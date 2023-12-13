import { test, expect } from '@playwright/test';
export class LighthousePage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.lighthouseTab = page.getByTestId('header-tab-4');
    this.contactUs = page.locator("xpath=//a[@title='Contact Us']");
    this.lighthouseCILink = page.locator(
      "xpath=//a[@title='Lighthouse Instance']",
    );
    this.lighthouseMenu = page.getByTestId('menu-button');
    (this.lighthouseMenuInspect = page.getByRole('menuitem', {
      name: 'Inspect entity',
    })),
      (this.lighthouseComponentLink = page.locator(
        "xpath=//a[normalize-space()='example-website-for-lighthouse-plugin']",
      ));
  }
  async openLighthouseTab() {
    await this.lighthouseTab.click();
  }
  async goToSite(url) {
    await this.page.goto(url);
  }
  async openTheExampleWebsiteMatomoTab() {
    await this.exampleWebsite.click();
  }
  async checklighthouseCILink() {
    expect(await this.lighthouseCILink.getAttribute('href')).not.toBeNull();
  }
  async checkContactUsButton() {
    expect(await this.contactUs.getAttribute('href')).not.toBeNull();
  }
  async checkValues() {
    expect(
      await this.page.locator(
        "//h5[normalize-space()='Total Deployments']/following-sibling::h1",
      ),
    ).not.toBeNull();
    expect(
      await this.page.locator(
        "//h5[normalize-space()='Avg. Deployment Time']/following-sibling::h1",
      ),
    ).not.toBeNull();
    expect(
      await this.page.locator(
        "//h5[normalize-space()='Total Ephemeral Deployments']/following-sibling::h1",
      ),
    ).not.toBeNull();
  }

  async checkConfigOptions() {
    await this.lighthouseMenu.click();
    await this.lighthouseMenuInspect.click();
    await this.page.getByRole('tab', { name: 'Raw YAML' }).click();
    await expect(
      this.page.getByText('lighthouse.io/project-name:'),
    ).toBeVisible();
    await expect(
      this.page.getByText('backstage.io/managed-by-origin-location:'),
    ).toBeVisible();
    await this.page.getByRole('tab', { name: 'Raw JSON' }).click();
    await expect(
      this.page.getByText('lighthouse.io/project-name:'),
    ).toBeDefined();
    await this.page.getByRole('button', { name: 'Close' }).click();
  }
}
