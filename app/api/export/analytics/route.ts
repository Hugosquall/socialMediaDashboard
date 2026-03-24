import { NextRequest, NextResponse } from "next/server"
import type { AnalyticsResponse } from "@/app/api/analytics/route"

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value)
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

function toCsv(rows: Array<Array<string | number | null | undefined>>): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n")
}

function defaultDateRange() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const defaults = defaultDateRange()
  const from = searchParams.get("from") ?? defaults.from
  const to = searchParams.get("to") ?? defaults.to

  const analyticsUrl = new URL("/api/analytics", request.url)
  analyticsUrl.searchParams.set("from", from)
  analyticsUrl.searchParams.set("to", to)

  const analyticsResponse = await fetch(analyticsUrl.toString(), {
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  })

  if (!analyticsResponse.ok) {
    return NextResponse.json(
      { error: "Falha ao obter analytics para exportação" },
      { status: 500 }
    )
  }

  const analytics = (await analyticsResponse.json()) as AnalyticsResponse

  const rows: Array<Array<string | number | null | undefined>> = [
    ["section", "date", "network", "post_id", "caption", "type", "impressions", "reach", "engagement_rate", "followers", "likes", "comments", "saves", "metric", "instagram", "facebook", "twitter", "value"],
    ["meta", null, null, null, null, null, null, null, null, null, null, null, null, "source", null, null, null, analytics.source],
    ["meta", null, null, null, null, null, null, null, null, null, null, null, null, "range_from", null, null, null, from],
    ["meta", null, null, null, null, null, null, null, null, null, null, null, null, "range_to", null, null, null, to],
  ]

  for (const day of analytics.daily) {
    rows.push([
      "daily",
      day.date,
      null,
      null,
      null,
      null,
      day.impressions,
      day.reach,
      day.engagementRate,
      day.followers,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ])
  }

  for (const post of analytics.topPosts) {
    rows.push([
      "top_post",
      null,
      post.network,
      post.id,
      post.caption,
      post.type,
      post.impressions,
      post.reach,
      post.engagement,
      null,
      post.likes,
      post.comments,
      post.saves,
      null,
      null,
      null,
      null,
      null,
    ])
  }

  for (const item of analytics.engagementByType) {
    rows.push([
      "engagement_by_type",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      item.type,
      item.instagram,
      item.facebook,
      item.twitter,
      null,
    ])
  }

  const dateStamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="analytics-${dateStamp}.csv"`,
      "cache-control": "no-store",
    },
  })
}
