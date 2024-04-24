import { test, expect } from '@playwright/test';
import { LandingPage } from './helpers/landingPage';
import { SPAshipPage } from './helpers/spashipPage';

test.describe('BackStage SPAShip Plugin', async () => {
  test('Test the section of SPAship plugin with no config in place', async ({
    page,
  }) => {
    const Landing = new LandingPage(page);
    const spashipPage = new SPAshipPage(page);
    let url: string;
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.openTheExampleWebsiteTab();
    await spashipPage.openSPAshipTab();
    await page.isVisible("text='Missing Annotation'");
    await expect(
      page.locator('pre', { hasText: 'spaship.io/property-id' }),
    ).toBeVisible();
    await expect(
      page.locator('pre', { hasText: 'spaship.io/app-id' }),
    ).toBeVisible();
  });
  test('Test spaship plugin for the configured property', async ({ page }) => {
    const Landing = new LandingPage(page);
    const spashipPage = new SPAshipPage(page);
    let url: string;
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.getSPAshipWebsite();
    await spashipPage.openSPAshipTab();
    await spashipPage.checkChatWithUsButton();
    await spashipPage.checkContactUsButton();
    await expect(
      page.getByText('example-website-for-spaship-plugin'),
    ).toBeVisible();
    await spashipPage.checkConfigOptions();
    await spashipPage.checkValues();
    await expect(page.locator("(//div[text()='Property Identifier:']/a)[1]")).not.toBeNull();
    await expect(
      page.locator("(//div[text()='Application Identifier:']/a)[2]"),
    ).not.toBeNull();
    const activityStreamElementsCount = await page
      .locator(
        "//span[normalize-space()='Activity Stream']/parent::div/parent::div/following-sibling::div/div/div",
      )
      .count();
    expect(activityStreamElementsCount).toBeGreaterThanOrEqual(1);
  });
  test('SPAship GLobal plugin', async ({ page }) => {
    const Landing = new LandingPage(page);
    const spashipPage = new SPAshipPage(page);
    let url: string;
    await Landing.goToSite(process.env.BASE_URL);
    await page.getByLabel('SPAship').click();
    await spashipPage.checkValues();
    await spashipPage.checkGlobalPluginLinks();
    const activityStreamElementsCount = await page
      .locator(
        "//span[text()='Activity Stream']/parent::div/parent::div/following-sibling::div/div/div",
      )
      .count();
    expect(activityStreamElementsCount).toBeGreaterThanOrEqual(1);
  });
});
