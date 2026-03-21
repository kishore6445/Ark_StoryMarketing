import { useMemo } from "react"
import { usePathname } from "next/navigation"

export interface BreadcrumbItem {
  label: string
  href: string
  active?: boolean
}

const ROUTE_LABELS: Record<string, string> = {
  "": "Home",
  "page": "Dashboard",
  "account-manager": "Account Manager",
  "admin": "Admin",
  "client-hub": "Client Hub",
  "client-portal": "Client Portal",
  "collaboration": "Collaboration",
  "command-center": "Command Center",
  "connect-social": "Connect Social",
  "content-calendar": "Content Calendar",
  "content-tracker": "Content Tracker",
  "content-visibility": "Content Visibility",
  "knowledge-base": "Knowledge Base",
  "login": "Login",
  "meetings": "Meetings",
  "pkr-analytics": "PKR Analytics",
  "register": "Register",
  "sprint-demo": "Sprint Demo",
  "sprint-recap": "Sprint Recap",
  "tasks": "Tasks",
  "team-analytics": "Team Analytics",
  "team-task-manager": "Team Task Manager",
  "weekly-summary": "Weekly Summary",
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname()

  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)

    if (segments.length === 0) {
      return [{ label: "Home", href: "/", active: true }]
    }

    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" }
    ]

    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/")
      const label = ROUTE_LABELS[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
      
      breadcrumbs.push({
        label,
        href,
        active: index === segments.length - 1,
      })
    })

    return breadcrumbs
  }, [pathname])
}
