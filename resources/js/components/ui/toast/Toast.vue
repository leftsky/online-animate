<template>
  <div
    :class="[
      'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
      toastVariants({ variant }),
      'animate-in slide-in-from-right-full duration-300'
    ]"
  >
    <div class="grid gap-1">
      <div class="text-sm font-semibold">
        {{ toast.title }}
      </div>
      <div v-if="toast.description" class="text-sm opacity-90">
        {{ toast.description }}
      </div>
    </div>
    
    <button
      @click="$emit('close')"
      class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { X } from 'lucide-vue-next';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { Toast } from '@/composables/useToast';

interface Props {
  toast: Toast;
}

const props = defineProps<Props>();
defineEmits<{
  close: [];
}>();

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
        info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const variant = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'success';
    case 'error':
      return 'destructive';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
});
</script>
