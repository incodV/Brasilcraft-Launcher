<template>
  <div class="absolute z-0 h-full w-full">
    <img
      :src="defaultBackgroundImage"
      class="absolute inset-0 h-full w-full app-background-image"
      :style="{ filter: `blur(${blur}px)` }"
    >
    <div class="absolute inset-0 app-background-glow" />
    <div
      class="z-3 absolute inset-0"
      :style="{ background: backgroundColor }"
    />
  </div>
</template>
<script lang="ts" setup>
import defaultBackgroundImage from '@/assets/fundo-do-carregamento.png'
import { injection } from '@/util/inject'
import { kTheme } from '@/composables/theme'

const { backgroundColor, blur } = injection(kTheme)


</script>
<style scoped>
.app-background-image {
  object-fit: cover;
  transform: scale(1.03);
}

.app-background-glow {
  background:
    radial-gradient(circle at top left, rgba(255, 211, 75, 0.22), transparent 28%),
    radial-gradient(circle at top right, rgba(134, 241, 45, 0.18), transparent 30%),
    linear-gradient(140deg, rgba(8, 18, 7, 0.18), rgba(8, 18, 7, 0.46));
}
</style>
