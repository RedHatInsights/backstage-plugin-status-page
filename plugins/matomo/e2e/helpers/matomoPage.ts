import { test, expect } from '@playwright/test';

exports.MatomoPage = class MatomoPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.readMore = page.locator("xpath=//span[text()='Read more']");
    this.matomoWebsite = page.locator(
      "xpath=//a[normalize-space()='matomo-website']",
    );
    this.matomoTab = page.getByTestId('header-tab-2');
    this.matomoRangeFilter = page.locator("//div[@aria-labelledby='range']");
    this.matomoSelectYear = page.locator("//li[normalize-space()='Last Year']");
    this.menuButton = page.getByTestId('menu-button');
    this.matomoPageElements = page.locator(
      "//div[@id='root']/div[@class='MuiBox-root jss10 jss7 jss9']/main[@class='jss731']/article[@class='jss1403']/div[2]/div/div",
    );
    this.matomoMenu = page.getByTestId('menu-button');
    this.matomoMenuInspect = page.getByRole('menuitem', {
      name: 'Inspect entity',
    });
  }

  async checkConfigOptions() {
    await this.matomoMenu.click();
    await this.matomoMenuInspect.click();
    await this.page.getByRole('tab', { name: 'Raw YAML' }).click();
    await expect(this.page.getByText('matomo.io/site-id:')).toBeVisible();
    await expect(
      this.page.getByText('backstage.io/managed-by-origin-location:'),
    ).toBeVisible();
    await this.page.getByRole('tab', { name: 'Raw JSON' }).click();
    await expect(this.page.getByText('"matomo.io/site-id"')).toBeVisible();
    await this.page.getByRole('button', { name: 'Close' }).click();
  }
  async checkHeaderVisibility() {
    await this.heading;
  }
  async goToSite(url) {
    await this.page.goto(url);
  }
  async openTheExampleWebsiteMatomoTab() {
    await this.exampleWebsite.click();
  }
  async selectTheFilter() {
    await this.matomoRangeFilter.click();
    await this.matomoSelectYear.click();
  }
  async getMatomoWebsite() {
    await this.matomoWebsite.click();
  }
  async openMatomoTab() {
    await this.matomoTab.click();
  }
  async clickMenuButton() {
    await this.clickMenuButton.click();
  }
};
