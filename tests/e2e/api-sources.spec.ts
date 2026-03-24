import { expect, test } from "@playwright/test"

test.describe("/api/analytics/sources", () => {
  test("redireciona usuário não autenticado para /login", async ({ request }) => {
    const response = await request.get("/api/analytics/sources", { maxRedirects: 0 })

    expect(response.status()).toBe(307)
    expect(response.headers()["location"]).toContain("/login")
  })
})
