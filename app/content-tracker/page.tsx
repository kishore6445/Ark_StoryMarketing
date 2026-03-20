"use client"

import { useState } from "react"
import { Plus, Filter } from "lucide-react"
import { ContentTrackerSummary } from "@/components/content-tracker-summary"
import { ContentTrackerFilters } from "@/components/content-tracker-filters"
import { ContentTrackerTable } from "@/components/content-tracker-table"
import { AddContentModal } from "@/components/add-content-modal"

// Sample data for demonstration
const sampleContentData = [
  {
    id: "1",
    client: "TechStart Inc",
    title: "Product Launch Announcement",
    platform: "LinkedIn",
    contentType: "Article",
    plannedDate: "2024-03-15",
    postedDate: "2024-03-15",
    status: "Posted",
    owner: "Sarah Johnson",
    postLink: "https://linkedin.com/posts/12345",
    notes: "Successfully launched on time",
  },
  {
    id: "2",
    client: "TechStart Inc",
    title: "Customer Success Story",
    platform: "Twitter",
    contentType: "Video",
    plannedDate: "2024-03-20",
    postedDate: null,
    status: "Pending",
    owner: "Mike Chen",
    postLink: null,
    notes: "In review process",
  },
  {
    id: "3",
    client: "DigitalFlow",
    title: "Q1 Results",
    platform: "Instagram",
    contentType: "Carousel",
    plannedDate: "2024-03-10",
    postedDate: null,
    status: "Missed",
    owner: "Emily Davis",
    postLink: null,
    notes: "Delayed due to design revisions",
  },
  {
    id: "4",
    client: "DigitalFlow",
    title: "Behind the Scenes",
    platform: "TikTok",
    contentType: "Video",
    plannedDate: "2024-03-18",
    postedDate: "2024-03-18",
    status: "Posted",
    owner: "James Wilson",
    postLink: "https://tiktok.com/video/67890",
    notes: "Great engagement, 5K views",
  },
  {
    id: "5",
    client: "TechStart Inc",
    title: "Webinar Announcement",
    platform: "Email",
    contentType: "Newsletter",
    plannedDate: "2024-03-22",
    postedDate: null,
    status: "Scheduled",
    owner: "Sarah Johnson",
    postLink: null,
    notes: "Scheduled for 3/22 at 10 AM",
  },
  {
    id: "6",
    client: "GrowthCorp",
    title: "Case Study Release",
    platform: "LinkedIn",
    contentType: "PDF",
    plannedDate: "2024-03-25",
    postedDate: null,
    status: "Paused",
    owner: "Lisa Anderson",
    postLink: null,
    notes: "On hold pending client approval",
  },
]

export default function ContentTrackerPage() {
  const [contentData, setContentData] = useState(sampleContentData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    client: "",
    platform: "",
    owner: "",
    status: "",
    month: new Date().toISOString().slice(0, 7),
  })

  const filteredData = contentData.filter((item) => {
    if (filters.client && item.client !== filters.client) return false
    if (filters.platform && item.platform !== filters.platform) return false
    if (filters.owner && item.owner !== filters.owner) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.month) {
      const itemMonth = item.plannedDate?.slice(0, 7)
      if (itemMonth !== filters.month) return false
    }
    return true
  })

  const stats = {
    totalPlanned: contentData.length,
    totalPosted: contentData.filter((d) => d.status === "Posted").length,
    totalPending: contentData.filter((d) => d.status === "Pending").length,
    totalMissed: contentData.filter((d) => d.status === "Missed").length,
  }

  const handleAddContent = (newContent: any) => {
    setContentData([...contentData, { ...newContent, id: String(contentData.length + 1) }])
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Content Tracker</h1>
          <p className="text-slate-600 mt-2">Track planned vs posted content across all clients</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Content
        </button>
      </div>

      {/* Summary Cards */}
      <ContentTrackerSummary stats={stats} />

      {/* Filters */}
      <ContentTrackerFilters filters={filters} onFilterChange={setFilters} contentData={contentData} />

      {/* Content Table */}
      <ContentTrackerTable data={filteredData} />

      {/* Add Content Modal */}
      {isModalOpen && (
        <AddContentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddContent}
          contentData={contentData}
        />
      )}
    </div>
  )
}
