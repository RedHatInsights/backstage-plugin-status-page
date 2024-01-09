import { test, expect } from '@playwright/test';

export class ContactDetailsCard {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.componentMenu = page.getByTestId('menu-button');
    this.componentMenuInspect = page.getByRole('menuitem', {
      name: 'Inspect entity',
    });
  }
  async goToSite(url) {
    await this.page.goto(url);
  }
  async openTheExampleWebsiteMatomoTab() {
    await this.exampleWebsite.click();
  }
  async checkConfigOptions() {
    await this.componentMenu.click();
    await this.componentMenuInspect.click();
    await this.page.getByRole('tab', { name: 'Raw YAML' }).click();
    await this.page.isVisible("text='contacts:'")
    await this.page.getByRole('tab', { name: 'Raw JSON' }).click();
    await this.page.isVisible("text='contacts:'")
    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async verifyCardData() {
    await expect(this.page.getByText('Contact Details')).toBeVisible();
    await expect(
      this.page.locator("//h3",
    )).toBeDefined();
    await this.page.locator(
      "//h3[normalize-space()='Manager']/ancestor::div[@role='button']",
    ).click();
    await expect(this.page.locator("//div[contains(@class,'MuiChip-root')]")).toBeDefined();
  }
}
