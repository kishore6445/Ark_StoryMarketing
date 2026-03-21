"use client"

import { ChevronRight, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs"

interface BreadcrumbTrailProps {
  items?: Array<{
    label: string
    onClick?: () => void
    active?: boolean
  }>
}

export function BreadcrumbTrail({ items }: BreadcrumbTrailProps) {
  const autoBreadcrumbs = useBreadcrumbs()
  const breadcrumbs = items || autoBreadcrumbs

  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-200 text-sm">
      <LayoutDashboard className="w-4 h-4 text-gray-600" />
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              {item.label}
            </button>
          ) : "href" in item ? (
            <Link
              href={item.href}
              className={
                item.active
                  ? "text-gray-900 font-medium cursor-default"
                  : "text-blue-600 hover:text-blue-700 transition-colors"
              }
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={
                item.active ? "text-gray-900 font-medium" : "text-gray-600"
              }
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
