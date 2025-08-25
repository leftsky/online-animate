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

            <div v-else class="chapter-list-container">
                <el-scrollbar height="500px" class="chapter-scrollbar">
                    <div class="space-y-3 p-2">
                        <div
                            v-for="chapter in chapters"
                            :key="chapter.id"
                            class="chapter-item cursor-pointer rounded-lg border bg-background p-4 transition-all duration-200 hover:bg-accent/50 hover:shadow-md"
                            @click="showChapterDetail(chapter)"
                        >
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h4 class="mb-2 font-medium text-foreground">{{ chapter.title }}</h4>
                                    <p class="mb-2 text-sm text-muted-foreground">
                                        第{{ chapter.chapter_number }}章 | 字数: {{ chapter.word_count }}
                                    </p>
                                    <p class="line-clamp-3 text-sm text-muted-foreground">
                                        {{ chapter.content_preview || chapter.content }}
                                    </p>
                                </div>
                                <div class="ml-4 flex-shrink-0">
                                    <el-icon class="text-muted-foreground transition-colors hover:text-primary">
                                        <ArrowRight />
                                    </el-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-scrollbar>
            </div>

            <!-- 分页控件 -->
            <div v-if="selectedNovel" class="mt-6">
                <el-pagination
                    v-if="totalChapters > 0"
                    :total="totalChapters"
                    :page-size="perPage"
                    :current-page="currentPage"
                    :page-sizes="[5, 10, 20, 50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handlePageSizeChange"
                    @current-change="handleCurrentPageChange"
                    :hide-on-single-page="false"
                />
                <div v-else-if="chapters.length === 0 && !isLoading" class="py-4 text-center text-muted-foreground">暂无章节数据</div>
                <div v-else-if="isLoading" class="py-4 text-center text-muted-foreground">
                    <el-icon class="is-loading mr-2"><Loading /></el-icon>
                    加载中...
                </div>
            </div>
        </div>

        <!-- 章节详情弹窗 -->
        <el-dialog
            v-model="isChapterDialogOpen"
            :title="selectedChapter?.title"
            width="80%"
            :close-on-click-modal="false"
            :close-on-press-escape="true"
        >
            <div class="mb-4 text-sm text-muted-foreground">第{{ selectedChapter?.chapter_number }}章 | 字数: {{ selectedChapter?.word_count }}</div>

            <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-2" style="max-height: 60vh">
                <div v-if="isLoadingChapter" class="flex items-center justify-center py-8">
                    <el-icon class="is-loading mr-2"><Loading /></el-icon>
                    <span class="text-muted-foreground">加载中...</span>
                </div>
                <div v-else-if="selectedChapter?.content" class="prose prose-sm max-w-none py-2">
                    <div class="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {{ selectedChapter.content }}
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" plain @click="copyChapterContent" :loading="isCopying" :disabled="!selectedChapter?.content">
                        <el-icon v-if="!isCopying" class="mr-2"><DocumentCopy /></el-icon>
                        {{ isCopying ? '复制中...' : '复制全文' }}
                    </el-button>
                    <el-button @click="closeChapterDialog">关闭</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { apiGet } from '@/utils/api';
import { ArrowRight, DocumentCopy, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { ref, watch } from 'vue';

// 定义props
const props = defineProps({
    selectedNovel: {
        type: Object,
        default: null,
    },
});

// 组件内部状态
const chapters = ref([]);
const totalChapters = ref(0);
const currentPage = ref(1);
const perPage = ref(10);
const isLoading = ref(false);
const isChapterDialogOpen = ref(false);
const selectedChapter = ref(null);
const isLoadingChapter = ref(false);
const isCopying = ref(false);

// 加载章节列表
const loadChapters = async (novelId, page = 1, pageSize = 10) => {
    if (!novelId) return;

    isLoading.value = true;
    try {
        const result = await apiGet(`/novels/${novelId}/chapters?page=${page}&per_page=${pageSize}`);

        if (result.success && result.data) {
            chapters.value = result.data.chapters || [];
            totalChapters.value = result.data.total || 0;
            currentPage.value = result.data.current_page || page;
            perPage.value = result.data.per_page || pageSize;
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

// 处理每页显示数量变化
const handlePageSizeChange = (newPageSize) => {
    if (props.selectedNovel) {
        // 重置到第一页
        loadChapters(props.selectedNovel.id, 1, newPageSize);
    }
};

// 处理当前页变化
const handleCurrentPageChange = (newPage) => {
    if (props.selectedNovel) {
        loadChapters(props.selectedNovel.id, newPage, perPage.value);
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
        ElMessage.error('章节内容为空，无法复制');
        return;
    }

    isCopying.value = true;
    try {
        // 尝试使用现代 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(selectedChapter.value.content);
            ElMessage.success('章节内容已复制到剪贴板！');
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
                ElMessage.success('章节内容已复制到剪贴板！');
            } else {
                throw new Error('复制命令执行失败');
            }
        }
    } catch (error) {
        console.error('复制失败:', error);
        ElMessage.error('复制失败，请手动复制内容');
    } finally {
        isCopying.value = false;
    }
};

// 监听选中的小说变化
watch(
    () => props.selectedNovel,
    (newNovel) => {
        if (newNovel) {
            // 直接加载章节数据
            loadChapters(newNovel.id, 1, perPage.value);
        } else {
            chapters.value = [];
            totalChapters.value = 0;
            currentPage.value = 1;
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

/* Element Plus 弹窗样式调整 */
:deep(.el-dialog) {
    border-radius: 8px;
}

:deep(.el-dialog__header) {
    padding: 20px 20px 10px;
    border-bottom: 1px solid #e4e7ed;
}

:deep(.el-dialog__body) {
    padding: 20px;
}

:deep(.el-dialog__footer) {
    padding: 10px 20px 20px;
    border-top: 1px solid #e4e7ed;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 章节列表容器样式 */
.chapter-list-container {
    border: 1px solid hsl(var(--border));
    border-radius: 8px;
    overflow: hidden;
}

.chapter-scrollbar {
    background: hsl(var(--background));
}

/* Element Plus 滚动条样式优化 */
:deep(.chapter-scrollbar .el-scrollbar__bar) {
    background: transparent;
}

:deep(.chapter-scrollbar .el-scrollbar__thumb) {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 4px;
    transition: all 0.2s ease;
}

:deep(.chapter-scrollbar .el-scrollbar__thumb:hover) {
    background: hsl(var(--primary) / 0.6);
}

/* 章节项样式优化 */
.chapter-item {
    position: relative;
    overflow: hidden;
}

.chapter-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
}

.chapter-item:hover::before {
    opacity: 1;
}

.chapter-item:hover {
    transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .chapter-list-container {
        margin: 0 -1rem;
        border-left: none;
        border-right: none;
        border-radius: 0;
    }

    .chapter-scrollbar {
        height: 300px !important;
    }
}
</style>
