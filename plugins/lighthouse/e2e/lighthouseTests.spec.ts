import { test, expect } from '@playwright/test';
import { LandingPage } from './helpers/landingPage';
import { LighthousePage } from './helpers/lighthousePage';

test.describe('BackStage Lighthouse Plugin', async () => {
  test('Test the section of Lighthouse plugin with no config in place', async ({
    page,
  }) => {
    const Landing = new LandingPage(page);
    const lighthousePage = new LighthousePage(page);
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.openTheExampleWebsiteTab();
    await lighthousePage.openLighthouseTab();
    await page.isVisible("text='Missing Annotation'");
    await expect(
      page.locator('pre', { hasText: 'lighthouse.io/project-name' }),
    ).toBeVisible();
  });

  test('Test lighthouse plugin for the configured property', async ({
    page,
  }) => {
    const Landing = new LandingPage(page);
    const lighthousePage = new LighthousePage(page);
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.getLightHouseComponent();
    await lighthousePage.openLighthouseTab();
    await expect(page.getByText('slug:')).toBeDefined();
    await lighthousePage.checklighthouseCILink();
    await lighthousePage.checkContactUsButton();
    await lighthousePage.checkConfigOptions();
    const activityStreamElementsCount = await page
      .locator("div[class*='MuiChip'] span")
      .count();
    expect(activityStreamElementsCount).toBeLessThanOrEqual(5);
    await page.locator("//input[@placeholder='Filter']").fill('Lighthouse');
    await page.waitForTimeout(2000);
    for (let i = 1; i <= 4; i++) {
      expect(
        page.locator(`//tbody/tr[${i}]/td[3]/div[1]/div[1]`),
      ).toHaveText('Lighthouse');
    }
    await page.locator("//input[@placeholder='Filter']").clear();
    expect(
      page.locator(
        'div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > div:nth-child(2) > div',
      ),
    ).toBeDefined();
    await page.locator("div[aria-labelledby='branches']").click();
    for (let i = 1; i < 7; i++) {
      await page.locator(`ul li:nth-child(${i})`).click();
      expect(page.locator("//div[@class='recharts-wrapper']")).toBeDefined();
      expect(page.locator("//div[@aria-labelledby='urls']")).not.toBeNull();
      if (i < 6) await page.locator("div[aria-labelledby='branches']").click();
    }
    await page.locator("//span[contains(text(),'Score Card')]").click();
    const countOfLimitedRows = await page
      .locator("div[class*='MuiChip'] span")
      .count();
    expect(countOfLimitedRows).toBeLessThanOrEqual(5);
    await page.getByLabel('5 rows').click();
    await page.locator('li:nth-child(2)').click({ force: true });
    const countOfRows = await page
      .locator("div[class*='MuiChip'] span")
      .count();
    expect(countOfRows).toBeLessThanOrEqual(10);
    await page.getByLabel('10 rows').click();
    await page.locator('li:nth-child(3)').click({ force: true });
    const activityStreamElements = await page
      .locator("div[class*='MuiChip'] span")
      .count();
    expect(activityStreamElements).toBeLessThanOrEqual(20);
  });
});
