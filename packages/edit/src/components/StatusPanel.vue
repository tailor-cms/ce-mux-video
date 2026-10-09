<template>
  <div class="status-panel d-flex flex-column align-center text-center pa-8">
    <VAvatar :color="color" size="x-large" variant="tonal">
      <VIcon :icon="icon" size="28" />
    </VAvatar>
    <div class="mt-4 mb-2 text-title-large">{{ title }}</div>
    <div v-if="message" class="text-body-medium text-medium-emphasis">
      {{ message }}
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  icon: string;
  title: string;
  message?: string;
  color?: string;
}

withDefaults(defineProps<Props>(), { message: '', color: undefined });
</script>

<style lang="scss" scoped>
.status-panel :deep(.v-progress-linear) {
  width: 100%;
  max-width: 22rem;
}
</style>
