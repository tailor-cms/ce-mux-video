<template>
  <div class="d-flex align-center justify-center">
    <VToolbarItems class="ga-2 align-center justify-center">
      <template v-if="fileName">
        <VBtn color="red" icon="mdi-delete" @click="remove" />
        <VTextField
          :model-value="fileName"
          hide-details="auto"
          min-width="350"
          variant="outlined"
          disabled
        />
      </template>
      <template v-else>
        <input
          :id="uniqueId('file_')"
          ref="fileInput"
          :accept="extensions.join(', ')"
          class="d-none"
          type="file"
          @change="validateAndUpload($event.target as HTMLInputElement)"
        />
        <template v-if="fileInput">
          <VBtn
            v-if="!loading && !processing"
            color="grey-darken-4"
            @click="fileInput.click()"
          >
            <VIcon color="secondary" icon="mdi-cloud-upload-outline" start />
            Upload video
          </VBtn>
          <template v-else-if="error">
            <span class="text-error text-overline">{{ error }}</span>
            <VBtn color="red" @click="cancelUpload">Dismiss</VBtn>
          </template>
          <template v-else-if="processing">
            <div class="text-overline">
              <span>Processing video...</span>
              <VProgressLinear
                color="secondary"
                height="15"
                indeterminate
                rounded
              />
            </div>
          </template>
          <template v-else>
            <div class="text-overline">
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
            <VBtn color="red" @click="cancelUpload">Cancel</VBtn>
          </template>
        </template>
      </template>
    </VToolbarItems>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, useTemplateRef } from 'vue';
import type { CallElementAction } from '@tailor-cms/cek-common';
import type { Element } from 'tce-mux-manifest';
import { uniqueId } from 'lodash-es';
import { UpChunk } from '@mux/upchunk';

const POLL_INTERVAL = 5_000;
const MAX_POLL_ATTEMPTS = 60;
const extensions = ['.mp4', '.mov', '.avi', '.mkv'];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const props = defineProps<{ element: Element }>();
const emit = defineEmits(['save']);

const callElementAction = inject('$callElementAction') as CallElementAction;

const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const progress = ref(0);
const loading = ref(false);
const processing = ref(false);
const error = ref('');
const upload = ref<UpChunk | null>(null);

const fileName = computed(() => props.element.data.fileName ?? '');

const waitForAsset = async (uploadId: string) => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const result = await callElementAction<{
      status: string;
      assetId?: string;
      playbackId?: string;
    }>('resolveAsset', { uploadId });
    if (result.status === 'ready') return result;
    await delay(POLL_INTERVAL);
  }
  throw new Error('Video processing timed out');
};

const uploadVideo = async (file: File) => {
  loading.value = true;
  const { id: uploadId, url } = await callElementAction<{
    id: string;
    url: string;
    status: string;
  }>('createUpload');
  upload.value = UpChunk.createUpload({ endpoint: url, file, chunkSize: 5120 });
  upload.value.on('progress', ({ detail }: any) => {
    progress.value = detail;
  });
  upload.value.on('error', ({ detail }: any) => {
    cancelUpload();
    error.value = detail?.message || 'Upload failed';
  });
  upload.value.on('success', async () => {
    loading.value = false;
    progress.value = 0;
    processing.value = true;
    error.value = '';
    try {
      const { assetId, playbackId } = await waitForAsset(uploadId);
      emit('save', {
        ...props.element.data,
        fileName: file.name,
        assetId,
        playbackId,
      });
    } catch (e: any) {
      error.value = e.message || 'Video processing failed';
    } finally {
      processing.value = false;
    }
  });
};

const validateAndUpload = async (target: HTMLInputElement) => {
  const files = Array.from(target.files ?? []);
  const regex = new RegExp('.(' + extensions.join('|') + ')$', 'i');
  const isValid = files.every((file: File) => regex.test(file.name));
  if (isValid) return uploadVideo(files[0]);
};

const cancelUpload = () => {
  upload.value?.abort();
  upload.value = null;
  progress.value = 0;
  processing.value = false;
  error.value = '';
  if (fileInput.value) fileInput.value.value = '';
  loading.value = false;
};

const remove = async () => {
  await callElementAction('removeVideo');
  emit('save', {
    ...props.element.data,
    token: undefined,
    thumbnailToken: undefined,
    fileName: undefined,
    playbackId: undefined,
    assetId: undefined,
  });
};
</script>

<style lang="scss" scoped>
.v-toolbar-items {
  height: 3.5rem;

  .v-progress-linear {
    width: 250px;
  }
}
</style>
