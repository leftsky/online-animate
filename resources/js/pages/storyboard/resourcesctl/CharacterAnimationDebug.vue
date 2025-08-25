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
                    <!-- 左侧动作库面板 -->
                    <div class="w-80">
                        <ActionLibraryPanel
                            ref="actionLibraryRef"
                            :model-id="modelId"
                            @animation-selected="handleAnimationSelected"
                            @animation-preview="handleAnimationPreview"
                            @batch-animation-preview="handleBatchAnimationPreview"
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

                        <!-- 批量预览状态显示 -->
                        <div
                            v-if="isBatchPreviewMode"
                            class="absolute right-4 top-4 rounded-lg border border-border bg-background/80 p-3 text-sm backdrop-blur-sm"
                        >
                            <h4 class="font-medium text-foreground">批量预览模式</h4>
                            <p class="text-xs text-muted-foreground">
                                {{ isCreatingBatchPreview ? '创建预览中...' : `预览 ${batchPreviewAnimations.length} 个动画` }}
                            </p>
                            <div v-if="batchPreviewError" class="mt-2 text-xs text-red-500">错误: {{ batchPreviewError }}</div>

                            <!-- 批量预览控制按钮 -->
                            <div class="mt-2 flex gap-2">
                                <el-button size="small" @click="refreshBatchPreview" :disabled="isCreatingBatchPreview">
                                    <el-icon><Refresh /></el-icon>
                                    刷新
                                </el-button>
                                <el-button size="small" @click="stopBatchPreview">
                                    <el-icon><VideoPause /></el-icon>
                                    停止
                                </el-button>
                                <el-button size="small" @click="debugBatchPreview">
                                    <el-icon><Tools /></el-icon>
                                    调试
                                </el-button>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧AI对话面板 -->
                    <div class="w-80">
                        <AIChatPanel ref="aiChatPanelRef" @ai-action="handleAIAction" @ai-animation-generated="handleAIAnimationGenerated" />
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import ActionLibraryPanel from '@/components/ActionLibraryPanel.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { Package } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import AIChatPanel from './components/AIChatPanel.vue';

import { useModelController } from '@/lib/three/ModelController';
import { useThreeJSManager } from '@/lib/three/ThreeJSBaseManager';
import { Tools, VideoPause } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const threeManager = useThreeJSManager();
const { destroyThreeJS, initThreeJS, handleResize } = threeManager;
const modelController = useModelController(threeManager);
const { load, animations: availableAnimations, status: modelStatus } = modelController;

const modelInitParams = ref({
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
const threeCanvas = ref();

// 组件引用
const actionLibraryRef = ref(null);
const aiChatPanelRef = ref(null);

// 批量预览相关状态
const batchPreviewControllers = ref([]);
const isBatchPreviewMode = ref(false);
const batchPreviewAnimations = ref([]);
const isCreatingBatchPreview = ref(false);
const batchPreviewError = ref(null);

// 模型名称和ID
const modelName = ref('调试模型');
const modelId = ref('debug-model-001');

// 默认模型URL
const defaultModelUrl = 'https://online-animate-qos.leftsky.top/models/2025/08/DY5l9zbaqO_1756016791.fbx';

// 动作库相关方法
const handleAnimationSelected = async (animation) => {
    try {
        if (animation.source_file_url && modelController) {
            const result = await modelController.importFBXAnimations(animation.source_file_url, {
                prefix: `${animation.name}_`,
                replaceExisting: false,
            });

            if (result.success && result.importedCount > 0) {
                const animationIndex = availableAnimations.value.length - 1;
                if (animationIndex >= 0) {
                    handleAnimationPlay(animationIndex);
                }
                ElMessage.success(`已载入动画: ${animation.name}`);
            } else {
                ElMessage.error('载入动画失败: ' + (result.errors?.join(', ') || '未知错误'));
            }
        } else if (animation.animation_tracks && modelController) {
            const animationTracks =
                typeof animation.animation_tracks === 'string' ? JSON.parse(animation.animation_tracks) : animation.animation_tracks;

            const animationData = {
                name: animation.name,
                duration: typeof animation.duration === 'string' ? parseFloat(animation.duration) : animation.duration,
                frameCount: typeof animation.frame_count === 'string' ? parseInt(animation.frame_count) : animation.frame_count,
                loopType: animation.loop_type,
                tracks: animationTracks.tracks || [],
            };

            const success = await modelController.addCustomAnimation(animationData);

            if (success) {
                const animationIndex = availableAnimations.value.length - 1;
                if (animationIndex >= 0) {
                    handleAnimationPlay(animationIndex);
                }
                ElMessage.success(`已应用动画: ${animation.name}`);
            } else {
                ElMessage.error('应用动画失败');
            }
        } else {
            ElMessage.error('动画数据格式错误或缺少源文件');
        }
    } catch (error) {
        ElMessage.error('应用动画失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
};

const handleAnimationPreview = (animation) => {
    ElMessage.info(`预览动画: ${animation.name}`);
};

// 批量预览动画
const handleBatchAnimationPreview = async (animations) => {
    try {
        await cleanupBatchPreview();

        const maxPreviewCount = 100;
        const previewAnimations = animations.slice(0, maxPreviewCount);

        if (previewAnimations.length === 0) {
            ElMessage.warning('没有可预览的动画');
            return;
        }

        isBatchPreviewMode.value = true;
        batchPreviewAnimations.value = previewAnimations;
        isCreatingBatchPreview.value = true;
        batchPreviewError.value = null;

        await createBatchPreviewControllers(previewAnimations);
        ElMessage.success(`开始预览 ${previewAnimations.length} 个动画`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        ElMessage.error('批量预览失败: ' + errorMessage);
        batchPreviewError.value = errorMessage;
        isBatchPreviewMode.value = false;
    } finally {
        isCreatingBatchPreview.value = false;
    }
};

// 动画控制方法
const handleAnimationPlay = (animationIndex) => {
    const success = modelController.play(animationIndex);
    if (!success) {
        ElMessage.error('播放动画失败');
    }
};

// AI动作处理
const handleAIAction = (action) => {
    if (action.includes('走路') || action.includes('走')) {
        if (availableAnimations.value.length > 0) {
            handleAnimationPlay(0);
        }
    } else if (action.includes('挥手')) {
        if (availableAnimations.value.length > 1) {
            handleAnimationPlay(1);
        }
    }
};

// AI动画生成处理
const handleAIAnimationGenerated = async (animation) => {
    try {
        const success = await modelController.addCustomAnimation({
            name: animation.name,
            duration: animation.data.animation_data.duration,
            tracks: animation.data.animation_data.tracks,
        });

        if (success) {
            const animationIndex = availableAnimations.value.length - 1;
            if (animationIndex >= 0) {
                handleAnimationPlay(animationIndex);
            }
        } else {
            throw new Error('添加动画失败');
        }
    } catch {
        ElMessage.error('AI动画处理失败');
    }
};

// 创建批量预览控制器
const createBatchPreviewControllers = async (animations) => {
    try {
        const controllers = [];

        // 计算网格布局
        const gridSize = Math.ceil(Math.sqrt(animations.length));
        const spacing = 4; // 增加模型之间的间距，避免重叠

        for (let i = 0; i < animations.length; i++) {
            const animation = animations[i];
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;

            // 计算位置偏移
            const x = (col - (gridSize - 1) / 2) * spacing;
            const z = (row - (gridSize - 1) / 2) * spacing;

            console.log(`创建预览控制器 ${i + 1}: ${animation.name} 在位置 (${x}, 0, ${z})`);

            // 创建新的控制器实例
            const newController = useModelController(threeManager);

            // 加载相同的模型但应用不同的动画
            await newController.load(defaultModelUrl);

            // 等待一帧，确保模型完全加载
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 应用对应的动画
            if (animation.source_file_url) {
                await newController.importFBXAnimations(animation.source_file_url, {
                    prefix: `${animation.name}_`,
                    replaceExisting: true,
                });
            } else if (animation.animation_tracks) {
                const animationTracks =
                    typeof animation.animation_tracks === 'string' ? JSON.parse(animation.animation_tracks) : animation.animation_tracks;

                const animationData = {
                    name: animation.name,
                    duration: typeof animation.duration === 'string' ? parseFloat(animation.duration) : animation.duration,
                    frameCount: typeof animation.frame_count === 'string' ? parseInt(animation.frame_count) : animation.frame_count,
                    loopType: animation.loop_type,
                    tracks: animationTracks.tracks || [],
                };

                await newController.addCustomAnimation(animationData);
            }

            // 设置模型位置 - 通过 updateParams 方法分别设置
            try {
                newController.updateParams({ type: 'position', value: { x, y: 0, z } });
                console.log(`设置模型 ${i + 1} 位置: (${x}, 0, ${z})`);

                // 等待位置设置生效
                await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (posError) {
                console.warn(`设置模型 ${i + 1} 位置失败:`, posError);
            }

            // 开始播放动画 - 播放最新导入的FBX动画
            try {
                let animationIndex = 0; // 默认播放第一个动画

                // 如果有FBX动画，播放最后一个（最新导入的）
                if (animation.source_file_url) {
                    const animations = newController.animations?.value || [];
                    // 找到以动画名称为前缀的动画
                    const fbxAnimationIndex = animations.findIndex((a) => a.name && a.name.includes(animation.name));
                    if (fbxAnimationIndex !== -1) {
                        animationIndex = fbxAnimationIndex;
                        console.log(`模型 ${i + 1} 找到FBX动画: ${animations[animationIndex]?.name} 在索引 ${animationIndex}`);
                    }
                }

                const playResult = newController.play(animationIndex);
                console.log(`模型 ${i + 1} 播放动画索引 ${animationIndex} 结果:`, playResult);

                // 验证动画是否真的在播放
                setTimeout(() => {
                    const isPlaying = newController.isPlaying?.value;
                    console.log(`模型 ${i + 1} 播放状态验证:`, isPlaying);
                }, 100);
            } catch (playError) {
                console.warn(`模型 ${i + 1} 播放动画失败:`, playError);
            }

            controllers.push(newController);
        }

        batchPreviewControllers.value = controllers;
        console.log(`创建了 ${controllers.length} 个预览控制器，网格大小: ${gridSize}x${gridSize}`);

        // 验证所有控制器是否正常工作
        await validateBatchPreviewControllers(controllers);
    } catch (error) {
        console.error('创建批量预览控制器失败:', error);
        throw error;
    }
};

// 清理批量预览
const cleanupBatchPreview = async () => {
    try {
        if (batchPreviewControllers.value.length > 0) {
            // 停止所有控制器
            for (const controller of batchPreviewControllers.value) {
                try {
                    controller.stop();
                    // 这里可以调用控制器的销毁方法，如果有的话
                } catch (error) {
                    console.warn('清理控制器时出错:', error);
                }
            }

            // 清空数组
            batchPreviewControllers.value = [];
        }

        // 重置状态
        isBatchPreviewMode.value = false;
        batchPreviewAnimations.value = [];
        isCreatingBatchPreview.value = false;
        batchPreviewError.value = null;

        console.log('批量预览清理完成');
    } catch (error) {
        console.error('清理批量预览失败:', error);
    }
};

// 验证批量预览控制器
const validateBatchPreviewControllers = async (controllers) => {
    try {
        console.log('开始验证批量预览控制器...');

        for (let i = 0; i < controllers.length; i++) {
            const controller = controllers[i];

            // 检查控制器状态
            const status = controller.status?.value;
            const isPlaying = controller.isPlaying?.value;
            const animations = controller.animations?.value;

            console.log(`控制器 ${i + 1} 状态:`, {
                status,
                isPlaying,
                animationCount: animations?.length || 0,
            });

            // 检查是否有动画
            if (animations && animations.length > 0) {
                console.log(
                    `控制器 ${i + 1} 动画列表:`,
                    animations.map((a) => a.name),
                );

                // 检查当前播放的动画
                if (isPlaying && animations.length > 0) {
                    // 尝试获取当前播放的动画信息
                    try {
                        // 这里可以添加更多调试信息
                        console.log(`控制器 ${i + 1} 当前播放状态:`, isPlaying);
                    } catch (e) {
                        console.warn(`控制器 ${i + 1} 获取播放状态失败:`, e);
                    }
                }
            }
        }

        console.log('批量预览控制器验证完成');

        // 延迟验证，确保动画有时间开始播放
        setTimeout(() => {
            console.log('延迟验证动画播放状态...');
            controllers.forEach((controller, index) => {
                const isPlaying = controller.isPlaying?.value;
                console.log(`延迟验证 - 控制器 ${index + 1} 播放状态:`, isPlaying);
            });
        }, 500);
    } catch (error) {
        console.error('验证批量预览控制器失败:', error);
    }
};

// 刷新批量预览
const refreshBatchPreview = async () => {
    if (!batchPreviewAnimations.value.length) return;

    try {
        console.log('刷新批量预览...');
        await handleBatchAnimationPreview(batchPreviewAnimations.value);
    } catch (error) {
        console.error('刷新批量预览失败:', error);
        ElMessage.error('刷新批量预览失败');
    }
};

// 停止批量预览
const stopBatchPreview = async () => {
    try {
        console.log('停止批量预览...');
        await cleanupBatchPreview();
        ElMessage.success('已停止批量预览');
    } catch (error) {
        console.error('停止批量预览失败:', error);
        ElMessage.error('停止批量预览失败');
    }
};

// 调试批量预览
const debugBatchPreview = () => {
    if (!batchPreviewControllers.value.length) {
        ElMessage.warning('没有可调试的批量预览');
        return;
    }

    console.log('=== 批量预览调试信息 ===');

    batchPreviewControllers.value.forEach((controller, index) => {
        const status = controller.status?.value;
        const isPlaying = controller.isPlaying?.value;
        const animations = controller.animations?.value;

        console.log(`控制器 ${index + 1}:`, {
            status,
            isPlaying,
            animationCount: animations?.length || 0,
            animations: animations?.map((a) => a.name) || [],
        });

        // 尝试播放不同的动画
        if (animations && animations.length > 0) {
            // 找到FBX动画（通常包含动画名称）
            const fbxAnimationIndex = animations.findIndex((a) => a.name && a.name.includes('_mixamocom'));

            if (fbxAnimationIndex !== -1) {
                console.log(`控制器 ${index + 1} 尝试播放FBX动画: ${animations[fbxAnimationIndex].name} (索引: ${fbxAnimationIndex})`);
                try {
                    controller.play(fbxAnimationIndex);
                } catch (e) {
                    console.warn(`控制器 ${index + 1} 播放FBX动画失败:`, e);
                }
            }
        }
    });

    ElMessage.info('调试信息已输出到控制台');
};

// 加载默认模型
const loadDefaultModel = async () => {
    try {
        await load(defaultModelUrl);
        modelInitParams.value = modelController.getModelParams();
    } catch (error) {
        console.error('加载默认模型失败:', error);
        ElMessage.error('加载默认模型失败');
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
