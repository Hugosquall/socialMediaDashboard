"use client"

import { Suspense, useState, useEffect, useCallback, useRef, type ChangeEvent } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  User,
  Camera,
  Bell,
  Shield,
  Database,
  Link2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Save,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Newspaper,
  BarChart3,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SettingsTab = "profile" | "integrations" | "notifications" | "data"

type NotificationPrefs = {
  newFollowers: boolean
  comments: boolean
  mentions: boolean
  competitorPost: boolean
  competitorGrow: boolean
  systemSync: boolean
  weeklyReport: boolean
  emailDigest: boolean
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  newFollowers: true,
  comments: true,
  mentions: true,
  competitorPost: true,
  competitorGrow: false,
  systemSync: true,
  weeklyReport: true,
  emailDigest: false,
}

function normalizeNotificationPrefs(input: unknown): NotificationPrefs {
  if (!input || typeof input !== "object") return DEFAULT_NOTIFICATION_PREFS
  const source = input as Record<string, unknown>
  return {
    newFollowers:   typeof source.newFollowers === "boolean" ? source.newFollowers : DEFAULT_NOTIFICATION_PREFS.newFollowers,
    comments:       typeof source.comments === "boolean" ? source.comments : DEFAULT_NOTIFICATION_PREFS.comments,
    mentions:       typeof source.mentions === "boolean" ? source.mentions : DEFAULT_NOTIFICATION_PREFS.mentions,
    competitorPost: typeof source.competitorPost === "boolean" ? source.competitorPost : DEFAULT_NOTIFICATION_PREFS.competitorPost,
    competitorGrow: typeof source.competitorGrow === "boolean" ? source.competitorGrow : DEFAULT_NOTIFICATION_PREFS.competitorGrow,
    systemSync:     typeof source.systemSync === "boolean" ? source.systemSync : DEFAULT_NOTIFICATION_PREFS.systemSync,
    weeklyReport:   typeof source.weeklyReport === "boolean" ? source.weeklyReport : DEFAULT_NOTIFICATION_PREFS.weeklyReport,
    emailDigest:    typeof source.emailDigest === "boolean" ? source.emailDigest : DEFAULT_NOTIFICATION_PREFS.emailDigest,
  }
}

type ApiTokenState = {
  hasToken: boolean
  maskedToken: string | null
  token: string | null
}

type TokenFeedback = {
  kind: "success" | "error"
  message: string
} | null

function maskTokenForDisplay(token: string): string {
  if (token.length <= 8) {
    return "********"
  }

  const prefix = token.slice(0, 6)
  const suffix = token.slice(-4)
  const middleLength = Math.max(8, token.length - prefix.length - suffix.length)

  return `${prefix}${"*".repeat(middleLength)}${suffix}`
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
          </CardContent>
        </Card>
      }
    >
      <SettingsPageContent />
    </Suspense>
  )
}

function SettingsPageContent() {
  const searchParams = useSearchParams()

  // Detecta retorno do OAuth do Instagram
  const instagramConnected = searchParams.get("instagram_connected") === "true"
  const instagramError = searchParams.get("instagram_error")
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    instagramConnected || !!instagramError ? "integrations" : "profile"
  )

  const tabs: { id: SettingsTab; label: string; Icon: React.ElementType }[] = [
    { id: "profile",       label: "Perfil",       Icon: User    },
    { id: "integrations",  label: "Integrações",  Icon: Link2   },
    { id: "notifications", label: "Notificações", Icon: Bell    },
    { id: "data",          label: "Dados",        Icon: Database},
  ]

  return (
    <div className="space-y-6">

      {/* ── Banners de retorno OAuth ── */}
      {instagramConnected && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 size={16} className="shrink-0" />
          Instagram conectado com sucesso! Seus dados de performance já estão disponíveis.
        </div>
      )}
      {instagramError === "missing_credentials" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertCircle size={16} className="shrink-0" />
          Credenciais Meta não configuradas. Adicione META_APP_ID e META_APP_SECRET no .env.local.
        </div>
      )}
      {instagramError === "token_exchange_failed" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          Falha ao obter token do Instagram. Verifique as configurações do app Meta.
        </div>
      )}
      {instagramError === "cancelled" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertCircle size={16} className="shrink-0" />
          Conexão cancelada no Instagram antes da conclusão do OAuth.
        </div>
      )}
      {instagramError === "no_code" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          Instagram não retornou o código de autorização. Tente conectar novamente.
        </div>
      )}
      {instagramError === "state_mismatch" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          A validação de segurança do OAuth expirou. Clique em Conectar novamente.
        </div>
      )}
      {instagramError === "no_page" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertCircle size={16} className="shrink-0" />
          Nenhuma Página do Facebook vinculada a uma conta profissional do Instagram foi encontrada.
        </div>
      )}
      {instagramError === "server_error" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          Falha inesperada ao conectar Instagram. Verifique as credenciais e tente novamente.
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10">
          <Shield size={16} className="text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Configurações</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Gerencie sua conta e integrações</p>
        </div>
      </div>

      {/* ── Layout tabs + conteúdo ── */}
      <div className="grid gap-6 lg:grid-cols-4">

        {/* Sidebar de tabs */}
        <Card className="h-fit lg:col-span-1">
          <CardContent className="p-2">
            {tabs.map((tab) => {
              const Icon = tab.Icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-[var(--primary)]/15 text-[var(--primary)] font-medium"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  )}
                >
                  <Icon size={15} className={isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {isActive && <ChevronRight size={13} className="text-[var(--primary)] opacity-60" />}
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Área de conteúdo */}
        <div className="space-y-4 lg:col-span-3">
          {activeTab === "profile"       && <ProfileTab />}
          {activeTab === "integrations"  && <IntegrationsTab instagramJustConnected={instagramConnected} />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "data"          && <DataTab />}
        </div>
      </div>
    </div>
  )
}

// ─── Aba: Perfil ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const [name,     setName]     = useState("")
  const [handle,   setHandle]   = useState("")
  const [email,    setEmail]    = useState("")
  const [bio,      setBio]      = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saved,    setSaved]    = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [userId,   setUserId]   = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const supabase = createClient()

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profile) {
        setName(profile.name ?? "")
        setHandle(profile.handle ?? "")
        setBio(profile.bio ?? "")
        setAvatarUrl(profile.avatar_url ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    try {
      await supabase.from("profiles").upsert({
        id: userId,
        name,
        handle,
        bio,
        updated_at: new Date().toISOString(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (!userId) return
    const file = event.target.files?.[0]
    if (!file) return

    setAvatarError(null)

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setAvatarError("Formato inválido. Use JPG ou PNG.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Arquivo muito grande. Limite de 2 MB.")
      return
    }

    setUploadingAvatar(true)
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const storagePath = `${userId}/avatar.${extension}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(storagePath, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(storagePath)
      const publicUrl = data.publicUrl

      await supabase.from("profiles").upsert({
        id: userId,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })

      setAvatarUrl(publicUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar avatar"
      setAvatarError(
        message.includes("Bucket not found")
          ? "Bucket 'avatars' não encontrado no Supabase Storage."
          : message
      )
    } finally {
      setUploadingAvatar(false)
      event.target.value = ""
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <User size={14} className="text-[var(--primary)]" />
          Perfil Público
        </CardTitle>
        <CardDescription>Informações exibidas no dashboard e relatórios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name ? `Avatar de ${name}` : "Avatar de perfil"}
                className="h-16 w-16 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white shadow-lg">
                {name ? name[0].toUpperCase() : "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow disabled:opacity-60"
            >
              <Camera size={11} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">{name || "—"}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{handle || "—"}</p>
            <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">JPG ou PNG · máx 2 MB</p>
            {uploadingAvatar && (
              <p className="mt-1 text-[10px] text-[var(--primary)]">Enviando avatar...</p>
            )}
            {avatarError && (
              <p className="mt-1 text-[10px] text-red-400">{avatarError}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" value={name} onChange={setName} />
          <Field label="Handle / @" value={handle} onChange={setHandle} />
          <Field label="E-mail" value={email} onChange={setEmail} type="email" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[var(--muted-foreground)]">
            Dados salvos no Supabase — persistem entre sessões
          </p>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : saved ? (
              <CheckCircle2 size={13} />
            ) : (
              <Save size={13} />
            )}
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Aba: Integrações ─────────────────────────────────────────────────────────

function IntegrationsTab({ instagramJustConnected }: { instagramJustConnected?: boolean }) {
  const [instagramUsername,   setInstagramUsername]   = useState<string | null>(null)
  const [checkingInstagram,   setCheckingInstagram]   = useState(true)
  const [metricoolConnected,  setMetricoolConnected]  = useState(false)
  const [showMetricoolInput,  setShowMetricoolInput]  = useState(false)
  const [metricoolKey,        setMetricoolKey]        = useState("")
  const [savingMetricool,     setSavingMetricool]     = useState(false)
  const [metricoolError,      setMetricoolError]      = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function checkInstagramToken() {
      setCheckingInstagram(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("instagram_tokens")
          .select("instagram_username")
          .eq("user_id", user.id)
          .single()
        if (data) setInstagramUsername(data.instagram_username)
      } finally {
        setCheckingInstagram(false)
      }
    }
    checkInstagramToken()
  }, [supabase, instagramJustConnected])

  // Verifica se Metricool está configurado consultando a API route de analytics
  useEffect(() => {
    fetch("/api/analytics/sources")
      .then((r) => r.json())
      .then((d) => setMetricoolConnected(d.metricool === true))
      .catch(() => {/* silencioso */})
  }, [])

  async function handleDisconnectInstagram() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("instagram_tokens").delete().eq("user_id", user.id)
    setInstagramUsername(null)
  }

  async function handleSaveMetricool() {
    if (!metricoolKey.trim()) return
    setSavingMetricool(true)
    setMetricoolError(null)
    try {
      const res = await fetch("/api/analytics/sources", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ metricoolApiKey: metricoolKey.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      setMetricoolConnected(true)
      setShowMetricoolInput(false)
      setMetricoolKey("")
    } catch (err) {
      setMetricoolError(err instanceof Error ? err.message : "Erro ao salvar chave")
    } finally {
      setSavingMetricool(false)
    }
  }

  async function handleDisconnectMetricool() {
    await fetch("/api/analytics/sources", { method: "DELETE" })
    setMetricoolConnected(false)
  }

  const instagramConnected = instagramUsername !== null

  const integrations = [
    {
      name: "Instagram Graph API",
      description: instagramConnected
        ? `Conta @${instagramUsername} conectada. Dados de performance e insights disponíveis.`
        : "Conecte via Facebook Login para buscar a conta profissional vinculada a uma Página",
      Icon: Camera,
      iconBg: "bg-gradient-to-br from-pink-500 to-orange-400",
      connected: instagramConnected,
      checking: checkingInstagram,
      badge: "Recomendado",
      badgeVariant: "default" as const,
      docs: "https://developers.facebook.com/docs/instagram-api",
      onConnect: () => { window.location.href = "/api/auth/instagram" },
      onDisconnect: handleDisconnectInstagram,
    },
    {
      name: "Metricool",
      description: metricoolConnected
        ? "API Key configurada. Métricas de Facebook e Twitter disponíveis como fallback."
        : "Sincronize métricas de múltiplas redes — Instagram, Facebook, Twitter, LinkedIn",
      Icon: BarChart3,
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-500",
      connected: metricoolConnected,
      checking: false,
      badge: "Popular",
      badgeVariant: "secondary" as const,
      docs: "https://metricool.com/developers",
      onConnect: () => setShowMetricoolInput(true),
      onDisconnect: handleDisconnectMetricool,
    },
    {
      name: "News RSS Feeds",
      description: "ArchDaily, Dezeen, Archinect — feed de notícias de arquitetura já ativo",
      Icon: Newspaper,
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
      connected: true,
      checking: false,
      badge: "Ativo",
      badgeVariant: "success" as const,
      docs: null,
      onConnect: undefined,
      onDisconnect: undefined,
    },
    {
      name: "Supabase",
      description: "Banco de dados ativo — posts, concorrentes e tokens persistidos com segurança",
      Icon: Database,
      iconBg: "bg-gradient-to-br from-emerald-600 to-green-500",
      connected: true,
      checking: false,
      badge: "Conectado",
      badgeVariant: "success" as const,
      docs: "https://supabase.com/docs",
      onConnect: undefined,
      onDisconnect: undefined,
    },
  ]

  return (
    <div className="space-y-3">
      {integrations.map((int) => {
        const Icon = int.Icon
        return (
          <Card key={int.name} className={cn(
            "transition-all",
            int.connected && "border-emerald-500/20 bg-emerald-500/3"
          )}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow", int.iconBg)}>
                <Icon size={18} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{int.name}</p>
                  <Badge variant={int.badgeVariant}>{int.badge}</Badge>
                  {int.checking ? (
                    <span className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                      <Loader2 size={10} className="animate-spin" /> Verificando...
                    </span>
                  ) : int.connected ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <CheckCircle2 size={10} /> Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                      <AlertCircle size={10} /> Não conectado
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {int.description}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {int.docs && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={int.docs} target="_blank" rel="noopener noreferrer" className="text-xs">
                      Docs
                    </a>
                  </Button>
                )}
                {int.connected && int.onDisconnect && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={int.onDisconnect}
                  >
                    Desconectar
                  </Button>
                )}
                {!int.connected && int.onConnect && (
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs"
                    onClick={int.onConnect}
                  >
                    Conectar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Input de API key da Metricool */}
      {showMetricoolInput && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-semibold text-[var(--foreground)]">
              Configurar Metricool API Key
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Gere sua chave em{" "}
              <a
                href="https://metricool.com/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                metricool.com/developers
              </a>{" "}
              e cole abaixo. A chave será salva no servidor (.env.local).
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={metricoolKey}
                onChange={(e) => setMetricoolKey(e.target.value)}
                placeholder="mc_api_xxxxxxxxxxxxxxxx"
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-blue-500 focus:outline-none"
              />
              <Button
                size="sm"
                onClick={handleSaveMetricool}
                disabled={!metricoolKey.trim() || savingMetricool}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {savingMetricool
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Save size={13} />}
                {savingMetricool ? "Salvando…" : "Salvar"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowMetricoolInput(false); setMetricoolError(null) }}
              >
                Cancelar
              </Button>
            </div>
            {metricoolError && (
              <p className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle size={11} /> {metricoolError}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Callout info */}
      <Card className="border-[var(--primary)]/20 bg-[var(--primary)]/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Zap size={16} className="mt-0.5 shrink-0 text-[var(--primary)]" />
          <div>
            <p className="text-xs font-semibold text-[var(--foreground)]">
              Próximo passo: conectar Instagram
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
              Configure o app Meta com Facebook Login, copie META_APP_ID e META_APP_SECRET para o .env.local,
              vincule seu Instagram profissional a uma Página do Facebook e clique em Conectar acima.
              Consulte o arquivo <code className="text-[var(--primary)]">INSTAGRAM_SETUP.md</code> no projeto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Aba: Notificações ────────────────────────────────────────────────────────

function NotificationsTab() {
  const [prefs, setPrefs] = useState(DEFAULT_NOTIFICATION_PREFS)
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savedPrefs, setSavedPrefs] = useState(false)
  const [prefsError, setPrefsError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadPreferences() {
      setLoadingPrefs(true)
      setPrefsError(null)
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        const metadata = user?.user_metadata as Record<string, unknown> | undefined
        const storedPrefs = metadata?.notification_prefs
        setPrefs(normalizeNotificationPrefs(storedPrefs))
      } catch (error) {
        setPrefsError(error instanceof Error ? error.message : "Erro ao carregar preferências")
      } finally {
        setLoadingPrefs(false)
      }
    }
    loadPreferences()
  }, [supabase])

  const toggle = (key: keyof typeof prefs) => {
    setSavedPrefs(false)
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  async function handleSavePreferences() {
    setSavingPrefs(true)
    setPrefsError(null)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { notification_prefs: prefs },
      })
      if (error) throw error
      setSavedPrefs(true)
      setTimeout(() => setSavedPrefs(false), 2500)
    } catch (error) {
      setPrefsError(error instanceof Error ? error.message : "Falha ao salvar preferências")
    } finally {
      setSavingPrefs(false)
    }
  }

  const groups = [
    {
      label: "Instagram",
      items: [
        { key: "newFollowers"   as const, label: "Novos seguidores",          desc: "Quando você atinge marcos ou recebe seguidores de peso" },
        { key: "comments"       as const, label: "Comentários e curtidas",    desc: "Atividade nos seus posts publicados" },
        { key: "mentions"       as const, label: "Marcações e menções",       desc: "Quando alguém te marca em posts ou stories" },
      ],
    },
    {
      label: "Concorrentes",
      items: [
        { key: "competitorPost" as const, label: "Novo post de concorrente",  desc: "Quando um concorrente monitorado publica" },
        { key: "competitorGrow" as const, label: "Crescimento de concorrente",desc: "Alertas de crescimento expressivo de seguidores" },
      ],
    },
    {
      label: "Sistema",
      items: [
        { key: "systemSync"     as const, label: "Sincronização do feed",     desc: "Quando o News Consolidator busca novos artigos" },
        { key: "weeklyReport"   as const, label: "Relatório semanal",         desc: "Resumo de performance toda segunda-feira" },
        { key: "emailDigest"    as const, label: "Digest por e-mail",         desc: "Resumo diário enviado por e-mail (requer integração)" },
      ],
    },
  ]

  if (loadingPrefs) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[var(--muted-foreground)]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--border)]">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-xs font-medium text-[var(--foreground)]">{item.label}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    prefs[item.key] ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    prefs[item.key] ? "left-[18px]" : "left-0.5"
                  )} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Preferências persistidas no Supabase Auth (user metadata).
            </p>
            {prefsError && <p className="mt-1 text-xs text-red-400">{prefsError}</p>}
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleSavePreferences} disabled={savingPrefs}>
            {savingPrefs ? (
              <Loader2 size={13} className="animate-spin" />
            ) : savedPrefs ? (
              <CheckCircle2 size={13} />
            ) : (
              <Save size={13} />
            )}
            {savingPrefs ? "Salvando..." : savedPrefs ? "Salvo!" : "Salvar preferências"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Aba: Dados ───────────────────────────────────────────────────────────────

function DataTab() {
  const [apiToken, setApiToken] = useState<string | null>(null)
  const [maskedToken, setMaskedToken] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [loadingToken, setLoadingToken] = useState(true)
  const [regeneratingToken, setRegeneratingToken] = useState(false)
  const [tokenFeedback, setTokenFeedback] = useState<TokenFeedback>(null)
  const [exportingPosts, setExportingPosts] = useState(false)
  const [exportingAnalytics, setExportingAnalytics] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadApiToken() {
      setLoadingToken(true)
      setTokenFeedback(null)

      try {
        const response = await fetch("/api/settings/api-token")
        const data = (await response.json()) as unknown

        if (!response.ok) {
          const message =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as Record<string, unknown>).error === "string"
              ? (data as Record<string, string>).error
              : "Falha ao carregar token"
          throw new Error(message)
        }

        const tokenState = data as ApiTokenState
        if (!active) return

        setApiToken(tokenState.token)
        setMaskedToken(tokenState.maskedToken)
        setShowToken(false)
      } catch (error) {
        if (!active) return
        setTokenFeedback({
          kind: "error",
          message: error instanceof Error ? error.message : "Falha ao carregar token",
        })
        setApiToken(null)
        setMaskedToken(null)
      } finally {
        if (active) {
          setLoadingToken(false)
        }
      }
    }

    loadApiToken()

    return () => {
      active = false
    }
  }, [])

  function resolveFilename(headerValue: string | null, fallback: string): string {
    if (!headerValue) return fallback
    const match = headerValue.match(/filename="?([^"]+)"?/)
    return match?.[1] ?? fallback
  }

  async function downloadExport(
    endpoint: string,
    fallbackFilename: string,
    setLoading: (value: boolean) => void
  ) {
    setLoading(true)
    setExportError(null)
    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const blob = await response.blob()
      const filename = resolveFilename(
        response.headers.get("content-disposition"),
        fallbackFilename
      )

      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Falha ao exportar dados")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerateToken() {
    setRegeneratingToken(true)
    setTokenFeedback(null)

    try {
      const response = await fetch("/api/settings/api-token", {
        method: "POST",
      })
      const data = (await response.json()) as unknown

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as Record<string, unknown>).error === "string"
            ? (data as Record<string, string>).error
            : "Falha ao regenerar token"
        throw new Error(message)
      }

      const tokenState = data as ApiTokenState
      setApiToken(tokenState.token)
      setMaskedToken(tokenState.maskedToken ?? (tokenState.token ? maskTokenForDisplay(tokenState.token) : null))
      setShowToken(true)
      setTokenFeedback({
        kind: "success",
        message: "Token regenerado com sucesso.",
      })
    } catch (error) {
      setTokenFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "Falha ao regenerar token",
      })
    } finally {
      setRegeneratingToken(false)
    }
  }

  async function handleCopyToken() {
    if (!apiToken) {
      return
    }

    try {
      await navigator.clipboard.writeText(apiToken)
      setTokenFeedback({
        kind: "success",
        message: "Token copiado para a área de transferência.",
      })
    } catch {
      setTokenFeedback({
        kind: "error",
        message: "Não foi possível copiar o token.",
      })
    }
  }

  const displayedToken = showToken ? apiToken : maskedToken
  const hasToken = apiToken !== null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Exportar Dados</CardTitle>
          <CardDescription>Baixe os dados do dashboard em formato JSON ou CSV</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={exportingPosts}
            onClick={() =>
              downloadExport(
                "/api/export/posts",
                `posts-${new Date().toISOString().slice(0, 10)}.json`,
                setExportingPosts
              )
            }
          >
            <Database size={13} />
            {exportingPosts ? "Exportando..." : "Exportar posts (JSON)"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={exportingAnalytics}
            onClick={() =>
              downloadExport(
                "/api/export/analytics",
                `analytics-${new Date().toISOString().slice(0, 10)}.csv`,
                setExportingAnalytics
              )
            }
          >
            <BarChart3 size={13} />
            {exportingAnalytics ? "Exportando..." : "Exportar analytics (CSV)"}
          </Button>
        </CardContent>
        {exportError && (
          <CardContent className="pt-0">
            <p className="text-xs text-red-400">{exportError}</p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">API Token</CardTitle>
          <CardDescription>Token persistido no Supabase Auth para integrações externas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 font-mono text-xs text-[var(--foreground)]">
              {loadingToken ? (
                <span className="flex items-center gap-2 text-[var(--muted-foreground)]">
                  <Loader2 size={12} className="animate-spin" />
                  Carregando token...
                </span>
              ) : displayedToken ? (
                displayedToken
              ) : (
                <span className="text-[var(--muted-foreground)]">Nenhum token gerado ainda</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowToken((current) => !current)}
                disabled={!hasToken}
                className="rounded-lg border border-[var(--border)] p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={showToken ? "Ocultar token" : "Revelar token"}
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleCopyToken}
                disabled={!hasToken || loadingToken}
              >
                <Copy size={13} />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleRegenerateToken}
                disabled={regeneratingToken}
              >
                <RefreshCw size={13} className={regeneratingToken ? "animate-spin" : ""} />
                {regeneratingToken ? "Regenerando..." : "Regenerar"}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Nunca compartilhe este token. Ele dá acesso completo à sua conta.
            </p>
            {tokenFeedback && (
              <p className={cn(
                "text-[10px]",
                tokenFeedback.kind === "success" ? "text-emerald-400" : "text-red-400"
              )}>
                {tokenFeedback.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/20 bg-red-500/3">
        <CardHeader>
          <CardTitle className="text-sm text-red-400">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis — proceda com cuidado</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10">
            Limpar todos os dados
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10">
            Resetar configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
      />
    </div>
  )
}
