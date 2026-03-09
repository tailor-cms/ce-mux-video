import { object, string } from 'yup';
import { Mux } from '@mux/mux-node';
import { pick } from 'lodash-es';

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

  static get(config: MuxServiceConfig) {
    if (!MuxService.instance) MuxService.instance = new MuxService(config);
    return MuxService.instance;
  }

  async createUpload() {
    const upload = await this.api.uploads.create({
      cors_origin: '*',
      new_asset_settings: { playback_policies: ['signed'] },
    });
    return pick(upload, ['id', 'url', 'status']);
  }

  async getUpload(uploadId: string) {
    const upload = await this.api.uploads.retrieve(uploadId);
    return pick(upload, ['id', 'status', 'asset_id']);
  }

  getAsset(assetId: string) {
    return this.api.assets.retrieve(assetId);
  }

  async resolveUpload(uploadId: string) {
    const { asset_id: assetId } = await this.getUpload(uploadId);
    if (!assetId) return { status: 'waiting' as const };
    const asset = await this.getAsset(assetId);
    if (asset.status === 'errored') throw new Error('Asset processing failed');
    if (asset.status === 'ready') {
      const playbackId = asset.playback_ids[0].id;
      return { status: 'ready' as const, assetId, playbackId };
    }
    return { status: asset.status };
  }

  async getTokens(playbackId: string) {
    const token = await this.jwt.signPlaybackId(playbackId, {
      expiration: '7d',
    });
    const thumbnailToken = await this.jwt.signPlaybackId(playbackId, {
      expiration: '7d',
      type: 'thumbnail',
    });
    return { token, thumbnailToken };
  }

  removeAsset(assetId: string) {
    return this.api.assets.delete(assetId);
  }
}
