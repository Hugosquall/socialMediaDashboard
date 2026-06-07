"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BookMarked, Loader2, Plus, Save, SwatchBook } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { BrandKit, ContentMemory } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"

type MemoryType = "hook" | "cta" | "theme" | "learning"

const defaultKit = {
  logo_url: "",
  primary_color: "#22d3ee",
  accent_color: "#34d399",
  tone: "Tecnico, claro, pragmatico e sem hype",
  default_cta: "Salve para revisar antes do proximo planejamento tecnico.",
  signature: "IA aplicada, desenvolvimento e qualidade de software.",
}

const typeLabels: Record<MemoryType, string> = {
  hook: "Hook",
  cta: "CTA",
  theme: "Tema",
  learning: "Aprendizado",
}

export default function BrandKitPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [kit, setKit] = useState(defaultKit)
  const [memory, setMemory] = useState<ContentMemory[]>([])
  const [memoryType, setMemoryType] = useState<MemoryType>("hook")
  const [memoryTitle, setMemoryTitle] = useState("")
  const [memoryBody, setMemoryBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const loadContext = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: brandKit }, { data: memoryRows }] = await Promise.all([
        supabase.from("brand_kit").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("content_memory")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12),
      ])

      if (brandKit) {
        const row = brandKit as BrandKit
        setKit({
          logo_url: row.logo_url ?? "",
          primary_color: row.primary_color,
          accent_color: row.accent_color,
          tone: row.tone,
          default_cta: row.default_cta,
          signature: row.signature,
        })
      }
      setMemory((memoryRows ?? []) as ContentMemory[])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  async function saveKit() {
    if (!userId) return
    setSaving(true)
    setFeedback(null)
    try {
      const { error } = await supabase.from("brand_kit").upsert({
        user_id: userId,
        logo_url: kit.logo_url || null,
        primary_color: kit.primary_color,
        accent_color: kit.accent_color,
        tone: kit.tone,
        default_cta: kit.default_cta,
        signature: kit.signature,
      })

      setFeedback(error ? error.message : "Brand Kit salvo.")
    } finally {
      setSaving(false)
    }
  }

  async function addMemory() {
    if (!userId || !memoryTitle.trim()) return
    const { data, error } = await supabase
      .from("content_memory")
      .insert({
        user_id: userId,
        type: memoryType,
        title: memoryTitle.trim(),
        body: memoryBody.trim(),
        source: "manual",
      })
      .select()
      .single()

    if (error || !data) {
      setFeedback(error?.message ?? "Não foi possível salvar a memória.")
      return
    }

    setMemory((prev) => [data as ContentMemory, ...prev].slice(0, 12))
    setMemoryTitle("")
    setMemoryBody("")
    setFeedback("Memória salva.")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.88fr)_minmax(0,1.12fr)]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
              <SwatchBook size={17} />
            </div>
            <div>
              <CardTitle className="text-base">Brand Kit</CardTitle>
              <CardDescription>Tom, CTA, assinatura visual e cores base para geração.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
              Cor primária
              <input
                value={kit.primary_color}
                onChange={(event) => setKit((prev) => ({ ...prev, primary_color: event.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </label>
            <label className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
              Cor de apoio
              <input
                value={kit.accent_color}
                onChange={(event) => setKit((prev) => ({ ...prev, accent_color: event.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]"
              />
            </label>
          </div>
          <label className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
            URL do logo
            <input
              value={kit.logo_url}
              onChange={(event) => setKit((prev) => ({ ...prev, logo_url: event.target.value }))}
              placeholder="https://..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
            Tom de voz
            <textarea
              value={kit.tone}
              onChange={(event) => setKit((prev) => ({ ...prev, tone: event.target.value }))}
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
            CTA padrão
            <input
              value={kit.default_cta}
              onChange={(event) => setKit((prev) => ({ ...prev, default_cta: event.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </label>
          <label className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
            Assinatura
            <input
              value={kit.signature}
              onChange={(event) => setKit((prev) => ({ ...prev, signature: event.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </label>
          <Button type="button" onClick={saveKit} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar Brand Kit
          </Button>
          {feedback && <p className="text-xs text-[var(--muted-foreground)]">{feedback}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookMarked size={16} className="text-[var(--primary)]" />
            Memória de conteúdo
          </CardTitle>
          <CardDescription>Hooks, CTAs, temas e aprendizados para reaproveitar no Growth Lab.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)]">
            <select
              value={memoryType}
              onChange={(event) => setMemoryType(event.target.value as MemoryType)}
              className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              {(Object.keys(typeLabels) as MemoryType[]).map((type) => (
                <option key={type} value={type}>{typeLabels[type]}</option>
              ))}
            </select>
            <input
              value={memoryTitle}
              onChange={(event) => setMemoryTitle(event.target.value)}
              placeholder="Ex: Hook sobre evals contínuos"
              className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </div>
          <textarea
            value={memoryBody}
            onChange={(event) => setMemoryBody(event.target.value)}
            placeholder="Texto, contexto ou aprendizado..."
            rows={3}
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)]"
          />
          <Button type="button" variant="outline" size="sm" onClick={addMemory}>
            <Plus size={14} />
            Adicionar memória
          </Button>

          <div className="grid gap-2 sm:grid-cols-2">
            {memory.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/35 p-3">
                <Badge variant="secondary">{typeLabels[item.type as MemoryType] ?? item.type}</Badge>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                {item.body && (
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--muted-foreground)]">{item.body}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
