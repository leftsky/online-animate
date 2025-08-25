<template>
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div class="p-6">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold">
                    {{ selectedNovel ? `${selectedNovel.title} - 章节列表` : '请选择小说查看章节' }}
                </h3>
                <div v-if="selectedNovel" class="text-sm text-muted-foreground">共 {{ totalChapters }} 章</div>
            </div>

            <!-- 章节列表 -->
            <div v-if="!selectedNovel" class="py-12 text-center text-muted-foreground">
                <svg class="mx-auto mb-4 h-12 w-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                </svg>
                <p>请从左侧选择小说查看章节</p>
            </div>

            <div v-else-if="chapters.length === 0" class="py-8 text-center text-muted-foreground">暂无章节数据</div>

            <div v-else class="space-y-3">
                <div 
                    v-for="chapter in chapters" 
                    :key="chapter.id" 
                    class="rounded-lg border bg-background p-4 transition-colors hover:bg-accent/50 cursor-pointer"
                    @click="showChapterDetail(chapter)"
                >
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="mb-2 font-medium">{{ chapter.title }}</h4>
                            <p class="mb-2 text-sm text-muted-foreground">第{{ chapter.chapter_number }}章 | 字数: {{ chapter.word_count }}</p>
                            <p class="line-clamp-3 text-sm text-muted-foreground">
                                {{ chapter.content_preview || chapter.content }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 分页控件 -->
            <div v-if="selectedNovel && totalChapters > 0" class="mt-6">
                <Pagination
                    :total="totalChapters"
                    :limit="currentLimit"
                    :offset="currentOffset"
                    :limit-options="[5, 10, 20, 50]"
                    @update:offset="handleOffsetChange"
                    @update:limit="handleLimitChange"
                />
            </div>
        </div>

        <!-- 章节详情弹窗 -->
        <Dialog v-model:open="isChapterDialogOpen">
            <DialogContent class="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader class="flex-shrink-0">
                    <DialogTitle class="text-xl font-semibold">
                        {{ selectedChapter?.title }}
                    </DialogTitle>
                    <DialogDescription class="text-sm text-muted-foreground">
                        第{{ selectedChapter?.chapter_number }}章 | 字数: {{ selectedChapter?.word_count }}
                    </DialogDescription>
                </DialogHeader>
                <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                    <div v-if="isLoadingChapter" class="flex items-center justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span class="ml-2 text-muted-foreground">加载中...</span>
                    </div>
                    <div v-else-if="selectedChapter?.content" class="prose prose-sm max-w-none py-2">
                        <div class="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                            {{ selectedChapter.content }}
                        </div>
                    </div>
                </div>
                <DialogFooter class="flex-shrink-0 mt-4">
                    <Button 
                        variant="outline" 
                        @click="copyChapterContent" 
                        class="mr-2"
                        :disabled="isCopying || !selectedChapter?.content"
                    >
                        <svg v-if="isCopying" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        {{ isCopying ? '复制中...' : '复制全文' }}
                    </Button>
                    <Button variant="outline" @click="closeChapterDialog">关闭</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup>
import Pagination from '@/components/ui/pagination/Pagination.vue';
import { apiGet } from '@/utils/api';
import { ref, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/composables/useToast';

// 定义props
const props = defineProps({
    selectedNovel: {
        type: Object,
        default: null,
    },
});

// Toast
const { toast } = useToast();

// 组件内部状态
const chapters = ref([]);
const totalChapters = ref(0);
const currentLimit = ref(10); // 改为10，确保在limitOptions中存在
const currentOffset = ref(0);
const isLoading = ref(false);
const isChapterDialogOpen = ref(false);
const selectedChapter = ref(null);
const isLoadingChapter = ref(false);
const isCopying = ref(false);

// 加载章节列表
const loadChapters = async (novelId, offset = 0, limit = 10) => { // 改为10
    if (!novelId) return;

    isLoading.value = true;
    try {
        const result = await apiGet(`/novels/${novelId}/chapters?limit=${limit}&offset=${offset}`);

        if (result.success && result.data) {
            chapters.value = result.data.chapters || result.data;
            totalChapters.value = result.data.total || result.data.length;
            currentOffset.value = offset;
            currentLimit.value = limit;
        } else {
            chapters.value = [];
            totalChapters.value = 0;
        }
    } catch (error) {
        console.error('加载章节列表失败:', error);
        chapters.value = [];
        totalChapters.value = 0;
    } finally {
        isLoading.value = false;
    }
};

// 处理分页偏移量变化
const handleOffsetChange = (newOffset) => {
    if (props.selectedNovel) {
        loadChapters(props.selectedNovel.id, newOffset, currentLimit.value);
    }
};

// 处理每页显示数量变化
const handleLimitChange = (newLimit) => {
    if (props.selectedNovel) {
        // 重置到第一页
        loadChapters(props.selectedNovel.id, 0, newLimit);
    }
};

// 显示章节详情
const showChapterDetail = async (chapter) => {
    selectedChapter.value = chapter;
    isChapterDialogOpen.value = true;
    isLoadingChapter.value = true;
    try {
        // 使用正确的API路径调用showChapter接口
        const result = await apiGet(`/novels/${props.selectedNovel.id}/chapters/${chapter.id}`);
        if (result.success && result.data) {
            selectedChapter.value = result.data;
        } else {
            selectedChapter.value = null;
        }
    } catch (error) {
        console.error('加载章节详情失败:', error);
        selectedChapter.value = null;
    } finally {
        isLoadingChapter.value = false;
    }
};

// 关闭章节详情弹窗
const closeChapterDialog = () => {
    isChapterDialogOpen.value = false;
    selectedChapter.value = null;
};

// 复制章节内容
const copyChapterContent = async () => {
    if (!selectedChapter.value?.content) {
        toast.error('章节内容为空，无法复制');
        return;
    }

    isCopying.value = true;
    try {
        // 尝试使用现代 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(selectedChapter.value.content);
            toast.success('章节内容已复制到剪贴板！');
        } else {
            // 降级方案：使用传统的 document.execCommand
            const textArea = document.createElement('textarea');
            textArea.value = selectedChapter.value.content;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                toast.success('章节内容已复制到剪贴板！');
            } else {
                throw new Error('复制命令执行失败');
            }
        }
    } catch (error) {
        console.error('复制失败:', error);
        toast.error('复制失败，请手动复制内容');
    } finally {
        isCopying.value = false;
    }
};

// 监听选中的小说变化
watch(
    () => props.selectedNovel,
    (newNovel) => {
        if (newNovel) {
            loadChapters(newNovel.id, 0, currentLimit.value);
        } else {
            chapters.value = [];
            totalChapters.value = 0;
            currentOffset.value = 0;
        }
    },
    { immediate: true },
);
</script>

<style scoped>
/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
    width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: hsl(var(--muted) / 0.3);
    border-radius: 6px;
    margin: 4px 0;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.6);
    border-radius: 6px;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    background-clip: content-box;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--primary) / 0.8);
    background-clip: content-box;
}

.custom-scrollbar::-webkit-scrollbar-thumb:active {
    background: hsl(var(--primary));
    background-clip: content-box;
}

/* Firefox 滚动条样式 */
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.6) hsl(var(--muted) / 0.3);
}

/* 确保内容区域有足够的内边距 */
.custom-scrollbar > div {
    padding-right: 12px;
}

/* 弹窗内容区域优化 */
.custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
}
</style>
