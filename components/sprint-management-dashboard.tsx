"use client"

import { useState } from "react"
import useSWR from "swr"
import { ChevronDown, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SprintTask {
  id: string
  task_id: string
  title: string
  status: string
  promised_date: string
  promised_time?: string
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
  const token = localStorage.getItem("sessionToken")
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json())
}

export function SprintManagementDashboard() {
  const { data: sprintsData, isLoading } = useSWR("/api/sprints", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  const [selectedClient, setSelectedClient] = useState<string>("")
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null)

  const sprints: Sprint[] = sprintsData?.sprints || []

  // Get unique clients from sprints with their names
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-700"
      case "planning":
        return "bg-amber-100 text-amber-700"
      case "completed":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "in_review":
        return <AlertCircle className="w-4 h-4 text-amber-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const SprintCard = ({ sprint }: { sprint: Sprint }) => {
    const tasks = sprint.tasks || []
    const taskCount = tasks.length
    const completedCount = tasks.filter((t) => t.status === "done").length
    const progressPercent = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0
    const isExpanded = expandedSprint === sprint.id

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        {/* Sprint Header */}
        <div
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedSprint(isExpanded ? null : sprint.id)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {sprint.name}
                </h3>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold uppercase",
                    getStatusColor(sprint.status)
                  )}
                >
                  {sprint.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {sprint.start_date} to {sprint.end_date}
              </p>
            </div>
            {sprint.status === "active" && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  // Will implement close sprint functionality
                }}
                className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
              >
                Close Sprint
              </button>
            )}
          </div>

          {/* Sprint Metrics */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{taskCount}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold">Progress</p>
              <p className="text-2xl font-bold text-blue-600">{progressPercent}%</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{taskCount - completedCount}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sprint Tasks - Expanded */}
        {isExpanded && tasks.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="p-6 space-y-3">
              <h4 className="font-semibold text-gray-900 mb-4">Tasks in Sprint</h4>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg p-4 flex items-start justify-between gap-3 border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTaskStatusIcon(task.status)}
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded font-mono">
                        {task.task_id}
                      </span>
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 text-xs font-semibold rounded",
                          task.status === "done"
                            ? "bg-green-100 text-green-700"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : task.status === "in_review"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {task.status === "done"
                          ? "Done"
                          : task.status === "in_progress"
                          ? "In Progress"
                          : task.status === "in_review"
                          ? "In Review"
                          : "Pending"}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Due: {task.promised_date}
                      {task.promised_time && ` at ${task.promised_time}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isExpanded && tasks.length === 0 && (
          <div className="border-t border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-gray-600 text-sm">No tasks in this sprint</p>
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
          Manage sprints, close completed sprints, and migrate pending tasks
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
            setExpandedSprint(null)
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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Loading sprints...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSprints.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No sprints found</p>
        </div>
      )}

      {/* Active Sprints */}
      {!isLoading && activeSprints.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full" />
            Active Sprints
          </h2>
          {activeSprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}

      {/* Planning Sprints */}
      {!isLoading && planningSprints.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-6 bg-amber-600 rounded-full" />
            Planning
          </h2>
          {planningSprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}

      {/* Completed Sprints */}
      {!isLoading && completedSprints.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-6 bg-green-600 rounded-full" />
            Completed
          </h2>
          {completedSprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}
    </div>
  )
}
