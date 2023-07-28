export class LandingPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.exampleWebsite = page.locator(
      "xpath=//a[normalize-space()='example-website']",
    );
    this.matomoWebsite = page.locator(
      "xpath=//a[normalize-space()='example-website-for-matomo-plugin']",
    );
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
  async openMatomoTab() {
    await this.matomoTab.click();
  }
  async getMatomoWebsite() {
    await this.matomoWebsite.click();
  }
}
