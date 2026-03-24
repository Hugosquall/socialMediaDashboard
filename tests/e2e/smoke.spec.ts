import { expect, test } from "@playwright/test"

test.describe("Smoke", () => {
  test("redireciona acesso não autenticado para /login", async ({ page }) => {
    await page.goto("/")

    await expect(page).toHaveURL(/\/login$/)
  })

  test("renderiza a tela de login", async ({ page }) => {
    await page.goto("/login")

    await expect(page.getByRole("heading", { name: "Dashboard Sabrina" })).toBeVisible()
    await expect(page.getByText("Faça login para continuar")).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Cadastre-se" })).toBeVisible()
  })
})
