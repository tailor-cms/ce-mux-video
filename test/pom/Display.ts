import type { Locator, Page } from '@playwright/test';
import { pom } from '@tailor-cms/cek-e2e';

export class Display extends pom.DisplayPanel {
  readonly root: Locator;
  readonly player: Locator;
  readonly captionsTrack: Locator;
  readonly transcriptBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.editor.locator('.tce-mux-video-root');
    this.player = this.root.locator('mux-player');
    this.captionsTrack = this.player.locator('track[kind="captions"]');
    this.transcriptBtn = this.root.getByRole('link', { name: 'Transcript' });
  }
}
