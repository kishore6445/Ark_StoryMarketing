"use client"

import { useState } from "react"
import useSWR from "swr"
import { X, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { SprintCloseModal } from "./sprint-close-modal"

interface Sprint {
  id: string
  name: string
  status: string
  start_date: string
  end_date: string
  clientId: string
  taskCount?: number
}

const fetcher = (url: string) => {
  const token = localStorage.getItem("sessionToken")
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json())
}

export function SprintManagementDashboard() {
  const { data: allSprintsData, isLoading: sprintsLoading } = useSWR(
    "/api/all-sprints",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 15000 }
  )

  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)

  const sprints: Sprint[] = allSprintsData?.sprints || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "planning":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const activeSprints = sprints.filter((s) => s.status === "active")
  const planningSprints = sprints.filter((s) => s.status === "planning")
  const completedSprints = sprints.filter((s) => s.status === "completed")

  if (sprintsLoading) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading sprint management...
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sprint Management</h1>
        <p className="text-gray-600 mt-2">Close sprints, migrate tasks, and manage sprint cycles across clients</p>
      </div>

      {/* Active Sprints */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Active Sprints</h2>
          <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            {activeSprints.length}
          </span>
        </div>

        {activeSprints.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-600">
            No active sprints at the moment
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSprints.map((sprint) => (
              <div
                key={sprint.id}
                className="bg-white border border-blue-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(sprint.start_date).toLocaleDateString()} →{" "}
                      {new Date(sprint.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold", getStatusColor(sprint.status))}>
                    {getStatusIcon(sprint.status)}
                    Active
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedSprint(sprint)
                    setShowCloseModal(true)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Close Sprint
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Planning Sprints */}
      {planningSprints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Sprints</h2>
            <span className="text-sm font-medium px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
              {planningSprints.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planningSprints.map((sprint) => (
              <div
                key={sprint.id}
                className="bg-white border border-amber-200 rounded-lg p-6 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Starts {new Date(sprint.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold", getStatusColor(sprint.status))}>
                    {getStatusIcon(sprint.status)}
                    Planning
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Completed Sprints</h2>
            <span className="text-sm font-medium px-3 py-1 bg-green-100 text-green-800 rounded-full">
              {completedSprints.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedSprints.map((sprint) => (
              <div
                key={sprint.id}
                className="bg-white border border-green-200 rounded-lg p-6 opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Completed {new Date(sprint.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold", getStatusColor(sprint.status))}>
                    {getStatusIcon(sprint.status)}
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close Sprint Modal */}
      {showCloseModal && selectedSprint && (
        <SprintCloseModal
          sprint={selectedSprint}
          onClose={() => {
            setShowCloseModal(false)
            setSelectedSprint(null)
          }}
          onSuccess={() => {
            setShowCloseModal(false)
            setSelectedSprint(null)
          }}
        />
      )}
    </div>
  )
}
