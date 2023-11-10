export class LandingPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.exampleWebsite = page.locator(
      "xpath=//a[normalize-space()='example-website']",
    );
    this.lighthouseComponentLink = page.locator(
      "xpath=//a[normalize-space()='example-website-for-lighthouse-plugin']",
    );
  }
  async checkHeaderVisibility() {
    await this.heading;
  }
  async goToSite(url) {
    await this.page.goto(url);
  }
  async openTheExampleWebsiteTab() {
    await this.exampleWebsite.click();
  }
  async getLightHouseComponent() {
    await this.lighthouseComponentLink.click();
  }
}
