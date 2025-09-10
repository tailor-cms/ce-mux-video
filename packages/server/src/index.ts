import type { HookServices, ServerRuntime } from '@tailor-cms/cek-common';
import { initState, mocks, type } from '@tailor-cms/ce-mux-video-manifest';
import type { Element } from '@tailor-cms/ce-mux-video-manifest';
import type { Model } from 'sequelize/types';

import MuxService from './mux';

// Detect if hooks are running in CEK (used for mocking end-system runtime)
const IS_CEK = process.env.CEK_RUNTIME;
// Don't use in production, use only when IS_CEK=true
const USER_STATE: any = {};

type SequelizeModel<T> = Model<T> & T;

export async function beforeSave(
  element: SequelizeModel<Element>,
  services: HookServices,
) {
  const service = MuxService.get(services.config.tce);
  const assetId = element.data.assetId;
  const playbackId = element.data.playbackId;
  const uploadId = element.data.upload?.id;
  const prevData = element.previous('data') as unknown as string;
  const prevAssetId = prevData ? JSON.parse(prevData)?.assetId : null;
  if (IS_CEK && prevAssetId && !assetId) {
    await service.removeAsset(prevAssetId);
  }
  if (!uploadId) {
    const upload = await service.createUpload();
    element.data = { ...element.data, upload };
  } else if (!playbackId) {
    const { asset_id: assetId, ...upload } = await service.getUpload(uploadId);
    const asset = await service.getAsset(assetId);
    const playbackId = asset.playback_ids[0].id;
    element.data = { ...element.data, upload, playbackId, assetId };
  }
  return element;
}

export function afterSave(element: Element, _services: HookServices) {
  console.log('After save hook');
  return element;
}

export async function afterLoaded(
  element: SequelizeModel<Element>,
  services: HookServices,
  runtime: ServerRuntime,
) {
  const isAuthoringRuntime = runtime === 'authoring';
  const service = MuxService.get(services.config.tce);
  const uploadId = element.data.upload?.id;
  const playbackId = element.data.playbackId;
  if (isAuthoringRuntime && !uploadId) {
    const upload = await service.createUpload();
    element.data = { ...element.data, upload };
  }
  if (playbackId) {
    const token = await service.getToken(playbackId);
    element.data = { ...element.data, token };
  }
  return element;
}

export function afterRetrieve(
  element: SequelizeModel<Element>,
  _services: HookServices,
  _runtime: ServerRuntime,
) {
  console.log('After retrieve hook');
  return element;
}

export function beforeDisplay(_element: Element, context: any) {
  console.log('beforeDisplay hook');
  console.log('beforeDisplay context', context);
  return { ...context, ...USER_STATE };
}

export function onUserInteraction(
  _element: SequelizeModel<Element>,
  context: any,
  payload: any,
): any {
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
}

export const hookMap = new Map(
  Object.entries({
    beforeSave,
    afterSave,
    afterLoaded,
    afterRetrieve,
    onUserInteraction,
    beforeDisplay,
  }),
);

export default {
  type,
  hookMap,
  initState,
  beforeSave,
  afterSave,
  afterLoaded,
  afterRetrieve,
  onUserInteraction,
  beforeDisplay,
  mocks,
};

export { type, initState, mocks };
