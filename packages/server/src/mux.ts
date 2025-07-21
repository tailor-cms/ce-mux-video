import { Mux } from '@mux/mux-node';
import { pick } from 'lodash-es';

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

  getPlaybackToken(playbackId: string) {
    return this.jwt.signPlaybackId(playbackId, { expiration: '7d' });
  }
}
