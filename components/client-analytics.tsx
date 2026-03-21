"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function ClientAnalytics() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Minimal implementation - display client tasks
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Client Analytics - View and copy client tasks to WhatsApp
      </div>
    </div>
  )
}
