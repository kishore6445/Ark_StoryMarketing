import { NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { getSupabaseAdminClient } from "@/lib/db"

interface CloseSprintRequest {
  sprintId: string
  destination: "new-sprint" | "backlog"
  newSprintName: string | null
  tasksToMigrate: string[]
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload: CloseSprintRequest = await request.json()
    const { sprintId, destination, newSprintName, tasksToMigrate } = payload

    if (!sprintId) {
      return NextResponse.json({ error: "Sprint ID required" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Get the current sprint
    const { data: sprint, error: sprintError } = await supabase
      .from("sprints")
      .select("*")
      .eq("id", sprintId)
      .single()

    if (sprintError || !sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 })
    }

    // Archive all done tasks
    await supabase
      .from("tasks")
      .update({ status: "done", archived: true, archived_at: new Date().toISOString() })
      .eq("sprint_id", sprintId)
      .eq("status", "done")

    let destinationSprintId: string | null = null

    // Create new sprint if needed
    if (destination === "new-sprint" && newSprintName) {
      const { data: newSprint, error: createError } = await supabase
        .from("sprints")
        .insert({
          name: newSprintName,
          client_id: sprint.client_id,
          status: "planning",
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .select("id")
        .single()

      if (createError) {
        return NextResponse.json({ error: "Failed to create new sprint" }, { status: 500 })
      }

      destinationSprintId = newSprint?.id || null
    }

    // Migrate pending tasks
    if (tasksToMigrate.length > 0) {
      if (destination === "backlog") {
        // Move to backlog (set sprint_id to null)
        await supabase
          .from("tasks")
          .update({ sprint_id: null, status: "todo" })
          .in("id", tasksToMigrate)
      } else {
        // Move to new sprint
        await supabase
          .from("tasks")
          .update({ sprint_id: destinationSprintId })
          .in("id", tasksToMigrate)
      }
    }

    // Mark sprint as completed
    await supabase
      .from("sprints")
      .update({ status: "completed", closed_at: new Date().toISOString() })
      .eq("id", sprintId)

    return NextResponse.json({
      success: true,
      message: `Sprint closed. ${tasksToMigrate.length} tasks migrated.`,
      newSprintId: destinationSprintId,
    })
  } catch (error: any) {
    console.error("[v0] Error closing sprint:", error)
    return NextResponse.json({ error: error.message || "Failed to close sprint" }, { status: 500 })
  }
}
