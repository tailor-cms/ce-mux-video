import type {
  BeforeDisplayHook,
  CallHandler,
  ElementHook,
  OnUserInteractionHook,
} from '@tailor-cms/cek-common';
import { initState, type } from '@tailor-cms/ce-mux-video-manifest';
import type { Element } from '@tailor-cms/ce-mux-video-manifest';

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

export const beforeDisplay: BeforeDisplayHook<Element> = (_element, context) => {
  console.log('beforeDisplay hook');
  console.log('beforeDisplay context', context);
  return { ...context, ...USER_STATE };
};

export const onUserInteraction: OnUserInteractionHook<Element> = (
  _element,
  context,
  payload,
) => {
  console.log('onUserInteraction', context, payload);
  // Simulate user state update within CEK
  if (IS_CEK) {
    // Only for showcase purposes
    USER_STATE.interactionTimestamp = new Date().getTime();
    // Can be reset to initial / mocked state via UI
    context.contextTimestamp = USER_STATE.interactionTimestamp;
    Object.assign(USER_STATE, payload);
  }
  // Can have arbitrary return value (interpreted by target system)
  // FE is updated if updateDisplayState is true
  return { updateDisplayState: true };
};

const createUpload: CallHandler<Element> = async (_element, services) => {
  const service = MuxService.get(services.config.tce);
  return service.createUpload();
};

const resolveAsset: CallHandler<Element, { uploadId: string }> = async (
  _element,
  services,
  payload,
) => {
  const service = MuxService.get(services.config.tce);
  const { uploadId } = payload;
  if (!uploadId) throw new Error('No upload to resolve');
  return service.resolveUpload(uploadId);
};

const removeVideo: CallHandler<Element> = async (element, services) => {
  const service = MuxService.get(services.config.tce);
  const { assetId } = element.data;
  if (assetId) await service.removeAsset(assetId);
};

export const hookMap = new Map(
  Object.entries({
    afterLoaded,
    onUserInteraction,
    beforeDisplay,
  }),
);

export const call = { createUpload, resolveAsset, removeVideo };

export default {
  type,
  hookMap,
  initState,
  call,
  afterLoaded,
  onUserInteraction,
  beforeDisplay,
};

export { type, initState };
