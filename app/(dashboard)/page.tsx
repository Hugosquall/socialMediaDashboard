import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Camera,
  BarChart3,
  CalendarDays,
  Swords,
  Newspaper,
  TrendingUp,
  Users,
  Heart,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"

const sections = [
  {
    title: "Instagram Manager",
    href: "/instagram",
    icon: Camera,
    description: "Gerencie posts, stories e reels",
    stat: "12 posts agendados",
    badge: "Ativo",
    badgeVariant: "success" as const,
    color: "from-pink-500/20 to-rose-500/10",
    iconColor: "text-pink-400",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Performance e métricas detalhadas",
    stat: "+24% esse mês",
    badge: "Novo dado",
    badgeVariant: "default" as const,
    color: "from-indigo-500/20 to-violet-500/10",
    iconColor: "text-indigo-400",
  },
  {
    title: "Content Calendar",
    href: "/calendar",
    icon: CalendarDays,
    description: "Planeje seu conteúdo com antecedência",
    stat: "8 eventos esta semana",
    badge: "Atualizado",
    badgeVariant: "success" as const,
    color: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
  },
  {
    title: "Competitor Tracker",
    href: "/competitors",
    icon: Swords,
    description: "Monitore a concorrência em tempo real",
    stat: "5 concorrentes rastreados",
    badge: "3 alertas",
    badgeVariant: "warning" as const,
    color: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
  },
  {
    title: "News Consolidator",
    href: "/news",
    icon: Newspaper,
    description: "Todas as notícias do setor em um lugar",
    stat: "5 novas notícias",
    badge: "5 novos",
    badgeVariant: "default" as const,
    color: "from-sky-500/20 to-blue-500/10",
    iconColor: "text-sky-400",
  },
]

const kpiCards = [
  { label: "Seguidores totais", value: "Conectar", change: "Instagram pendente", icon: Users, trend: "up" },
  { label: "Engajamento médio", value: "—", change: "Aguardando dados", icon: Heart, trend: "up" },
  { label: "Posts publicados", value: "—", change: "Aguardando sincronização", icon: TrendingUp, trend: "up" },
  { label: "Alcance orgânico", value: "—", change: "Aguardando insights", icon: ArrowUpRight, trend: "up" },
]

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-[var(--border)]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">{kpi.label}</p>
                    <p className="mt-1.5 text-2xl font-bold text-[var(--foreground)]">{kpi.value}</p>
                    <p className="mt-1 text-xs text-emerald-400">{kpi.change}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                    <Icon size={16} className="text-[var(--primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Seções do dashboard */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Módulos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.href} href={section.href}>
                <Card className="group cursor-pointer border-[var(--border)] transition-all duration-200 hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${section.color}`}>
                        <Icon size={18} className={section.iconColor} />
                      </div>
                      <Badge variant={section.badgeVariant}>{section.badge}</Badge>
                    </div>
                    <CardTitle className="mt-3 text-base">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-[var(--muted-foreground)]">{section.stat}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100">
                      Acessar módulo
                      <ArrowUpRight size={12} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
