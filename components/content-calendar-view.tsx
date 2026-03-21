"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ContentCalendarViewProps {
  clientId?: string | null
  onCreatePost: () => void
}

// Mock data for demo - in production this would come from API
const MOCK_CALENDAR_POSTS = [
  { date: "2026-03-03", client: "Telugu Pizza", type: "Blog", color: "bg-blue-100 text-blue-700" },
  { date: "2026-03-04", client: "Smart Snaxx", type: "Reel", color: "bg-purple-100 text-purple-700" },
  { date: "2026-03-05", client: "Telugu Pizza", type: "Reel", color: "bg-blue-100 text-blue-700" },
  { date: "2026-03-06", client: "Visa Nagendar", type: "Blog", color: "bg-green-100 text-green-700" },
  { date: "2026-03-07", client: "Smart Snaxx", type: "Post", color: "bg-purple-100 text-purple-700" },
  { date: "2026-03-10", client: "Story Marketing", type: "Blog", color: "bg-orange-100 text-orange-700" },
  { date: "2026-03-12", client: "Telugu Pizza", type: "Post", color: "bg-blue-100 text-blue-700" },
  { date: "2026-03-15", client: "Visa Nagendar", type: "Reel", color: "bg-green-100 text-green-700" },
]

const CLIENT_COLORS = {
  "Telugu Pizza": "bg-blue-100 text-blue-700 border-l-4 border-blue-400",
  "Smart Snaxx": "bg-purple-100 text-purple-700 border-l-4 border-purple-400",
  "Visa Nagendar": "bg-green-100 text-green-700 border-l-4 border-green-400",
  "Story Marketing": "bg-orange-100 text-orange-700 border-l-4 border-orange-400",
  "ArkTechies": "bg-amber-100 text-amber-700 border-l-4 border-amber-400",
}

export function ContentCalendarView({ clientId, onCreatePost }: ContentCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2)) // March 2026

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getPostsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return MOCK_CALENDAR_POSTS.filter(p => p.date === dateStr)
  }

  // Calculate total posts and balance
  const totalPosts = MOCK_CALENDAR_POSTS.length
  const daysWithPosts = new Set(MOCK_CALENDAR_POSTS.map(p => p.date)).size
  const avgPostsPerDay = daysWithPosts > 0 ? (totalPosts / daysWithPosts).toFixed(1) : 0

  return (
    <div className="space-y-6">
      {/* Header with balance indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
          <p className="text-sm text-gray-600 mt-1">{totalPosts} posts scheduled across {daysWithPosts} days</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0 border-b border-gray-200 bg-gray-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square border-b border-r border-gray-200 bg-gray-50" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1
            const dayPosts = getPostsForDate(day)
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth()

            return (
              <div
                key={day}
                className={`aspect-square border-b border-r border-gray-200 p-2 hover:bg-blue-50 transition-colors ${
                  isToday ? "bg-blue-50" : "bg-white"
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.map((post, i) => (
                    <div
                      key={i}
                      className={`text-xs px-2 py-1 rounded truncate font-medium ${post.color}`}
                      title={`${post.client} - ${post.type}`}
                    >
                      {post.client.split(" ")[0]}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Balance Indicator */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-medium mb-2">PUBLISHING BALANCE</p>
            <p className="text-sm text-gray-700">
              {totalPosts} posts across {daysWithPosts} days
              <span className={`ml-2 font-semibold ${daysWithPosts > 15 ? "text-green-600" : daysWithPosts > 8 ? "text-amber-600" : "text-red-600"}`}>
                {daysWithPosts > 15 ? "Balanced" : daysWithPosts > 8 ? "Moderate" : "Light"}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 font-medium mb-2">AVG PER DAY</p>
            <p className="text-2xl font-bold text-gray-900">{avgPostsPerDay}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
