<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { Head } from '@inertiajs/vue3'
import AppLayout from '@/layouts/AppLayout.vue'
import { type BreadcrumbItem } from '@/types'
import StoryboardCanvas from '@/components/storyboard/StoryboardCanvas.vue'
import Timeline from '@/components/storyboard/Timeline.vue'
import StoryboardList from '@/components/storyboard/StoryboardList.vue'
import ToastProvider from '@/components/ui/toast/ToastProvider.vue'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: '分镜画板',
        href: '/storyboard',
    },
]

const canvasRef = ref<InstanceType<typeof StoryboardCanvas>>()
const selectedObject = ref(null)
const timeline = ref<gsap.core.Timeline>()

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
    if (timeline.value) {
        timeline.value.play()
    }
}

const handlePause = () => {
    if (timeline.value) {
        timeline.value.pause()
    }
}

const handleStop = () => {
    if (timeline.value) {
        timeline.value.restart().pause()
    }
}

const handleSeek = (time: number) => {
    if (timeline.value) {
        timeline.value.seek(time)
    }
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
    if (item.animation && timeline.value) {
        // 这里可以根据动画数据创建GSAP动画
        timeline.value.clear()
        // 添加动画到时间轴的逻辑
        timeline.value.play()
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

// 初始化
onMounted(() => {
    // 初始化GSAP时间轴
    timeline.value = gsap.timeline({ paused: true })
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
                    />
                </div>
            </div>

            <!-- 底部时间轴 - 增加高度 -->
            <div class="h-48 border-t">
                <Timeline
                    :duration="10"
                    :selected-object="selectedObject"
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