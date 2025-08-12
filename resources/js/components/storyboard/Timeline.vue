<script setup lang="ts">
import { ref, computed } from 'vue';
import { Play, Pause, Square, SkipBack, SkipForward, Plus } from 'lucide-vue-next';

interface Keyframe {
    id: string;
    time: number;
    properties: Record<string, any>;
    objectId: string;
}

interface Props {
    duration?: number;
    selectedObject?: any;
}

const props = withDefaults(defineProps<Props>(), {
    duration: 10, // 默认10秒
});

const emit = defineEmits<{
    play: [];
    pause: [];
    stop: [];
    seek: [time: number];
    addKeyframe: [time: number, objectId: string];
    removeKeyframe: [keyframeId: string];
}>();

// 播放状态
const isPlaying = ref(false);
const currentTime = ref(0);
const keyframes = ref<Keyframe[]>([]);

// 时间轴设置
const timelineWidth = ref(800);
const pixelsPerSecond = computed(() => timelineWidth.value / props.duration);

// 播放控制
const togglePlay = () => {
    if (isPlaying.value) {
        pause();
    } else {
        play();
    }
};

const play = () => {
    isPlaying.value = true;
    emit('play');
};

const pause = () => {
    isPlaying.value = false;
    emit('pause');
};

const stop = () => {
    isPlaying.value = false;
    currentTime.value = 0;
    emit('stop');
    emit('seek', 0);
};

const skipToStart = () => {
    currentTime.value = 0;
    emit('seek', 0);
};

const skipToEnd = () => {
    currentTime.value = props.duration;
    emit('seek', props.duration);
};

// 时间轴交互
const handleTimelineClick = (event: MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = Math.max(0, Math.min(props.duration, x / pixelsPerSecond.value));
    currentTime.value = time;
    emit('seek', time);
};

// 删除关键帧
const removeKeyframe = (keyframeId: string) => {
    const index = keyframes.value.findIndex(kf => kf.id === keyframeId);
    if (index > -1) {
        keyframes.value.splice(index, 1);
        emit('removeKeyframe', keyframeId);
    }
};

// 格式化时间显示
const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

// 生成时间刻度
const timeMarkers = computed(() => {
    const markers = [];
    const step = props.duration <= 10 ? 1 : props.duration <= 60 ? 5 : 10;

    for (let i = 0; i <= props.duration; i += step) {
        markers.push({
            time: i,
            position: (i / props.duration) * 100,
            label: formatTime(i),
        });
    }

    return markers;
});

// 当前时间指针位置
const playheadPosition = computed(() => {
    return (currentTime.value / props.duration) * 100;
});

// 关键帧位置
const getKeyframePosition = (time: number) => {
    return (time / props.duration) * 100;
};
</script>

<template>
    <div class="flex h-full flex-col border-t bg-card">
        <!-- 控制栏 -->
        <div class="flex items-center justify-between border-b px-4 py-2">
            <!-- 播放控制 -->
            <div class="flex items-center space-x-2">
                <button @click="skipToStart"
                    class="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    title="跳到开始">
                    <SkipBack class="h-4 w-4" />
                </button>

                <button @click="togglePlay"
                    class="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90"
                    :title="isPlaying ? '暂停' : '播放'">
                    <Play v-if="!isPlaying" class="h-4 w-4" />
                    <Pause v-else class="h-4 w-4" />
                </button>

                <button @click="stop"
                    class="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    title="停止">
                    <Square class="h-4 w-4" />
                </button>

                <button @click="skipToEnd"
                    class="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    title="跳到结束">
                    <SkipForward class="h-4 w-4" />
                </button>
            </div>

            <!-- 时间显示 -->
            <div class="flex items-center space-x-4">
                <span class="text-sm font-mono text-muted-foreground">
                    {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
                </span>

                <!-- 移除关键帧按钮 -->
                <!-- <button
                    @click="addKeyframe"
                    :disabled="!selectedObject"
                    :class="[
                        'flex items-center rounded-md px-3 py-1 text-sm font-medium',
                        selectedObject
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'cursor-not-allowed bg-muted text-muted-foreground'
                    ]"
                    title="添加关键帧"
                >
                    <Plus class="mr-1 h-3 w-3" />
                    关键帧
                </button> -->
            </div>
        </div>

        <!-- 时间轴 -->
        <div class="flex-1 overflow-x-auto">
            <div class="relative h-full min-w-full" :style="{ width: timelineWidth + 'px' }">
                <!-- 时间刻度 -->
                <div class="relative h-8 border-b bg-muted/30">
                    <div v-for="marker in timeMarkers" :key="marker.time" class="absolute flex flex-col items-center"
                        :style="{ left: marker.position + '%' }">
                        <div class="h-2 w-px bg-border"></div>
                        <span class="mt-1 text-xs text-muted-foreground">{{ marker.label }}</span>
                    </div>
                </div>

                <!-- 时间轴主体 -->
                <div class="relative h-20 cursor-pointer bg-muted/20" @click="handleTimelineClick">
                    <!-- 关键帧 -->
                    <div v-for="keyframe in keyframes" :key="keyframe.id"
                        class="absolute top-2 h-4 w-4 cursor-pointer rounded-full bg-primary shadow-sm hover:bg-primary/90"
                        :style="{ left: getKeyframePosition(keyframe.time) + '%', transform: 'translateX(-50%)' }"
                        :title="`关键帧 - ${formatTime(keyframe.time)}`" @click.stop="removeKeyframe(keyframe.id)">
                        <div class="absolute -bottom-1 left-1/2 h-2 w-px -translate-x-1/2 bg-primary"></div>
                    </div>

                    <!-- 播放头 -->
                    <div class="absolute top-0 h-full w-px bg-destructive" :style="{ left: playheadPosition + '%' }">
                        <div class="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-destructive"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
.overflow-x-auto::-webkit-scrollbar {
    height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>