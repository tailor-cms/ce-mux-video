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

const MOCK_VIDEO = {
  playbackId: 'mock-playback-test',
  assetId: 'mock-asset-test',
  fileKey: 'mock/test-video.mp4',
  fileName: 'test-video.mp4',
  assets: {},
};

test.describe('When video is not set', () => {
  test('Shows dropzone as empty state', async ({ page }) => {
    const edit = new Edit(page);
    await expect(edit.fileInput.dropzone).toBeVisible();
    await expect(edit.fileInput.dropzoneUrlBtn).not.toBeVisible();
    await expect(edit.placeholder).not.toBeVisible();
    await expect(edit.player).not.toBeVisible();
  });

  test('Dropzone accepts video extensions only', async ({ page }) => {
    const edit = new Edit(page);
    const accept =
      await edit.fileInput.dropzoneFileInput.getAttribute('accept');
    for (const ext of ['.mp4', '.mov', '.avi', '.mkv'])
      expect(accept).toContain(ext);
  });

  test('Uploads via dropzone, processes and persists player across reload', async ({
    page,
  }) => {
    const edit = new Edit(page);
    await edit.focus();
    await edit.fileInput.dropzoneUpload(VIDEO);
    await expect(edit.processingText).toBeVisible();
    await expect(edit.fileInput.dropzone).not.toBeVisible();
    await expect(edit.player).toBeVisible({ timeout: 15_000 });
    await expect(edit.processingText).not.toBeVisible();
    await edit.fileInput.expectFile('test-video.mp4');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(edit.player).toBeVisible();
    await expect(edit.fileInput.dropzone).not.toBeVisible();
  });

  test('Rejects non-video file', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await edit.fileInput.dropzoneUpload(TRANSCRIPT);
    await expect(edit.processingText).not.toBeVisible();
    await expect(edit.fileInput.dropzone).toBeVisible();
    await expect(edit.player).not.toBeVisible();
  });
});

test.describe('When video is set', () => {
  test.beforeEach(async ({ page }) => {
    await elementClient.update(ELEMENT_ID, MOCK_VIDEO);
    await page.reload({ waitUntil: 'networkidle' });
  });

  test('Shows player', async ({ page }) => {
    const edit = new Edit(page);
    await expect(edit.player).toBeVisible();
    await expect(edit.player).toHaveAttribute(
      'playback-id',
      MOCK_VIDEO.playbackId,
    );
    await expect(edit.fileInput.dropzone).not.toBeVisible();
  });

  test('Can remove video', async ({ page }) => {
    const edit = new Edit(page);
    await edit.focus();
    await edit.fileInput.removeFromRow();
    await expect(edit.player).not.toBeVisible();
    await expect(edit.fileInput.dropzone).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(edit.fileInput.dropzone).toBeVisible();
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

test.describe('Readonly mode', () => {
  test('Shows placeholder instead of dropzone when empty', async ({ page }) => {
    const edit = new Edit(page);
    await edit.setReadonly();
    await expect(edit.placeholder).toBeVisible();
    await expect(edit.fileInput.dropzone).not.toBeVisible();
  });

  test('Keeps player visible and hides file actions when set', async ({
    page,
  }) => {
    await elementClient.update(ELEMENT_ID, MOCK_VIDEO);
    await page.reload({ waitUntil: 'networkidle' });
    const edit = new Edit(page);
    await edit.setReadonly();
    await edit.focus();
    await expect(edit.player).toBeVisible();
    await expect(edit.fileInput.replaceBtn).not.toBeVisible();
  });
});
