<template>
    <div class="flex h-full w-full flex-col rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur-sm">
        <!-- 标题栏 -->
        <div class="sticky top-0 z-10 flex flex-shrink-0 items-center border-b border-border bg-background/95 p-2">
            <div class="flex flex-col">
                <h3 class="text-sm font-medium text-foreground">模型控制</h3>
                <div class="text-xs text-muted-foreground">{{ modelName }}</div>
            </div>
        </div>

        <!-- 可滚动内容区域 -->
        <div class="flex-1 space-y-3 overflow-y-auto p-3">
            <!-- 动作控制 -->
            <div>
                <div class="mb-2 flex items-center justify-between">
                    <h4 class="flex items-center text-sm font-medium text-foreground">
                        <Play class="mr-2 h-4 w-4" />
                        动作控制
                    </h4>

                    <!-- 播放/暂停按钮 -->
                    <Button
                        variant="outline"
                        size="sm"
                        @click="togglePlayPause"
                        :disabled="currentAnimation === null || availableAnimations.length === 0"
                        class="h-7 px-2 text-xs"
                    >
                        <Play v-if="!isPlaying" class="mr-1 h-3 w-3" />
                        <Pause v-else class="mr-1 h-3 w-3" />
                        {{ isPlaying ? '暂停' : '播放' }}
                    </Button>
                </div>

                <!-- 动作选择下拉框 -->
                <select
                    :value="currentAnimation?.toString() || ''"
                    @change="selectAnimation(parseInt(($event.target as HTMLSelectElement).value))"
                    class="h-7 w-full rounded-md border border-input bg-background px-2 text-xs transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    :disabled="availableAnimations.length === 0"
                >
                    <option value="" disabled>选择动作</option>
                    <option v-for="(animation, index) in availableAnimations" :key="index" :value="index.toString()">
                        {{ animation.name }} ({{ animation.duration }}ms)
                    </option>
                </select>
            </div>

            <!-- 显示控制 -->
            <div>
                <h4 class="mb-2 flex items-center text-sm font-medium text-foreground">
                    <Eye class="mr-2 h-4 w-4" />
                    显示控制
                </h4>

                <div class="flex items-center gap-4">
                    <!-- 边界框显示 -->
                    <div class="flex items-center gap-2">
                        <label class="text-xs text-foreground">边界框</label>
                        <Button
                            variant="ghost"
                            size="sm"
                            @click="toggleBoundingBox"
                            :class="{ 'text-primary': showBoundingBox, 'text-muted-foreground': !showBoundingBox }"
                            class="h-6 w-6 p-0 hover:bg-accent"
                            :title="showBoundingBox ? '隐藏边界框' : '显示边界框'"
                        >
                            <Eye v-if="showBoundingBox" class="h-3 w-3" />
                            <EyeOff v-else class="h-3 w-3" />
                        </Button>
                    </div>

                    <!-- 骨骼显示 -->
                    <div class="flex items-center gap-2">
                        <label class="text-xs text-foreground">骨骼</label>
                        <Button
                            variant="ghost"
                            size="sm"
                            @click="toggleSkeleton"
                            :class="{ 'text-primary': showSkeleton, 'text-muted-foreground': !showSkeleton }"
                            class="h-6 w-6 p-0 hover:bg-accent"
                            :title="showSkeleton ? '隐藏骨骼' : '显示骨骼'"
                        >
                            <Eye v-if="showSkeleton" class="h-3 w-3" />
                            <EyeOff v-else class="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            <!-- 模型参数调整 -->
            <div>
                <h4 class="mb-2 flex items-center text-sm font-medium text-foreground">
                    <Settings class="mr-2 h-4 w-4" />
                    模型参数
                </h4>

                <!-- 位置控制 -->
                <div class="mb-3">
                    <label class="mb-1 block text-xs font-medium text-muted-foreground">位置</label>
                    <div class="grid grid-cols-3 gap-1">
                        <div>
                            <label class="text-xs text-muted-foreground">X</label>
                            <Input
                                v-model.number="modelParams.position.x"
                                type="number"
                                step="0.1"
                                class="h-7 text-xs"
                                @input="updateModelPosition"
                            />
                        </div>
                        <div>
                            <label class="text-xs text-muted-foreground">Y</label>
                            <Input
                                v-model.number="modelParams.position.y"
                                type="number"
                                step="0.1"
                                class="h-7 text-xs"
                                @input="updateModelPosition"
                            />
                        </div>
                        <div>
                            <label class="text-xs text-muted-foreground">Z</label>
                            <Input
                                v-model.number="modelParams.position.z"
                                type="number"
                                step="0.1"
                                class="h-7 text-xs"
                                @input="updateModelPosition"
                            />
                        </div>
                    </div>
                </div>

                <!-- 旋转控制 -->
                <div class="mb-3">
                    <label class="mb-1 block text-xs font-medium text-muted-foreground">旋转 (度)</label>
                    <div class="grid grid-cols-3 gap-1">
                        <div>
                            <label class="text-xs text-muted-foreground">X</label>
                            <Input v-model.number="modelParams.rotation.x" type="number" step="1" class="h-7 text-xs" @input="updateModelRotation" />
                        </div>
                        <div>
                            <label class="text-xs text-muted-foreground">Y</label>
                            <Input v-model.number="modelParams.rotation.y" type="number" step="1" class="h-7 text-xs" @input="updateModelRotation" />
                        </div>
                        <div>
                            <label class="text-xs text-muted-foreground">Z</label>
                            <Input v-model.number="modelParams.rotation.z" type="number" step="1" class="h-7 text-xs" @input="updateModelRotation" />
                        </div>
                    </div>
                </div>

                <!-- 缩放控制 -->
                <div class="mb-3">
                    <label class="mb-1 block text-xs font-medium text-muted-foreground">缩放</label>
                    <div class="flex items-center gap-2">
                        <Input
                            v-model.number="modelParams.scale"
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="5"
                            class="h-7 flex-1 text-xs"
                            @input="updateModelScale"
                        />
                        <Button variant="outline" size="sm" @click="resetScale" class="h-7 px-2 text-xs"> 重置 </Button>
                    </div>
                </div>

                <!-- 重置按钮 -->
                <Button variant="outline" size="sm" @click="resetAllParams" class="w-full">
                    <RotateCcw class="mr-1 h-3 w-3" />
                    重置所有参数
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nextTick, reactive, ref, watch } from 'vue';
// 移除了Select组件导入，改用原生select元素
import { Eye, EyeOff, Pause, Play, RotateCcw, Settings } from 'lucide-vue-next';

// Props
interface Props {
    modelName?: string;
    // model?: any; // Three.js模型对象
    modelInitParams: any;
    availableAnimations?: Array<{
        name: string;
        duration: number;
        clip?: any; // Three.js AnimationClip
    }>;
}

const props = withDefaults(defineProps<Props>(), {
    modelName: '',
    availableAnimations: () => [],
});

// Emits
const emit = defineEmits<{
    close: [];
    animationPlay: [index: number];
    animationPause: [];
    animationStop: [];
    modelUpdate: [params: any];
    toggleBoundingBox: [show: boolean];
    toggleSkeleton: [show: boolean];
}>();

// 状态
const currentAnimation = ref<number | null>(null);
const isPlaying = ref(false);
const showBoundingBox = ref(false);
const showSkeleton = ref(false);

// 模型参数
const modelParams = reactive({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
});

// 初始参数备份
const initialParams = reactive({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
});

// 监听模型变化，更新参数
watch(
    () => props.modelInitParams,
    (newModel) => {
        if (newModel) {
            // 更新当前参数
            modelParams.position.x = newModel.position.x;
            modelParams.position.y = newModel.position.y;
            modelParams.position.z = newModel.position.z;

            modelParams.rotation.x = (newModel.rotation.x * 180) / Math.PI;
            modelParams.rotation.y = (newModel.rotation.y * 180) / Math.PI;
            modelParams.rotation.z = (newModel.rotation.z * 180) / Math.PI;

            modelParams.scale = newModel.scale.x;

            // 备份初始参数
            Object.assign(initialParams.position, modelParams.position);
            Object.assign(initialParams.rotation, modelParams.rotation);
            initialParams.scale = modelParams.scale;
        }
    },
    { immediate: true },
);

// 监听动画列表变化，自动选择并播放第一个动作
watch(
    () => props.availableAnimations,
    (animations) => {
        if (animations && animations.length > 0 && currentAnimation.value === null) {
            currentAnimation.value = 0;
            // 延迟一下确保模型已加载完成
            nextTick(() => {
                playCurrentAnimation();
            });
        }
    },
    { immediate: true },
);

// 播放/暂停切换方法
const togglePlayPause = () => {
    if (isPlaying.value) {
        pauseAnimation();
    } else {
        playCurrentAnimation();
    }
};

// 动作控制方法
const selectAnimation = (index: number) => {
    currentAnimation.value = index;
    // 自动播放新选择的动作
    playCurrentAnimation();
};

const playCurrentAnimation = () => {
    if (currentAnimation.value !== null) {
        isPlaying.value = true;
        emit('animationPlay', currentAnimation.value);
    }
};

const pauseAnimation = () => {
    isPlaying.value = false;
    emit('animationPause');
};

// 参数更新方法
const updateModelPosition = () => {
    emit('modelUpdate', {
        type: 'position',
        value: { ...modelParams.position },
    });
};

const updateModelRotation = () => {
    emit('modelUpdate', {
        type: 'rotation',
        value: {
            x: (modelParams.rotation.x * Math.PI) / 180,
            y: (modelParams.rotation.y * Math.PI) / 180,
            z: (modelParams.rotation.z * Math.PI) / 180,
        },
    });
};

const updateModelScale = () => {
    emit('modelUpdate', {
        type: 'scale',
        value: modelParams.scale,
    });
};

const resetScale = () => {
    modelParams.scale = initialParams.scale;
    updateModelScale();
};

const resetAllParams = () => {
    Object.assign(modelParams.position, initialParams.position);
    Object.assign(modelParams.rotation, initialParams.rotation);
    modelParams.scale = initialParams.scale;

    updateModelPosition();
    updateModelRotation();
    updateModelScale();
};

// 显示控制方法
const toggleBoundingBox = () => {
    showBoundingBox.value = !showBoundingBox.value;
    emit('toggleBoundingBox', showBoundingBox.value);
};

const toggleSkeleton = () => {
    showSkeleton.value = !showSkeleton.value;
    emit('toggleSkeleton', showSkeleton.value);
};

// 暴露方法给父组件
defineExpose({
    setAnimationState: (playing: boolean) => {
        isPlaying.value = playing;
    },
    updateParams: (params: any) => {
        if (params.position) {
            Object.assign(modelParams.position, params.position);
        }
        if (params.rotation) {
            modelParams.rotation.x = (params.rotation.x * 180) / Math.PI;
            modelParams.rotation.y = (params.rotation.y * 180) / Math.PI;
            modelParams.rotation.z = (params.rotation.z * 180) / Math.PI;
        }
        if (params.scale !== undefined) {
            modelParams.scale = params.scale;
        }
    },
});
</script>
