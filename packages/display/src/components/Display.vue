<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="tce-mux-video-root">
    <mux-player
      v-if="element.data.playbackId"
      :playback-id="element.data.playbackId"
      :playback-token="element.data.token"
      :thumbnail-token="element.data.token"
    />
  </div>
</template>

<script setup lang="ts">
import '@mux/mux-player';
import { Element } from '@tailor-cms/ce-mux-video-manifest';

defineProps<{ element: Element; userState: any }>();
defineEmits(['interaction']);
</script>

<style scoped>
.tce-mux-video-root {
}
</style>
