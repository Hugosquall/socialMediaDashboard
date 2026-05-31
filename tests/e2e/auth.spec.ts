import { expect, test } from "@playwright/test"

test.describe("Auth page", () => {
  test("alterna entre login e cadastro sem depender de credenciais", async ({ page }) => {
    await page.goto("/login")

    await expect(page.getByRole("heading", { name: "Instagram Dashboard" })).toBeVisible()
    await expect(page.getByText("Faça login para continuar")).toBeVisible()

    await page.getByRole("button", { name: "Cadastre-se" }).click()

    await expect(page.getByRole("heading", { name: "Instagram Dashboard" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Fazer login" })).toBeVisible()
  })
})
