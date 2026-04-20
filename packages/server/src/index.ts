import type {
  BeforeDisplayHook,
  ElementHook,
  HookMap,
  OnUserInteractionHook,
  ProcedureHandler,
  ServerModule,
} from '@tailor-cms/cek-common';
import { initState, mocks, type } from '@tailor-cms/ce-mux-video-manifest';
import type { Element } from '@tailor-cms/ce-mux-video-manifest';

import { getVideoService } from './video-service';

// Detect if hooks are running in CEK (used for mocking end-system runtime)
const IS_CEK = process.env.CEK_RUNTIME;
// Don't use in production, use only when IS_CEK=true
const USER_STATE: any = {};

export const afterLoaded: ElementHook<Element> = async (element, services) => {
  const { playbackId } = element.data;
  if (!playbackId) return element;
  const service = getVideoService(services.config.tce);
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
  return { updateDisplayState: true };
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
    const service = getVideoService(services.config.tce);
    const storageUrl = await services.storage.getFileUrl(fileKey);
    return service.prepareVideo(storageUrl);
  },
  resolveAsset: async (services, payload) => {
    const service = getVideoService(services.config.tce);
    return service.resolveAsset(payload);
  },
  removeVideo: async (services, payload) => {
    const { assetId } = payload;
    if (!assetId) throw new Error('No asset ID provided');
    await getVideoService(services.config.tce).removeVideo(assetId);
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
  mocks,
};

export default serverModule;

export { type, initState, mocks };
