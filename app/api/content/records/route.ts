import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getUserFromRequest } from "@/lib/auth"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientId = request.nextUrl.searchParams.get("clientId")
    const status = request.nextUrl.searchParams.get("status")
    const startDate = request.nextUrl.searchParams.get("startDate")
    const endDate = request.nextUrl.searchParams.get("endDate")
    const viewMode = request.nextUrl.searchParams.get("viewMode") || "all"

    console.log("[v0] Fetching content records:", { clientId, status, viewMode })

    let query = supabase
      .from("scheduled_posts")
      .select(
        `
        id,
        client_id,
        content,
        platforms,
        media_urls,
        scheduled_date,
        scheduled_time,
        status,
        created_at,
        updated_at,
        clients(name),
        assigned_to(full_name)
      `
      )
      .order("scheduled_date", { ascending: false })

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (startDate && endDate) {
      query = query.gte("scheduled_date", startDate).lte("scheduled_date", endDate)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("[v0] Error fetching content records:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform posts to match component interface
    const transformedRecords = (posts || []).map((post) => ({
      id: post.id,
      client: post.clients?.name || "Unknown",
      title: post.content?.substring(0, 100) || "Untitled",
      platform: (post.platforms || [])[0] || "multiple",
      plannedDate: post.created_at?.split("T")[0] || "",
      scheduledDate: post.scheduled_date,
      publishedDate: post.status === "published" ? post.updated_at?.split("T")[0] : "",
      owner: post.assigned_to?.full_name || "Unassigned",
      status: post.status?.toUpperCase() || "PLANNED",
      month: new Date(post.scheduled_date).toLocaleString("default", { month: "long" }).toLowerCase(),
      week: `Week ${Math.ceil(new Date(post.scheduled_date).getDate() / 7)}`,
    }))

    return NextResponse.json({
      records: transformedRecords,
      total: transformedRecords.length,
      viewMode,
    })
  } catch (error) {
    console.error("[v0] Content records error:", error)
    return NextResponse.json(
      { error: "Failed to fetch content records" },
      { status: 500 }
    )
  }
}
