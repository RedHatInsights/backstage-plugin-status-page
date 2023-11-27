import { test, expect } from '@playwright/test';
import { LandingPage } from './helpers/landingPage';
import { jiraPluginPage } from './helpers/jiraPluginPage';

test.describe('BackStage Jira Plugin', async () => {
  test('Test the section of Jira plugin with no config in place', async ({
    page,
  }) => {
    const Landing = new LandingPage(page);
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.openTheExampleWebsiteTab();
    await Landing.openJiraTab();
    await page.isVisible("text='Missing Annotation'");
    await expect(
      page.locator('pre', { hasText: 'jira/project-key: value' }),
    ).toBeDefined();
    await expect(
      page.locator('pre', { hasText: 'jira/component: value' }),
    ).toBeDefined();
  });

  test('Test jira plugin for the configured property', async ({ page }) => {
    const Landing = new LandingPage(page);
    const jiraPage = new jiraPluginPage(page);
    await Landing.goToSite(process.env.BASE_URL);
    await page.isVisible('css=h1');
    await Landing.getJiraComponent();
    await jiraPage.openJiraTab();
    await jiraPage.checkOpenInJira();
    await jiraPage.checkFilterSelection();
    const countOfNewIssues = await page.locator("//td[text()='New']").count();
    expect(countOfNewIssues).toBeLessThanOrEqual(5);
    await jiraPage.checkEmptyIssuesFilter();
    await jiraPage.checkConfigOptions();
    await expect(page.locator('table > thead > tr > th')).toBeDefined();
    const columnsCount = await page.locator('table > thead > tr > th').count();
    expect(columnsCount).toBeLessThanOrEqual(7);
    const rowCount = await page.locator('table > tbody > tr').count();
    expect(rowCount).toBeLessThanOrEqual(5);
    const button = page.locator("button[title='Next page']");
    const isButtonDisabled = async () => {
      const disabled = await button.getAttribute('disabled');
      return disabled !== null;
    };
    while (!(await isButtonDisabled())) {
      await button.click();
    }
    await page
      .locator(
        "(//p[contains(text(),'Rows per page:')]/following-sibling::div)[1]",
      )
      .click();
    await page.locator('li:nth-child(2)').click({ force: true });
    const rowsCount = await page.locator('table > tbody > tr').count();
    expect(rowsCount).toBeLessThanOrEqual(10);
    await page
      .locator(
        "(//p[contains(text(),'Rows per page:')]/following-sibling::div)[1]",
      )
      .click();
    await page.locator('li:nth-child(3)').click({ force: true });
    const maxRowsCount = await page.locator('table > tbody > tr').count();
    expect(maxRowsCount).toBeLessThanOrEqual(20);
  });
});


