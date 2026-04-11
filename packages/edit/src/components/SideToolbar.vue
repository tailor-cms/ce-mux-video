<template>
  <div>
    <VFileInput
      :append-inner-icon="transcript ? 'mdi-open-in-new' : undefined"
      :model-value="getFileName(element.data.assets.transcript)"
      accept=".doc,.docx,.pdf,.txt"
      label="Transcript"
      prepend-icon="mdi-file-document-outline"
      variant="outlined"
      clearable
      @change="uploadTranscript"
      @click:append-inner.stop="transcript && openInNew(transcript)"
      @click:clear="removeAsset('transcript')"
    />
    <VFileInput
      :append-inner-icon="captions ? 'mdi-open-in-new' : undefined"
      :model-value="getFileName(element.data.assets.captions)"
      accept=".vtt,.srt"
      hint="SRT files will be automatically converted to VTT format"
      label="Captions"
      prepend-icon="mdi-closed-caption-outline"
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
import { computed, inject } from 'vue';
import type { Element, ElementData } from '@tailor-cms/ce-mux-video-manifest';
import type { InputFileEvent } from '@tailor-cms/cek-common';
import { last } from 'lodash-es';
import toWebVTT from 'srt-webvtt';

const props = defineProps<{ element: Element }>();
const emit = defineEmits<{ save: [data: ElementData] }>();

const $storageService = inject('$storageService') as any;

const transcript = computed(() => props.element.data.transcript);
const captions = computed(() => props.element.data.captions);

const getFileName = (url?: string | null): File[] | undefined => {
  if (url) return [new File([], last(url.split('___')) || 'file')];
};

const saveData = (updates: Partial<Element['data']>) => {
  emit('save', { ...props.element.data, ...updates });
};

const uploadTranscript = async (e: InputFileEvent) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const { url } = await $storageService.upload(files);
  const assets = { ...props.element.data.assets, transcript: url };
  saveData({ assets });
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
  const [file] = e.target.files || [];
  if (!file) return;
  const isSRT = file.name.toLowerCase().endsWith('.srt');
  const uploadFile = isSRT ? await convertSrtToVtt(file) : file;
  const { url } = await $storageService.upload([uploadFile]);
  const assets = { ...props.element.data.assets, captions: url };
  saveData({ assets });
};

const removeAsset = (type: 'transcript' | 'captions') => {
  const assets = { ...props.element.data.assets, [type]: undefined };
  saveData({ [type]: null, assets });
};

const openInNew = (url: string) => window.open(url, '_blank');
</script>
