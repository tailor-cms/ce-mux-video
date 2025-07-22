<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="tce-mux-video">
    <ElementPlaceholder
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
      :thumbnail-token="element.data.token"
    />
  </div>
</template>

<script lang="ts" setup>
import '@mux/mux-player';
import { defineEmits, defineProps } from 'vue';
import manifest, { Element } from '@tailor-cms/ce-mux-video-manifest';
import { ElementPlaceholder } from '@tailor-cms/core-components';

defineEmits(['save']);
defineProps<{
  element: Element;
  isDragged: boolean;
  isReadonly: boolean;
  isFocused: boolean;
}>();
</script>

<style scoped>
.tce-video {
  text-align: left;
}
</style>
