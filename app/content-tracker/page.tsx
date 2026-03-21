"use client"

import { useState } from "react"
import { Plus, Download, Upload } from "lucide-react"
import useSWR from "swr"
import { ContentTrackerTable } from "@/components/content-tracker-table"
import AddContentModal from "@/components/add-content-modal-cv"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ContentTrackerPage() {
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch tracker data from API
  const { data: trackerData, isLoading } = useSWR(
    `/api/content/tracker`,
    fetcher,
    { revalidateOnFocus: false }
  )

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
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600">Loading content tracker...</p>
        </div>
      ) : (
        <ContentTrackerTable data={trackerData?.items || []} />
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
