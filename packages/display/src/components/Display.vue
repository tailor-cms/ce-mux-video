<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="tce-mux-video-root">
    <mux-player
      v-if="element.data.playbackId"
      :playback-id="element.data.playbackId"
    />
    <VCard
      v-else
      class="pa-12 text-center bg-grey-lighten-5"
      variant="flat"
      border
    >
      <VAvatar color="primary-darken-1" size="60">
        <VIcon :icon="manifest.ui.icon" size="30" />
      </VAvatar>
      <VCardTitle class="text-h5 pb-0">{{ manifest.name }} element</VCardTitle>
      <VCardSubtitle class="text-subtitle-1">Work in progress</VCardSubtitle>
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
</style>
