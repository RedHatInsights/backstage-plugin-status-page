import { test, expect } from '@playwright/test';
export class jiraPluginPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.jiraTab = page.getByTestId('header-tab-5');
    this.contactUs = page.locator("xpath=//a[@title='Contact Us']");
    this.viewStatus = page.locator("//div[@id='select-statuses']");
    this.viewProject = page.getByRole('link', { name: 'Open in JIRA' });
    this.jiraMenu = page.getByTestId('menu-button');
    this.jiraPluginMenuInspect = page.getByRole('menuitem', {
      name: 'Inspect entity',
    });
  }
  async openJiraTab() {
    await this.jiraTab.click();
  }
  async goToSite(url) {
    await this.page.goto(url);
  }
  async openTheExampleWebsiteMatomoTab() {
    await this.exampleWebsite.click();
  }

  async checkOpenInJira() {
    expect(await this.viewProject.getAttribute('href')).not.toBeNull();
    expect(await this.viewProject.getAttribute('href')).toContain(
      process.env.JIRA_URL,
    );
  }
  async checkEmptyIssuesFilter() {
    await this.page
      .getByTestId('info-card-subheader')
      .getByLabel('more')
      .click();
    await this.page.waitForTimeout(5000);
    await this.page.getByRole('checkbox').check();
    await this.page
      .locator("(//span[text()='Jira'])[2]")
      .click({ force: true });
    const countOfIssueTypes = await this.page.locator('h6').count();
    expect(countOfIssueTypes).toBe(20);
    await this.page
      .getByTestId('info-card-subheader')
      .getByLabel('more')
      .click();
    await this.page.getByRole('checkbox').uncheck();
    await this.page
      .locator("(//span[text()='Jira'])[2]")
      .click({ force: true });
    const newCountOfIssueTypes = await this.page.locator('h6').count();
    expect(newCountOfIssueTypes).toBe(3);
  }
  async checkFilterSelection() {
    await this.viewStatus.click();
    await this.page.waitForTimeout(5000);
    await this.page
      .getByRole('option', { name: 'New' })
      .getByRole('checkbox')
      .check();
    await this.page.locator('h1').click({ force: true });
  }
  async checkContactUsButton() {
    expect(await this.contactUs.getAttribute('href')).not.toBeNull();
  }

  async checkConfigOptions() {
    await this.jiraMenu.click();
    await this.jiraPluginMenuInspect.click();
    await this.page.getByRole('tab', { name: 'Raw YAML' }).click();
    await expect(this.page.getByText('jira/project-key:')).toBeVisible();
    await expect(this.page.getByText('jira/component:')).toBeVisible();
    await this.page.getByRole('tab', { name: 'Raw JSON' }).click();
    await this.page.getByRole('button', { name: 'Close' }).click();
  }
}

