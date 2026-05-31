import NewsFeed from "@/components/news/news-feed"
import { brandConfig } from "@/lib/brand"

export const metadata = {
  title: `News — ${brandConfig.appName}`,
  description: "Feed de notícias sobre Arquitetura, Construção e Design agregado de fontes RSS.",
}

export default function NewsPage() {
  return <NewsFeed />
}
