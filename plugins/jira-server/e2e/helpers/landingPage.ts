export class LandingPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.exampleWebsite = page.locator(
      "xpath=//a[normalize-space()='example-website']",
    );
    this.jiraComponentLink = page.locator(
      "xpath=//a[normalize-space()='example-website-for-jira-server-plugin']",
    );
    this.jiraTabInExampleWebsite = page.getByTestId('header-tab-7');
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
  async getJiraComponent() {
    await this.jiraComponentLink.click();
  }
  async openJiraTab() {
    await this.jiraTabInExampleWebsite.click();
  }
}


