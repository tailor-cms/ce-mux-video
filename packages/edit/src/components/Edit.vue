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
      v-else-if="token"
      :playback-id="element.data.playbackId"
      :playback-token="token"
      :thumbnail-token="thumbnailToken"
      style="aspect-ratio: 16/9"
    />
  </div>
</template>

<script lang="ts" setup>
import '@mux/mux-player';
import type { Element, ElementData } from '@tailor-cms/ce-mux-video-manifest';
import { inject, ref, watch } from 'vue';
import manifest from '@tailor-cms/ce-mux-video-manifest';
import type { RpcCaller } from '@tailor-cms/cek-common';

const props = defineProps<{
  element: Element;
  isDragged: boolean;
  isReadonly: boolean;
  isFocused: boolean;
}>();
defineEmits<{ save: [data: ElementData] }>();

const rpc = inject<RpcCaller>('$rpc')!;

const token = ref<string>();
const thumbnailToken = ref<string>();

watch(
  () => props.element.data.playbackId,
  async (playbackId) => {
    token.value = undefined;
    thumbnailToken.value = undefined;
    if (!playbackId) return;
    const result = await rpc<{ token: string; thumbnailToken: string }>(
      'getTokens',
      { playbackId },
    );
    token.value = result.token;
    thumbnailToken.value = result.thumbnailToken;
  },
  { immediate: true },
);
</script>

<style scoped>
.tce-mux-video {
  text-align: left;
}
</style>
