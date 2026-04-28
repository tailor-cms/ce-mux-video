import { object, string } from 'yup';
import isLocalhost from 'is-localhost-ip';
import { Mux } from '@mux/mux-node';

import type {
  PrepareVideoResult,
  ResolveAssetResult,
  VideoService,
} from './video-service';

const schema = object({
  muxTokenId: string().required(),
  muxTokenSecret: string().required(),
  muxJwtSigningKey: string().required(),
  muxJwtPrivateKey: string().required(),
});

export interface MuxServiceConfig {
  muxTokenId: string;
  muxTokenSecret: string;
  muxJwtSigningKey: string;
  muxJwtPrivateKey: string;
}

export default class MuxVideoService implements VideoService {
  private static instance: MuxVideoService;

  api: Mux.Video;
  jwt: Mux.Jwt;

  private constructor(private config: MuxServiceConfig) {
    schema.validateSync(this.config);
    const { video, jwt } = new Mux({
      tokenId: this.config.muxTokenId,
      tokenSecret: this.config.muxTokenSecret,
      jwtSigningKey: this.config.muxJwtSigningKey,
      jwtPrivateKey: this.config.muxJwtPrivateKey,
    });
    this.api = video;
    this.jwt = jwt;
  }

  static get(config: MuxServiceConfig): MuxVideoService {
    if (!MuxVideoService.instance)
      MuxVideoService.instance = new MuxVideoService(config);
    return MuxVideoService.instance;
  }

  async prepareVideo(storageUrl: string): Promise<PrepareVideoResult> {
    const directUpload = await isLocalhost(new URL(storageUrl).hostname);
    if (directUpload) {
      const { id, url } = await this.createUpload();
      return { mode: 'upload', uploadId: id, uploadUrl: url };
    }
    const { assetId } = await this.ingestFromUrl(storageUrl);
    return { mode: 'ingest', assetId };
  }

  async ingestFromUrl(url: string): Promise<{ assetId: string }> {
    const asset = await this.api.assets.create({
      inputs: [{ url }],
      playback_policies: ['signed'],
    });
    return { assetId: asset.id };
  }

  async createUpload(): Promise<{ id: string; url: string }> {
    const upload = await this.api.uploads.create({
      cors_origin: '*',
      new_asset_settings: { playback_policies: ['signed'] },
    });
    return { id: upload.id, url: upload.url };
  }

  private async resolveAssetFromUpload(
    uploadId: string,
  ): Promise<ResolveAssetResult> {
    const upload = await this.api.uploads.retrieve(uploadId);
    if (!upload.asset_id) return { status: 'waiting' };
    return this.resolveAssetById(upload.asset_id);
  }

  async resolveAsset(input: {
    assetId?: string;
    uploadId?: string;
  }): Promise<ResolveAssetResult> {
    if (input.uploadId) return this.resolveAssetFromUpload(input.uploadId);
    if (!input.assetId) throw new Error('No asset or upload ID provided');
    return this.resolveAssetById(input.assetId);
  }

  private async resolveAssetById(assetId: string): Promise<ResolveAssetResult> {
    const asset = await this.api.assets.retrieve(assetId);
    if (asset.status === 'errored') throw new Error('Asset processing failed');
    if (asset.status === 'ready') {
      const playbackId = asset.playback_ids[0].id;
      const { token, thumbnailToken } = await this.getTokens(playbackId);
      return {
        status: 'ready' as const,
        assetId,
        playbackId,
        token,
        thumbnailToken,
      };
    }
    return { status: asset.status };
  }

  async getTokens(
    playbackId: string,
  ): Promise<{ token: string; thumbnailToken: string }> {
    const token = await this.jwt.signPlaybackId(playbackId, {
      expiration: '7d',
    });
    const thumbnailToken = await this.jwt.signPlaybackId(playbackId, {
      expiration: '7d',
      type: 'thumbnail',
    });
    return { token, thumbnailToken };
  }

  removeVideo(assetId: string): Promise<void> {
    return this.api.assets.delete(assetId);
  }
}
