import type * as common from '@tailor-cms/cek-common';

export interface ElementData extends common.ElementConfig {
  assets: { transcript?: string; captions?: string };
  fileKey?: string;
  fileName?: string;
  assetId?: string;
  playbackId?: string;
  // CSS aspect-ratio of the source video, e.g. '16/9'
  aspectRatio?: string;
  token?: string;
  thumbnailToken?: string;
  transcript?: string | null;
  captions?: string | null;
}

export type DataInitializer = common.DataInitializer<ElementData>;
export type Element = common.Element<ElementData>;
export type ElementManifest = common.ElementManifest<ElementData>;
