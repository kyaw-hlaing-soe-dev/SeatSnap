import { test, expect } from "@playwright/test"

test("complete patient journey: browse -> select -> reserve -> confirm", async ({ page }) => {
  await page.goto("http://localhost:3000")

  await expect(page.getByTestId("clinic-card")).toHaveCount(2)

  await page.getByTestId("clinic-card").first().click()
  await expect(page).toHaveURL(/\/clinics\/\d+/)

  const availableSlots = page.getByTestId("slot-card-available")
  const fullSlots = page.getByTestId("slot-card-full")
  await expect(availableSlots.first()).toBeVisible()
  await expect(fullSlots.first()).toHaveClass(/opacity-50|cursor-not-allowed/)

  await availableSlots.first().click()
  await expect(page.getByTestId("booking-modal")).toBeVisible()

  await page.getByTestId("userId-input").fill("Test Patient")
  await page.getByTestId("submit-reserve-btn").click()

  await expect(page.getByTestId("countdown-timer")).toBeVisible()
  const timerText = await page.getByTestId("countdown-timer").textContent()
  expect(timerText ?? "").toMatch(/[0-4]:[0-5][0-9]/)

  await page.getByTestId("confirm-purchase-btn").click()

  await expect(page.getByTestId("success-screen")).toBeVisible()
  await expect(page.getByText(/confirmed/i)).toBeVisible()
})
