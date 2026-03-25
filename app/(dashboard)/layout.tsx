import { DashboardShell } from "@/components/layout/dashboard-shell"

// Dashboard pages depend on authenticated/request-specific data.
// Force request-time rendering to avoid static prerender during CI builds.
export const dynamic = "force-dynamic"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
