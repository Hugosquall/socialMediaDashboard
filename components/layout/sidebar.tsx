"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Camera,
  BarChart3,
  CalendarDays,
  Swords,
  Newspaper,
  LayoutDashboard,
  Settings,
  Bell,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { brandConfig, getInitials } from "@/lib/brand"

const navItems = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Instagram Manager",
    href: "/instagram",
    icon: Camera,
    badge: "12",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Content Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "Competitor Tracker",
    href: "/competitors",
    icon: Swords,
  },
  {
    label: "News Consolidator",
    href: "/news",
    icon: Newspaper,
    badge: "5",
  },
]

const bottomItems = [
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
]

type SidebarProps = {
  isMobileMenuOpen?: boolean
  onCloseMobileMenu?: () => void
}

type SidebarPanelProps = {
  pathname: string
  onNavigate?: () => void
  onLogout: () => Promise<void>
}

function SidebarPanel({ pathname, onNavigate, onLogout }: SidebarPanelProps) {
  const initials = getInitials(brandConfig.brandName)

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] shadow-lg shadow-indigo-500/25">
          <LayoutDashboard size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-[var(--foreground)]">{brandConfig.appName}</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{brandConfig.tagline}</p>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Menu
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                    isActive
                      ? "bg-[var(--primary)]/15 font-medium text-[var(--primary)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  )}
                >
                  <Icon
                    size={17}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)]/20 px-1.5 text-[10px] font-semibold text-[var(--primary)]">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight size={14} className="text-[var(--primary)] opacity-60" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Rodapé */}
      <div className="border-t border-[var(--border)] px-3 py-3">
        <ul className="space-y-0.5">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                    isActive
                      ? "bg-[var(--primary)]/15 font-medium text-[var(--primary)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  )}
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Avatar + logout */}
        <div className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[var(--foreground)]">{brandConfig.brandName}</p>
            <p className="truncate text-[10px] text-[var(--muted-foreground)]">{brandConfig.userRole}</p>
          </div>
          <button
            type="button"
            onClick={() => void onLogout()}
            title="Sair"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  )
}

export function Sidebar({
  isMobileMenuOpen = false,
  onCloseMobileMenu,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    onCloseMobileMenu?.()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <aside className="hidden h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] lg:flex">
        <SidebarPanel pathname={pathname} onLogout={handleLogout} />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobileMenu}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] transition-transform duration-200 lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarPanel
          pathname={pathname}
          onNavigate={onCloseMobileMenu}
          onLogout={handleLogout}
        />
      </aside>
    </>
  )
}
