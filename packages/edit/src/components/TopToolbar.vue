<template>
  <div class="d-flex align-center justify-center">
    <VToolbarItems class="ga-2 align-center justify-center">
      <template v-if="fileName">
        <VBtn color="red" icon="mdi-delete" @click="remove" />
        <VTextField
          v-if="fileName"
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
          :key="fileName"
          ref="fileInput"
          :accept="extensions.join(', ')"
          class="d-none"
          type="file"
          @change="validateAndUpload($event.target as HTMLInputElement)"
        />
        <template v-if="fileInput">
          <VBtn
            v-if="!loading"
            color="grey-darken-4"
            @click="fileInput.click()"
          >
            <VIcon color="secondary" icon="mdi-cloud-upload-outline" start />
            Upload video
          </VBtn>
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
import { computed, defineEmits, defineProps, ref } from 'vue';
import type { Element } from '@tailor-cms/ce-mux-video-manifest';
import { uniqueId } from 'lodash-es';
import { UpChunk } from '@mux/upchunk';

const props = defineProps<{ element: Element }>();
const emit = defineEmits(['save']);

const extensions = ref(['.mp4', '.mov', '.avi', '.mkv']);
const progress = ref(0);
const fileInput = ref<HTMLInputElement>();
const loading = ref(false);
const upload = ref<UpChunk | null>(null);

const fileName = computed(() => props.element.data.fileName ?? '');

const uploadVideo = (file: File) => {
  const endpoint = props.element.data.upload?.url ?? '';
  loading.value = true;
  upload.value = UpChunk.createUpload({ endpoint, file, chunkSize: 5120 });
  upload.value.on('progress', ({ detail }) => {
    progress.value = detail;
  });
  upload.value.on('success', () => {
    emit('save', { ...props.element.data, fileName: file.name });
    loading.value = false;
    progress.value = 0;
  });
};

const validateAndUpload = async (target: HTMLInputElement) => {
  const files = Array.from(target.files ?? []);
  const regex = new RegExp('.(' + extensions.value.join('|') + ')$', 'i');
  const isValid = files.every((file: File) => regex.test(file.name));
  if (isValid) return uploadVideo(files[0]);
};

const cancelUpload = () => {
  upload.value?.abort();
  upload.value = null;
  progress.value = 0;
  if (fileInput.value) fileInput.value.value = '';
  loading.value = false;
  remove();
};

const remove = () => {
  emit('save', {
    ...props.element.data,
    token: undefined,
    fileName: undefined,
    playbackId: undefined,
    assetId: undefined,
    upload: undefined,
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
