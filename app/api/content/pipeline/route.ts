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

    const selectedClient = request.nextUrl.searchParams.get("client") || "All Clients"

    console.log("[v0] Fetching pipeline overview for:", selectedClient)

    let query = supabase
      .from("clients")
      .select("id, name")
      .order("name", { ascending: true })

    const { data: clients, error: clientsError } = await query

    if (clientsError) {
      console.error("[v0] Error fetching clients:", clientsError)
      return NextResponse.json({ error: clientsError.message }, { status: 500 })
    }

    // For each client, get their scheduled_posts counts by status
    const clientPipelines = await Promise.all(
      (clients || []).map(async (client) => {
        // Get planned posts count
        const { count: plannedCount } = await supabase
          .from("scheduled_posts")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id)
          .in("status", ["draft", "scheduled"])

        // Get scheduled posts count
        const { count: scheduledCount } = await supabase
          .from("scheduled_posts")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id)
          .eq("status", "scheduled")

        // Get published posts count
        const { count: publishedCount } = await supabase
          .from("scheduled_posts")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id)
          .eq("status", "published")

        return {
          id: client.id,
          name: client.name,
          planned: plannedCount || 0,
          scheduled: scheduledCount || 0,
          published: publishedCount || 0,
        }
      })
    )

    console.log("[v0] Pipeline overview fetched:", clientPipelines.length, "clients")

    return NextResponse.json({ clients: clientPipelines })
  } catch (error) {
    console.error("[v0] Pipeline fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch pipeline overview" },
      { status: 500 }
    )
  }
}
