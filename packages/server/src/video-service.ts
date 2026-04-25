import MuxVideoService, { type MuxServiceConfig } from './mux';
import MockVideoService from './mock-video-service';

export type PrepareVideoResult =
  | { mode: 'ingest'; assetId: string }
  | { mode: 'upload'; uploadId: string; uploadUrl: string };

export type ResolveAssetResult =
  | { status: 'ready'; assetId: string; playbackId: string }
  | { status: string };

export interface VideoService {
  prepareVideo(storageUrl: string): Promise<PrepareVideoResult>;
  resolveAsset(input: {
    assetId?: string;
    uploadId?: string;
  }): Promise<ResolveAssetResult>;
  getTokens(playbackId: string): Promise<{
    token: string;
    thumbnailToken: string;
  }>;
  removeVideo(assetId: string): Promise<void>;
}

const mockVideoService = new MockVideoService();

const hasMuxConfig = (
  config?: Partial<MuxServiceConfig>,
): config is MuxServiceConfig =>
  !!config?.muxTokenId &&
  !!config?.muxTokenSecret &&
  !!config?.muxJwtSigningKey &&
  !!config?.muxJwtPrivateKey;

export const getVideoService = (
  config?: Partial<MuxServiceConfig>,
): VideoService => {
  if (hasMuxConfig(config)) return MuxVideoService.get(config);
  if (process.env.CEK_RUNTIME) return mockVideoService;
  throw new Error(`Mux config missing, set:
    - TCE_MUX_TOKEN_ID,
    - TCE_MUX_TOKEN_SECRET,
    - TCE_MUX_JWT_SIGNING_KEY,
    - TCE_MUX_JWT_PRIVATE_KEY
  `);
};
