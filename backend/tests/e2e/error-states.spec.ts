import { test, expect } from "@playwright/test"

test("patient sees correct error when slot becomes full mid-booking", async ({ page, request }) => {
  await page.goto("http://localhost:3000/clinics/1")

  await page.getByTestId("slot-card-available").first().click()

  await request.post("http://localhost:4000/reserve", {
    data: { slotId: 1, userId: "sneaky-patient" },
  })

  await page.getByTestId("userId-input").fill("Late Patient")
  await page.getByTestId("submit-reserve-btn").click()

  await expect(page.getByTestId("toast-error")).toBeVisible()
  await expect(page.getByText(/no longer available|slot taken/i)).toBeVisible()
})

test("patient sees validation error for empty name", async ({ page }) => {
  await page.goto("http://localhost:3000/clinics/1")
  await page.getByTestId("slot-card-available").first().click()

  await page.getByTestId("submit-reserve-btn").click()

  await expect(page.getByTestId("userId-error")).toBeVisible()
  await expect(page.getByTestId("userId-error")).toContainText(/required|empty/i)
})

test("rate limit toast appears after too many requests", async ({ page }) => {
  await page.goto("http://localhost:3000/clinics/1")

  for (let i = 0; i < 6; i++) {
    await page.getByTestId("slot-card-available").first().click()
    await page.getByTestId("userId-input").fill(`patient-${i}`)
    await page.getByTestId("submit-reserve-btn").click()
    await page.getByTestId("booking-modal").waitFor({ state: "hidden" }).catch(() => {})
  }

  await expect(page.getByText(/too many requests|slow down/i)).toBeVisible()
})
