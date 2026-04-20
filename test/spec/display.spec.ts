import { expect, test } from '@playwright/test';
import { elementClient } from '@tailor-cms/cek-e2e';

import { Display } from '../pom';

const ELEMENT_ID = 'test-mux-video-display';
const TRANSCRIPT_URL = 'https://example.com/transcript.pdf';

test.beforeEach(async ({ page }) => {
  await elementClient.reset(ELEMENT_ID);
  await page.goto(`/?id=${ELEMENT_ID}`);
  await page.waitForLoadState('networkidle');
});

test.describe('When no video is set', () => {
  test('Does not render mux-player', async ({ page }) => {
    const display = new Display(page);
    await expect(display.root).toBeVisible();
    await expect(display.player).not.toBeVisible();
  });

  test('Does not render transcript button', async ({ page }) => {
    const display = new Display(page);
    await expect(display.transcriptBtn).not.toBeVisible();
  });
});

test.describe('When transcript is set', () => {
  test.beforeEach(async ({ page }) => {
    await elementClient.update(ELEMENT_ID, {
      transcript: TRANSCRIPT_URL,
      captions: null,
      assets: {},
    });
    await page.reload({ waitUntil: 'networkidle' });
  });

  test('Renders transcript button with correct href', async ({ page }) => {
    const display = new Display(page);
    await expect(display.transcriptBtn).toBeVisible();
    await expect(display.transcriptBtn).toHaveAttribute('href', TRANSCRIPT_URL);
  });

  test('Transcript link opens in new tab', async ({ page }) => {
    const display = new Display(page);
    await expect(display.transcriptBtn).toHaveAttribute('target', '_blank');
  });
});

test.afterAll(async () => {
  await elementClient.reset(ELEMENT_ID);
});
