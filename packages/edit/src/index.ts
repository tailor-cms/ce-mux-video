import baseManifest from '@tailor-cms/ce-mux-video-manifest';
import type { ElementManifest } from '@tailor-cms/ce-mux-video-manifest';

import Edit from './components/Edit.vue';
import TopToolbar from './components/TopToolbar.vue';
import SideToolbar from './components/SideToolbar.vue';

const manifest: ElementManifest = {
  ...baseManifest,
  Edit,
  TopToolbar,
  SideToolbar,
};

export default manifest;
export { Edit, TopToolbar, SideToolbar };
