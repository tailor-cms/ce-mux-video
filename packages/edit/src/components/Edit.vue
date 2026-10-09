<!-- eslint-disable vue/no-undef-components -->
<template>
  <div class="tce-mux-video text-left">
    <TailorElementPlaceholder
      v-if="!element.data.playbackId && isReadonly"
      :icon="manifest.ui.icon"
      :name="`${manifest.name} component`"
      is-readonly
    />
    <StatusPanel
      v-else-if="error"
      :message="error"
      color="error"
      icon="mdi-alert-circle-outline"
      title="Video processing failed"
    >
      <VBtn class="mt-5" text="Dismiss" variant="tonal" @click="cancelUpload" />
    </StatusPanel>
    <StatusPanel
      v-else-if="uploading"
      :message="`${Math.ceil(progress)}%`"
      icon="mdi-cloud-upload-outline"
      title="Uploading video"
    >
      <VProgressLinear
        :model-value="progress"
        class="mt-4"
        color="primary"
        height="6"
        rounded
      />
      <VBtn class="mt-5" text="Cancel" variant="tonal" @click="cancelUpload" />
    </StatusPanel>
    <StatusPanel
      v-else-if="processing"
      icon="mdi-progress-clock"
      message="Preparing the stream. This can take a few minutes."
      title="Processing video"
    >
      <VProgressLinear
        class="mt-4"
        color="primary"
        height="6"
        indeterminate
        rounded
      />
    </StatusPanel>
    <TailorFileInput
      v-else
      :allowed-extensions="EXTENSIONS"
      :file-key="element.data.fileKey"
      :readonly="isReadonly"
      :show-actions="isFocused"
      mode="dropzone"
      @input="onVideoFile"
      @upload="onVideoFile"
    >
      <mux-player
        :playback-id="element.data.playbackId"
        :playback-token="element.data.token"
        :style="{ aspectRatio: element.data.aspectRatio }"
        :thumbnail-token="element.data.thumbnailToken"
        class="d-block w-100"
      />
    </TailorFileInput>
  </div>
</template>

<script lang="ts" setup>
import '@mux/mux-player';
import type { Element, ElementData } from '@tailor-cms/ce-mux-video-manifest';
import { inject, ref } from 'vue';
import manifest from '@tailor-cms/ce-mux-video-manifest';
import type { RpcCaller } from '@tailor-cms/cek-common';
import { UpChunk } from '@mux/upchunk';

import StatusPanel from './StatusPanel.vue';

const POLL_INTERVAL = 5_000;
const MAX_POLL_ATTEMPTS = 60;
const EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv'];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type PrepareResult =
  | { mode: 'ingest'; assetId: string }
  | { mode: 'upload'; uploadId: string; uploadUrl: string };

const props = defineProps<{
  element: Element;
  isDragged: boolean;
  isReadonly: boolean;
  isFocused: boolean;
}>();
const emit = defineEmits<{ save: [data: ElementData] }>();

const rpc = inject('$rpc') as RpcCaller;

const uploading = ref(false);
const processing = ref(false);
const progress = ref(0);
const error = ref('');
const activeUpload = ref<UpChunk | null>(null);

const cancelUpload = () => {
  activeUpload.value?.abort();
  activeUpload.value = null;
  uploading.value = false;
  processing.value = false;
  progress.value = 0;
  error.value = '';
};

const waitForAsset = async (params: {
  assetId?: string;
  uploadId?: string;
}) => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const result = await rpc<{
      status: string;
      assetId?: string;
      playbackId?: string;
      aspectRatio?: string;
    }>('resolveAsset', params);
    if (result.status === 'ready') return result;
    await delay(POLL_INTERVAL);
  }
  throw new Error('Video processing timed out');
};

const chunkedUpload = (url: string, file: File): Promise<void> => {
  uploading.value = true;
  return new Promise((resolve, reject) => {
    const upload = UpChunk.createUpload({
      endpoint: url,
      file,
      chunkSize: 5120,
    });
    activeUpload.value = upload;
    upload.on('progress', ({ detail }: any) => {
      progress.value = detail;
    });
    upload.on('error', ({ detail }: any) => {
      cancelUpload();
      reject(new Error(detail?.message || 'Upload failed'));
    });
    upload.on('success', () => {
      activeUpload.value = null;
      uploading.value = false;
      resolve();
    });
  });
};

const onVideoFile = async (value: Record<string, any> | null) => {
  if (!value) return remove();
  if (!value.key) return;
  error.value = '';
  // Covers the prepare step and the readiness poll; the chunked upload
  // takes over the panel while it runs.
  processing.value = true;
  try {
    const result = await rpc<PrepareResult>('prepareVideo', {
      fileKey: value.key,
    });
    let pollParams: { assetId?: string; uploadId?: string };
    if (result.mode === 'ingest') {
      pollParams = { assetId: result.assetId };
    } else {
      const blob = await fetch(value.publicUrl).then((r) => r.blob());
      const file = new File([blob], value.name || 'video');
      await chunkedUpload(result.uploadUrl, file);
      pollParams = { uploadId: result.uploadId };
    }
    const { assetId, playbackId, aspectRatio } =
      await waitForAsset(pollParams);
    emit('save', {
      ...props.element.data,
      fileKey: value.key,
      fileName: value.name || value.key.split('/').pop(),
      assetId,
      playbackId,
      aspectRatio,
    });
  } catch (e: any) {
    error.value = e.message || 'Video processing failed';
  } finally {
    uploading.value = false;
    processing.value = false;
    progress.value = 0;
  }
};

const remove = async () => {
  const { assetId } = props.element.data;
  try {
    if (assetId) await rpc('removeVideo', { assetId });
  } finally {
    emit('save', {
      ...props.element.data,
      fileKey: undefined,
      token: undefined,
      thumbnailToken: undefined,
      fileName: undefined,
      playbackId: undefined,
      aspectRatio: undefined,
      assetId: undefined,
    });
  }
};
</script>
