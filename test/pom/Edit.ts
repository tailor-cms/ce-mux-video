import type { Locator, Page } from '@playwright/test';
import { pom } from '@tailor-cms/cek-e2e';

export class Edit extends pom.EditPanel {
  readonly root: Locator;
  readonly placeholder: Locator;
  readonly player: Locator;
  readonly fileInput: pom.FileInput;
  readonly uploadingText: Locator;
  readonly processingText: Locator;
  readonly errorText: Locator;
  readonly transcriptField: Locator;
  readonly transcriptInput: Locator;
  readonly transcriptClearBtn: Locator;
  readonly captionsField: Locator;
  readonly captionsInput: Locator;
  readonly captionsClearBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.editor.locator('.tce-mux-video');
    this.placeholder = this.editor.getByText('MUX Video component');
    this.player = this.editor.locator('mux-player');
    this.fileInput = new pom.FileInput(this.el);
    const statusPanel = this.root.locator('.status-panel');
    this.uploadingText = statusPanel.getByText('Uploading video');
    this.processingText = statusPanel.getByText('Processing video');
    this.errorText = statusPanel.getByText('Video processing failed');
    this.transcriptField = this.sideToolbar
      .locator('.v-input')
      .filter({ hasText: 'Transcript' });
    this.transcriptInput = this.transcriptField.locator('input[type="file"]');
    this.transcriptClearBtn = this.transcriptField.locator(
      '.v-field__clearable',
    );
    this.captionsField = this.sideToolbar
      .locator('.v-input')
      .filter({ hasText: 'Captions' });
    this.captionsInput = this.captionsField.locator('input[type="file"]');
    this.captionsClearBtn = this.captionsField.locator('.v-field__clearable');
  }
}
