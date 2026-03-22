"use client"

import { useState } from "react"
import useSWR from "swr"
import { ChevronDown, PlayCircle, CheckCircle2, Clock } from "lucide-react"
import { SprintCloseModal } from "./sprint-close-modal"

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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-1">Sprint Management</h1>
        <p className="text-gray-600">Close sprints and migrate pending work</p>
      </div>

      {/* Client Selector */}
      <div className="mb-8">
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Clients ({sprints.length})</option>
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

      {/* Active Sprints - Main Section */}
      {activeSprints.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-900">Active Sprints</h2>
          {activeSprints.map((sprint) => {
            const { completed, total, pending } = getTaskStats(sprint)
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0

            return (
              <div
                key={sprint.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Sprint Header - Always Visible */}
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
          })}
        </div>
      )}

      {/* Planning Sprints */}
      {planningSprints.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-900">Planning</h2>
          {planningSprints.map((sprint) => {
            const { completed, total, pending } = getTaskStats(sprint)
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0

            return (
              <div
                key={sprint.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Sprint Header - Always Visible */}
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
          })}
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-900">Completed</h2>
          {completedSprints.map((sprint) => {
            const { completed, total, pending } = getTaskStats(sprint)
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0

            return (
              <div
                key={sprint.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow opacity-75"
              >
                {/* Sprint Header - Always Visible */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{sprint.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {sprint.start_date} to {sprint.end_date}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gray-400 h-full transition-all"
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
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredSprints.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No sprints to manage</p>
        </div>
      )}

      {/* Close Sprint Modal */}
      {selectedSprint && (
        <SprintCloseModal
          isOpen={closeModalOpen}
          onClose={() => {
            setCloseModalOpen(false)
            setSelectedSprint(null)
          }}
          sprint={selectedSprint}
          tasks={
            selectedSprint.tasks?.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status as "todo" | "in-progress" | "in-review" | "done",
            })) || []
          }
          sprints={sprints.map((s) => ({ id: s.id, name: s.name }))}
          onSprintClosed={() => {
            mutate()
          }}
        />
      )}
    </div>
  )
}
