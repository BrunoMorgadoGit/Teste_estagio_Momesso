import { expect, test } from '@playwright/test';

test('logs in through the Angular form and opens companies', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('admin@momesso.com');
  await page.locator('input[formcontrolname="password"]').fill('Admin@123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/companies$/);
  await expect(page.getByRole('heading', { name: 'Empresas', exact: true })).toBeVisible();

  const tokenLength = await page.evaluate(() => localStorage.getItem('token')?.length ?? 0);
  expect(tokenLength).toBeGreaterThan(0);
});
