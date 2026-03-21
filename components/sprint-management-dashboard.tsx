"use client"

import { useState } from "react"
import useSWR from "swr"

const fetcher = (url: string) => {
  const token = localStorage.getItem("sessionToken")
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json())
}

export function SprintManagementDashboard() {
  const { data } = useSWR("/api/all-sprints", fetcher)
  const [selectedClient, setSelectedClient] = useState<string>("")

  const sprints = data?.sprints || []
  const clients = Array.from(new Set(sprints.map((s: any) => s.clientId)))
  
  const filteredSprints = selectedClient
    ? sprints.filter((s: any) => s.clientId === selectedClient)
    : sprints

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sprint Management</h1>
        <p className="text-gray-600">Select a client to view and manage sprints</p>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold">Select Client:</label>
        <select 
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Clients</option>
          {clients.map(clientId => (
            <option key={clientId} value={clientId}>{clientId}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {filteredSprints.map((sprint: any) => (
          <div key={sprint.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg">{sprint.name}</h3>
            <p className="text-sm text-gray-600">Status: {sprint.status}</p>
            <p className="text-sm text-gray-600">Dates: {sprint.start_date} to {sprint.end_date}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
