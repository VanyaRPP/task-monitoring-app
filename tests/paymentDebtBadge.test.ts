import { test, expect } from '@playwright/test';

test.describe('Payments Page - Оновлення заборгованості (RTK Query)', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/auth/signin');
        await page.locator('[data-e2e="authFormEmail"]').fill('globalAdmin@test.com');
        await page.locator('[data-e2e="authFormPassword"]').fill('testGlobalAdmin123');
        await page.getByRole('button', { name: 'Вхід', exact: true }).click();

        await expect(page.getByRole('button', { name: 'Вхід', exact: true })).not.toBeVisible();
        await page.goto('http://localhost:3000/payment');
    });

    test('Кейс 1: Погашення боргу через Кредит(Оплата)', async ({ page }) => {
        const rowWithDebt = page.locator('tbody tr')
            .filter({ has: page.locator('.ant-badge') })
            .filter({ has: page.locator('td').nth(4).filter({ hasText: /\d/ }) })
            .first();

        const debtBadge = rowWithDebt.locator('.ant-badge');

        await expect(rowWithDebt).toBeVisible({ timeout: 10000 });
        await expect(debtBadge).toBeVisible();

        const initialDebtText = await debtBadge.innerText();

        const debtAmountMatch = initialDebtText.match(/\d+(\.\d+)?/);
        const debtToPay = debtAmountMatch ? debtAmountMatch[0] : '0';

        let providerName = await rowWithDebt.locator('td').nth(1).innerText();
        providerName = providerName.split('\n')[0].trim();

        let companyName = await rowWithDebt.locator('td').nth(2).innerText();
        companyName = companyName.split('\n')[0].trim();

        await page.locator('.ant-collapse-header')
            .filter({ hasText: /Надавачі/ })
            .locator('.ant-collapse-expand-icon')
            .evaluate((node: HTMLElement) => node.click());

        await page.waitForTimeout(500);
        await page.getByText('Додати').click();

        const modal = page.locator('.ant-modal-content:visible').first();
        await expect(modal).toBeVisible();

        await modal.locator('.ant-form-item').filter({ hasText: 'Надавач послуг' }).locator('.ant-select-selector').click();
        await page.locator('.ant-select-dropdown:visible').locator('.ant-select-item-option').filter({ hasText: providerName }).first().click();

        await page.waitForTimeout(1000);

        const companySelect = modal.locator('.ant-form-item').filter({ hasText: 'Компанія' }).locator('.ant-select');
        const isCompanyDisabled = await companySelect.evaluate(node => node.classList.contains('ant-select-disabled'));

        if (!isCompanyDisabled) {
            await companySelect.locator('.ant-select-selector').click();
            await page.locator('.ant-select-dropdown:visible').locator('.ant-select-item-option').filter({ hasText: companyName }).first().click();
        }

        await modal.locator('.ant-form-item').filter({ hasText: 'Тип оплати' }).locator('.ant-select-selector').click();
        await page.locator('.ant-select-dropdown:visible').getByText('Кредит (Оплата)', { exact: true }).click();

        const amountInput = modal.getByLabel('Сума');
        await amountInput.waitFor({ state: 'visible' });
        await amountInput.fill(debtToPay);

        await modal.getByLabel('Опис').fill(`Автотест: Погашення боргу ${debtToPay}`);

        await modal.getByRole('button', { name: 'Додати' }).click();

        await page.waitForResponse(response => response.url().includes('/api/') && response.status() === 200);
        await expect(modal).not.toBeVisible();

        const updatedRow = page.locator('tbody tr')
            .filter({ hasText: companyName })
            .filter({ hasText: providerName })
            .first();

        await expect(async () => {
            const badge = updatedRow.locator('.ant-badge');
            await expect(badge).not.toBeVisible();
        }).toPass({ timeout: 5000 });
    });

    test('Кейс 2: Позначення оплати', async ({ page }) => {
        const rowWithDebt = page.locator('tbody tr')
            .filter({ has: page.locator('.ant-badge') })
            .filter({ has: page.locator('td').nth(4).filter({ hasText: /\d/ }) })
            .first();

        const debtBadge = rowWithDebt.locator('.ant-badge');

        await expect(rowWithDebt).toBeVisible({ timeout: 10000 });
        await expect(debtBadge).toBeVisible();

        const companyName = await rowWithDebt.locator('td').nth(2).innerText();
        const providerName = await rowWithDebt.locator('td').nth(1).innerText();

        await rowWithDebt.locator('[aria-label="more"], .ant-dropdown-trigger').first().click();
        await page.getByText('Позначити оплату').click();

        await page.waitForResponse(response => response.url().includes('/api/') && response.status() === 200);

        const paidRow = page.locator('tbody tr')
            .filter({ hasText: companyName })
            .filter({ hasText: providerName })
            .first();

        await expect(paidRow.locator('.ant-badge')).not.toBeVisible();
    });
});