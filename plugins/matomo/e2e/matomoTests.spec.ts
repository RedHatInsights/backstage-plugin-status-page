import { test, expect } from '@playwright/test';
import { LandingPage } from './helpers/landingPage';
import { MatomoPage } from './helpers/matomoPage';
require('dotenv').config();
test.describe('Matomo Test App', async () => {
  test('test the section of matomo with no matomo configured', async ({
    page,
  }) => {
    const Landing = new LandingPage(page);
    const matomo = new MatomoPage(page);
    let url: string;
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.openTheExampleWebsiteMatomoTab();
    await matomo.openMatomoTab();
    await page.isVisible("text='Missing Annotation'");
    await page.isVisible('pre');
  });
  test('test matomo with matomo configured', async ({ page }) => {
    const Landing = new LandingPage(page);
    const matomo = new MatomoPage(page);
    await page.waitForLoadState('domcontentloaded');
    await Landing.goToSite(process.env.BASE_URL);
    await Landing.getMatomoWebsite();
    await matomo.openMatomoTab();
    await expect(
      page.locator("//div[@id='root']/div/main/article/div[2]/div/div"),
    ).toHaveCount(9);
    await page.isVisible("text='Matomo Site ID:")
    await matomo.selectTheFilter();
    await expect(page.locator("div[class*='MuiTypography-h1']")).toBeDefined();
    const instanceLink = await page.locator("a[title='Matomo Instance']");
    const instanceLinkValue = await instanceLink.getAttribute('href');
    expect(instanceLinkValue).toContain(process.env.MATOMO_TEST_URL);
    await expect(page.locator("a[title='Contact Us']")).toBeVisible();
    const slackLink = await page.locator("//a[@title='Contact Us']");
    const slackLinkValue = await slackLink.getAttribute('href');
    expect(slackLinkValue).toContain(process.env.SLACK_CHANNEL_LINK);
  });
  test('Filters & the config file test', async ({ page }) => {
    const Landing = new LandingPage(page);
    const matomo = new MatomoPage(page);
    await page.waitForLoadState('domcontentloaded');
    await Landing.goToSite(process.env.BASE_URL);
    await Landing.getMatomoWebsite();
    await matomo.openMatomoTab();
    await matomo.checkConfigOptions();
    await page.getByRole('button', { name: 'Period' }).click();
    await page.getByRole('option', { name: 'Week' }).click();
    await page.getByRole('button', { name: 'Period' }).click();
    await page.getByRole('option', { name: 'Month' }).click();
    await page.getByText('Today').click();
    await page.getByRole('option', { name: 'Last Year' }).click();
  });
});
