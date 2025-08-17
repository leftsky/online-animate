<template>
  <button
    ref="trigger"
    :class="[
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    ]"
    :disabled="disabled"
    @click="toggle"
  >
    <slot />
    <svg
      class="h-4 w-4 opacity-50"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  className?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  disabled: false
});

const emit = defineEmits<{
  click: [];
}>();

const trigger = ref<HTMLButtonElement>();

const toggle = () => {
  emit('click');
};
</script>
