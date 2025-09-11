<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="tce-mux-video-root">
    <mux-player
      v-if="element.data.playbackId"
      ref="video"
      :playback-id="element.data.playbackId"
      :playback-token="element.data.token"
      @seeked="interact"
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
import { onMounted, useTemplateRef } from 'vue';
import type { Element } from '@tailor-cms/ce-mux-video-manifest';
import { throttle } from 'lodash-es';

const PROGRESS_UPDATE_INTERVAL = 5000;

const props = defineProps<{ element: Element; userState: any }>();
const emit = defineEmits(['interaction']);

const video = useTemplateRef<HTMLVideoElement>('video');

const interact = () => {
  const currentTime = video.value!.currentTime;
  emit('interaction', { currentTime });
};
const handleTimeUpdate = throttle(interact, PROGRESS_UPDATE_INTERVAL);

onMounted(() => {
  const currentTime = props.userState?.currentTime;
  if (currentTime && video.value) video.value.currentTime = currentTime;
});
</script>

<style scoped>
.tce-mux-video-root {
}
</style>
