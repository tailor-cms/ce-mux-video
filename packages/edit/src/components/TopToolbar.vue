<template>
  <div class="d-flex align-center justify-center ga-2">
    <template v-if="error">
      <span class="text-error text-label-medium text-uppercase">
        {{ error }}
      </span>
      <VBtn text="Dismiss" variant="tonal" @click="cancelUpload" />
    </template>
    <template v-else-if="processing">
      <div class="text-label-medium text-uppercase">
        <span>Processing video...</span>
        <VProgressLinear color="secondary" height="15" indeterminate rounded />
      </div>
    </template>
    <template v-else-if="uploading">
      <div class="text-label-medium text-uppercase">
        <div class="d-flex align-center justify-space-between">
          <span>Uploading video...</span>
          <span>{{ Math.ceil(progress) }}%</span>
        </div>
        <VProgressLinear
          :model-value="progress"
          class="flex-shrink-0"
          color="primary"
          height="15"
          rounded
          striped
        />
      </div>
      <VBtn text="Cancel" variant="tonal" @click="cancelUpload" />
    </template>
    <TailorFileInput
      v-else
      :allowed-extensions="EXTENSIONS"
      :file-key="element.data.fileKey"
      label="Video"
      @input="onVideoFile"
      @upload="onVideoFile"
    />
  </div>
</template>

<script setup lang="ts">
import type { Element, ElementData } from '@tailor-cms/ce-mux-video-manifest';
import { inject, ref } from 'vue';
import type { RpcCaller } from '@tailor-cms/cek-common';
import { UpChunk } from '@mux/upchunk';

const POLL_INTERVAL = 5_000;
const MAX_POLL_ATTEMPTS = 60;
const EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv'];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type PrepareResult =
  | { mode: 'ingest'; assetId: string }
  | { mode: 'upload'; uploadId: string; uploadUrl: string };

const props = defineProps<{ element: Element }>();
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
    processing.value = true;
    const { assetId, playbackId } = await waitForAsset(pollParams);
    emit('save', {
      ...props.element.data,
      fileKey: value.key,
      fileName: value.name || value.key.split('/').pop(),
      assetId,
      playbackId,
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
  await rpc('removeVideo', { assetId });
  emit('save', {
    ...props.element.data,
    fileKey: undefined,
    token: undefined,
    thumbnailToken: undefined,
    fileName: undefined,
    playbackId: undefined,
    assetId: undefined,
  });
};
</script>

<style lang="scss" scoped>
.v-progress-linear {
  width: 15.625rem;
}
</style>
