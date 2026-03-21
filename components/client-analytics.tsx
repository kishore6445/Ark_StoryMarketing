"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Copy, Check, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientTask {
  id: string
  taskId?: string
  title: string
  clientName: string
  clientId: string
  promisedDate: string
  promisedTime?: string
  status?: "todo" | "in_progress" | "in_review" | "done"
}

const fetcher = (url: string) => {
  const token = localStorage.getItem("sessionToken")
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json())
}

export function ClientAnalytics() {
  const { data, isLoading } = useSWR("/api/my-tasks", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 15000,
  })

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedId])

  const tasks: ClientTask[] = (data?.tasks || [])
    .filter((task: any) => task.promisedDate)
    .map((task: any) => ({
      id: task.id,
      taskId: task.taskId,
      title: task.title,
      clientName: task.clientName,
      clientId: task.clientId || task.id,
      promisedDate: task.promisedDate,
      promisedTime: task.promisedTime,
      status: task.status || "todo",
    }))

  const uniqueClients = Array.from(
    new Map(tasks.map((task) => [task.clientId, task.clientName])).entries()
  ).map(([id, name]) => ({ id, name }))

  // Group tasks by client
  const groupedTasks = tasks.reduce(
    (acc: Record<string, ClientTask[]>, task: ClientTask) => {
      if (!acc[task.clientId]) {
        acc[task.clientId] = []
      }
      acc[task.clientId].push(task)
      return acc
    },
    {}
  )

  // Filter tasks
  const filteredGroups = Object.entries(groupedTasks)
    .map(([clientId, clientTasks]) => {
      if (selectedClients.length > 0 && !selectedClients.includes(clientId)) {
        return null
      }

      const filtered = clientTasks.filter(
        (task) =>
          !searchTerm ||
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.taskId?.toLowerCase().includes(searchTerm.toLowerCase())
      )

      return filtered.length > 0
        ? { clientId, clientName: tasks.find((t) => t.clientId === clientId)?.clientName || "", tasks: filtered }
        : null
    })
    .filter((item) => item !== null)

  const formatForWhatsApp = (clientName: string, tasks: ClientTask[]) => {
    const formatted = tasks
      .map(
        (task) =>
          `📌 ${task.taskId || task.id.substring(0, 8)}\n${task.title}\n📅 ${new Date(task.promisedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
      )
      .join("\n\n")
    return `🎯 *${clientName}*\n\n${formatted}`
  }

  const handleCopy = (clientName: string, clientTasks: ClientTask[]) => {
    const text = formatForWhatsApp(clientName, clientTasks)
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(clientName)
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Client Analytics</h1>
        <p className="text-gray-600">View all client promises. Copy to WhatsApp for sharing.</p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {uniqueClients.map((client) => (
            <button
              key={client.id}
              onClick={() => {
                setSelectedClients(
                  selectedClients.includes(client.id)
                    ? selectedClients.filter((id) => id !== client.id)
                    : [...selectedClients, client.id]
                )
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
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Loading tasks...</p>
          </div>
        </div>
      )}

      {!isLoading && filteredGroups.length === 0 && (
        <div className="border border-dashed border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-sm">No tasks found</p>
        </div>
      )}

      {!isLoading &&
        filteredGroups.map((group: any) => (
          <div key={group.clientId} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{group.clientName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{group.tasks.length} task(s)</p>
              </div>
              <button
                onClick={() => handleCopy(group.clientName, group.tasks)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                  copiedId === group.clientName
                    ? "bg-green-100 text-green-700"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
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

            <div className="divide-y divide-gray-100">
              {group.tasks.map((task: ClientTask) => (
                <div key={task.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="font-mono">{task.taskId || task.id.substring(0, 8)}</span>
                        <span>•</span>
                        <span>
                          {new Date(task.promisedDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {task.promisedTime && (
                          <>
                            <span>•</span>
                            <span>{task.promisedTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
