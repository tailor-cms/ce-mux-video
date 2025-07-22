<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="tce-mux-video-root">
    <mux-player
      v-if="element.data.playbackId"
      :playback-id="element.data.playbackId"
      :playback-token="element.data.token"
      :thumbnail-token="element.data.token"
    />
    <VCard
      v-else
      class="article-card d-flex flex-column align-center justify-center"
      color="primary-darken-1"
      height="250"
      variant="tonal"
    >
      <VIcon :icon="manifest.ui.icon" size="500" />
      <VCardTitle class="text-h5 pb-0">{{ manifest.name }} element</VCardTitle>
      <VCardSubtitle class="text-overline">Work in progress</VCardSubtitle>
    </VCard>
  </div>
</template>

<script setup lang="ts">
import '@mux/mux-player';
import manifest, { Element } from '@tailor-cms/ce-mux-video-manifest';

defineProps<{ element: Element; userState: any }>();
defineEmits(['interaction']);
</script>

<style scoped>
.tce-mux-video-root {
}

.v-card {
  border: 1px dashed color-mix(in srgb, currentColor 36%, transparent);

  .v-icon {
    position: absolute;
    opacity: 0.08;
    left: calc(50% - 15.625rem);
    top: calc(50% - 15.625rem);
    z-index: -1;
    transform: rotate(-15deg);
  }
}
</style>
