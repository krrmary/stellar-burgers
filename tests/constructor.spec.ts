import { test, expect } from '@playwright/test';
import * as path from 'path';

const APP_URL = 'http://localhost:4000';

// Валидный JWT токен
const MOCK_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

test.describe('Тесты страницы конструктора бургера', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Подстановка фейковых токенов авторизации
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: MOCK_TOKEN,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false
      }
    ]);
    await page.addInitScript((token) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', token);
    }, MOCK_TOKEN);

    // 2. Перехват всех запросов к бэкенду через HAR-файл
    const harPath = path.join(__dirname, 'hars/api-mocks.har');
    await page.routeFromHAR(harPath, {
      url: /.*\/api\/.*/,
      update: false,
      notFound: 'fallback'
    });
  });

  test('должен добавить ингредиент из списка в конструктор', async ({
    page
  }) => {
    await page.goto(APP_URL);
    await expect(page.getByText('Краторная булка N-200i')).toBeVisible({
      timeout: 15000
    });

    await expect(page.locator('.constructor-element')).toHaveCount(0);

    await page
      .locator('li')
      .filter({ hasText: 'Краторная булка N-200i' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    await expect(page.locator('.constructor-element')).toHaveCount(2, {
      timeout: 5000
    });

    await page.locator('text=Начинки').first().click();
    await page.waitForTimeout(800);

    await page
      .locator('li')
      .filter({ hasText: 'Филе Люминесцентного тетраодонтимформа' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    await expect(page.locator('.constructor-element')).toHaveCount(3, {
      timeout: 5000
    });
  });

  test('должен открыть модальное окно и отобразить данные выбранного ингредиента', async ({
    page
  }) => {
    await page.goto(APP_URL);
    await expect(page.getByText('Краторная булка N-200i')).toBeVisible({
      timeout: 15000
    });

    await expect(
      page
        .locator('#modals')
        .getByRole('heading', { name: 'Детали ингредиента' })
    ).not.toBeVisible();

    await page
      .locator('a[href*="/ingredients/"]')
      .filter({ hasText: 'Краторная булка N-200i' })
      .click();

    await expect(page).toHaveURL(/\/ingredients\//, { timeout: 5000 });

    await expect(
      page
        .locator('#modals')
        .getByRole('heading', { name: 'Детали ингредиента' })
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.locator('#modals').getByText('Краторная булка N-200i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('должен закрыть модальное окно по клику на крестик', async ({
    page
  }) => {
    await page.goto(APP_URL);
    await expect(page.getByText('Краторная булка N-200i')).toBeVisible({
      timeout: 15000
    });

    await page
      .locator('a[href*="/ingredients/"]')
      .filter({ hasText: 'Краторная булка N-200i' })
      .click();

    await expect(
      page
        .locator('#modals')
        .getByRole('heading', { name: 'Детали ингредиента' })
    ).toBeVisible({ timeout: 5000 });

    await page
      .locator('#modals')
      .locator('button[type="button"]')
      .first()
      .click();

    await expect(
      page.getByRole('heading', { name: 'Детали ингредиента' })
    ).not.toBeVisible({ timeout: 5000 });
  });

  test('должен успешно создать заказ и очистить конструктор', async ({
    page
  }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Краторная булка N-200i')).toBeVisible({
      timeout: 15000
    });

    await page
      .locator('li')
      .filter({ hasText: 'Краторная булка N-200i' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    await expect(page.locator('.constructor-element')).toHaveCount(2, {
      timeout: 5000
    });

    await page.locator('text=Начинки').first().click();
    await page.waitForTimeout(800);

    await page
      .locator('li')
      .filter({ hasText: 'Филе Люминесцентного тетраодонтимформа' })
      .getByRole('button', { name: 'Добавить' })
      .click();

    await expect(page.locator('.constructor-element')).toHaveCount(3, {
      timeout: 5000
    });

    await page.getByRole('button', { name: 'Оформить заказ' }).click();

    await expect(page.locator('#modals').getByText('12345')).toBeVisible({
      timeout: 10000
    });

    await expect(page.locator('.constructor-element')).toHaveCount(0, {
      timeout: 5000
    });

    await page
      .locator('#modals')
      .locator('button[type="button"]')
      .first()
      .click();

    await expect(page.locator('#modals').getByText('12345')).not.toBeVisible({
      timeout: 5000
    });
  });
});
