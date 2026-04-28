<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="tce-mux-video">
    <TailorElementPlaceholder
      v-if="!element.data.playbackId"
      :icon="manifest.ui.icon"
      :is-disabled="isReadonly"
      :is-focused="isFocused"
      :name="`${manifest.name} component`"
      active-icon="mdi-arrow-up"
      active-placeholder="Use toolbar to upload the video"
    />
    <mux-player
      v-else
      :playback-id="element.data.playbackId"
      :playback-token="element.data.token"
      :thumbnail-token="element.data.thumbnailToken"
      style="aspect-ratio: 16/9"
    />
  </div>
</template>

<script lang="ts" setup>
import '@mux/mux-player';
import type { Element, ElementData } from '@tailor-cms/ce-mux-video-manifest';
import manifest from '@tailor-cms/ce-mux-video-manifest';

defineEmits<{ save: [data: ElementData] }>();
defineProps<{
  element: Element;
  isDragged: boolean;
  isReadonly: boolean;
  isFocused: boolean;
}>();
</script>

<style scoped>
.tce-mux-video {
  text-align: left;
}
</style>
