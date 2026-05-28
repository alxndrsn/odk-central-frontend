import { test, expect } from '@playwright/test';
import BackendClient from '../backend-client';
import { login } from '../util';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const projectId = process.env.PROJECT_ID;

let publishedForm;
let draftForm;
let firstSubmission;
let publicLink;

test.beforeAll(async ({ playwright }, testInfo) => {
  const backendClient = new BackendClient(playwright, `${testInfo.project.name}_wf`);
  await backendClient.alwaysHideModal();
  const resources = await backendClient.createFormAndChildren();
  publishedForm = resources.form;
  draftForm = resources.formDraft;
  firstSubmission = resources.submission;
  publicLink = resources.publicLink;

  await backendClient.setWebForms(resources.form.xmlFormId, true);
  await backendClient.dispose();
});

test.describe('ODK Web Forms', () => {
  test.describe('all old URLs should be working', () => {
    const oldUrls = [
      {
        description: 'Preview Web Forms',
        url: ({ xmlFormId }) => `/#/projects/${projectId}/forms/${xmlFormId}/preview`, requireLogin: true
      },
    ];

    oldUrls.forEach(t => {
      test(`shows Form using old URL - ${t.description}`, async ({ page }) => {
        const { enketoId, enketoOnceId, xmlFormId } = publishedForm;
        const { enketoId: draftEnketoId } = draftForm;
        const { instanceId } = firstSubmission;
        const { token: st } = publicLink;

        page.on('response', response => {
          const request = response.request();
          const headers = response.headers();
          console.log(`[CSP] ${response.status()} ${response.url()}:`, headers);
        });

        if (t.requireLogin) {
          await login(page, { freshContext: true });
        }

        const url = appUrl + t.url({ enketoId, enketoOnceId, draftEnketoId, xmlFormId, instanceId, st });
        console.log('[CSP] Navigating to:', url);
        const res = await page.goto(url);
        console.log('[CSP] response headers:', res?.headers());


        if (t.draft) {
          await expect(page.getByRole('heading', { name: `${publishedForm.name} - v2` })).toBeVisible();
        } else {
          await expect(page.getByRole('heading', { name: publishedForm.name })).toBeVisible();
        }
      });
    });
  });
});
