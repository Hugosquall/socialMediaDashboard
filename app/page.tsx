/**
 * Root page — redirect to the dashboard Overview.
 *
 * This file exists because `create-next-app` generates it automatically.
 * The real dashboard home lives at app/(dashboard)/page.tsx, which is
 * rendered within the Sidebar + Topbar layout.
 *
 * When authentication is added, change this redirect to point at /login.
 */
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/instagram")
}
