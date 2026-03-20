"use client"

import { useState } from "react"
import { Save, Loader, X, Zap, Copy, CheckCircle2, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Meeting {
  id: string
  title?: string
  client_id?: string
  client_name?: string
  date: string
  time: string
  attendees: Array<{ id: string; full_name: string; email?: string }>
  summary?: string
  key_decisions?: string[]
}

interface MeetingsMomCardProps {
  meeting: Meeting
  onUpdate: () => void
  onCreateActionItems?: (summary: string, decisions: string[]) => void
  onCreateTask?: (title: string, decision: string) => void
  onAddToKnowledgeBase?: (data: { summary: string; decisions: string[]; meetingDate: string; meetingId: string }) => void
}

export function MeetingsMomCard({ meeting, onUpdate, onCreateActionItems, onCreateTask, onAddToKnowledgeBase }: MeetingsMomCardProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    summary: meeting.summary || "",
    keyDecisions: meeting.key_decisions || [""],
  })

  const handleCopyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Ready to share on WhatsApp",
      duration: 2000,
    })
    if (index !== undefined) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }

  const handleAddToKnowledgeBase = async () => {
    if (!meeting.client_id) return

    const kbData = {
      summary: formData.summary,
      decisions: formData.keyDecisions.filter((d) => d.trim()),
      meetingDate: meeting.date,
      meetingId: meeting.id,
    }

    try {
      const token = localStorage.getItem("sessionToken")
      const response = await fetch(`/api/clients/${meeting.client_id}/knowledge-base`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(kbData),
      })

      if (response.ok) {
        toast({
          title: "Added to Knowledge Base",
          description: "Meeting insights have been saved",
          duration: 2000,
        })
      }
    } catch (error) {
      console.error("[v0] Error adding to KB:", error)
      toast({
        title: "Error",
        description: "Failed to add to knowledge base",
        duration: 2000,
      })
    }
  }

  const handleCopyAllMOM = () => {
    const decisions = formData.keyDecisions
      .filter((d) => d.trim())
      .map((d) => `• ${d}`)
      .join("\n")
    const momText = `📋 Minutes of Meeting - ${meeting.client_id}\n\n📝 Summary:\n${formData.summary}\n\n✅ Key Actions:\n${decisions}`
    handleCopyToClipboard(momText)
  }

  const handleAddDecision = () => {
    setFormData({
      ...formData,
      keyDecisions: [...formData.keyDecisions, ""],
    })
  }

  const handleUpdateDecision = (index: number, value: string) => {
    const updated = [...formData.keyDecisions]
    updated[index] = value
    setFormData({ ...formData, keyDecisions: updated })
  }

  const handleRemoveDecision = (index: number) => {
    setFormData({
      ...formData,
      keyDecisions: formData.keyDecisions.filter((_, i) => i !== index),
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("sessionToken")
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          summary: formData.summary,
          keyDecisions: formData.keyDecisions.filter((d) => d.trim()),
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        onUpdate()
      }
    } catch (error) {
      console.error("[v0] Error saving MOM:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-xl border-2 border-amber-300 p-6 shadow-lg">
      {/* Header with Copy Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-amber-900 to-orange-700 bg-clip-text text-transparent">Minutes of Meeting</h3>
          <p className="text-xs text-gray-600 mt-0.5 font-medium">
            {meeting.client_id || "Meeting"}
          </p>
        </div>
        <button
          onClick={handleCopyAllMOM}
          title="Copy all to clipboard for WhatsApp"
          className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all flex items-center gap-1.5"
        >
          <Copy className="w-4 h-4" />
          <span className="text-xs font-semibold">Copy All</span>
        </button>
      </div>

      {/* Meeting Info - Pre-filled from schedule */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-amber-200">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
          <p className="text-sm font-medium text-gray-900">{meeting.date}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase">Time</p>
          <p className="text-sm font-medium text-gray-900">{meeting.time}</p>
        </div>
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Attendees</p>
            <div className="flex flex-wrap gap-2">
              {meeting.attendees.map((attendee) => (
                <span key={attendee.id} className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {attendee.full_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Summary */}
          <div>
            <label className="block text-xs text-amber-900 font-semibold uppercase tracking-wide mb-2">
              Summary
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              placeholder="Add a meeting summary..."
              className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Key Actions */}
          {formData.keyDecisions.some((d) => d.trim()) && (
            <div>
              <p className="text-xs text-amber-900 font-semibold uppercase tracking-wide mb-3">
                Key Actions
              </p>
              <div className="space-y-2.5">
                {formData.keyDecisions.map(
                  (decision, index) =>
                    decision.trim() && (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 hover:shadow-md transition-all"
                      >
                        <span className="text-orange-600 font-bold text-lg mt-0.5 flex-shrink-0">
                          ✓
                        </span>
                        <p className="text-sm text-gray-800 flex-1 mt-0.5">{decision}</p>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleCopyToClipboard(decision, index)}
                            title="Copy to clipboard"
                            className={cn(
                              "p-1.5 rounded transition-all",
                              copiedIndex === index
                                ? "bg-green-200 text-green-700"
                                : "bg-white text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            {copiedIndex === index ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          {onCreateTask && (
                            <button
                              onClick={() => onCreateTask(decision, decision)}
                              title="Create task from this action"
                              className="p-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-sm rounded-lg disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isSaving && <Loader className="w-4 h-4 animate-spin" />}
              Save MOM
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-sm rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Display */}
          {formData.summary ? (
            <div>
              <p className="text-xs text-amber-900 font-semibold uppercase tracking-wide mb-2">
                Summary
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {formData.summary}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No summary yet</p>
            </div>
          )}

          {/* Key Decisions */}
          {formData.keyDecisions.some((d) => d.trim()) && (
            <div>
              <p className="text-xs text-amber-900 font-semibold uppercase tracking-wide mb-3">
                Key Decisions & Action Items
              </p>
              <div className="space-y-2.5">
                {formData.keyDecisions.map(
                  (decision, index) =>
                    decision.trim() && (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 hover:shadow-md transition-all"
                      >
                        <span className="text-orange-600 font-bold text-lg mt-0.5 flex-shrink-0">
                          ✓
                        </span>
                        <p className="text-sm text-gray-800 flex-1 mt-0.5">{decision}</p>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleCopyToClipboard(decision, index)}
                            title="Copy to clipboard"
                            className={cn(
                              "p-1.5 rounded transition-all",
                              copiedIndex === index
                                ? "bg-green-200 text-green-700"
                                : "bg-white text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            {copiedIndex === index ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          {onCreateTask && (
                            <button
                              onClick={() => onCreateTask(decision, decision)}
                              title="Create task from this decision"
                              className="p-1.5 rounded bg-white text-blue-600 hover:bg-blue-50 transition-all"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-amber-300 flex-wrap">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 min-w-max px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg"
            >
              ✎ Edit
            </button>
            {onAddToKnowledgeBase && (
              <button
                onClick={handleAddToKnowledgeBase}
                className="flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg"
              >
                <BookOpen className="w-4 h-4" />
                Add to KB
              </button>
            )}
            {onCreateActionItems && formData.summary && (
              <button
                onClick={() => onCreateActionItems(formData.summary, formData.keyDecisions.filter((d) => d.trim()))}
                className="flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg"
              >
                <Zap className="w-4 h-4" />
                Create Actions
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
