import { expect, Page, test } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@momesso.com');
  await page.locator('input[formcontrolname="password"]').fill('Admin@123');

  const companiesResponse = page.waitForResponse(
    (response) => response.url().includes('/api/company') && response.request().method() === 'GET'
  );

  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/companies$/);

  return companiesResponse;
}

test('loads companies automatically and supports refresh, create, edit and delete', async ({ page }) => {
  const initialListResponse = await loginAsAdmin(page);
  const initialCompanies = await initialListResponse.json();

  await expect(page.getByText('Carregando empresas...')).toBeHidden();

  if (initialCompanies.length > 0) {
    await expect(page.getByText(initialCompanies[0].name).first()).toBeVisible();
  } else {
    await expect(page.getByText('Nenhuma empresa encontrada.')).toBeVisible();
  }

  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/company') && response.request().method() === 'GET'
    ),
    page.getByRole('button', { name: 'Atualizar' }).click()
  ]);

  const suffix = Date.now().toString();
  const companyName = `Empresa E2E ${suffix}`;
  const editedCompanyName = `Empresa E2E Editada ${suffix}`;
  const cnpj = suffix;

  await page.getByRole('button', { name: 'Nova empresa' }).click();
  await expect(page.locator('input[formcontrolname="name"]')).toBeFocused();

  await page.getByLabel('Nome').fill(companyName);
  await page.getByLabel('CNPJ').fill(cnpj);
  await page.getByRole('button', { name: 'Criar empresa' }).click();

  await expect(page.getByText('Empresa criada.')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(companyName) })).toBeVisible();

  const createdRow = page.getByRole('row', { name: new RegExp(companyName) });
  await createdRow.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Nome').fill(editedCompanyName);
  await page.getByRole('button', { name: 'Salvar alterações' }).click();

  await expect(page.getByText('Empresa atualizada.')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(editedCompanyName) })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  const editedRow = page.getByRole('row', { name: new RegExp(editedCompanyName) });
  await editedRow.getByRole('button', { name: 'Excluir' }).click();

  await expect(page.getByText('Empresa excluída.')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(editedCompanyName) })).toHaveCount(0);
});
