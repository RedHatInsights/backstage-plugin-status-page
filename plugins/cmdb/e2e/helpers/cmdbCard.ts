import { test, expect } from '@playwright/test';

export class CMDBCardPage {
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
    await this.page.isVisible("text='servicenow.com/appcode:'")
    await this.page.getByRole('tab', { name: 'Raw JSON' }).click();
    await this.page.isVisible("text='servicenow.com/appcode:'")
    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async verifyCardData() {
    await expect(this.page.getByText('CMDB Details')).toBeVisible();
    await expect(
      this.page.getByRole('heading', { name: 'App Code' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', { name: 'Service Criticality' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', { name: 'Service Owner' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', { name: 'Delegate' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('link', {
        name: 'one-platform-devs@redhat.com , Opens in a new window',
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('link', {
        name: 'View on ServiceNow , Opens in a new window',
      }),
    ).toBeVisible();
  }
}
