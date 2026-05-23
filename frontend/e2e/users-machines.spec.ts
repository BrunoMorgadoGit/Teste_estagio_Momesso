import { expect, Page, test } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@momesso.com');
  await page.locator('input[formcontrolname="password"]').fill('Admin@123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/companies$/);
}

async function selectFirstCompany(page: Page) {
  const companySelect = page.locator('select[formcontrolname="companyId"]');
  await expect(companySelect.locator('option').nth(1)).toBeAttached();
  await companySelect.selectOption({ index: 1 });
}

test('supports user refresh, create, edit and delete', async ({ page }) => {
  await loginAsAdmin(page);

  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/user') && response.request().method() === 'GET'
    ),
    page.goto('/users')
  ]);

  await expect(page.getByText('Carregando usuários...')).toBeHidden();

  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/user') && response.request().method() === 'GET'
    ),
    page.getByRole('button', { name: 'Atualizar' }).click()
  ]);

  const suffix = Date.now().toString();
  const userName = `Usuario E2E ${suffix}`;
  const editedUserName = `Usuario E2E Editado ${suffix}`;
  const email = `usuario.e2e.${suffix}@momesso.com`;

  await page.getByRole('button', { name: 'Novo usuário' }).click();
  await expect(page.locator('input[formcontrolname="name"]')).toBeFocused();

  await page.getByLabel('Nome').fill(userName);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill('User@123');
  await page.getByLabel('Role').selectOption('USER');
  await selectFirstCompany(page);
  await page.getByRole('button', { name: 'Criar usuário' }).click();

  await expect(page.getByText('Usuário criado.')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(userName) })).toBeVisible();

  const createdRow = page.getByRole('row', { name: new RegExp(userName) });
  await createdRow.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Nome').fill(editedUserName);
  await page.getByRole('button', { name: 'Salvar alterações' }).click();

  await expect(page.getByText('Usuário atualizado.')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(editedUserName) })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  const editedRow = page.getByRole('row', { name: new RegExp(editedUserName) });
  await editedRow.getByRole('button', { name: 'Excluir' }).click();

  await expect(page.getByText('Usuário excluído.')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(editedUserName) })).toHaveCount(0);
});

test('supports machine refresh, create, edit and delete', async ({ page }) => {
  await loginAsAdmin(page);

  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/machine') && response.request().method() === 'GET'
    ),
    page.goto('/machines')
  ]);

  await expect(page.getByText('Carregando máquinas...')).toBeHidden();

  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/machine') && response.request().method() === 'GET'
    ),
    page.getByRole('button', { name: 'Atualizar' }).click()
  ]);

  const suffix = Date.now().toString();
  const machineName = `Maquina E2E ${suffix}`;
  const editedMachineName = `Maquina E2E Editada ${suffix}`;
  const serialNumber = `MACHINE-E2E-${suffix}`;

  await page.getByRole('button', { name: 'Nova máquina' }).click();
  await expect(page.locator('input[formcontrolname="name"]')).toBeFocused();

  await page.getByLabel('Nome').fill(machineName);
  await page.getByLabel('Número de série').fill(serialNumber);
  await selectFirstCompany(page);
  await page.getByRole('button', { name: 'Criar máquina' }).click();

  await expect(page.getByText('Máquina criada.')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(machineName) })).toBeVisible();

  const createdRow = page.getByRole('row', { name: new RegExp(machineName) });
  await createdRow.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Nome').fill(editedMachineName);
  await page.getByRole('button', { name: 'Salvar alterações' }).click();

  await expect(page.getByText('Máquina atualizada.')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(editedMachineName) })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  const editedRow = page.getByRole('row', { name: new RegExp(editedMachineName) });
  await editedRow.getByRole('button', { name: 'Excluir' }).click();

  await expect(page.getByText('Máquina excluída.')).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(editedMachineName) })).toHaveCount(0);
});
