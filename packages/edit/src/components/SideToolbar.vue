<template>
  <div>
    <VFileInput
      :accept="TRANSCRIPT_EXTENSIONS.join(',')"
      :append-inner-icon="transcript ? 'mdi-open-in-new' : undefined"
      :error-messages="transcriptError"
      :model-value="getFileName(element.data.assets.transcript)"
      class="mb-2"
      label="Transcript"
      prepend-icon=""
      prepend-inner-icon="mdi-file-document-outline"
      variant="outlined"
      clearable
      @change="uploadTranscript"
      @click:append-inner.stop="transcript && openInNew(transcript)"
      @click:clear="removeAsset('transcript')"
    />
    <VFileInput
      :accept="CAPTION_EXTENSIONS.join(',')"
      :append-inner-icon="captions ? 'mdi-open-in-new' : undefined"
      :error-messages="captionsError"
      :loading="captionsBusy"
      :model-value="getFileName(element.data.assets.captions)"
      hint="SRT files will be automatically converted to VTT format"
      label="Captions"
      prepend-icon=""
      prepend-inner-icon="mdi-closed-caption-outline"
      variant="outlined"
      clearable
      persistent-hint
      @change="uploadCaptions"
      @click:append-inner.stop="captions && openInNew(captions)"
      @click:clear="removeAsset('captions')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import type { Element, ElementData } from '@tailor-cms/ce-mux-video-manifest';
import type { InputFileEvent } from '@tailor-cms/cek-common';
import toWebVTT from 'srt-webvtt';

const TRANSCRIPT_EXTENSIONS = ['.doc', '.docx', '.pdf', '.txt'];
const CAPTION_EXTENSIONS = ['.vtt', '.srt'];

const extensionList = new Intl.ListFormat('en', { type: 'disjunction' });
const invalidFileMessage = (label: string, extensions: string[]): string =>
  `${label} must be a ${extensionList.format(extensions)} file`;

const props = defineProps<{ element: Element }>();
const emit = defineEmits<{ save: [data: ElementData] }>();

const $storageService = inject('$storageService') as any;

const transcript = computed(() => props.element.data.transcript);
const captions = computed(() => props.element.data.captions);

const transcriptError = ref('');
const captionsError = ref('');
const captionsBusy = ref(false);

const getFileName = (url?: string | null): File[] | undefined => {
  if (url) return [new File([], url.split('___').pop() || 'file')];
};

const hasAllowedExtension = (file: File, extensions: string[]): boolean => {
  const name = file.name.toLowerCase();
  return extensions.some((ext) => name.endsWith(ext));
};

const saveData = (updates: Partial<Element['data']>) => {
  emit('save', { ...props.element.data, ...updates });
};

const uploadTranscript = async (e: InputFileEvent) => {
  const [file] = Array.from(e.target.files || []);
  if (!file) return;
  if (!hasAllowedExtension(file, TRANSCRIPT_EXTENSIONS)) {
    transcriptError.value = invalidFileMessage(
      'Transcript',
      TRANSCRIPT_EXTENSIONS,
    );
    return;
  }
  transcriptError.value = '';
  try {
    const { url } = await $storageService.upload(file);
    const assets = { ...props.element.data.assets, transcript: url };
    saveData({ assets });
  } catch {
    transcriptError.value = 'Could not upload transcript';
  }
};

const convertSrtToVtt = async (srtFile: File): Promise<File> => {
  const vttBlobUrl = await toWebVTT(srtFile);
  const response = await fetch(vttBlobUrl);
  const vttContent = await response.text();
  const vttFileName = srtFile.name.replace(/\.srt$/i, '.vtt');
  URL.revokeObjectURL(vttBlobUrl);
  return new File([vttContent], vttFileName, { type: 'text/vtt' });
};

const uploadCaptions = async (e: InputFileEvent) => {
  const [file] = Array.from(e.target.files || []);
  if (!file) return;
  if (!hasAllowedExtension(file, CAPTION_EXTENSIONS)) {
    captionsError.value = invalidFileMessage('Captions', CAPTION_EXTENSIONS);
    return;
  }
  captionsError.value = '';
  captionsBusy.value = true;
  try {
    const isSRT = file.name.toLowerCase().endsWith('.srt');
    const uploadFile = isSRT ? await convertSrtToVtt(file) : file;
    const { url } = await $storageService.upload(uploadFile);
    const assets = { ...props.element.data.assets, captions: url };
    saveData({ assets });
  } catch {
    captionsError.value = 'Could not process the caption file';
  } finally {
    captionsBusy.value = false;
  }
};

const removeAsset = (type: 'transcript' | 'captions') => {
  if (type === 'transcript') transcriptError.value = '';
  if (type === 'captions') captionsError.value = '';
  const assets = { ...props.element.data.assets, [type]: undefined };
  saveData({ [type]: null, assets });
};

const openInNew = (url: string) => window.open(url, '_blank');
</script>
