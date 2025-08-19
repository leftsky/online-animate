<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Head } from '@inertiajs/vue3'
import AppLayout from '@/layouts/AppLayout.vue'
import { type BreadcrumbItem } from '@/types'
import StoryboardCanvas from './components/StoryboardCanvas.vue'
import Timeline from './components/Timeline.vue'
import StoryboardList from './components/StoryboardList.vue'
import ToastProvider from '@/components/ui/toast/ToastProvider.vue'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: '分镜画板',
        href: '/storyboard',
    },
]

const canvasRef = ref<InstanceType<typeof StoryboardCanvas>>()
const coreHandles = ref<any>(null)

// 接收画布核心句柄
const handleCanvasReady = (handles: any) => {
    coreHandles.value = handles
    console.log('画布核心句柄已就绪:', handles)
}

// 手动重新初始化动画系统（用于热更新后）
const reinitializeAnimationSystem = async () => {
    try {
        console.log('手动重新初始化动画系统...');
        if (canvasRef.value) {
            await canvasRef.value.reinitializeAnimationSystem();
            console.log('动画系统重新初始化成功');
        }
    } catch (error) {
        console.error('动画系统重新初始化失败:', error);
    }
};

// 处理动画预览
const handlePreviewAnimation = async (item: any) => {
    console.log('Preview animation for item:', item);

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
        console.log('动画预览启动成功');
    } catch (error) {
        console.error('动画预览失败:', error);
        // 如果失败，尝试重新初始化
        console.log('尝试重新初始化动画系统...');
        await reinitializeAnimationSystem();
        // 再次尝试播放
        try {
            if (coreHandles.value?.animationPlayer) {
                await coreHandles.value.animationPlayer.setAnimation(item);
                coreHandles.value.animationPlayer.playAnimation();
                console.log('重新初始化后动画播放成功');
            } else {
                console.error('重新初始化后动画播放器仍然不可用');
            }
        } catch (retryError) {
            console.error('重新初始化后仍然失败:', retryError);
        }
    }
}

// 处理项目更新
const handleUpdateItem = (updatedItem: any) => {
    console.log('更新项目:', updatedItem);
    // 这里可以添加更新逻辑，比如保存到后端
    // 暂时只是打印日志
}
</script>

<template>
  <Head title="分镜画板" />

  <AppLayout :breadcrumbs="breadcrumbs">
    <ToastProvider>
      <div class="flex h-[calc(100vh-4rem)] flex-col bg-muted/50 dark:bg-muted/20">
        <!-- 主要内容区域 -->
        <div class="flex-1 flex">
          <!-- 画布区域 -->
          <div class="flex-1 flex items-center justify-center p-6">
            <div class="relative w-full h-full flex items-center justify-center">
              <div
                class="relative max-w-full max-h-full"
                :style="{
                  aspectRatio: '16/9',
                  width: 'min(100%, calc(100vh * 16/9 - 12rem))',
                  height: 'min(100%, calc(100vw * 9/16 - 8rem))',
                }"
              >
                <StoryboardCanvas
                  ref="canvasRef"
                  class="w-full h-full"
                  @canvas-ready="handleCanvasReady"
                />
              </div>
            </div>
          </div>

          <!-- 右侧分镜列表 -->
          <div class="w-80 border-l">
            <StoryboardList 
              @preview-animation="handlePreviewAnimation" 
              @update-item="handleUpdateItem" 
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
