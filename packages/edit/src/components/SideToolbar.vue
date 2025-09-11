<template>
  <div class="side-toolbar">
    <VFileInput
      :model-value="getFileName(element.data.transcript)"
      accept=".doc,.docx,.pdf,.txt"
      label="Transcript"
      prepend-icon="mdi-file-document-outline"
      variant="outlined"
      clearable
      @change="uploadTranscript"
      @click:clear="removeAsset('transcript')"
    />
    <VFileInput
      :model-value="getFileName(element.data.captions)"
      accept=".vtt,.srt"
      hint="SRT files will be automatically converted to VTT format"
      label="Captions"
      prepend-icon="mdi-closed-caption-outline"
      variant="outlined"
      clearable
      persistent-hint
      @change="uploadCaptions"
      @click:clear="removeAsset('captions')"
    />
  </div>
</template>

<script setup lang="ts">
import {
  createUploadForm,
  InputFileEvent,
  UploadFormData,
} from '@tailor-cms/cek-common';
import { defineEmits, defineProps, inject } from 'vue';
import type { Element } from '@tailor-cms/ce-mux-video-manifest';
import toWebVTT from 'srt-webvtt';

const props = defineProps<{ element: Element }>();
const emit = defineEmits(['save']);

const $storageService = inject('$storageService') as any;

const getFileName = (url?: string | null): { name: string }[] | undefined => {
  if (url) return [{ name: url.split('___').pop() || 'file' }];
};

const saveData = (updates: Partial<Element['data']>) => {
  emit('save', { ...props.element.data, ...updates });
};

const uploadTranscript = async (e: InputFileEvent) => {
  const form = createUploadForm(e);
  if (!form) return;
  const { url } = await $storageService.upload(form);
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
  const form: UploadFormData = new FormData();
  const isSRT = file.name.toLowerCase().endsWith('.srt');
  form.append('file', isSRT ? await convertSrtToVtt(file) : file);
  const { url } = await $storageService.upload(form);
  const assets = { ...props.element.data.assets, captions: url };
  saveData({ assets });
};

const removeAsset = (type: 'transcript' | 'captions') => {
  const assets = { ...props.element.data.assets, [type]: undefined };
  saveData({ [type]: null, assets });
};
</script>
