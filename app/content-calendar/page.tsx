"use client"

import { useState } from "react"
import { Plus, Download, Upload } from "lucide-react"
import { ContentCalendarView } from "@/components/content-calendar-view"
import AddContentModal from "@/components/add-content-modal-cv"

export default function ContentCalendarPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-sm text-gray-600 mt-2">Plan content distribution, manage blackout dates, optimize posting schedule</p>
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
            Schedule Post
          </button>
        </div>
      </div>

      {/* Content Calendar */}
      <ContentCalendarView 
        clientId={null}
        onCreatePost={() => setShowAddModal(true)}
      />

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
