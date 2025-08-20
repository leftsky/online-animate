<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from "vue";
// 移除了 CanvasManager 和 AnimationPlayer 导入，现在使用 Three.js 渲染

const canvasContainer = ref<HTMLDivElement>();
const canvasElement = ref<HTMLCanvasElement>();
// TODO: 替换为 Three.js 场景管理器
// const sceneManager = ref<ThreeSceneManager | null>(null);
// TODO: 替换为 Three.js 动画播放器
// const threeAnimationPlayer = ref<ThreeAnimationPlayer | null>(null);
const isAnimating = ref(false);

const emit = defineEmits<{
  animationStart: [];
  animationEnd: [];
  animationProgress: [progress: number];
  canvasReady: [handles: any];
}>();

// 处理窗口大小变化
const handleResize = () => {
  if (canvasElement.value && canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect();
    const width = rect.width - 32;
    const height = rect.height - 32;
    
    console.log('📐 窗口大小变化，新尺寸:', { width, height });
    
    // 更新 canvas 元素尺寸
    canvasElement.value.width = width;
    canvasElement.value.height = height;
    
    // TODO: 更新 Three.js 场景尺寸
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
    
    // TODO: 使用 Three.js 初始化场景
    console.log('TODO: 初始化 Three.js 场景', { width, height });

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);

    // 初始化完成后，向父组件抛出核心句柄
    emit("canvasReady", {
      // TODO: 传递 Three.js 相关句柄
      // threeAnimationPlayer: threeAnimationPlayer.value,
      isAnimating: isAnimating.value,
    });
  }
});

onUnmounted(() => {
  // TODO: 清理 Three.js 场景资源
  
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
    // TODO: 使用 Three.js 重新初始化动画系统
    console.log("TODO: Three.js 动画系统重新初始化");
  } catch (error) {
    console.error("Three.js 动画系统重新初始化失败:", error);
  }
};

// 导出方法供父组件使用
defineExpose({
  reinitializeAnimationSystem,
  // 获取核心句柄的方法
  getCoreHandles: () => ({
    // TODO: 返回 Three.js 相关句柄
    // threeAnimationPlayer: threeAnimationPlayer.value,
    isAnimating: isAnimating.value,
  }),
});
</script>

<template>
  <div ref="canvasContainer" class="relative h-full w-full p-4">
    <!-- 主画布 -->
    <canvas ref="canvasElement" class="block border rounded" />
    <!-- TODO: 使用 Three.js 动画播放器组件替代 -->
    <!-- <div class="absolute top-6 right-6">
      <ThreeAnimationPlayer
        ref="threeAnimationPlayer"
        @animation-start="handleAnimationStart"
        @animation-end="handleAnimationEnd"
        @animation-progress="handleAnimationProgress"
      />
    </div> -->
  </div>
</template>
