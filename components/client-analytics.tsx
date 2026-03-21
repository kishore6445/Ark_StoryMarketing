"use client"

import { useState } from "react"
import useSWR from "swr"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientTask {
  id: string
  title: string
  clientName: string
  status: "todo" | "in_progress" | "in_review" | "done"
  promisedDate: string
  promisedTime?: string
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

  const tasks: ClientTask[] = (data?.tasks || []).filter((task: any) => task.promisedDate)

  const groupedByClient = tasks.reduce(
    (acc: Record<string, ClientTask[]>, task: ClientTask) => {
      if (!acc[task.clientName]) {
        acc[task.clientName] = []
      }
      acc[task.clientName].push(task)
      return acc
    },
    {}
  )

  const filteredGroups = Object.entries(groupedByClient).filter(([_, clientTasks]) =>
    clientTasks.some((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleCopy = (clientName: string, clientTasks: ClientTask[]) => {
    const text = clientTasks
      .map((task) => `• ${task.title} - ${new Date(task.promisedDate).toLocaleDateString()}`)
      .join("\n")
    
    navigator.clipboard.writeText(`${clientName}\n\n${text}`).then(() => {
      setCopiedId(clientName)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading tasks...
      </div>
    )
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        No tasks found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Client Tasks</h2>
        
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredGroups.map(([clientName, clientTasks]) => (
        <div key={clientName} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{clientName}</h3>
            <button
              onClick={() => handleCopy(clientName, clientTasks)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                copiedId === clientName
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              )}
            >
              {copiedId === clientName ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {clientTasks.map((task) => (
              <div key={task.id} className="px-6 py-4">
                <p className="font-medium text-gray-900">{task.title}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Due: {new Date(task.promisedDate).toLocaleDateString()}
                  {task.promisedTime && ` at ${task.promisedTime}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
