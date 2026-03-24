/**
 * /api/analytics/sources
 *
 * GET  → retorna quais fontes estão disponíveis (instagram, metricool)
 * POST → salva/atualiza a METRICOOL_API_KEY no .env.local
 * DELETE → remove a METRICOOL_API_KEY do .env.local
 *
 * Nota: escrever no .env.local só funciona em ambiente de desenvolvimento local.
 * Em produção (Vercel, etc.) as env vars são gerenciadas pelo painel do host.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as fs from "fs"
import * as path from "path"

const ENV_PATH = path.join(process.cwd(), ".env.local")

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readEnvFile(): string {
  return fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf-8") : ""
}

function setEnvVar(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, "m")
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`)
  }
  return content.trimEnd() + `\n${key}=${value}\n`
}

function removeEnvVar(content: string, key: string): string {
  return content.replace(new RegExp(`^${key}=.*\n?`, "m"), "")
}

// ─── GET — verifica fontes disponíveis ────────────────────────────────────────

export async function GET() {
  // Verifica Instagram token no Supabase
  let instagram = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from("instagram_tokens")
        .select("id")
        .eq("user_id", user.id)
        .single()
      instagram = !!data
    }
  } catch { /* silencioso */ }

  // Verifica Metricool via env
  const metricool = !!(process.env.METRICOOL_API_KEY?.trim())

  return NextResponse.json({ instagram, metricool })
}

// ─── POST — salva Metricool API key ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { metricoolApiKey?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const key = body.metricoolApiKey?.trim()
  if (!key) {
    return NextResponse.json({ error: "Chave inválida" }, { status: 400 })
  }

  // Valida a chave chamando a Metricool API antes de salvar
  try {
    const testRes = await fetch("https://app.metricool.com/api/v2/user", {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!testRes.ok && testRes.status === 401) {
      return NextResponse.json(
        { error: "Chave de API inválida — verifique no painel da Metricool" },
        { status: 401 }
      )
    }
    // Qualquer outro status != 401 é aceito (pode ser 404 ou endpoint diferente)
  } catch {
    // Não bloqueamos se a validação falhar por timeout/rede — salvamos mesmo assim
  }

  // Escreve no .env.local
  try {
    const updated = setEnvVar(readEnvFile(), "METRICOOL_API_KEY", key)
    fs.writeFileSync(ENV_PATH, updated, "utf-8")
    // Atualiza process.env para a sessão atual sem precisar reiniciar
    process.env.METRICOOL_API_KEY = key
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao salvar no .env.local: ${err}` },
      { status: 500 }
    )
  }
}

// ─── DELETE — remove Metricool API key ───────────────────────────────────────

export async function DELETE() {
  try {
    const updated = removeEnvVar(readEnvFile(), "METRICOOL_API_KEY")
    fs.writeFileSync(ENV_PATH, updated, "utf-8")
    process.env.METRICOOL_API_KEY = ""
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao remover do .env.local: ${err}` },
      { status: 500 }
    )
  }
}
