import { object, string } from 'yup';
import { Mux } from '@mux/mux-node';

const schema = object({
  muxTokenId: string().required(),
  muxTokenSecret: string().required(),
  muxJwtSigningKey: string().required(),
  muxJwtPrivateKey: string().required(),
});

interface MuxServiceConfig {
  muxTokenId: string;
  muxTokenSecret: string;
  muxJwtSigningKey: string;
  muxJwtPrivateKey: string;
}

export default class MuxService {
  private static instance: MuxService;

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

  static get(config: MuxServiceConfig): MuxService {
    if (!MuxService.instance) MuxService.instance = new MuxService(config);
    return MuxService.instance;
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

  async resolveUpload(
    uploadId: string,
  ): Promise<
    | { status: 'ready'; assetId: string; playbackId: string }
    | { status: string }
  > {
    const upload = await this.api.uploads.retrieve(uploadId);
    if (!upload.asset_id) return { status: 'waiting' };
    return this.resolveAsset(upload.asset_id);
  }

  async resolveAsset(
    assetId: string,
  ): Promise<
    | { status: 'ready'; assetId: string; playbackId: string }
    | { status: string }
  > {
    const asset = await this.api.assets.retrieve(assetId);
    if (asset.status === 'errored') throw new Error('Asset processing failed');
    if (asset.status === 'ready') {
      const playbackId = asset.playback_ids[0].id;
      return { status: 'ready' as const, assetId, playbackId };
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

  removeAsset(assetId: string): Promise<void> {
    return this.api.assets.delete(assetId);
  }
}
