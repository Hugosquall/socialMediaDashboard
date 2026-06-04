"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, Copy, FileText, Plus, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  growthPromptFieldLabels,
  growthPrompts,
  type GrowthPromptInputKey,
} from "@/lib/growth-prompts"
import { cn } from "@/lib/utils"

const initialInput: Record<GrowthPromptInputKey, string> = {
  niche: "",
  audience: "",
  goal: "",
  idea: "",
  tone: "",
  voice: "",
  content: "",
}

const starterValues: Partial<Record<GrowthPromptInputKey, string>> = {
  niche: "Arquitetura, interiores e design autoral",
  audience: "Clientes premium, arquitetos e pessoas reformando imoveis",
  goal: "Gerar salvamentos, compartilhamentos e leads qualificados",
  tone: "Inteligente, claro e sem exagero",
  voice: "Especialista, elegante e direta",
}

export default function GrowthLabPage() {
  const [activeId, setActiveId] = useState(growthPrompts[0].id)
  const [input, setInput] = useState<Record<GrowthPromptInputKey, string>>({
    ...initialInput,
    ...starterValues,
  })
  const [copied, setCopied] = useState(false)

  const activePrompt = growthPrompts.find((prompt) => prompt.id === activeId) ?? growthPrompts[0]
  const generatedPrompt = useMemo(() => activePrompt.template(input), [activePrompt, input])

  function updateField(key: GrowthPromptInputKey, value: string) {
    setInput((prev) => ({ ...prev, [key]: value }))
    setCopied(false)
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  function fillStarterBrief() {
    setInput((prev) => ({ ...prev, ...starterValues }))
    setCopied(false)
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/15">
                  <Sparkles size={17} className="text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">Growth Lab</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Prompts para transformar ideias em posts com hook, formato, retencao e posicionamento.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={fillStarterBrief}>
                <FileText size={14} />
                Brief base
              </Button>
              <Button asChild size="sm">
                <Link href="/instagram">
                  <Plus size={14} />
                  Criar post
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {growthPrompts.map((prompt) => {
              const Icon = prompt.Icon
              const isActive = prompt.id === activePrompt.id
              return (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => {
                    setActiveId(prompt.id)
                    setCopied(false)
                  }}
                  className={cn(
                    "min-h-36 rounded-xl border p-4 text-left transition-all",
                    isActive
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg shadow-[var(--primary)]/5"
                      : "border-[var(--border)] bg-[var(--secondary)]/35 hover:border-[var(--primary)]/35"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                      {prompt.step}
                    </span>
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", prompt.accent)}>
                      <Icon size={15} />
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-snug text-[var(--foreground)]">{prompt.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">{prompt.summary}</p>
                </button>
              )
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
            <CardDescription>Da ruptura de padroes ao refinamento final de autoridade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {growthPrompts.map((prompt, index) => (
              <div key={prompt.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                    prompt.id === activePrompt.id
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)]"
                  )}
                >
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{prompt.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">{prompt.summary}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Brief</CardTitle>
                <CardDescription>Campos usados no prompt selecionado.</CardDescription>
              </div>
              <Badge variant="secondary">{activePrompt.step}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePrompt.fields.map((fieldKey) => {
              const isLongField = fieldKey === "content" || fieldKey === "idea"
              return (
                <div key={fieldKey} className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">
                    {growthPromptFieldLabels[fieldKey]}
                  </label>
                  {isLongField ? (
                    <textarea
                      value={input[fieldKey]}
                      onChange={(event) => updateField(fieldKey, event.target.value)}
                      rows={fieldKey === "content" ? 7 : 4}
                      className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5 text-sm leading-relaxed text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30"
                      placeholder={`Preencha ${growthPromptFieldLabels[fieldKey].toLowerCase()}`}
                    />
                  ) : (
                    <input
                      value={input[fieldKey]}
                      onChange={(event) => updateField(fieldKey, event.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30"
                      placeholder={`Preencha ${growthPromptFieldLabels[fieldKey].toLowerCase()}`}
                    />
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{activePrompt.title}</CardTitle>
                <CardDescription>{activePrompt.summary}</CardDescription>
              </div>
              <Button type="button" size="sm" onClick={copyPrompt}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar prompt"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[620px] overflow-auto rounded-xl border border-[var(--border)] bg-[#10101a] p-4 text-sm leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">
              {generatedPrompt}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
