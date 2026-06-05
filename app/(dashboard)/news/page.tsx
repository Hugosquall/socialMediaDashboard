import NewsFeed from "@/components/news/news-feed"
import { brandConfig } from "@/lib/brand"

export const metadata = {
  title: `AI Dev Radar — ${brandConfig.appName}`,
  description: "Feed de IA, engenharia de software, qualidade e ferramentas para produtos com IA.",
}

export default function NewsPage() {
  return <NewsFeed />
}
