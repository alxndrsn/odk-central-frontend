import { test as teardown, expect } from '@playwright/test';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const credentials = Buffer.from(`${user}:${password}`, 'utf-8').toString('base64');
const projectId = process.env.PROJECT_ID;
const projectIdEncrypted = process.env.PROJECT_ID_ENCRYPTED;

teardown('delete project', async ({ request }) => {
  const check1 = await request.get(`${appUrl}/v1/projects`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`
    }
  });
  console.log('check1:', await check1.json());

  const promises = [ projectId, projectIdEncrypted ].map((project) => {
    return request.delete(`${appUrl}/v1/projects/${project}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`
      }
    })
      .then(res => res.json())
      .then(res => res.success);
  });

  const results = await Promise.allSettled(promises);
  results.forEach(result => expect(result.value).toEqual(true));

  const check2 = await request.get(`${appUrl}/v1/projects`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`
    }
  });
  console.log('check2:', await check2.json());
});
