import { expect, test } from '@playwright/test';
import { elementClient } from '@tailor-cms/cek-e2e';

import { CAPTIONS_SRT, CAPTIONS_VTT, TRANSCRIPT, VIDEO } from '../fixtures';
import { Edit } from '../pom';

const ELEMENT_ID = 'test-mux-video-edit';

test.beforeEach(async ({ page }) => {
  await elementClient.reset(ELEMENT_ID);
  await page.goto(`/?id=${ELEMENT_ID}`);
  await page.waitForLoadState('networkidle');
});

test.describe('When video is not set', () => {
  test('Shows placeholder', async ({ page }) => {
    const edit = new Edit(page);
    await expect(edit.placeholder).toBeVisible();
    await expect(edit.player).not.toBeVisible();
  });

  test('Upload dialog lists accepted video extensions', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await edit.videoFileInput.open();
    const accept = await edit.videoFileInput.fileInput.getAttribute('accept');
    expect(accept).toContain('.mp4');
    expect(accept).toContain('.mov');
    expect(accept).toContain('.avi');
    expect(accept).toContain('.mkv');
    await edit.videoFileInput.cancel();
  });
});

test.describe('When video is set', () => {
  test('Uploads and persists player across reload', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await expect(edit.uploadingText).not.toBeVisible();
    await expect(edit.processingText).not.toBeVisible();
    await edit.videoFileInput.open();
    await edit.videoFileInput.upload(VIDEO);
    await expect(edit.processingText).toBeVisible();
    await expect(edit.player).toBeVisible({ timeout: 15_000 });
    await expect(edit.placeholder).not.toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await expect(edit.player).toBeVisible();
    await expect(edit.placeholder).not.toBeVisible();
  });
});

test.describe('Transcript', () => {
  test('Can upload a transcript file', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await expect(edit.transcriptClearBtn).not.toBeVisible();
    await edit.transcriptInput.setInputFiles(TRANSCRIPT);
    await expect(edit.transcriptClearBtn).toBeVisible();
  });

  test('Persists across reload', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await edit.transcriptInput.setInputFiles(TRANSCRIPT);
    await expect(edit.transcriptClearBtn).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await edit.focus();
    await expect(edit.transcriptClearBtn).toBeVisible();
  });

  test('Can clear an uploaded transcript', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await edit.transcriptInput.setInputFiles(TRANSCRIPT);
    await expect(edit.transcriptClearBtn).toBeVisible();
    await edit.transcriptClearBtn.click();
    await expect(edit.transcriptClearBtn).not.toBeVisible();
  });
});

test.describe('Captions', () => {
  test('Can upload a VTT file', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await expect(edit.captionsClearBtn).not.toBeVisible();
    await edit.captionsInput.setInputFiles(CAPTIONS_VTT);
    await expect(edit.captionsClearBtn).toBeVisible();
  });

  test('Accepts SRT (converted to VTT)', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await edit.captionsInput.setInputFiles(CAPTIONS_SRT);
    await expect(edit.captionsClearBtn).toBeVisible();
  });

  test('Can clear uploaded captions', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await edit.captionsInput.setInputFiles(CAPTIONS_VTT);
    await expect(edit.captionsClearBtn).toBeVisible();
    await edit.captionsClearBtn.click();
    await expect(edit.captionsClearBtn).not.toBeVisible();
  });
});

test.afterAll(async () => {
  await elementClient.reset(ELEMENT_ID);
});
