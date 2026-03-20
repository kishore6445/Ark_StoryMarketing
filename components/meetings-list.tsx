"use client"

import { Clock, Users, Calendar, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface Meeting {
  id: string
  title?: string
  client_id?: string
  date: string
  time: string
  attendees: Array<{ id: string; full_name: string }>
  status: "scheduled" | "completed" | "cancelled"
}

interface MeetingsListProps {
  meetings: Meeting[]
  selectedId: string | null
  onSelect: (id: string) => void
}

// Color palette for meeting cards - cycles through colors
const colorSchemes = [
  { bg: "bg-blue-50", border: "border-blue-200", accent: "bg-blue-500", tag: "bg-blue-100 text-blue-700" },
  { bg: "bg-emerald-50", border: "border-emerald-200", accent: "bg-emerald-500", tag: "bg-emerald-100 text-emerald-700" },
  { bg: "bg-amber-50", border: "border-amber-200", accent: "bg-amber-500", tag: "bg-amber-100 text-amber-700" },
  { bg: "bg-purple-50", border: "border-purple-200", accent: "bg-purple-500", tag: "bg-purple-100 text-purple-700" },
  { bg: "bg-pink-50", border: "border-pink-200", accent: "bg-pink-500", tag: "bg-pink-100 text-pink-700" },
  { bg: "bg-cyan-50", border: "border-cyan-200", accent: "bg-cyan-500", tag: "bg-cyan-100 text-cyan-700" },
]

const getColorScheme = (index: number) => colorSchemes[index % colorSchemes.length]

const formatDate = (date: string) => {
  const d = new Date(`${date}T00:00`)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function MeetingsList({
  meetings,
  selectedId,
  onSelect,
}: MeetingsListProps) {
  if (meetings.length === 0) {
    return (
      <div className="px-2 py-8 text-center">
        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-600">No meetings</p>
        <p className="text-xs text-gray-500 mt-1">Create your first meeting to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting, index) => {
        const colors = getColorScheme(index)
        const isSelected = selectedId === meeting.id

        return (
          <button
            key={meeting.id}
            onClick={() => onSelect(meeting.id)}
            className={cn(
              "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md",
              isSelected
                ? `${colors.border} ${colors.bg} shadow-md ring-2 ring-offset-1 ring-blue-400`
                : `${colors.border} ${colors.bg} hover:shadow-sm hover:border-opacity-80`
            )}
          >
            {/* Top: Colored accent bar + Client Name + Status */}
            <div className="flex items-start gap-3 mb-3">
              <div className={cn("w-1.5 h-12 rounded-full flex-shrink-0", colors.accent)} />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-gray-900 truncate">
                  {meeting.client_id || "Meeting"}
                </h3>
                {meeting.title && (
                  <p className="text-sm text-gray-600 line-clamp-1 mt-1">{meeting.title}</p>
                )}
              </div>
              {meeting.status !== "scheduled" && (
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0", colors.tag)}>
                  {meeting.status === "completed" ? "Done" : "Cancelled"}
                </span>
              )}
            </div>

            {/* Middle: Date/Time Info */}
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-700 px-0.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{formatDate(meeting.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{meeting.time}</span>
              </div>
            </div>

            {/* Bottom: Attendees */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                {meeting.attendees && meeting.attendees.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1.5">
                      {meeting.attendees.slice(0, 3).map((attendee, i) => (
                        <div
                          key={attendee.id}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium border border-white"
                          title={attendee.full_name}
                        >
                          {attendee.full_name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-1">
                      {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No attendees</span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
