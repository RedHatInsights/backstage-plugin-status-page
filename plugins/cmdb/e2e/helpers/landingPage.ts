export class LandingPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.exampleWebsite = page.locator(
      "xpath=//a[normalize-space()='example-website']",
    );
    this.cmdbService = page.locator(
      "xpath=//a[normalize-space()='example-service-for-cmdb-plugin']",
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
  async getCMDBService() {
    await this.cmdbService.click();
  }
}
