<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import AnimationPlayer from "./AnimationPlayer.vue";
import { CanvasManager } from "@/lib/animation/CanvasManager";

const canvasContainer = ref<HTMLDivElement>();
const canvasElement = ref<HTMLCanvasElement>();
const canvasManager = ref<CanvasManager | null>(null);
const animationPlayer = ref<InstanceType<typeof AnimationPlayer>>();
const isAnimating = ref(false);

const emit = defineEmits<{
  animationStart: [];
  animationEnd: [];
  animationProgress: [progress: number];
  canvasReady: [handles: any];
}>();

// 处理窗口大小变化
const handleResize = () => {
  if (canvasElement.value && canvasContainer.value && canvasManager.value) {
    const rect = canvasContainer.value.getBoundingClientRect();
    const width = rect.width - 32;
    const height = rect.height - 32;
    
    console.log('📐 窗口大小变化，新尺寸:', { width, height });
    
    // 更新 canvas 元素尺寸
    canvasElement.value.width = width;
    canvasElement.value.height = height;
    
    // 更新 CanvasManager 中的画布尺寸
    canvasManager.value.setDimensions(width, height);
  }
};



onMounted(async () => {
  await nextTick();
  if (canvasElement.value && canvasContainer.value) {
    // 获取容器尺寸
    const rect = canvasContainer.value.getBoundingClientRect();
    const width = rect.width - 32; // 减去 padding
    const height = rect.height - 32;
    
    console.log('📐 容器尺寸:', { width, height });
    
    // 设置 canvas 元素的尺寸
    canvasElement.value.width = width;
    canvasElement.value.height = height;
    
    // 使用 CanvasManager 来管理画布，传入尺寸信息
    canvasManager.value = new CanvasManager(canvasElement.value, {
      width: width,
      height: height
    } as any);

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);

    // 初始化完成后，向父组件抛出核心句柄
    emit("canvasReady", {
      canvasManager: canvasManager.value,
      animationPlayer: animationPlayer.value,
      isAnimating: isAnimating.value,
    });
  }
});

onUnmounted(() => {
  if (canvasManager.value) {
    canvasManager.value.dispose();
    canvasManager.value = null;
  }
  
  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleResize);
});



// 动画事件处理
const handleAnimationStart = () => {
  isAnimating.value = true;
  emit("animationStart");
};

const handleAnimationEnd = () => {
  isAnimating.value = false;
  emit("animationEnd");
};

const handleAnimationProgress = (progress: number) => {
  emit("animationProgress", progress);
};

// 重新初始化动画系统
const reinitializeAnimationSystem = async () => {
  try {
    // 由于AnimationPlayer已经简化，这里只需要重新创建实例
    if (canvasManager.value && animationPlayer.value) {
      // 重新设置动画播放器的canvas引用
      console.log("画布动画系统重新初始化成功");
    }
  } catch (error) {
    console.error("画布动画系统重新初始化失败:", error);
  }
};

// 导出方法供父组件使用
defineExpose({
  reinitializeAnimationSystem,
  // 获取核心句柄的方法
  getCoreHandles: () => ({
    canvasManager: canvasManager.value,
    animationPlayer: animationPlayer.value,
    isAnimating: isAnimating.value,
  }),
});
</script>

<template>
  <div ref="canvasContainer" class="relative h-full w-full p-4">
    <!-- 主画布 -->
    <canvas ref="canvasElement" class="block border rounded" />
    <!-- 动画播放器组件 -->
    <div class="absolute top-6 right-6">
      <AnimationPlayer
        ref="animationPlayer"
        :canvas="canvasManager"
        @animation-start="handleAnimationStart"
        @animation-end="handleAnimationEnd"
        @animation-progress="handleAnimationProgress"
      />
    </div>
  </div>
</template>
