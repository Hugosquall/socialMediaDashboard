export type InstagramTokenState = "active" | "expiring" | "expired" | "unknown" | "disconnected"

export type InstagramTokenStatus = {
  expiresInDays: number | null
  tokenState: InstagramTokenState
}

export function getInstagramTokenStatus(
  expiresAt: string | null,
  nowMs = Date.now()
): InstagramTokenStatus {
  if (!expiresAt) {
    return { expiresInDays: null, tokenState: "unknown" }
  }

  const expiresTime = new Date(expiresAt).getTime()
  if (!Number.isFinite(expiresTime)) {
    return { expiresInDays: null, tokenState: "unknown" }
  }

  const diffMs = expiresTime - nowMs
  const expiresInDays = Math.ceil(diffMs / 86_400_000)

  if (expiresInDays < 0) {
    return { expiresInDays, tokenState: "expired" }
  }
  if (expiresInDays <= 7) {
    return { expiresInDays, tokenState: "expiring" }
  }

  return { expiresInDays, tokenState: "active" }
}
