import type * as common from '@tailor-cms/cek-common';

export interface ElementData extends common.ElementConfig {
  assets: { transcript?: string; captions?: string };
  upload?: { id: string; url?: string; status: string };
  fileName?: string;
  assetId?: string;
  playbackId?: string;
  token?: string;
  transcript?: string | null;
  captions?: string | null;
}

export type DataInitializer = common.DataInitializer<ElementData>;
export type Element = common.Element<ElementData>;
export type ElementManifest = common.ElementManifest<ElementData>;
