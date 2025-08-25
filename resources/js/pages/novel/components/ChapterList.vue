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
                <div v-for="chapter in chapters" :key="chapter.id" class="rounded-lg border bg-background p-4 transition-colors hover:bg-accent/50">
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
                    @update:offset="handleOffsetChange"
                    @update:limit="handleLimitChange"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import Pagination from '@/components/ui/pagination/Pagination.vue';
import { apiGet } from '@/utils/api';
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
const currentLimit = ref(5);
const currentOffset = ref(0);
const isLoading = ref(false);

// 加载章节列表
const loadChapters = async (novelId, offset = 0, limit = 5) => {
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
