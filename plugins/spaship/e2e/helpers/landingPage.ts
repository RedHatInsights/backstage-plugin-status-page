export class LandingPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.exampleWebsite = page.locator(
      "xpath=//a[normalize-space()='example-website']",
    );
    this.spashipWebsite = page.locator(
      "xpath=//a[normalize-space()='example-website-for-spaship-plugin']",
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
  async getSPAshipWebsite() {
    await this.spashipWebsite.click();
  }
}
