import { Mux } from '@mux/mux-node';
import { pick } from 'lodash-es';

interface MuxServiceConfig {
  muxTokenId: string;
  muxTokenSecret: string;
}

export default class MuxService {
  private static instance: MuxService;

  api: Mux.Video;

  private constructor(private config: MuxServiceConfig) {
    const { video } = new Mux({
      tokenId: this.config.muxTokenId,
      tokenSecret: this.config.muxTokenSecret,
    });
    this.api = video;
  }

  static get(config: MuxServiceConfig) {
    if (!MuxService.instance) MuxService.instance = new MuxService(config);
    return MuxService.instance;
  }

  async createUpload() {
    const upload = await this.api.uploads.create({
      cors_origin: '*',
      new_asset_settings: { playback_policies: ['public'] },
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
}
