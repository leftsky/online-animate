<template>
  <div
    v-if="isOpen"
    class="absolute top-full left-0 z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg"
  >
    <div class="p-1">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen?: boolean;
}

defineProps<Props>();
</script>
