<template>
    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="min-h-screen bg-background">
            <div class="container mx-auto p-6">
                <!-- 页面标题 -->
                <div class="mb-6">
                    <h1 class="text-3xl font-bold text-foreground">人物动作调试</h1>
                    <p class="mt-2 text-muted-foreground">调试和测试3D人物模型的动画效果</p>
                </div>

                <div class="flex h-[calc(100vh-200px)] gap-6">
                    <!-- 左侧模型控制面板 -->
                    <div class="w-80">
                        <ModelControlPanel
                            ref="controlPanelRef"
                            :model-name="modelName"
                            :model-init-params="modelInitParams"
                            :available-animations="availableAnimations"
                            @animation-play="handleAnimationPlay"
                            @animation-pause="handleAnimationPause"
                            @animation-stop="handleAnimationStop"
                            @model-update="modelController.updateParams"
                            @toggle-bounding-box="handleToggleBoundingBox"
                            @toggle-skeleton="handleToggleSkeleton"
                        />
                    </div>

                    <!-- 中央3D画布区域 -->
                    <div class="relative flex-1 overflow-hidden rounded-lg border border-border bg-card">
                        <canvas ref="threeCanvas" class="h-full w-full" :class="{ 'opacity-0': modelStatus === 'loading' }"></canvas>

                        <!-- 覆盖层 -->
                        <div
                            v-if="modelStatus === 'loading' || modelStatus === 'created' || modelStatus === 'inited'"
                            class="absolute inset-0 flex items-center justify-center bg-card text-muted-foreground"
                        >
                            <!-- 加载中状态 -->
                            <div v-if="modelStatus === 'loading'" class="text-center">
                                <div class="mx-auto mb-4 flex h-16 w-16 animate-spin items-center justify-center rounded-full bg-muted">
                                    <Package class="h-8 w-8" />
                                </div>
                                <h3 class="mb-2 text-lg font-medium">加载模型中...</h3>
                                <p class="text-sm">请稍候</p>
                            </div>

                            <!-- 默认状态 -->
                            <div v-else class="text-center">
                                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <Package class="h-8 w-8" />
                                </div>
                                <h3 class="mb-2 text-lg font-medium">3D模型画布</h3>
                                <p class="text-sm">模型加载中，请稍候...</p>
                            </div>
                        </div>

                        <!-- 模型信息显示 -->
                        <div
                            v-if="modelStatus === 'loaded'"
                            class="absolute left-4 top-4 rounded-lg border border-border bg-background/80 p-3 text-sm backdrop-blur-sm"
                        >
                            <h4 class="font-medium text-foreground">{{ modelName }}</h4>
                            <p class="text-xs text-muted-foreground">3D模型预览</p>
                        </div>
                    </div>

                    <!-- 右侧AI对话面板 -->
                    <div class="w-80">
                        <AIChatPanel
                            ref="aiChatPanelRef"
                            :model-status="modelStatus"
                            :available-animations="availableAnimations"
                            @ai-action="handleAIAction"
                        />
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import ModelControlPanel from '@/components/ModelControlPanel.vue';
import { useToast } from '@/composables/useToast';
import AppLayout from '@/layouts/AppLayout.vue';
import { Package } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import AIChatPanel from './components/AIChatPanel.vue';

import { useModelController } from '@/lib/three/ModelController';
import { useThreeJSManager } from '@/lib/three/ThreeJSBaseManager';

const threeManager = useThreeJSManager();
const { destroyThreeJS, initThreeJS, handleResize } = threeManager;
const modelController = useModelController(threeManager);
const {
    load,
    animations: availableAnimations,
    status: modelStatus,
    toggleBoundingBox: handleToggleBoundingBox,
    toggleSkeleton: handleToggleSkeleton,
} = modelController;

const modelInitParams = ref<any>({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
});

// 面包屑导航
const breadcrumbs = [
    { title: '工作台', href: '/dashboard' },
    { title: '人物动作调试', href: '/character-animation-debug' },
];

// Toast
const { toast } = useToast();
const threeCanvas = ref<HTMLCanvasElement>();

// 模型控制面板相关状态
const controlPanelRef = ref<InstanceType<typeof ModelControlPanel> | null>(null);
const aiChatPanelRef = ref<InstanceType<typeof AIChatPanel> | null>(null);

// 模型名称
const modelName = ref('调试模型');

// 默认模型URL
const defaultModelUrl = 'http://online-animate-qos.leftsky.top/models/2025/08/tOS0oFc8hx_1755666406.glb';

// 模型控制面板事件处理方法
const handleAnimationPlay = (animationIndex: number) => {
    const success = modelController.play(animationIndex);
    if (success) {
        controlPanelRef.value?.setAnimationState(true);
        aiChatPanelRef.value?.addLog('info', `开始播放动画: ${availableAnimations.value[animationIndex]?.name || '未知动画'}`);
        console.log('播放动画成功');
    } else {
        toast.error('播放动画失败');
        aiChatPanelRef.value?.addLog('error', '播放动画失败');
    }
};

const handleAnimationPause = () => {
    const success = modelController.pause();
    if (success) {
        controlPanelRef.value?.setAnimationState(false);
        aiChatPanelRef.value?.addLog('info', '动画已暂停');
    }
};

const handleAnimationStop = () => {
    const success = modelController.stop();
    if (success) {
        controlPanelRef.value?.setAnimationState(false);
        aiChatPanelRef.value?.addLog('info', '动画已停止');
    }
};

// AI动作处理
const handleAIAction = (action: string) => {
    aiChatPanelRef.value?.addLog('info', `执行AI指令: ${action}`);

    // 这里可以根据AI指令执行相应的模型控制操作
    // 例如：解析自然语言指令并转换为模型动作
    console.log('AI指令:', action);

    // 示例：简单的关键词匹配
    if (action.includes('走路') || action.includes('走')) {
        // 播放走路动画
        if (availableAnimations.value.length > 0) {
            handleAnimationPlay(0); // 假设第一个动画是走路
        }
        aiChatPanelRef.value?.addLog('success', '执行走路动作');
    } else if (action.includes('挥手')) {
        // 播放挥手动画
        if (availableAnimations.value.length > 1) {
            handleAnimationPlay(1); // 假设第二个动画是挥手
        }
        aiChatPanelRef.value?.addLog('success', '执行挥手动作');
    } else {
        aiChatPanelRef.value?.addLog('warning', `无法理解的指令: ${action}`);
    }
};

// 加载默认模型
const loadDefaultModel = async () => {
    try {
        aiChatPanelRef.value?.addLog('info', '开始加载默认模型...');
        await load(defaultModelUrl);
        aiChatPanelRef.value?.addLog('success', '默认模型加载成功');
        modelInitParams.value = modelController.getModelParams();
    } catch (error) {
        console.error('加载默认模型失败:', error);
        aiChatPanelRef.value?.addLog('error', '加载默认模型失败: ' + (error instanceof Error ? error.message : '未知错误'));
        toast.error('加载默认模型失败');
    }
};

// 生命周期
onMounted(async () => {
    if (threeCanvas.value) {
        initThreeJS(threeCanvas.value);
        window.addEventListener('resize', handleResize);

        // 加载默认模型
        await loadDefaultModel();
    }
});

// 组件卸载时清理资源
const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    destroyThreeJS();
};

watch(() => false, cleanup);
</script>
