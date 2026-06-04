export const META_GRAPH_API_VERSION =
  process.env.META_GRAPH_API_VERSION?.trim() || "v19.0"

export const FACEBOOK_INSTAGRAM_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
  "instagram_basic",
  "instagram_content_publish",
].join(",")

export function getMetaAppCredentials() {
  return {
    appId: process.env.META_APP_ID?.trim() || process.env.INSTAGRAM_APP_ID?.trim() || "",
    appSecret:
      process.env.META_APP_SECRET?.trim() || process.env.INSTAGRAM_APP_SECRET?.trim() || "",
  }
}
