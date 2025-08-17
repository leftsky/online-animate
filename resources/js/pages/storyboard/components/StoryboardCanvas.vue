<script setup lang="ts">
import { Canvas, Image, Object as FabricObject } from 'fabric';
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import AnimationPlayer from './AnimationPlayer.vue';
import type { StoryboardItem } from './types';
const canvasContainer = ref<HTMLDivElement>();
const canvasElement = ref<HTMLCanvasElement>();
const fabricCanvas = ref<Canvas | null>(null);
const animationPlayer = ref<InstanceType<typeof AnimationPlayer>>();
const isAnimating = ref(false);
const emit = defineEmits<{
    animationStart: [];
    animationEnd: [];
    animationProgress: [progress: number];
}>();
// 获取容器尺寸
const getContainerSize = () => {
    if (!canvasContainer.value) return { width: 800, height: 600 };
    const rect = canvasContainer.value.getBoundingClientRect();
    return {
        width: rect.width - 32,
        height: rect.height - 32
    };
};
// 调整画布尺寸
const resizeCanvas = () => {
    if (!fabricCanvas.value || !canvasContainer.value) return;
    const { width, height } = getContainerSize();
    fabricCanvas.value.setDimensions({ width, height });
    fabricCanvas.value.renderAll();
};
onMounted(async () => {
    await nextTick();
    if (canvasElement.value && canvasContainer.value) {
        const { width, height } = getContainerSize();
        fabricCanvas.value = new Canvas(canvasElement.value, {
            width: width,
            height: height,
            backgroundColor: '#f8f9fa',
            selection: false,
            interactive: false,
        });
        // 监听窗口大小变化
        window.addEventListener('resize', resizeCanvas);
    }
});

onUnmounted(() => {
    if (fabricCanvas.value) {
        fabricCanvas.value.dispose();
        fabricCanvas.value = null;
    }
    window.removeEventListener('resize', resizeCanvas);
});

// 清空画布
const clearCanvas = () => {
    if (!fabricCanvas.value) return;
    fabricCanvas.value.clear();
    fabricCanvas.value.backgroundColor = '#f8f9fa';
    fabricCanvas.value.renderAll();
};
// 动画播放相关方法
const playAnimation = async (item: StoryboardItem) => {
    if (animationPlayer.value) {
        await animationPlayer.value.setAnimation(item);
        animationPlayer.value.playAnimation();
    }
};
const stopAnimation = () => {
    if (animationPlayer.value) {
        animationPlayer.value.stopAnimation();
    }
};
const pauseAnimation = () => {
    if (animationPlayer.value) {
        animationPlayer.value.pauseAnimation();
    }
};
const replayAnimation = () => {
    if (animationPlayer.value) {
        animationPlayer.value.replayAnimation();
    }
};
// 动画事件处理
const handleAnimationStart = () => {
    isAnimating.value = true;
    emit('animationStart');
};
const handleAnimationEnd = () => {
    isAnimating.value = false;
    emit('animationEnd');
};
const handleAnimationProgress = (progress: number) => {
    emit('animationProgress', progress);
};
// 导出方法供父组件使用
defineExpose({
    clearCanvas,
    canvas: fabricCanvas,
    resizeCanvas,
    playAnimation,
    stopAnimation,
    pauseAnimation,
    replayAnimation,
});
</script>
<template>
    <div ref="canvasContainer" class="relative h-full w-full p-4">
        <!-- 主画布 -->
        <canvas ref="canvasElement" class="block border rounded" />
        <!-- 动画播放器组件 -->
        <div class="absolute top-6 right-6">
            <AnimationPlayer ref="animationPlayer" :canvas="fabricCanvas" @animation-start="handleAnimationStart"
                @animation-end="handleAnimationEnd" @animation-progress="handleAnimationProgress" />
        </div>
    </div>
</template>
<style scoped></style>