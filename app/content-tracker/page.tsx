"use client"

import { useState } from "react"
import { Plus, Download, Upload } from "lucide-react"
import { ContentTrackerTable } from "@/components/content-tracker-table"
import AddContentModal from "@/components/add-content-modal-cv"

// Mock content tracker data
const MOCK_CONTENT = [
  {
    id: "1",
    client: "Telugu Pizza",
    title: "Top 5 Pizza Hacks",
    type: "Blog",
    status: "In Review" as const,
    daysOverdue: 1,
    workflow: { writer: "Done" as const, editor: "In Progress" as const, designer: "Pending" as const },
    blocker: "Editor"
  },
  {
    id: "2",
    client: "Smart Snaxx",
    title: "Unboxing New Product",
    type: "Reel",
    status: "In Progress" as const,
    daysOverdue: 0,
    workflow: { writer: "Done" as const, editor: "In Progress" as const, designer: "Not Started" as const },
    blocker: undefined
  },
  {
    id: "3",
    client: "Visa Nagendar",
    title: "Q2 Roadmap",
    type: "Blog",
    status: "Draft" as const,
    daysOverdue: 0,
    workflow: { writer: "Not Started" as const, editor: "Not Started" as const, designer: "Not Started" as const },
    blocker: "Writer"
  },
  {
    id: "4",
    client: "Story Marketing",
    title: "Brand Guidelines Update",
    type: "Document",
    status: "In Progress" as const,
    daysOverdue: 0,
    workflow: { writer: "Done" as const, editor: "Done" as const, designer: "In Progress" as const },
    blocker: undefined
  },
  {
    id: "5",
    client: "ArkTechies",
    title: "March Newsletter",
    type: "Email",
    status: "In Review" as const,
    daysOverdue: 2,
    workflow: { writer: "Done" as const, editor: "Done" as const, designer: "Done" as const },
    blocker: undefined
  },
]

export default function ContentTrackerPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Tracker</h1>
          <p className="text-sm text-gray-600 mt-2">Monitor content workflow and identify blockers</p>
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

      {/* Content Tracker Table */}
      <ContentTrackerTable data={MOCK_CONTENT} />

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
