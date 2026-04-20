import { expect, test } from '@playwright/test';
import { elementClient } from '@tailor-cms/cek-e2e';

import { Display } from '../pom';

const ELEMENT_ID = 'test-mux-video-display';
const PLAYBACK_ID = 'mock-playback-test';
const TRANSCRIPT_URL = 'https://example.com/transcript.pdf';
const CAPTIONS_URL = 'https://example.com/captions.vtt';

test.beforeEach(async ({ page }) => {
  await elementClient.reset(ELEMENT_ID);
  await page.goto(`/?id=${ELEMENT_ID}`);
  await page.waitForLoadState('networkidle');
});

test.describe('When video is not set', () => {
  test('Shows empty-state placeholder', async ({ page }) => {
    const display = new Display(page);
    await expect(display.placeholder).toBeVisible();
    await expect(display.root).not.toBeVisible();
  });
});

test.describe('When video is set', () => {
  test.beforeEach(async ({ page }) => {
    await elementClient.update(ELEMENT_ID, {
      playbackId: PLAYBACK_ID,
      assets: {},
    });
    await page.reload({ waitUntil: 'networkidle' });
  });

  test('Renders mux-player', async ({ page }) => {
    const display = new Display(page);
    await expect(display.placeholder).not.toBeVisible();
    await expect(display.player).toBeVisible();
  });

  test('Renders captions track when captions are set', async ({ page }) => {
    await elementClient.update(ELEMENT_ID, {
      playbackId: PLAYBACK_ID,
      captions: CAPTIONS_URL,
      assets: {},
    });
    await page.reload({ waitUntil: 'networkidle' });
    const display = new Display(page);
    await expect(display.captionsTrack).toHaveCount(1);
    await expect(display.captionsTrack).toHaveAttribute('src', CAPTIONS_URL);
  });

  test('Renders transcript button when transcript is set', async ({ page }) => {
    await elementClient.update(ELEMENT_ID, {
      playbackId: PLAYBACK_ID,
      transcript: TRANSCRIPT_URL,
      assets: {},
    });
    await page.reload({ waitUntil: 'networkidle' });
    const display = new Display(page);
    await expect(display.transcriptBtn).toBeVisible();
    await expect(display.transcriptBtn).toHaveAttribute('href', TRANSCRIPT_URL);
    await expect(display.transcriptBtn).toHaveAttribute('target', '_blank');
  });
});

test.afterAll(async () => {
  await elementClient.reset(ELEMENT_ID);
});
