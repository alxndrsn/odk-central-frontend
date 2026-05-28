import { expect } from '@playwright/test';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;

const login = async (page, { freshContext }={}) => {
  await page.goto(appUrl);
  await expect(page.getByRole('heading', { name: 'Welcome to ODK Central' })).toBeVisible();

  await page.getByPlaceholder('email address').fill(user);
  await page.getByPlaceholder('password').fill(password);

  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL(appUrl);

  if (freshContext) {
    // prevent DOM re-use
    await page.goto('about:blank');
  }
};

export { login };
