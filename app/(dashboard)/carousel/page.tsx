"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, FileText, ImageDown, Layers, Loader2, Plus, Save, Send, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CarouselProject } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type CarouselTheme = "signal" | "terminal" | "clean"

type EditableSlide = {
  id: string
  position: number
  headline: string
  body: string
  visualHint: string
  speakerNotes: string
}

const themeOptions: Record<CarouselTheme, { label: string; bg: string; accent: string; text: string }> = {
  signal: {
    label: "Signal",
    bg: "from-slate-950 via-[#101827] to-emerald-950",
    accent: "#22d3ee",
    text: "#f8fafc",
  },
  terminal: {
    label: "Terminal",
    bg: "from-zinc-950 via-neutral-950 to-lime-950",
    accent: "#84cc16",
    text: "#ecfccb",
  },
  clean: {
    label: "Clean",
    bg: "from-slate-100 via-white to-cyan-50",
    accent: "#2563eb",
    text: "#0f172a",
  },
}

function getInitialSource() {
  if (typeof window === "undefined") {
    return { title: "", content: "", sourceUrl: "", sourceType: "manual" }
  }

  const params = new URLSearchParams(window.location.search)
  return {
    title: params.get("title")?.trim() ?? "",
    content: params.get("content")?.trim() ?? "",
    sourceUrl: params.get("url")?.trim() ?? "",
    sourceType: params.get("source")?.trim() || "manual",
  }
}

function createSlides(title: string, content: string): EditableSlide[] {
  const baseTitle = title.trim() || "Ideia de conteúdo com IA"
  const context = content.trim() || "Contexto ainda não preenchido."

  return [
    {
      id: crypto.randomUUID(),
      position: 1,
      headline: baseTitle,
      body: "O que muda para quem cria, testa e entrega software com IA.",
      visualHint: "Radar técnico",
      speakerNotes: context,
    },
    {
      id: crypto.randomUUID(),
      position: 2,
      headline: "O ponto não é a notícia",
      body: "É o comportamento novo que ela sinaliza para times de produto e engenharia.",
      visualHint: "Contraste",
      speakerNotes: "",
    },
    {
      id: crypto.randomUUID(),
      position: 3,
      headline: "O erro comum",
      body: "Tratar IA como atalho isolado, sem processo, avaliação e governança.",
      visualHint: "Alerta",
      speakerNotes: "",
    },
    {
      id: crypto.randomUUID(),
      position: 4,
      headline: "O que observar",
      body: "Qualidade, custo, latência, segurança, regressões e impacto real no fluxo de entrega.",
      visualHint: "Checklist",
      speakerNotes: "",
    },
    {
      id: crypto.randomUUID(),
      position: 5,
      headline: "Como aplicar",
      body: "Escolha um caso pequeno, defina métrica, rode evals e só então aumente o escopo.",
      visualHint: "Framework",
      speakerNotes: "",
    },
    {
      id: crypto.randomUUID(),
      position: 6,
      headline: "Pergunta prática",
      body: "Se essa tendência entrar no seu produto amanhã, o que quebra primeiro?",
      visualHint: "Pergunta",
      speakerNotes: "",
    },
    {
      id: crypto.randomUUID(),
      position: 7,
      headline: "Salve para revisar",
      body: "Use este checklist antes de adotar a próxima ferramenta de IA no seu processo.",
      visualHint: "CTA",
      speakerNotes: "",
    },
  ]
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function wrapText(value: string, max = 26): string[] {
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > max && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.slice(0, 7)
}

function slideSvg(slide: EditableSlide, title: string, theme: CarouselTheme) {
  const cfg = themeOptions[theme]
  const headlineLines = wrapText(slide.headline, 20)
  const bodyLines = wrapText(slide.body, 34)
  const dark = theme !== "clean"
  const subtitleColor = dark ? "#cbd5e1" : "#475569"

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" x2="1080" y1="0" y2="1080">
      <stop stop-color="${dark ? "#020617" : "#f8fafc"}"/>
      <stop offset="0.58" stop-color="${dark ? "#111827" : "#ffffff"}"/>
      <stop offset="1" stop-color="${dark ? "#064e3b" : "#ecfeff"}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="148" cy="122" r="150" fill="${cfg.accent}" opacity="0.16"/>
  <circle cx="930" cy="918" r="190" fill="${cfg.accent}" opacity="0.12"/>
  <rect x="74" y="74" width="932" height="932" rx="56" fill="none" stroke="${cfg.accent}" stroke-width="4" opacity="0.42"/>
  <text x="92" y="126" fill="${subtitleColor}" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3">${escapeXml(title.toUpperCase().slice(0, 42))}</text>
  <text x="92" y="188" fill="${cfg.accent}" font-family="Arial, sans-serif" font-size="30" font-weight="700">SLIDE ${slide.position.toString().padStart(2, "0")}</text>
  ${headlineLines.map((line, index) => (
    `<text x="92" y="${340 + index * 74}" fill="${cfg.text}" font-family="Arial, sans-serif" font-size="64" font-weight="800">${escapeXml(line)}</text>`
  )).join("")}
  ${bodyLines.map((line, index) => (
    `<text x="92" y="${690 + index * 46}" fill="${subtitleColor}" font-family="Arial, sans-serif" font-size="34" font-weight="500">${escapeXml(line)}</text>`
  )).join("")}
  <rect x="92" y="940" width="318" height="54" rx="27" fill="${cfg.accent}" opacity="0.95"/>
  <text x="120" y="976" fill="${dark ? "#03111a" : "#ffffff"}" font-family="Arial, sans-serif" font-size="24" font-weight="800">${escapeXml(slide.visualHint || "CONTENT STUDIO")}</text>
</svg>`
}

async function downloadPng(svg: string, filename: string) {
  const image = new Image()
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error("Falha ao renderizar slide"))
    image.src = url
  })

  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1080
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas indisponível")
  context.drawImage(image, 0, 0)
  URL.revokeObjectURL(url)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error("Falha ao exportar PNG"))
    }, "image/png")
  })

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function CarouselBuilderPage() {
  const initial = useMemo(() => getInitialSource(), [])
  const [title, setTitle] = useState(initial.title || "Carrossel sobre IA aplicada")
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl)
  const [theme, setTheme] = useState<CarouselTheme>("signal")
  const [slides, setSlides] = useState<EditableSlide[]>(() => createSlides(initial.title, initial.content))
  const [activeSlideId, setActiveSlideId] = useState(slides[0]?.id ?? "")
  const [userId, setUserId] = useState<string | null>(null)
  const [recentProjects, setRecentProjects] = useState<CarouselProject[]>([])
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])
  const activeSlide = slides.find((slide) => slide.id === activeSlideId) ?? slides[0]

  const loadContext = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from("carousel_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    setRecentProjects((data ?? []) as CarouselProject[])
  }, [supabase])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  function updateSlide(id: string, patch: Partial<EditableSlide>) {
    setSlides((prev) => prev.map((slide) => slide.id === id ? { ...slide, ...patch } : slide))
  }

  function addSlide() {
    const next: EditableSlide = {
      id: crypto.randomUUID(),
      position: slides.length + 1,
      headline: "Novo slide",
      body: "Desenvolva este ponto com uma frase clara.",
      visualHint: "Novo ponto",
      speakerNotes: "",
    }
    setSlides((prev) => [...prev, next])
    setActiveSlideId(next.id)
  }

  async function exportAllPng() {
    setExporting(true)
    setFeedback(null)
    try {
      for (const slide of slides) {
        await downloadPng(slideSvg(slide, title, theme), `carousel-slide-${slide.position}.png`)
      }
      setFeedback("Slides exportados em PNG.")
    } finally {
      setExporting(false)
    }
  }

  async function saveProject(createDraft: boolean) {
    if (!userId) {
      setFeedback("Faça login para salvar o carrossel.")
      return
    }

    setSaving(true)
    setFeedback(null)
    try {
      const { data: project, error: projectError } = await supabase
        .from("carousel_projects")
        .insert({
          user_id: userId,
          title,
          source_type: initial.sourceType === "news" || initial.sourceType === "growth" ? initial.sourceType : "manual",
          source_url: sourceUrl || null,
          theme,
          status: createDraft ? "sent_to_instagram" : "draft",
        })
        .select()
        .single()

      if (projectError || !project) {
        setFeedback(projectError?.message ?? "Não foi possível salvar o projeto.")
        return
      }

      const { error: slidesError } = await supabase.from("carousel_slides").insert(
        slides.map((slide) => ({
          user_id: userId,
          project_id: project.id,
          position: slide.position,
          headline: slide.headline,
          body: slide.body,
          visual_hint: slide.visualHint,
          speaker_notes: slide.speakerNotes,
        }))
      )

      if (slidesError) {
        setFeedback(slidesError.message)
        return
      }

      if (createDraft) {
        const caption = `${title}\n\nRoteiro de carrossel com ${slides.length} slides criado no Content Studio.`
        const { error: postError } = await supabase.from("posts").insert({
          user_id: userId,
          title: title.slice(0, 80),
          caption,
          platform: "instagram",
          type: "carrossel",
          status: "draft",
          media_url: null,
          metrics: {
            carousel_project_id: project.id,
            slide_count: slides.length,
            source_url: sourceUrl || null,
          },
        })

        if (postError) {
          setFeedback(`Projeto salvo, mas o draft falhou: ${postError.message}`)
          return
        }
      }

      await loadContext()
      setFeedback(createDraft ? "Projeto salvo e draft criado no Instagram Manager." : "Projeto salvo.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
                <Layers size={17} />
              </div>
              <div>
                <CardTitle className="text-base">Carousel Builder</CardTitle>
                <CardDescription>Slides quadrados, editáveis e exportáveis para Instagram.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">Título do projeto</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">Fonte</label>
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Tema visual</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(themeOptions) as CarouselTheme[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium",
                      theme === key
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--muted-foreground)]"
                    )}
                  >
                    {themeOptions[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addSlide}>
                <Plus size={14} />
                Slide
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={exportAllPng} disabled={exporting}>
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <ImageDown size={14} />}
                PNG
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
                <Download size={14} />
                PDF
              </Button>
              <Button type="button" size="sm" onClick={() => { void saveProject(false) }} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar
              </Button>
              <Button type="button" size="sm" onClick={() => { void saveProject(true) }} disabled={saving}>
                <Send size={14} />
                Criar draft
              </Button>
            </div>

            {feedback && (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                {feedback}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Editor de slides</CardTitle>
                <CardDescription>{slides.length} slides no projeto atual.</CardDescription>
              </div>
              <Badge variant="secondary">{themeOptions[theme].label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-2">
              {slides.map((slide) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveSlideId(slide.id)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                    activeSlide?.id === slide.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)] bg-[var(--secondary)]/35 hover:border-[var(--primary)]/40"
                  )}
                >
                  <p className="font-semibold text-[var(--foreground)]">Slide {slide.position}</p>
                  <p className="mt-0.5 line-clamp-2 text-[var(--muted-foreground)]">{slide.headline}</p>
                </button>
              ))}
            </div>

            {activeSlide && (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(320px,1.18fr)]">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Headline</label>
                    <textarea
                      value={activeSlide.headline}
                      onChange={(event) => updateSlide(activeSlide.id, { headline: event.target.value })}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Texto</label>
                    <textarea
                      value={activeSlide.body}
                      onChange={(event) => updateSlide(activeSlide.id, { body: event.target.value })}
                      rows={5}
                      className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Hint visual</label>
                    <input
                      value={activeSlide.visualHint}
                      onChange={(event) => updateSlide(activeSlide.id, { visualHint: event.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="mx-auto w-full max-w-[430px]">
                  <div className="aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--secondary)] shadow-2xl">
                    <div
                      className={cn(
                        "flex h-full w-full flex-col justify-between bg-gradient-to-br p-8",
                        themeOptions[theme].bg
                      )}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
                        <span>{title.slice(0, 28)}</span>
                        <span>{String(activeSlide.position).padStart(2, "0")}</span>
                      </div>
                      <div>
                        <p className="text-4xl font-black leading-tight text-white">{activeSlide.headline}</p>
                        <p className="mt-5 text-base leading-relaxed text-white/72">{activeSlide.body}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950">
                          {activeSlide.visualHint || "CONTENT STUDIO"}
                        </span>
                        <Sparkles size={20} className="text-cyan-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText size={14} className="text-[var(--primary)]" />
            Projetos recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">Nenhum carrossel salvo ainda.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/35 p-3">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{project.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {project.theme} · {project.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
