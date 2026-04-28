import type {
  PrepareVideoResult,
  ResolveAssetResult,
  VideoService,
} from './video-service';

export default class MockVideoService implements VideoService {
  private polls = new Map<string, number>();

  prepareVideo(_storageUrl: string): Promise<PrepareVideoResult> {
    const assetId = `mock-asset-${Date.now()}`;
    this.polls.set(assetId, 0);
    return Promise.resolve({ mode: 'ingest', assetId });
  }

  resolveAsset(input: {
    assetId?: string;
    uploadId?: string;
  }): Promise<ResolveAssetResult> {
    const id = input.assetId ?? input.uploadId;
    if (!id) return Promise.reject(new Error('No asset or upload ID provided'));

    const count = this.polls.get(id) ?? 0;
    this.polls.set(id, count + 1);

    if (count < 1) return Promise.resolve({ status: 'preparing' });

    return Promise.resolve({
      status: 'ready',
      assetId: input.assetId ?? `mock-asset-from-${input.uploadId}`,
      playbackId: `mock-playback-${id}`,
      token: 'mock-token',
      thumbnailToken: 'mock-thumbnail-token',
    });
  }

  getTokens(): Promise<{ token: string; thumbnailToken: string }> {
    return Promise.resolve({
      token: 'mock-token',
      thumbnailToken: 'mock-thumbnail-token',
    });
  }

  removeVideo(_assetId: string): Promise<void> {
    return Promise.resolve();
  }
}
