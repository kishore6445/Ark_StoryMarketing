import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getUserFromRequest } from "@/lib/auth"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get("status")

    console.log("[v0] Fetching content tracker:", { status })

    let query = supabase
      .from("content_workflows")
      .select(`
        id,
        title,
        client_id,
        clients(name),
        content_type,
        status,
        workflow_stages(stage, assignee, status as stage_status),
        created_at,
        due_date
      `)
      .order("created_at", { ascending: false })

    if (status && status !== "All") {
      query = query.eq("status", status)
    }

    const { data: contentItems, error } = await query

    if (error) {
      console.error("[v0] Error fetching content tracker:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Content tracker items fetched:", contentItems?.length || 0)

    // Transform to match tracker component interface
    const transformedItems = (contentItems || []).map((item: any) => {
      const stages = item.workflow_stages || []
      const writerStage = stages.find((s: any) => s.stage === "writing")
      const editorStage = stages.find((s: any) => s.stage === "editing")
      const designerStage = stages.find((s: any) => s.stage === "design")

      // Check for blockers (stage that's not done but is assigned)
      let blocker = null
      if (writerStage?.stage_status !== "done" && writerStage?.assignee) blocker = "Writer"
      if (editorStage?.stage_status !== "done" && editorStage?.assignee) blocker = "Editor"
      if (designerStage?.stage_status !== "done" && designerStage?.assignee) blocker = "Designer"

      // Calculate days overdue
      const dueDate = item.due_date ? new Date(item.due_date) : null
      const today = new Date()
      const daysOverdue = dueDate && dueDate < today 
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        id: item.id,
        title: item.title,
        client: item.clients?.name || "Unknown",
        type: item.content_type || "Content",
        status: item.status,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
        workflow: {
          writer: writerStage?.stage_status === "done" ? "Done" : writerStage?.stage_status === "in_progress" ? "In Progress" : "Not Started",
          editor: editorStage?.stage_status === "done" ? "Done" : editorStage?.stage_status === "in_progress" ? "In Progress" : "Not Started",
          designer: designerStage?.stage_status === "done" ? "Done" : designerStage?.stage_status === "in_progress" ? "In Progress" : "Not Started",
        },
        blocker: blocker,
      }
    })

    return NextResponse.json({ items: transformedItems })
  } catch (error) {
    console.error("[v0] Content tracker fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch content tracker" },
      { status: 500 }
    )
  }
}
