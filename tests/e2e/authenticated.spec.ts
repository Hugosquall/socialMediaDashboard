import { expect, test } from "@playwright/test"

const authEmail = process.env.E2E_AUTH_EMAIL?.trim()
const authPassword = process.env.E2E_AUTH_PASSWORD?.trim()
const hasAuthCredentials = Boolean(authEmail && authPassword)

test.describe("Authenticated flow", () => {
  test.beforeAll(() => {
    test.skip(
      !hasAuthCredentials,
      "Defina E2E_AUTH_EMAIL e E2E_AUTH_PASSWORD para habilitar este cenário autenticado."
    )
  })

  test("faz login e acessa o calendário protegido", async ({ page }) => {
    await page.goto("/login")

    await page.getByLabel("E-mail").fill(authEmail ?? "")
    await page.getByLabel("Senha").fill(authPassword ?? "")
    await page.getByRole("button", { name: "Entrar" }).click()

    await expect(page).toHaveURL(/\/instagram$/)
    await expect(page.getByRole("heading", { name: "Instagram Manager" })).toBeVisible()

    await page.getByRole("link", { name: "Content Calendar" }).click()

    await expect(page).toHaveURL(/\/calendar$/)
    await expect(page.getByRole("heading", { name: "Content Calendar" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Próximos Conteúdos" })).toBeVisible()
    await expect(page.getByText("Agendados e rascunhos")).toBeVisible()
  })
})
