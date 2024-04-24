import { test, expect } from '@playwright/test';

export class SPAshipPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.SPAshipTab = page.getByTestId('header-tab-3');
    this.contactUs = page.locator("//a[@title='Contact Us']");
    this.chatWithUs = page.locator("a[title='Chat With Us']");
    this.spashipMenu = page.getByTestId('menu-button');
    this.spashipMenuInspect = page.getByRole('menuitem', {
      name: 'Inspect entity',
    });
  }
  async openSPAshipTab() {
    await this.SPAshipTab.click();
  }
  async goToSite(url) {
    await this.page.goto(url);
  }
  async openTheExampleWebsiteMatomoTab() {
    await this.exampleWebsite.click();
  }
  async getSPAshipWebsite() {
    await this.spashipWebsite.click();
  }
  async checkChatWithUsButton() {
    expect(await this.chatWithUs.getAttribute('href')).not.toBeNull();
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
    await this.spashipMenu.click();
    await this.spashipMenuInspect.click();
    await this.page.getByRole('tab', { name: 'Raw YAML' }).click();
    await expect(this.page.getByText('spaship.io/property-id:')).toBeVisible();
    await expect(
      this.page.getByText('backstage.io/managed-by-origin-location:'),
    ).toBeVisible();
    await this.page.getByRole('tab', { name: 'Raw JSON' }).click();
    await expect(this.page.getByText('spaship.io/app-id')).toBeVisible();
    await this.page.getByRole('button', { name: 'Close' }).click();
  }
  async checkGlobalPluginLinks() {
    const websiteLink = await this.page.locator(
      "//h4[text()='SPAship']/parent::a",
    );
    const websiteLinkValue = await websiteLink.getAttribute('href');
    expect(websiteLinkValue).toContain(process.env.SPASHIP_INSTANCE_LINK);
    const slackLink = await this.page.locator(
      "//p[text()='Slack']/following-sibling::span/a",
    );
    const slackLinkValue = await slackLink.getAttribute('href');
    expect(slackLinkValue).toContain(process.env.SPASHIP_SLACK_CHANNEL);
    const githubLink = await this.page.locator(
      "//p[text()='Github']/following-sibling::span/a",
    );
    const githubLinkValue = await githubLink.getAttribute('href');
    expect(githubLinkValue).toContain(process.env.SPASHIP_GITHUB_LINK);
  }
}
