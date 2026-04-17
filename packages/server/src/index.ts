import type {
  BeforeDisplayHook,
  ElementHook,
  HookMap,
  OnUserInteractionHook,
  ProcedureHandler,
  ServerModule,
} from '@tailor-cms/cek-common';
import { initState, type } from '@tailor-cms/ce-mux-video-manifest';
import type { Element } from '@tailor-cms/ce-mux-video-manifest';
import isLocalhost from 'is-localhost-ip';

import MuxService from './mux';

// Detect if hooks are running in CEK (used for mocking end-system runtime)
const IS_CEK = process.env.CEK_RUNTIME;
// Don't use in production, use only when IS_CEK=true
const USER_STATE: any = {};

export const afterLoaded: ElementHook<Element> = async (element, services) => {
  const { playbackId } = element.data;
  if (!playbackId) return element;
  const service = MuxService.get(services.config.tce);
  const { token, thumbnailToken } = await service.getTokens(playbackId);
  element.data = { ...element.data, token, thumbnailToken };
  return element;
};

export const beforeDisplay: BeforeDisplayHook<Element> = (
  _element,
  context,
) => {
  console.log('beforeDisplay hook');
  console.log('beforeDisplay context', context);
  return { ...context, ...USER_STATE };
};

export const onUserInteraction: OnUserInteractionHook<Element> = (
  _element,
  _context,
  payload,
) => {
  const { currentTime } = payload;
  if (IS_CEK) USER_STATE.currentTime = currentTime;
  return { currentTime };
};

export const hookMap: HookMap<Element> = new Map(
  Object.entries({
    afterLoaded,
    onUserInteraction,
    beforeDisplay,
  }),
);

export const procedures: Record<string, ProcedureHandler> = {
  prepareVideo: async (services, { fileKey }) => {
    if (!fileKey) throw new Error('No file key provided');
    const service = MuxService.get(services.config.tce);
    const storageUrl = await services.storage.getFileUrl(fileKey);
    const directUpload = await isLocalhost(new URL(storageUrl).hostname);
    if (directUpload) {
      const { id, url } = await service.createUpload();
      return { mode: 'upload' as const, uploadId: id, uploadUrl: url };
    }
    const { assetId } = await service.ingestFromUrl(storageUrl);
    return { mode: 'ingest' as const, assetId };
  },
  resolveAsset: async (services, payload) => {
    const { assetId, uploadId } = payload;
    const service = MuxService.get(services.config.tce);
    if (uploadId) return service.resolveUpload(uploadId);
    if (!assetId) throw new Error('No asset or upload ID provided');
    return service.resolveAsset(assetId);
  },
  removeVideo: async (services, payload) => {
    const service = MuxService.get(services.config.tce);
    const { assetId } = payload;
    if (!assetId) throw new Error('No asset ID provided');
    await service.removeAsset(assetId);
  },
};

const serverModule: ServerModule<Element> = {
  type,
  initState,
  hookMap,
  procedures,
  afterLoaded,
  onUserInteraction,
  beforeDisplay,
};

export default serverModule;

export { type, initState };
