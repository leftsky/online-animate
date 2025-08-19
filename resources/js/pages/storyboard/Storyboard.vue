<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
const selectedObject = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)

// 对象选择处理
const handleObjectSelected = (object: any) => {
    selectedObject.value = object
}

// 对象修改处理
const handleObjectModified = (object: any) => {
    // 可以在这里添加历史记录或其他逻辑
    console.log('Object modified:', object)
}

// 时间轴控制
const handlePlay = () => {
    isPlaying.value = true
    // 这里可以添加实际的动画播放逻辑
}

const handlePause = () => {
    isPlaying.value = false
    // 这里可以添加实际的动画暂停逻辑
}

const handleStop = () => {
    isPlaying.value = false
    currentTime.value = 0
    // 这里可以添加实际的动画停止逻辑
}

const handleSeek = (time: number) => {
    currentTime.value = time
    // 这里可以添加实际的动画跳转逻辑
}

const handleAddKeyframe = () => {
    // 添加关键帧逻辑
    console.log('Add keyframe at current time')
}

const handleRemoveKeyframe = (keyframeId: string) => {
    // 移除关键帧逻辑
    console.log('Remove keyframe:', keyframeId)
}

// 分镜列表事件处理
const handleSelectItem = (item: any) => {
    console.log('Selected storyboard item:', item)
    // 可以在这里更新时间轴显示选中的动画
}

const handlePlayItem = (item: any) => {
    console.log('Play storyboard item:', item)
    // 播放指定的动画项目
    if (item.animation) {
        // 这里可以添加实际的动画播放逻辑
        isPlaying.value = true
    }
}

const handleEditItem = (item: any) => {
    console.log('Edit storyboard item:', item)
    // 打开编辑器或切换到编辑模式
}

const handleDeleteItem = (itemId: string) => {
    console.log('Delete storyboard item:', itemId)
    // 删除分镜项目的逻辑
}

const handleDuplicateItem = (item: any) => {
    console.log('Duplicate storyboard item:', item)
    // 复制分镜项目的逻辑
}

const handleToggleVisibility = (itemId: string) => {
    console.log('Toggle visibility for item:', itemId)
    // 切换项目可见性的逻辑
}

const handleAddNewItem = () => {
    console.log('Add new storyboard item')
    // 添加新分镜项目的逻辑
}

// 处理动画预览
const handlePreviewAnimation = async (item: any) => {
    console.log('Preview animation for item:', item)
    // 调用画布组件的动画播放功能
    if (canvasRef.value) {
        await canvasRef.value.playAnimation(item)
    }
}

// 初始化
onMounted(() => {
    // 初始化状态
    isPlaying.value = false
    currentTime.value = 0
})
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
                    <!-- 修改容器以更好地利用空间 -->
                    <div class="relative w-full h-full flex items-center justify-center">
                        <div 
                            class="relative max-w-full max-h-full"
                            :style="{
                                aspectRatio: '16/9',
                                width: 'min(100%, calc(100vh * 16/9 - 12rem))',
                                height: 'min(100%, calc(100vw * 9/16 - 8rem))'
                            }"
                        >
                            <StoryboardCanvas
                                ref="canvasRef"
                                class="w-full h-full"
                                @object-selected="handleObjectSelected"
                                @object-modified="handleObjectModified"
                            />
                        </div>
                    </div>
                </div>
                
                <!-- 右侧分镜列表 -->
                <div class="w-80 border-l">
                    <StoryboardList
                        @select-item="handleSelectItem"
                        @play-item="handlePlayItem"
                        @edit-item="handleEditItem"
                        @delete-item="handleDeleteItem"
                        @duplicate-item="handleDuplicateItem"
                        @toggle-visibility="handleToggleVisibility"
                        @add-new-item="handleAddNewItem"
                        @preview-animation="handlePreviewAnimation"
                    />
                </div>
            </div>

            <!-- 底部时间轴 - 增加高度 -->
            <div class="h-48 border-t">
                <Timeline
                    :duration="10"
                    :selected-object="selectedObject"
                    :is-playing="isPlaying"
                    :current-time="currentTime"
                    @play="handlePlay"
                    @pause="handlePause"
                    @stop="handleStop"
                    @seek="handleSeek"
                    @add-keyframe="handleAddKeyframe"
                    @remove-keyframe="handleRemoveKeyframe"
                />
            </div>
        </div>
        </ToastProvider>
    </AppLayout>
</template>

<style scoped>
/* 自定义样式 */
</style>