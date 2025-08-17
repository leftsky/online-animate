<template>
  <div class="animation-player">
    <!-- 动画控制按钮 -->
    <Transition name="slide-up" appear>
      <div v-if="currentAnimation" class="animation-controls">
        <div class="control-group">
          <button @click="playAnimation" :disabled="isPlaying" class="control-btn play-btn" title="播放动画">
            <Play class="w-4 h-4" />
            <span class="btn-text">播放</span>
          </button>
          <button @click="pauseAnimation" :disabled="!isPlaying" class="control-btn pause-btn" title="暂停动画">
            <Pause class="w-4 h-4" />
            <span class="btn-text">暂停</span>
          </button>
        </div>
        <div class="control-group">
          <button @click="stopAnimation" class="control-btn stop-btn" title="停止动画">
            <Square class="w-4 h-4" />
            <span class="btn-text">停止</span>
          </button>
          <button @click="replayAnimation" class="control-btn replay-btn" title="重播动画">
            <RotateCcw class="w-4 h-4" />
            <span class="btn-text">重播</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 动画信息显示/播放进度条 -->
    <Transition name="fade" appear>
      <div v-if="currentAnimation" class="animation-info">
        <!-- 播放时显示进度条 -->
        <div v-if="isPlaying" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <div class="progress-text">
            <span class="text-xs text-muted-foreground">播放进度</span>
            <span class="text-xs font-medium">{{ Math.round(progress) }}%</span>
          </div>
        </div>
        <!-- 非播放时显示动画信息 -->
        <div v-else class="info-content">
          <div class="info-item">
            <span class="info-label">动画名称:</span>
            <span class="info-value">{{ currentAnimation.elementName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">持续时间:</span>
            <span class="info-value">{{ currentAnimation.duration }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, readonly, watch } from 'vue'
import { Play, Pause, Square, RotateCcw } from 'lucide-vue-next'
import type { StoryboardItem } from './types'
import { AnimationParser, type AnimationData } from '@/lib/AnimationParser'
import { CanvasCore } from '@/lib/CanvasCore'

// Props
interface Props {
  canvas?: any | null
}

const props = withDefaults(defineProps<Props>(), {
  canvas: null
})

// Emits
const emit = defineEmits<{
  animationStart: []
  animationEnd: []
  animationProgress: [progress: number]
}>()

// 响应式数据
const isPlaying = ref(false)
const progress = ref(0)
const currentAnimation = ref<StoryboardItem | null>(null)
const canvasCore = ref<CanvasCore | null>(null)
const progressInterval = ref<number | null>(null)

// 播放动画
const playAnimation = async () => {
  if (!currentAnimation.value || !canvasCore.value) {
    console.warn('无法播放动画：缺少动画数据或CanvasCore实例')
    return
  }

  try {
    isPlaying.value = true
    emit('animationStart')

    // 解析动画脚本
    const animationData = await parseAnimationScript(currentAnimation.value.animationScript || '')

    // 加载并播放动画
    await canvasCore.value.loadAnimation(animationData)
    canvasCore.value.play(animationData)

    // 开始进度监控
    startProgressMonitoring()

  } catch (error) {
    console.error('动画播放失败:', error)
    stopAnimation()
  }
}

// 暂停动画
const pauseAnimation = () => {
  if (canvasCore.value && isPlaying.value) {
    canvasCore.value.pause()
    isPlaying.value = false
    clearProgressInterval()
  }
}

// 停止动画
const stopAnimation = () => {
  if (canvasCore.value) {
    canvasCore.value.stop()
  }

  isPlaying.value = false
  progress.value = 0
  clearProgressInterval()
  emit('animationEnd')
}

// 重播动画
const replayAnimation = () => {
  stopAnimation()
  setTimeout(() => {
    playAnimation()
  }, 100)
}

// 开始进度监控
const startProgressMonitoring = () => {
  clearProgressInterval()
  progressInterval.value = window.setInterval(() => {
    if (canvasCore.value) {
      const state = canvasCore.value.getPlaybackState()
      progress.value = state.progress * 100
      emit('animationProgress', progress.value)

      // 检查动画是否完成
      if (!state.isPlaying && progress.value >= 100) {
        stopAnimation()
      }
    }
  }, 100)
}

// 解析动画脚本
const parseAnimationScript = async (script: string): Promise<AnimationData> => {
  const getDefaultAnimation = (): AnimationData => ({
    name: '默认动画',
    initialPosition: { x: 0, y: 0, opacity: 1, scaleX: 1, scaleY: 1, rotation: 0 },
    animationSequences: [{
      id: 'default',
      name: '淡入',
      duration: 1000,
      easing: 'ease',
      keyframes: [
        { startTime: 0, duration: 1000, opacity: 0 },
        { startTime: 1000, duration: 0, opacity: 1 }
      ]
    }]
  })

  try {
    const parsedData = AnimationParser.parseYamlToJson(script)
    return (parsedData && Object.keys(parsedData).length > 0) ? parsedData : getDefaultAnimation()
  } catch (error) {
    console.error('解析动画脚本失败:', error)
    return getDefaultAnimation()
  }
}

// 清除进度更新
const clearProgressInterval = () => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
}

// 设置当前动画
const setAnimation = async (item: StoryboardItem) => {
  currentAnimation.value = item
  stopAnimation() // 停止当前播放的动画

  // 如果有画布和图片路径，加载图片到画布
  if (props.canvas && item.imagePath) {
    await loadImageToCanvas(item)
  }
}

// 加载图片到画布
const loadImageToCanvas = async (item: StoryboardItem) => {
  if (!props.canvas || !item.imagePath) return

  try {
    // 清除画布上的非网格线对象
    const objects = props.canvas.getObjects().filter((obj: any) => !obj.isGridLine)
    objects.forEach((obj: any) => props.canvas.remove(obj))

    // 创建图片对象
    const { Image } = await import('fabric')

    return new Promise((resolve) => {
      Image.fromURL(item.imagePath, {
        crossOrigin: 'anonymous'
      }).then((img: any) => {
        if (!props.canvas) return

        // 设置图片属性
        img.set({
          left: props.canvas.width / 2 - 100,
          top: props.canvas.height / 2 - 100,
          scaleX: 0.5,
          scaleY: 0.5,
          originX: 'center',
          originY: 'center'
        })

        // 添加到画布
        props.canvas.add(img)
        props.canvas.setActiveObject(img)
        props.canvas.renderAll()

        resolve(img)
      })
    })
  } catch (error) {
    console.error('加载图片到画布失败:', error)
  }
}

// 清除动画
const clearAnimation = () => {
  stopAnimation()
  currentAnimation.value = null
}

// 暴露方法给父组件
defineExpose({
  setAnimation,
  clearAnimation,
  playAnimation,
  pauseAnimation,
  stopAnimation,
  replayAnimation,
  isPlaying: readonly(isPlaying),
  currentAnimation: readonly(currentAnimation)
})

// 监听canvas变化，初始化CanvasCore实例
watch(() => props.canvas, (newCanvas) => {
  if (newCanvas && !canvasCore.value) {
    canvasCore.value = new CanvasCore(newCanvas)
  }
}, { immediate: true })

// 生命周期
onUnmounted(() => {
  stopAnimation()
  clearProgressInterval()
  if (canvasCore.value) {
    canvasCore.value = null
  }
})
</script>

<style scoped>
.animation-player {
  @apply space-y-4;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  @apply transition-all duration-300 ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0 transform scale-95;
}

.slide-up-enter-active,
.slide-up-leave-active {
  @apply transition-all duration-300 ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  @apply opacity-0 transform translate-y-2;
}



/* 控制按钮 */
.animation-controls {
  @apply space-y-2;
  min-height: 88px;
  /* 固定控制按钮区域高度 */
}

.animation-controls .control-group {
  @apply flex gap-2;
}

.animation-controls .control-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200;
  @apply border border-border bg-background hover:bg-accent shadow-sm hover:shadow-md;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm;
  @apply transform hover:scale-105 active:scale-95;
}

.animation-controls .control-btn .btn-text {
  @apply hidden sm:inline;
}

.animation-controls .control-btn.play-btn:not(:disabled) {
  @apply border-primary text-primary hover:bg-primary/10 hover:border-primary/80;
}

.animation-controls .control-btn.pause-btn:not(:disabled) {
  @apply border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-400;
  @apply dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-950;
}

.animation-controls .control-btn.stop-btn {
  @apply border-destructive text-destructive hover:bg-destructive/10 hover:border-destructive/80;
}

.animation-controls .control-btn.replay-btn {
  @apply border-primary text-primary hover:bg-primary/10 hover:border-primary/80;
}

/* 动画信息 */
.animation-info {
  @apply bg-muted/30 border border-border rounded-lg p-3;
  min-height: 80px;
  /* 固定最小高度，避免布局变化 */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.animation-info .progress-container {
  @apply space-y-2;
}

.animation-info .progress-bar {
  @apply w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner;
}

.animation-info .progress-bar .progress-fill {
  @apply h-full bg-primary transition-all duration-100 ease-linear relative;
}

.animation-info .progress-bar .progress-fill::after {
  content: '';
  @apply absolute top-0 right-0 w-2 h-full bg-white opacity-30 animate-pulse;
}

.animation-info .progress-text {
  @apply flex items-center justify-between;
}

.animation-info .info-content {
  @apply space-y-2;
}

.animation-info .info-item {
  @apply flex items-center justify-between text-sm;
}

.animation-info .info-item .info-label {
  @apply text-muted-foreground font-medium;
}

.animation-info .info-item .info-value {
  @apply text-foreground font-semibold;
}
</style>