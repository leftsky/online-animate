<script setup lang="ts">
import ToastProvider from '@/components/ui/toast/ToastProvider.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/vue3';
import { nextTick, ref } from 'vue';
import StoryboardCanvas from './components/StoryboardCanvas.vue';
import StoryboardList from './components/StoryboardList.vue';
import Timeline from './components/Timeline.vue';
// 移除了 Canvas 动画相关的导入，现在使用 Three.js 渲染

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: '分镜画板',
        href: '/storyboard',
    },
];

const canvasRef = ref<InstanceType<typeof StoryboardCanvas>>();
const coreHandles = ref<any>(null);

// 接收画布核心句柄
const handleCanvasReady = (handles: any) => {
    coreHandles.value = handles;
};

// 手动重新初始化动画系统（用于热更新后）
const reinitializeAnimationSystem = async () => {
    try {
        if (canvasRef.value) {
            await canvasRef.value.reinitializeAnimationSystem();
        }
    } catch (error) {
        console.error('动画系统重新初始化失败:', error);
    }
};

// 处理动画预览
const handlePreviewAnimation = async (item: any) => {
    try {
        // 检查画布引用是否存在
        if (!canvasRef.value) {
            console.warn('画布引用未初始化，等待组件挂载...');
            await nextTick();
            if (!canvasRef.value) {
                console.error('画布组件初始化失败');
                return;
            }
        }

        // 检查核心句柄是否就绪
        if (!coreHandles.value?.animationPlayer) {
            console.warn('动画播放器未就绪，等待初始化...');
            await nextTick();
            if (!coreHandles.value?.animationPlayer) {
                console.error('动画播放器初始化失败');
                return;
            }
        }

        // 通过核心句柄调用动画播放功能
        await coreHandles.value.animationPlayer.setAnimation(item);
        coreHandles.value.animationPlayer.playAnimation();
    } catch (error) {
        console.error('动画预览失败:', error);
        // 如果失败，尝试重新初始化
        await reinitializeAnimationSystem();
        // 再次尝试播放
        try {
            if (coreHandles.value?.animationPlayer) {
                await coreHandles.value.animationPlayer.setAnimation(item);
                coreHandles.value.animationPlayer.playAnimation();
            } else {
                console.error('重新初始化后动画播放器仍然不可用');
            }
        } catch (retryError) {
            console.error('重新初始化后仍然失败:', retryError);
        }
    }
};

// 处理项目更新
const handleUpdateItem = () => {
    // 这里可以添加更新逻辑，比如保存到后端
};

// 处理播放单个项目
const handlePlayItem = async (item: any) => {
    console.log('播放单个项目:', item);
    await handlePreviewAnimation(item);
};

// 处理图片更换
const handleChangeImage = (item: any, resource: any) => {
    console.log('更换图片:', item, resource);
    // 这里可以添加额外的处理逻辑
};

// 处理播放整个分镜序列
const handlePlayAllStoryboards = async (items: any[]) => {
    console.log('同时播放所有分镜内容:', items);

    if (items.length === 0) {
        console.warn('没有分镜内容可播放');
        return;
    }

    try {
        // 检查画布是否就绪
        if (!coreHandles.value?.canvasManager) {
            console.error('画布管理器未就绪');
            return;
        }

        // 第一步：清空整个画布
        console.log('清空画布...');
        coreHandles.value.canvasManager.clear();
        console.log('画布已清空');

        // TODO: 使用 Three.js 实现动画播放逻辑
        console.log('动画播放功能将使用 Three.js 重新实现', items);
    } catch (error) {
        console.error('同时播放分镜内容失败:', error);
    }
};
</script>

<template>
    <Head title="分镜画板" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <ToastProvider>
            <div class="flex h-[calc(100vh-4rem)] flex-col bg-muted/50 dark:bg-muted/20">
                <!-- 主要内容区域 -->
                <div class="flex flex-1">
                    <!-- 画布区域 -->
                    <div class="flex flex-1 items-center justify-center p-6">
                        <div class="relative flex h-full w-full items-center justify-center">
                            <div
                                class="relative max-h-full max-w-full"
                                :style="{
                                    aspectRatio: '16/9',
                                    width: 'min(100%, calc(100vh * 16/9 - 12rem))',
                                    height: 'min(100%, calc(100vw * 9/16 - 8rem))',
                                }"
                            >
                                <StoryboardCanvas ref="canvasRef" class="h-full w-full" @canvas-ready="handleCanvasReady" />
                            </div>
                        </div>
                    </div>

                    <!-- 右侧分镜列表 -->
                    <div class="w-80 border-l">
                        <StoryboardList
                            @preview-animation="handlePreviewAnimation"
                            @update-item="handleUpdateItem"
                            @play-item="handlePlayItem"
                            @play-all-storyboards="handlePlayAllStoryboards"
                            @change-image="handleChangeImage"
                        />
                    </div>
                </div>

                <!-- 底部时间轴 -->
                <div class="h-48 border-t">
                    <Timeline />
                </div>
            </div>
        </ToastProvider>
    </AppLayout>
</template>

<style scoped>
/* 自定义样式 */
</style>
