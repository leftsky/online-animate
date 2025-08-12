<template>
  <div>
    <!-- 主要内容 -->
    <slot />
    
    <!-- Toast容器 -->
    <div
      class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="space-y-2"
      >
        <Toast
          v-for="toast in toasts"
          :key="toast.id"
          :toast="toast"
          @close="removeToast(toast.id)"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import Toast from './Toast.vue';

const { toasts, removeToast } = useToast();
</script>

<style scoped>
/* Toast进入动画 */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
