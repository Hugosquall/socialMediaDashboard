import { NextRequest, NextResponse } from "next/server"

import { generateContent } from "@/lib/ai-provider"
import { createClient } from "@/lib/supabase/server"

type GenerateBody = {
  prompt?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  let body: GenerateBody
  try {
    body = (await request.json()) as GenerateBody
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    return NextResponse.json({ error: "Prompt obrigatório" }, { status: 400 })
  }

  try {
    const result = await generateContent(prompt)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao gerar conteúdo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
