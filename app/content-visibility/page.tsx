"use client"

import { useState } from "react"
import { Plus, Download, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { ContentClientPipeline } from "@/components/content-client-pipeline"
import { ContentCalendarView } from "@/components/content-calendar-view"
import { ContentTrackerTable } from "@/components/content-tracker-table"
import AddContentModal from "@/components/add-content-modal-cv"

// Get current month
const getCurrentMonth = () => {
  const date = new Date()
  return date.toLocaleString("default", { month: "long" }).toLowerCase()
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
const CLIENTS = ["All Clients", "Telugu Pizza", "Smart Snaxx", "Visa Nagendar", "Story Marketing", "ArkTechies"]

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const TABS = [
  { id: "pipeline", label: "Pipeline Overview" },
  { id: "calendar", label: "Content Calendar" },
  { id: "tracker", label: "Content Tracker" },
]

export default function ContentVisibilityPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedClient, setSelectedClient] = useState("All Clients")
  const [activeTab, setActiveTab] = useState("pipeline")

  // Fetch pipeline data from API
  const { data: pipelineData, isLoading: pipelineLoading } = useSWR(
    `/api/content/pipeline?client=${selectedClient}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Fetch calendar data from API
  const { data: calendarData, isLoading: calendarLoading } = useSWR(
    activeTab === "calendar" ? `/api/content/calendar?clientId=${selectedClient}&month=${selectedMonth}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Fetch tracker data from API
  const { data: trackerData, isLoading: trackerLoading } = useSWR(
    activeTab === "tracker" ? `/api/content/tracker` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const displayClients = pipelineData?.clients || []

  return (
    <div className="w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-sm text-gray-600 mt-2">Plan, schedule, and track content across all clients</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Upload">
            <Upload className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Content
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Month</label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 transition-colors"
          >
            {MONTHS.map((month) => (
              <option key={month} value={month}>
                {month.charAt(0).toUpperCase() + month.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Client</label>
          <select 
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 transition-colors"
          >
            {CLIENTS.map((client) => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "text-blue-600 border-b-blue-600"
                : "text-gray-600 border-b-transparent hover:text-gray-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "pipeline" && (
        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Total Planned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {displayClients.reduce((sum: number, c: any) => sum + c.planned, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">
                  {displayClients.reduce((sum: number, c: any) => sum + c.scheduled, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayClients.reduce((sum: number, c: any) => sum + c.published, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Gap</p>
                <p className="text-2xl font-bold text-red-600">
                  {displayClients.reduce((sum: number, c: any) => sum + (c.planned - c.published), 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Client Pipeline */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              {selectedClient === "All Clients" ? "All Clients" : selectedClient} - {selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)}
            </h2>
            <ContentClientPipeline 
              clients={displayClients} 
              loading={pipelineLoading}
            />
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div key="calendar-tab">
          <ContentCalendarView 
            clientId={selectedClient === "All Clients" ? null : selectedClient}
            onCreatePost={() => setShowAddModal(true)}
          />
        </div>
      )}

      {activeTab === "tracker" && (
        <div key="tracker-tab">
          <ContentTrackerTable data={trackerData?.items || []} />
        </div>
      )}

      {/* Add Content Modal */}
      {showAddModal && (
        <AddContentModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => {
            console.log("[v0] Add content:", data)
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

  return (
    <div className="w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-sm text-gray-600 mt-2">Plan, schedule, and track content across all clients</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Upload">
            <Upload className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Content
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Month</label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 transition-colors"
          >
            {MONTHS.map((month) => (
              <option key={month} value={month}>
                {month.charAt(0).toUpperCase() + month.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Client</label>
          <select 
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 transition-colors"
          >
            {CLIENTS.map((client) => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "text-blue-600 border-b-blue-600"
                : "text-gray-600 border-b-transparent hover:text-gray-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "pipeline" && (
        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Total Planned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {displayClients.reduce((sum, c) => sum + c.planned, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">
                  {displayClients.reduce((sum, c) => sum + c.scheduled, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayClients.reduce((sum, c) => sum + c.published, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Gap</p>
                <p className="text-2xl font-bold text-red-600">
                  {displayClients.reduce((sum, c) => sum + (c.planned - c.published), 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Client Pipeline */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              {selectedClient === "All Clients" ? "All Clients" : selectedClient} - {selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)}
            </h2>
            <ContentClientPipeline 
              clients={displayClients} 
              loading={isLoading}
            />
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div key="calendar-tab">
          <ContentCalendarView 
            clientId={selectedClient === "All Clients" ? null : selectedClient}
            onCreatePost={() => setShowAddModal(true)}
          />
        </div>
      )}

      {activeTab === "tracker" && (
        <div key="tracker-tab">
          <ContentTrackerTable data={MOCK_CONTENT} />
        </div>
      )}

      {/* Add Content Modal */}
      {showAddModal && (
        <AddContentModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => {
            console.log("[v0] Add content:", data)
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

