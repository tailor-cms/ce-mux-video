<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="tce-mux-video-root">
    <mux-player
      v-if="element.data.playbackId"
      ref="video"
      :playback-id="element.data.playbackId"
      :playback-token="element.data.token"
      :thumbnail-token="element.data.thumbnailToken"
      style="aspect-ratio: 16/9"
      @seeked="handleSeeked"
      @timeupdate="handleTimeUpdate"
    >
      <track
        v-if="element.data.captions"
        :src="element.data.captions"
        kind="captions"
        label="English"
        srclang="en"
      />
    </mux-player>
    <div v-if="element.data.transcript" class="d-flex justify-end mt-2">
      <VBtn
        :href="element.data.transcript"
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
import { debounce, throttle } from 'lodash-es';
import { onMounted, useTemplateRef } from 'vue';
import type { Element } from '@tailor-cms/ce-mux-video-manifest';

const PROGRESS_UPDATE_INTERVAL = 5000;
const SEEK_DEBOUNCE_INTERVAL = 300;

const props = defineProps<{ element: Element; userState: any }>();
const emit = defineEmits<{ interaction: [data: any] }>();

const video = useTemplateRef<HTMLVideoElement>('video');

const interact = () => {
  const currentTime = video.value!.currentTime;
  const furthestTime = Math.max(
    props.userState?.furthestTime ?? 0,
    currentTime,
  );
  emit('interaction', { currentTime, furthestTime });
};
const handleTimeUpdate = throttle(interact, PROGRESS_UPDATE_INTERVAL);
const handleSeeked = debounce(interact, SEEK_DEBOUNCE_INTERVAL);

onMounted(() => {
  const currentTime = props.userState?.currentTime;
  if (!currentTime || !video.value) return;
  video.value.addEventListener(
    'loadedmetadata',
    () => (video.value!.currentTime = currentTime),
    { once: true },
  );
});
</script>

<style scoped>
.tce-mux-video-root {
}
</style>
