<template>
  <div class="animation-player">
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
          <button @click="stopAnimation" class="control-btn stop-btn" title="停止动画">
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
import { ref, onMounted, onUnmounted } from "vue";
import { Play, Pause, Square, RotateCcw } from "lucide-vue-next";
import type { StoryboardItem } from "./types";
import { YamlAnimationPlayer } from "@/lib/animation";

// Props
interface Props {
  canvas?: HTMLCanvasElement | string | any | null;
}

const props = withDefaults(defineProps<Props>(), {
  canvas: null,
});

// Emits
const emit = defineEmits<{
  animationStart: [];
  animationEnd: [];
  animationProgress: [progress: number];
}>();

// 响应式数据
const isPlaying = ref(false);
const progress = ref(0);
const currentAnimation = ref<StoryboardItem | null>(null);
const yamlPlayer = ref<YamlAnimationPlayer | null>(null);
const progressInterval = ref<number | null>(null);

// 播放动画
const playAnimation = async () => {
  if (!currentAnimation.value) {
    console.warn("无法播放动画：缺少动画数据");
    return;
  }

  // 如果没有YamlAnimationPlayer实例，先创建一个
  if (!yamlPlayer.value && props.canvas) {
    try {
      yamlPlayer.value = new YamlAnimationPlayer(props.canvas as any);
      console.log("创建动画播放器实例");
    } catch (error) {
      console.error("创建动画播放器失败:", error);
      return;
    }
  }

  if (!yamlPlayer.value) {
    console.warn("无法播放动画：YamlAnimationPlayer实例未创建");
    return;
  }

  try {
    isPlaying.value = true;
    emit("animationStart");

    // 直接播放动画
    yamlPlayer.value.play();

    // 开始进度监控
    startProgressMonitoring();
  } catch (error) {
    console.error("动画播放失败:", error);
    stopAnimation();
  }
};

// 暂停动画
const pauseAnimation = () => {
  if (yamlPlayer.value && isPlaying.value) {
    yamlPlayer.value.pause();
    isPlaying.value = false;
    clearProgressInterval();
  }
};

// 停止动画
const stopAnimation = () => {
  if (yamlPlayer.value) {
    yamlPlayer.value.stop();
  }

  isPlaying.value = false;
  progress.value = 0;
  clearProgressInterval();
  emit("animationEnd");
};

// 重播动画
const replayAnimation = () => {
  stopAnimation();
  setTimeout(() => {
    playAnimation();
  }, 100);
};

// 开始进度监控
const startProgressMonitoring = () => {
  clearProgressInterval();
  progressInterval.value = window.setInterval(() => {
    if (yamlPlayer.value) {
      const progressValue = yamlPlayer.value.getProgress() * 100;
      progress.value = progressValue;
      emit("animationProgress", progressValue);

      // 检查动画是否完成
      if (!yamlPlayer.value.getPlayingStatus() && progressValue >= 100) {
        stopAnimation();
      }
    } else {
      // 如果没有播放器实例，停止监控
      clearProgressInterval();
    }
  }, 100);
};

// 清除进度更新
const clearProgressInterval = () => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value);
    progressInterval.value = null;
  }
};

// 设置当前动画
const setAnimation = async (item: StoryboardItem) => {
  currentAnimation.value = item
  stopAnimation() // 停止当前播放的动画

  // 先创建实例（如果还没有的话）
  if (!yamlPlayer.value && props.canvas) {
    yamlPlayer.value = new YamlAnimationPlayer(props.canvas as any);
    console.log('创建动画播放器实例');
  }

  // 设置动画脚本并等待初始化完成
  if (yamlPlayer.value && item.animationScript) {
    try {
      await yamlPlayer.value.setYamlScript(item.animationScript);
      console.log('动画数据已更新');
    } catch (error) {
      console.error('更新动画数据失败:', error);
    }
  }
}

// 暴露方法给父组件（只保留必要的）
defineExpose({
  setAnimation,
  playAnimation,
});

// 生命周期
onMounted(() => {
  // 页面加载时不需要立即创建实例，等播放时再创建
  console.log("动画播放器组件已挂载");
});

onUnmounted(() => {
  stopAnimation();
  clearProgressInterval();
  if (yamlPlayer.value) {
    yamlPlayer.value.clear();
    yamlPlayer.value = null;
  }
});
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
  content: "";
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
