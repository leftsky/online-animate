<template>
  <div class="animation-player">
    <!-- 动画播放状态指示器 -->
    <Transition name="fade" appear>
      <div v-if="isPlaying" class="animation-status">
        <div class="status-indicator">
          <div class="status-icon">
            <Play class="w-4 h-4 animate-pulse" />
          </div>
          <span class="text-sm font-medium">正在播放动画...</span>
          <div class="ml-auto text-xs text-blue-600">
            {{ Math.round(progress) }}%
          </div>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
    </Transition>

    <!-- 动画控制按钮 -->
    <Transition name="slide-up" appear>
      <div v-if="currentAnimation" class="animation-controls">
        <div class="control-group">
          <button 
            @click="playAnimation" 
            :disabled="isPlaying"
            class="control-btn play-btn"
            title="播放动画"
          >
            <Play class="w-4 h-4" />
            <span class="btn-text">播放</span>
          </button>
          <button 
            @click="pauseAnimation" 
            :disabled="!isPlaying"
            class="control-btn pause-btn"
            title="暂停动画"
          >
            <Pause class="w-4 h-4" />
            <span class="btn-text">暂停</span>
          </button>
        </div>
        <div class="control-group">
          <button 
            @click="stopAnimation" 
            class="control-btn stop-btn"
            title="停止动画"
          >
            <Square class="w-4 h-4" />
            <span class="btn-text">停止</span>
          </button>
          <button 
            @click="replayAnimation" 
            class="control-btn replay-btn"
            title="重播动画"
          >
            <RotateCcw class="w-4 h-4" />
            <span class="btn-text">重播</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- 动画信息显示 -->
    <Transition name="fade" appear>
      <div v-if="currentAnimation && !isPlaying" class="animation-info">
        <div class="info-item">
          <span class="info-label">动画名称:</span>
          <span class="info-value">{{ currentAnimation.elementName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">持续时间:</span>
          <span class="info-value">{{ currentAnimation.duration }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { gsap } from 'gsap'
import { Play, Pause, Square, RotateCcw } from 'lucide-vue-next'
import type { StoryboardItem } from './types'

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
const isPaused = ref(false)
const progress = ref(0)
const currentAnimation = ref<StoryboardItem | null>(null)
const animationTimeline = ref<gsap.core.Timeline | null>(null)
const progressInterval = ref<number | null>(null)

// 计算属性
const canPlay = computed(() => {
  return currentAnimation.value && !isPlaying.value && props.canvas
})

// 播放动画
const playAnimation = async () => {
  if (!currentAnimation.value || !props.canvas) {
    console.warn('无法播放动画：缺少动画数据或画布')
    return
  }

  try {
    isPlaying.value = true
    isPaused.value = false
    emit('animationStart')

    // 创建 GSAP 时间线
    animationTimeline.value = gsap.timeline({
      onComplete: () => {
        stopAnimation()
      },
      onUpdate: () => {
        updateProgress()
      }
    })

    // 解析并执行动画脚本
    await executeAnimationScript(currentAnimation.value)

  } catch (error) {
    console.error('动画播放失败:', error)
    stopAnimation()
  }
}

// 暂停动画
const pauseAnimation = () => {
  if (animationTimeline.value && isPlaying.value) {
    animationTimeline.value.pause()
    isPaused.value = true
    isPlaying.value = false
    clearProgressInterval()
  }
}

// 停止动画
const stopAnimation = () => {
  if (animationTimeline.value) {
    animationTimeline.value.kill()
    animationTimeline.value = null
  }
  
  isPlaying.value = false
  isPaused.value = false
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

// 执行动画脚本
const executeAnimationScript = async (item: StoryboardItem) => {
  if (!props.canvas || !animationTimeline.value) return

  try {
    // 打印动画脚本用于调试
    console.log('=== 动画脚本调试信息 ===')
    console.log('元素名称:', item.elementName)
    console.log('动画脚本内容:')
    console.log(item.animationScript || '无脚本')
    console.log('========================')
    
    // 解析 YAML 动画脚本
    const animationData = await parseAnimationScript(item.animationScript || '')
    
    // 获取画布上的对象
    const canvasObjects = props.canvas.getObjects().filter((obj: any) => !obj.isGridLine)
    
    if (canvasObjects.length === 0) {
      console.warn('画布上没有可动画的对象')
      return
    }
    
    // 设置初始状态
     if (animationData.initial) {
       canvasObjects.forEach((obj: any) => {
         obj.set({
           left: animationData.initial.x,
           top: animationData.initial.y,
           opacity: animationData.initial.opacity,
           scaleX: animationData.initial.scale,
           scaleY: animationData.initial.scale,
           angle: animationData.initial.rotation
         })
       })
       props.canvas.renderAll()
     }
    
    // 执行动画序列
    for (const animation of animationData.animations) {
      await executeAnimation(animation, canvasObjects)
    }
    
  } catch (error) {
    console.error('执行动画脚本失败:', error)
    throw error
  }
}

// 解析动画脚本
const parseAnimationScript = async (script: string) => {
  try {
    // 使用增强的 AnimationParser 解析 YAML 脚本
    const { AnimationParser } = await import('../../lib/AnimationParser')
    const parsedData = AnimationParser.parseYAMLScript(script)
    
    if (parsedData) {
      return parsedData
    }
    
    // 如果解析失败，返回默认动画
    return {
      target: 'all',
      initial: { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
      animations: [
        {
          id: 'default',
          name: '淡入',
          type: 'fadeIn',
          duration: '1s',
          easing: 'ease',
          properties: {}
        }
      ]
    }
  } catch (error) {
    console.error('解析动画脚本失败:', error)
    // 返回默认动画
    return {
      target: 'all',
      initial: { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
      animations: [
        {
          id: 'default',
          name: '淡入',
          type: 'fadeIn',
          duration: '1s',
          easing: 'ease',
          properties: {}
        }
      ]
    }
  }
}

// 执行单个动画
const executeAnimation = async (animation: any, objects: any[]) => {
  return new Promise<void>((resolve) => {
    if (!animationTimeline.value) {
      resolve()
      return
    }

    // 根据目标选择对象
    let targetObjects = objects
    if (animation.target && animation.target !== 'all') {
      targetObjects = objects.filter(obj => 
        (obj as any).name === animation.target || 
        obj.type === animation.target
      )
    }

    if (targetObjects.length === 0) {
      resolve()
      return
    }

    // 解析持续时间
    const duration = typeof animation.duration === 'string' 
      ? parseFloat(animation.duration.replace('s', '')) 
      : (animation.duration || 1)
    
    const delay = animation.properties?.delay || 0
    const easing = animation.easing || 'ease'

    // 根据动画类型执行不同的动画
    switch (animation.type) {
      case 'fadeIn':
        targetObjects.forEach((obj, index) => {
          obj.set('opacity', 0)
          animationTimeline.value?.to(obj, {
            opacity: 1,
            duration,
            delay: delay + (index * 0.1),
            ease: easing,
            onUpdate: () => props.canvas?.renderAll(),
            onComplete: index === targetObjects.length - 1 ? resolve : undefined
          })
        })
        break
        
      case 'fadeOut':
        targetObjects.forEach((obj, index) => {
          animationTimeline.value?.to(obj, {
            opacity: 0,
            duration,
            delay: delay + (index * 0.1),
            ease: easing,
            onUpdate: () => props.canvas?.renderAll(),
            onComplete: index === targetObjects.length - 1 ? resolve : undefined
          })
        })
        break
        
      case 'slideInLeft':
        targetObjects.forEach((obj, index) => {
          const originalLeft = obj.left || 0
          obj.set('left', originalLeft - 200)
          animationTimeline.value?.to(obj, {
            left: originalLeft,
            duration,
            delay: delay + (index * 0.1),
            ease: 'power2.out',
            onUpdate: () => props.canvas?.renderAll(),
            onComplete: index === targetObjects.length - 1 ? resolve : undefined
          })
        })
        break
        
      case 'slideInRight':
        targetObjects.forEach((obj, index) => {
          const originalLeft = obj.left || 0
          obj.set('left', originalLeft + 200)
          animationTimeline.value?.to(obj, {
            left: originalLeft,
            duration,
            delay: delay + (index * 0.1),
            ease: 'power2.out',
            onUpdate: () => props.canvas?.renderAll(),
            onComplete: index === targetObjects.length - 1 ? resolve : undefined
          })
        })
        break
        
      case 'scaleIn':
        targetObjects.forEach((obj, index) => {
          const originalScaleX = obj.scaleX || 1
          const originalScaleY = obj.scaleY || 1
          obj.set({ scaleX: 0, scaleY: 0 })
          animationTimeline.value?.to(obj, {
            scaleX: originalScaleX,
            scaleY: originalScaleY,
            duration,
            delay: delay + (index * 0.1),
            ease: 'back.out(1.7)',
            onUpdate: () => props.canvas?.renderAll(),
            onComplete: index === targetObjects.length - 1 ? resolve : undefined
          })
        })
        break
        
      case 'rotateIn':
        targetObjects.forEach((obj, index) => {
          const originalAngle = obj.angle || 0
          obj.set('angle', originalAngle - 360)
          animationTimeline.value?.to(obj, {
            angle: originalAngle,
            duration,
            delay: delay + (index * 0.1),
            ease: easing,
            onUpdate: () => props.canvas?.renderAll(),
            onComplete: index === targetObjects.length - 1 ? resolve : undefined
          })
        })
        break
        
      case 'bounceIn':
        targetObjects.forEach((obj, index) => {
          const originalScaleX = obj.scaleX || 1
          const originalScaleY = obj.scaleY || 1
          obj.set({ scaleX: 0.3, scaleY: 0.3, opacity: 0 })
          animationTimeline.value?.to(obj, {
            scaleX: originalScaleX,
            scaleY: originalScaleY,
            opacity: 1,
            duration,
            delay: delay + (index * 0.1),
            ease: 'back.out(1.7)',
            onUpdate: () => props.canvas?.renderAll(),
            onComplete: index === targetObjects.length - 1 ? resolve : undefined
          })
        })
        break
        
      default:
        // 自定义动画或未知类型，检查是否有关键帧数据
        console.log('=== Default分支调试 ===')
        console.log('动画对象:', animation)
        console.log('properties:', animation.properties)
        console.log('keyframes存在:', !!animation.properties?.keyframes)
        console.log('keyframes类型:', typeof animation.properties?.keyframes)
        console.log('keyframes内容:', animation.properties?.keyframes)
        console.log('========================')
        
        if (animation.properties?.keyframes && Array.isArray(animation.properties.keyframes)) {
          console.log('=== 关键帧动画调试 ===')
          console.log('动画名称:', animation.name)
          console.log('关键帧数据:', animation.properties.keyframes)
          console.log('=====================')
          
          // 使用关键帧创建动画
          targetObjects.forEach((obj, index) => {
            const keyframes = animation.properties.keyframes
            
            // 创建关键帧动画
            for (let i = 0; i < keyframes.length - 1; i++) {
              const currentFrame = keyframes[i]
              const nextFrame = keyframes[i + 1]
              
              // 计算这一段的持续时间
              const segmentDuration = (nextFrame.time - currentFrame.time) * duration
              
              // 设置起始状态（仅第一帧）
              if (i === 0) {
                obj.set({
                  left: currentFrame.properties.x || obj.left,
                  top: currentFrame.properties.y || obj.top,
                  opacity: currentFrame.properties.opacity !== undefined ? currentFrame.properties.opacity : obj.opacity,
                  scaleX: currentFrame.properties.scaleX || obj.scaleX,
                  scaleY: currentFrame.properties.scaleY || obj.scaleY,
                  angle: currentFrame.properties.rotation || obj.angle
                })
              }
              
              // 创建到下一帧的动画
              const targetProps: any = {}
              if (nextFrame.properties.x !== undefined) targetProps.left = nextFrame.properties.x
              if (nextFrame.properties.y !== undefined) targetProps.top = nextFrame.properties.y
              if (nextFrame.properties.opacity !== undefined) targetProps.opacity = nextFrame.properties.opacity
              if (nextFrame.properties.scaleX !== undefined) targetProps.scaleX = nextFrame.properties.scaleX
              if (nextFrame.properties.scaleY !== undefined) targetProps.scaleY = nextFrame.properties.scaleY
              if (nextFrame.properties.rotation !== undefined) targetProps.angle = nextFrame.properties.rotation
              
              animationTimeline.value?.to(obj, {
                ...targetProps,
                duration: segmentDuration,
                delay: delay + (index * 0.1) + (currentFrame.time * duration),
                ease: easing,
                onUpdate: () => props.canvas?.renderAll(),
                onComplete: (i === keyframes.length - 2 && index === targetObjects.length - 1) ? resolve : undefined
              })
            }
          })
        } else {
          // 使用属性中的配置创建简单动画
          targetObjects.forEach((obj, index) => {
            const animProps = { ...animation.properties }
            delete animProps.delay // delay 已经单独处理
            delete animProps.keyframes // 移除keyframes属性
            
            animationTimeline.value?.to(obj, {
              ...animProps,
              duration,
              delay: delay + (index * 0.1),
              ease: easing,
              onUpdate: () => props.canvas?.renderAll(),
              onComplete: index === targetObjects.length - 1 ? resolve : undefined
            })
          })
        }
    }
  })
}

// 更新进度
const updateProgress = () => {
  if (animationTimeline.value) {
    const currentProgress = (animationTimeline.value.progress() * 100)
    progress.value = currentProgress
    emit('animationProgress', currentProgress)
  }
}

// 开始进度更新
const startProgressInterval = () => {
  clearProgressInterval()
  progressInterval.value = window.setInterval(updateProgress, 100)
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

// 生命周期
onMounted(() => {
  // 组件挂载时的初始化
})

onUnmounted(() => {
  stopAnimation()
  clearProgressInterval()
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

/* 动画状态指示器 */
.animation-status {
  @apply bg-muted/50 border border-border rounded-lg p-4 shadow-sm;
}

.status-indicator {
  @apply flex items-center gap-3 text-primary mb-3;
}

.status-icon {
  @apply flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full;
}

.progress-bar {
  @apply w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner;
}

.progress-fill {
  @apply h-full bg-primary transition-all duration-100 ease-linear;
  @apply relative;
}

.progress-fill::after {
  content: '';
  @apply absolute top-0 right-0 w-2 h-full bg-white opacity-30 animate-pulse;
}

/* 控制按钮 */
.animation-controls {
  @apply space-y-2;
}

.control-group {
  @apply flex gap-2;
}

.control-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200;
  @apply border border-border bg-background hover:bg-accent shadow-sm hover:shadow-md;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm;
  @apply transform hover:scale-105 active:scale-95;
}

.btn-text {
  @apply hidden sm:inline;
}

.play-btn:not(:disabled) {
  @apply border-primary text-primary hover:bg-primary/10 hover:border-primary/80;
}

.pause-btn:not(:disabled) {
  @apply border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-400 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-950;
}

.stop-btn {
  @apply border-destructive text-destructive hover:bg-destructive/10 hover:border-destructive/80;
}

.replay-btn {
  @apply border-primary text-primary hover:bg-primary/10 hover:border-primary/80;
}

/* 动画信息 */
.animation-info {
  @apply bg-muted/30 border border-border rounded-lg p-3 space-y-2;
}

.info-item {
  @apply flex items-center justify-between text-sm;
}

.info-label {
  @apply text-muted-foreground font-medium;
}

.info-value {
  @apply text-foreground font-semibold;
}
</style>