"use client"

import { useState } from "react"
import { Plus, Download, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import DeliveryHealthHero from "@/components/delivery-health-hero"
import NeedsAttentionSimple from "@/components/needs-attention-simple"
import ClientSLASimple from "@/components/client-sla-simple"
import TeamBottlenecks from "@/components/team-bottlenecks"
import WeeklyDeliveryTracker from "@/components/weekly-delivery-tracker"
import SchedulingReadiness from "@/components/scheduling-readiness"
import AddContentModal from "@/components/add-content-modal-cv"
import ContentRecordsUnified from "@/components/content-records-unified"

// Get current month
const getCurrentMonth = () => {
  const date = new Date()
  return date.toLocaleString("default", { month: "long" }).toLowerCase()
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4"]
const CLIENTS = ["All Clients", "Telugu Pizza", "Smart Snaxx", "Visa Nagendar", "Story Marketing", "ArkTechies"]

const CONTENT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "records", label: "Content Records" },
  { id: "sla", label: "Client SLA" },
  { id: "team", label: "Team Workload" },
]

export default function ContentVisibilityPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedWeek, setSelectedWeek] = useState("All Weeks")
  const [selectedClient, setSelectedClient] = useState("All Clients")
  const [activeContentTab, setActiveContentTab] = useState("overview")

  return (
    <div className="w-full max-w-7xl">
      {/* Header - Minimal */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Content Visibility</h1>
          <p className="text-sm text-gray-500 mt-2">Are we delivering content on time?</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Upload className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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

      {/* Filters - Month, Week, Client */}
      <div className="mb-8 flex gap-4">
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
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Week</label>
          <select 
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 transition-colors"
          >
            <option value="All Weeks">All Weeks</option>
            {WEEKS.map((week) => (
              <option key={week} value={week}>{week}</option>
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

      {/* Horizontal Tabs for Content Sections */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {CONTENT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveContentTab(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeContentTab === tab.id
                ? "text-blue-600 border-b-blue-600"
                : "text-gray-600 border-b-transparent hover:text-gray-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeContentTab === "overview" && (
        <div className="space-y-8">
          {/* Section 1: Delivery Health Hero */}
          <DeliveryHealthHero month={selectedMonth} week={selectedWeek} client={selectedClient} />

          {/* Section 2: Weekly Delivery Tracker */}
          <WeeklyDeliveryTracker month={selectedMonth} client={selectedClient} />

          {/* Section 3: Scheduling Readiness */}
          <SchedulingReadiness month={selectedMonth} />

          {/* Section 4: Needs Attention */}
          <NeedsAttentionSimple month={selectedMonth} week={selectedWeek} client={selectedClient} />
        </div>
      )}

      {activeContentTab === "records" && (
        <div>
          <ContentRecordsUnified 
            month={selectedMonth}
            week={selectedWeek}
            client={selectedClient}
          />
        </div>
      )}

      {activeContentTab === "sla" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client SLA Performance</h2>
          <ClientSLASimple month={selectedMonth} />
        </div>
      )}

      {activeContentTab === "team" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Workload Status</h2>
          <TeamBottlenecks />
        </div>
      )}

      {/* Add Content Modal */}
      {showAddModal && (
        <AddContentModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => {
            console.log("Add content:", data)
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}
