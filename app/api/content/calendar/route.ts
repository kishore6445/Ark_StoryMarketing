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

    const clientId = request.nextUrl.searchParams.get("clientId")
    const month = request.nextUrl.searchParams.get("month")

    console.log("[v0] Fetching calendar posts:", { clientId, month })

    // Get all scheduled posts for the month
    let query = supabase
      .from("scheduled_posts")
      .select("id, client_id, clients(name), content_type, scheduled_date, status")
      .order("scheduled_date", { ascending: true })

    if (clientId && clientId !== "All Clients") {
      query = query.eq("client_id", clientId)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("[v0] Error fetching calendar posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Calendar posts fetched:", posts?.length || 0)

    // Transform to match calendar component interface
    const transformedPosts = (posts || []).map((post: any) => {
      const clientName = post.clients?.name || "Unknown"
      const contentType = post.content_type || "Post"
      
      return {
        id: post.id,
        date: post.scheduled_date,
        client: clientName,
        type: contentType,
        status: post.status,
      }
    })

    return NextResponse.json({ posts: transformedPosts })
  } catch (error) {
    console.error("[v0] Calendar fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar posts" },
      { status: 500 }
    )
  }
}
