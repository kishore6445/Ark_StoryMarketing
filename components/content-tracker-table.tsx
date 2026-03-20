"use client"

import { ExternalLink } from "lucide-react"

interface ContentTrackerTableProps {
  data: any[]
}

const statusStyles = {
  Planned: "bg-gray-100 text-gray-800",
  Scheduled: "bg-blue-100 text-blue-800",
  Posted: "bg-green-100 text-green-800",
  Missed: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Paused: "bg-orange-100 text-orange-800",
}

const statusColors = {
  Planned: "border-l-4 border-gray-400",
  Scheduled: "border-l-4 border-blue-400",
  Posted: "border-l-4 border-green-400",
  Missed: "border-l-4 border-red-400",
  Pending: "border-l-4 border-yellow-400",
  Paused: "border-l-4 border-orange-400",
}

export function ContentTrackerTable({ data }: ContentTrackerTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <p className="text-gray-600 font-medium">No content found matching your filters</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Client</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Title</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Platform</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Planned Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Posted Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Owner</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Link</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${statusColors[item.status]}`}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.client}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.title}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.platform}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.contentType}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.plannedDate}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.postedDate || "-"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.owner}</td>
                <td className="px-6 py-4 text-sm">
                  {item.postLink ? (
                    <a
                      href={item.postLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={item.notes}>
                  {item.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with row count */}
      <div className="bg-slate-50 border-t border-gray-200 px-6 py-3">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{data.length}</span> of{" "}
          <span className="font-semibold">{data.length}</span> items
        </p>
      </div>
    </div>
  )
}
