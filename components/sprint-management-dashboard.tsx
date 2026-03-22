"use client"

import { useState } from "react"
import useSWR from "swr"
import { PlayCircle, CheckCircle2, Clock } from "lucide-react"
import { SprintCloseModal } from "./sprint-close-modal"
import { cn } from "@/lib/utils"

interface SprintTask {
  id: string
  task_id: string
  title: string
  status: "todo" | "in_progress" | "in_review" | "done"
}

interface Sprint {
  id: string
  name: string
  status: string
  start_date: string
  end_date: string
  client_id: string
  clients?: {
    name: string
  }
  tasks?: SprintTask[]
}

const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((res) => res.json())
}

export function SprintManagementDashboard() {
  const { data: sprintsData, isLoading, mutate } = useSWR("/api/sprints", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  const [selectedClient, setSelectedClient] = useState<string>("")
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)

  const sprints: Sprint[] = sprintsData?.sprints || []

  // Get unique clients
  const uniqueClients = Array.from(
    new Map(
      sprints.map((s) => [
        s.client_id,
        s.clients?.name || `Client ${s.client_id?.substring(0, 8)}`,
      ])
    ).entries()
  )

  // Filter sprints
  const filteredSprints = selectedClient
    ? sprints.filter((s) => s.client_id === selectedClient)
    : sprints

  // Group by status
  const activeSprints = filteredSprints.filter((s) => s.status === "active")
  const planningSprints = filteredSprints.filter((s) => s.status === "planning")
  const completedSprints = filteredSprints.filter((s) => s.status === "completed")

  const handleCloseSprint = (sprint: Sprint) => {
    console.log("[v0] Opening close sprint modal for:", sprint.name)
    setSelectedSprint(sprint)
    setCloseModalOpen(true)
  }

  const getTaskStats = (sprint: Sprint) => {
    const tasks = sprint.tasks || []
    const completed = tasks.filter((t) => t.status === "done").length
    const total = tasks.length
    return { completed, total, pending: total - completed }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading sprints...</p>
      </div>
    )
  }

  const SprintCard = ({ sprint }: { sprint: Sprint }) => {
    const { completed, total, pending } = getTaskStats(sprint)
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{sprint.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {sprint.start_date} to {sprint.end_date}
              </p>
            </div>
            <button
              onClick={() => handleCloseSprint(sprint)}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors text-sm"
            >
              Close Sprint
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded p-3">
              <p className="text-xs text-gray-600 font-semibold">Total</p>
              <p className="text-xl font-bold text-blue-600">{total}</p>
            </div>
            <div className="bg-green-50 rounded p-3">
              <p className="text-xs text-gray-600 font-semibold">Done</p>
              <p className="text-xl font-bold text-green-600">{completed}</p>
            </div>
            <div className="bg-amber-50 rounded p-3">
              <p className="text-xs text-gray-600 font-semibold">Pending</p>
              <p className="text-xl font-bold text-amber-600">{pending}</p>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {(sprint.tasks || []).length > 0 && (
          <div className="bg-gray-50 px-6 py-4">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(sprint.tasks || []).map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-2 bg-white rounded border border-gray-100">
                  <div className="pt-1">
                    {task.status === "done" && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {task.status === "in_progress" && (
                      <PlayCircle className="w-4 h-4 text-blue-600" />
                    )}
                    {task.status === "in_review" && (
                      <Clock className="w-4 h-4 text-amber-600" />
                    )}
                    {!["done", "in_progress", "in_review"].includes(task.status) && (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-gray-500">{task.task_id}</span>
                    <p className="text-sm text-gray-900 truncate">{task.title}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                      task.status === "done"
                        ? "bg-green-100 text-green-700"
                        : task.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : task.status === "in_review"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.status === "done"
                      ? "Done"
                      : task.status === "in_progress"
                      ? "In Progress"
                      : task.status === "in_review"
                      ? "Review"
                      : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(sprint.tasks || []).length === 0 && (
          <div className="bg-gray-50 px-6 py-4 text-center">
            <p className="text-sm text-gray-600">No tasks in this sprint</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sprint Management</h1>
        <p className="text-gray-600 mt-2">
          Close sprints and migrate pending tasks to backlog or new sprint
        </p>
      </div>

      {/* Client Dropdown */}
      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4">
        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          Select Client:
        </label>
        <select
          value={selectedClient}
          onChange={(e) => {
            setSelectedClient(e.target.value)
            setCloseModalOpen(false)
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Clients ({sprints.length} sprints)</option>
          {uniqueClients.map(([clientId, clientName]) => {
            const count = sprints.filter((s) => s.client_id === clientId).length
            return (
              <option key={clientId} value={clientId}>
                {clientName} ({count})
              </option>
            )
          })}
        </select>
      </div>

      {/* Empty State */}
      {!isLoading && filteredSprints.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No sprints found</p>
        </div>
      )}

      {/* Active Sprints */}
      {!isLoading && activeSprints.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Active Sprints</h2>
          {activeSprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}

      {/* Planning Sprints */}
      {!isLoading && planningSprints.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Planning</h2>
          {planningSprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}

      {/* Completed Sprints */}
      {!isLoading && completedSprints.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Completed</h2>
          {completedSprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}

      {/* Close Sprint Modal */}
      <SprintCloseModal
        isOpen={closeModalOpen && !!selectedSprint}
        onClose={() => {
          console.log("[v0] Closing sprint modal")
          setCloseModalOpen(false)
          setSelectedSprint(null)
        }}
        sprint={selectedSprint}
        tasks={
          selectedSprint?.tasks?.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status as "todo" | "in-progress" | "in-review" | "done",
          })) || []
        }
        sprints={sprints.map((s) => ({ id: s.id, name: s.name }))}
        onSprintClosed={() => {
          console.log("[v0] Sprint closed successfully, refreshing data")
          setCloseModalOpen(false)
          setSelectedSprint(null)
          mutate()
        }}
      />
    </div>
  )
}
