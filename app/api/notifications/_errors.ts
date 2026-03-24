import { NextResponse } from "next/server"

export const NOTIFICATIONS_TABLE_MISSING_CODE = "NOTIFICATIONS_TABLE_MISSING" as const

type NotificationsErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export type NotificationsErrorResponse = {
  error: string
  code?: string
}

export type NotificationsHealthResponse = {
  ok: boolean
  status: "ready" | "missing_table" | "unauthenticated" | "error"
  message: string
  code?: string
}

export type NotificationsResolvedError = {
  status: number
  body: NotificationsErrorResponse
}

export type NotificationsResolvedHealthError = {
  status: number
  body: NotificationsHealthResponse
}

function normalizeErrorText(error: NotificationsErrorLike): string {
  return [error.code, error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()
}

export function isNotificationsTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const candidate = error as NotificationsErrorLike
  const text = normalizeErrorText(candidate)

  return (
    candidate.code === "42P01" ||
    candidate.code === "PGRST205" ||
    text.includes('relation "public.notifications" does not exist') ||
    text.includes('relation "notifications" does not exist') ||
    text.includes("could not find the table") ||
    text.includes("schema cache")
  )
}

export function resolveNotificationsError(
  error: unknown,
  fallbackMessage: string
): NotificationsResolvedError {
  if (isNotificationsTableMissingError(error)) {
    return {
      status: 503,
      body: {
        error: "A tabela `notifications` ainda não foi criada. Aplique a migration do banco e tente novamente.",
        code: NOTIFICATIONS_TABLE_MISSING_CODE,
      },
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      status: 500,
      body: {
        error: error.message,
      },
    }
  }

  return {
    status: 500,
    body: {
      error: fallbackMessage,
    },
  }
}

export function jsonError(status: number, message: string, code?: string) {
  const body: NotificationsErrorResponse = code ? { error: message, code } : { error: message }
  return NextResponse.json(body, { status })
}

export function resolveNotificationsHealthError(
  error: unknown,
  fallbackMessage: string
): NotificationsResolvedHealthError {
  if (isNotificationsTableMissingError(error)) {
    return {
      status: 503,
      body: {
        ok: false,
        status: "missing_table",
        message: "A tabela `notifications` ainda não foi criada. Aplique a migration do banco e tente novamente.",
        code: NOTIFICATIONS_TABLE_MISSING_CODE,
      },
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      status: 500,
      body: {
        ok: false,
        status: "error",
        message: error.message,
      },
    }
  }

  return {
    status: 500,
    body: {
      ok: false,
      status: "error",
      message: fallbackMessage,
    },
  }
}
