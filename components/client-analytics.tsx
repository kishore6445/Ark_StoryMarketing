"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Copy, Check, Download, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientTask {
  id: string
  taskId?: string
  title: string
  clientName: string
  clientId: string
  dueDate?: string
  dueTime?: string
  promisedDate: string
  promisedTime?: string
  status?: "todo" | "in_progress" | "in_review" | "done"
}

interface GroupedTasks {
  [clientId: string]: {
    clientName: string
    tasks: ClientTask[]
  }
}

const fetcher = (url: string) => {
  const token = localStorage.getItem("sessionToken")
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json())
}

const STATUS_CONFIG = {
  todo: { dot: "bg-gray-400", label: "To Do", color: "bg-gray-100 text-gray-700" },
  in_progress: { dot: "bg-blue-500", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  in_review: { dot: "bg-amber-500", label: "In Review", color: "bg-amber-100 text-amber-700" },
  done: { dot: "bg-green-500", label: "Done", color: "bg-green-100 text-green-700" },
}

export function ClientAnalytics() {
  const { data, isLoading } = useSWR("/api/my-tasks", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 15000,
  })

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["todo", "in_progress"])

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedId])

  const tasks: ClientTask[] = (data?.tasks || [])
    .filter((task: any) => task.promisedDate || task.dueDate)
    .map((task: any) => ({
      id: task.id,
      taskId: task.taskId,
      title: task.title,
      clientName: task.clientName,
      clientId: task.clientId || task.id,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      promisedDate: task.promisedDate,
      promisedTime: task.promisedTime,
      status: task.status || "todo",
    }))

  const uniqueClients = Array.from(
    new Map(tasks.map((task) => [task.clientId, task.clientName])).entries()
  ).map(([id, name]) => ({ id, name }))

  // Group and filter tasks
  const groupedTasks: GroupedTasks = tasks.reduce((acc: GroupedTasks, task: ClientTask) => {
    if (!acc[task.clientId]) {
      acc[task.clientId] = { clientName: task.clientName, tasks: [] }
    }
    acc[task.clientId].tasks.push(task)
    return acc
  }, {})

  const filteredGroups = Object.entries(groupedTasks)
    .map(([clientId, group]) => {
      if (selectedClients.length > 0 && !selectedClients.includes(clientId)) return null

      const filteredTasks = group.tasks.filter((task) => {
        const term = searchTerm.toLowerCase()
        const matchesSearch = !searchTerm || task.title.toLowerCase().includes(term) || task.taskId?.toLowerCase().includes(term)
        const taskStatus = task.status || "todo"
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(taskStatus)
        return matchesSearch && matchesStatus
      })

      return filteredTasks.length > 0 ? [clientId, { ...group, tasks: filteredTasks }] : null
    })
    .filter((item) => item !== null) as Array<[string, any]>

  const formatTasksForWhatsApp = (clientName: string, clientTasks: ClientTask[]) => {
    const formattedTasks = clientTasks
      .map((task) => `📌 ${task.taskId || task.id.substring(0, 8)}\n${task.title}\n📅 ${new Date(task.promisedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`)
      .join("\n\n")
    return `🎯 *${clientName}*\n\n${formattedTasks}`
  }

  const handleCopy = (clientName: string, clientTasks: ClientTask[]) => {
    const text = formatTasksForWhatsApp(clientName, clientTasks)
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(clientName)
    })
  }

  const handleCopyAll = () => {
    const allText = filteredGroups.map(([_, group]) => formatTasksForWhatsApp(group.clientName, group.tasks)).join("\n\n" + "─".repeat(50) + "\n\n")
    navigator.clipboard.writeText(allText).then(() => {
      setCopiedId("all")
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Client Analytics</h1>
        <p className="text-gray-600">View all client promises. Copy directly to WhatsApp for sharing.</p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleCopyAll}
            disabled={filteredGroups.length === 0}
            className={cn(
              "px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all",
              filteredGroups.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : copiedId === "all"
                ? "bg-green-100 text-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {copiedId === "all" ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy All
              </>
            )}
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {uniqueClients.map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  setSelectedClients(selectedClients.includes(client.id) ? selectedClients.filter((id) => id !== client.id) : [...selectedClients, client.id])
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  selectedClients.includes(client.id)
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300"
                )}
              >
                {client.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatuses(selectedStatuses.includes(status) ? selectedStatuses.filter((s) => s !== status) : [...selectedStatuses, status])
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all",
                  selectedStatuses.includes(status)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", config.dot)} />
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Loading tasks...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredGroups.length === 0 && (
        <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Copy className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No tasks found</h3>
          <p className="text-gray-600 text-sm">{searchTerm ? "No tasks match your search" : "Create tasks to see them here"}</p>
        </div>
      )}

      {/* Client Groups */}
      {!isLoading && filteredGroups.length > 0 && (
        <div className="space-y-3">
          {filteredGroups.map(([clientId, group]) => (
            <div key={clientId} className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
              {/* Client Header */}
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.clientName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(group.clientName, group.tasks)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                    copiedId === group.clientName ? "bg-green-100 text-green-700" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  )}
                >
                  {copiedId === group.clientName ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Tasks List */}
              <div className="divide-y divide-gray-100">
                {group.tasks.map((task) => (
                  <div key={task.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="font-mono">{task.taskId || task.id.substring(0, 8)}</span>
                          <span>•</span>
                          <span>
                            {new Date(task.promisedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          {task.promisedTime && (
                            <>
                              <span>•</span>
                              <span>{task.promisedTime}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap", STATUS_CONFIG[task.status || "todo"].color)}>
                          <span className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[task.status || "todo"].dot)} />
                          {STATUS_CONFIG[task.status || "todo"].label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
