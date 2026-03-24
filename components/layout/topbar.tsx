"use client"

import { Bell, Menu, Search } from "lucide-react"
import { usePathname } from "next/navigation"

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": { title: "Overview", description: "Visão geral do seu dashboard" },
  "/instagram": { title: "Instagram Manager", description: "Gerencie posts, stories e engajamento" },
  "/analytics": { title: "Analytics", description: "Métricas e performance de conteúdo" },
  "/calendar": { title: "Content Calendar", description: "Planejamento e agendamento de conteúdo" },
  "/competitors": { title: "Competitor Tracker", description: "Monitore os seus concorrentes" },
  "/news": { title: "News Consolidator", description: "Notícias e tendências do setor" },
  "/notifications": { title: "Notifications", description: "Suas notificações e alertas" },
  "/settings": { title: "Settings", description: "Configurações do dashboard" },
}

export function Topbar({
  onOpenMobileMenu,
}: {
  onOpenMobileMenu?: () => void
}) {
  const pathname = usePathname()
  const page = pageTitles[pathname] ?? { title: "Dashboard", description: "" }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={16} />
        </button>
        <div>
          <h1 className="text-base font-semibold leading-none text-[var(--foreground)]">{page.title}</h1>
          {page.description && (
            <p className="mt-1 hidden text-xs text-[var(--muted-foreground)] sm:block">{page.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/50 focus-within:border-[var(--primary)]/50 focus-within:text-[var(--foreground)] sm:flex">
          <Search size={14} />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-40 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
          />
        </div>

        {/* Notificações */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] transition-colors hover:bg-[var(--accent)]">
          <Bell size={15} className="text-[var(--muted-foreground)]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--primary)]" />
        </button>
      </div>
    </header>
  )
}
