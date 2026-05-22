import { test, expect } from '@playwright/test'

test('landing page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('Đăng nhập')).toBeVisible()
})

test('landing → login flow', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByLabel(/email/i).or(page.locator('input[type="email"]'))).toBeVisible()
})
