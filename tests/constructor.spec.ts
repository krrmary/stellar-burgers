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

    // 2. Перехват HAR-файла
    const harPath = path.join(__dirname, 'hars/api-mocks.har');
    await page.routeFromHAR(harPath, {
      url: /.*\/api\/.*/,
      update: false,
      notFound: 'fallback'
    });

    // 3.Переопределяем HAR для ключевых эндпоинтов до загрузки страницы
    await page.route(/.*\/api\/auth\/user.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { email: 'test@test.ru', name: 'Test User' }
        })
      });
    });

    await page.route(/.*\/api\/auth\/token.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          accessToken: MOCK_TOKEN,
          refreshToken: MOCK_TOKEN
        })
      });
    });

    await page.route(/.*\/api\/orders.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          name: 'Флюоресцентный люминесцентный бургер',
          order: { number: 12345 }
        })
      });
    });
  });

  test('должен добавить ингредиент из списка в конструктор', async ({
    page
  }) => {
    await page.goto(APP_URL);
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
  });

  test('должен открыть модальное окно и отобразить данные выбранного ингредиента', async ({
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
    // Ждем полной загрузки, чтобы моки авторизации успели отработать при старте приложения
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Краторная булка N-200i')).toBeVisible({
      timeout: 15000
    });

    // Добавляем булку
    await page
      .locator('li')
      .filter({ hasText: 'Краторная булка N-200i' })
      .getByRole('button', { name: 'Добавить' })
      .click();
    await expect(page.locator('.constructor-element')).toHaveCount(2, {
      timeout: 5000
    });

    // Переключаем на начинки
    await page.locator('text=Начинки').first().click();
    await page.waitForTimeout(800);

    // Добавляем начинку
    await page
      .locator('li')
      .filter({ hasText: 'Филе Люминесцентного тетраодонтимформа' })
      .getByRole('button', { name: 'Добавить' })
      .click();
    await expect(page.locator('.constructor-element')).toHaveCount(3, {
      timeout: 5000
    });

    // Оформляем заказ
    await page.getByRole('button', { name: 'Оформить заказ' }).click();

    // Проверяем модальное окно с номером заказа
    await expect(page.locator('#modals').getByText('12345')).toBeVisible({
      timeout: 10000
    });

    // Проверяем, что конструктор очистился
    await expect(page.locator('.constructor-element')).toHaveCount(0, {
      timeout: 5000
    });

    // Закрываем модальное окно
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
