"use client"

import { useState } from "react"
import useSWR from "swr"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Sprint {
  id: string
  name: string
  status: string
  start_date: string
  end_date: string
  client_id?: string
  clientName?: string
  taskCount?: number
  completedCount?: number
}

interface Client {
  id: string
  name: string
}

const fetcher = (url: string) => {
  const token = localStorage.getItem("sessionToken")
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json())
}

export function SprintManagementDashboard() {
  const { data: sprintsData, isLoading: sprintsLoading } = useSWR(
    "/api/individual-sprints",
    fetcher
  )
  const { data: clientsData } = useSWR("/api/clients", fetcher)
  
  const [selectedClient, setSelectedClient] = useState<string>("")

  const sprints: Sprint[] = sprintsData?.sprints || []
  const clients: Client[] = clientsData?.clients || []
  
  // Group sprints by client
  const sprintsByClient = sprints.reduce(
    (acc: Record<string, Sprint[]>, sprint) => {
      const clientId = sprint.client_id || "unknown"
      if (!acc[clientId]) {
        acc[clientId] = []
      }
      acc[clientId].push(sprint)
      return acc
    },
    {}
  )

  const filteredSprints = selectedClient
    ? sprintsByClient[selectedClient] || []
    : sprints

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.name || clientId.substring(0, 8)
  }

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

  if (sprintsLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading sprints...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sprint Management</h1>
        <p className="text-gray-600 mt-2">
          Manage sprints, close completed sprints, and migrate tasks
        </p>
      </div>

      {/* Client Dropdown */}
      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4">
        <label className="text-sm font-semibold text-gray-700">Select Client:</label>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Clients ({sprints.length})</option>
          {clients.map((client) => {
            const count = sprintsByClient[client.id]?.length || 0
            return (
              <option key={client.id} value={client.id}>
                {client.name} ({count})
              </option>
            )
          })}
        </select>
      </div>

      {/* Sprints Grid */}
      <div className="space-y-4">
        {filteredSprints.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">No sprints found</p>
          </div>
        ) : (
          filteredSprints.map((sprint) => (
            <div
              key={sprint.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
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
                  <button className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
                    Close Sprint
                  </button>
                )}
              </div>

              {/* Sprint Metrics */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-semibold">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sprint.taskCount || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-semibold">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {sprint.completedCount || 0}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-semibold">Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {sprint.taskCount
                      ? Math.round(
                          ((sprint.completedCount || 0) / sprint.taskCount) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 font-semibold">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {(sprint.taskCount || 0) - (sprint.completedCount || 0)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
