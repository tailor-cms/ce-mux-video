<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="tce-mux-video-root">
    <mux-player
      v-if="element.data.playbackId"
      :playback-id="element.data.playbackId"
      :playback-token="element.data.token"
      :thumbnail-token="element.data.token"
    >
      <track
        v-if="element.data.captions"
        :src="element.data.captions"
        kind="captions"
        label="English"
        srclang="en"
      />
    </mux-player>
    <div v-if="element.data.captions" class="d-flex justify-end mt-2">
      <VBtn
        :href="element.data.captions"
        color="primary"
        prepend-icon="mdi-text"
        size="small"
        target="_blank"
        variant="tonal"
      >
        Transcript
      </VBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@mux/mux-player';
import type { Element } from '@tailor-cms/ce-mux-video-manifest';

defineProps<{ element: Element; userState: any }>();
defineEmits(['interaction']);
</script>

<style scoped>
.tce-mux-video-root {
}
</style>
