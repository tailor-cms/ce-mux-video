<template>
  <div class="d-flex align-center justify-center">
    <VToolbarItems class="ga-2">
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
        <VBtn
          v-if="fileInput"
          :loading="loading"
          color="grey-darken-4"
          @click="fileInput.click()"
        >
          <VIcon color="secondary" icon="mdi-cloud-upload-outline" start />
          Upload video
          <template #loader>
            <VProgressLinear
              :model-value="progress"
              color="primary-lighten-3"
              height="20"
              stripped
            >
              <template #default>
                <span class="text-caption">{{ Math.ceil(progress) }}%</span>
              </template>
            </VProgressLinear>
          </template>
        </VBtn>
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

const fileName = computed(() => props.element.data.fileName ?? '');

const uploadVideo = (file: File) => {
  const endpoint = props.element.data.upload?.url ?? '';
  loading.value = true;
  const upload = UpChunk.createUpload({
    endpoint,
    file,
    chunkSize: 5120,
  });
  upload.on('progress', ({ detail }) => {
    progress.value = detail;
  });
  upload.on('success', () => {
    emit('save', { ...props.element.data, fileName: file.name });
    loading.value = false;
  });
};

const validateAndUpload = async (target: HTMLInputElement) => {
  const files = Array.from(target.files ?? []);
  const regex = new RegExp('.(' + extensions.value.join('|') + ')$', 'i');
  const isValid = files.every((file: File) => regex.test(file.name));
  if (isValid) return uploadVideo(files[0]);
};

const remove = () => {
  emit('save', {
    ...props.element.data,
    token: undefined,
    fileName: undefined,
    playbackId: undefined,
    upload: undefined,
  });
};
</script>

<style scoped>
.v-toolbar-items {
  height: 3.5rem;
}
</style>
