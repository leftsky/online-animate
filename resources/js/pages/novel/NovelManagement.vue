<template>
    <AppLayout>
        <div class="container mx-auto py-6">
            <div class="space-y-6">
                <!-- 页面标题 -->
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold tracking-tight">小说管理</h1>
                        <p class="text-muted-foreground">管理已导入的小说，查看章节内容，支持文件导入和删除</p>
                    </div>
                </div>

                <!-- 导入结果 -->
                <div v-if="importResult" class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6">
                        <h3 class="mb-4 text-lg font-semibold">导入结果</h3>
                        <div v-if="importResult.success" class="space-y-3">
                            <div class="flex items-center space-x-2 text-green-600">
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <span class="font-medium">{{ importResult.message }}</span>
                            </div>
                            <div v-if="importResult.data" class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                                <div>
                                    <span class="text-muted-foreground">小说ID:</span>
                                    <span class="ml-2 font-mono">{{ importResult.data.novel_id }}</span>
                                </div>
                                <div>
                                    <span class="text-muted-foreground">标题:</span>
                                    <span class="ml-2">{{ importResult.data.title }}</span>
                                </div>
                                <div>
                                    <span class="text-muted-foreground">章节数:</span>
                                    <span class="ml-2">{{ importResult.data.chapter_count }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="flex items-center space-x-2 text-red-600">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            <span class="font-medium">{{ importResult.message }}</span>
                        </div>
                    </div>
                </div>

                <!-- 主要内容区域 - 左右分栏 -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    <!-- 左侧：小说列表 -->
                    <div class="lg:col-span-1">
                        <NovelList
                            :novels="novels"
                            :selected-novel="selectedNovel"
                            :is-importing="isImporting"
                            @select="selectNovel"
                            @delete="deleteNovel"
                            @import="selectNovelFile"
                        />
                    </div>

                    <!-- 右侧：章节列表 -->
                    <div class="lg:col-span-3">
                        <ChapterList :selected-novel="selectedNovel" />
                    </div>
                </div>
            </div>
        </div>
        <ConfirmDialog />
    </AppLayout>
</template>

<script setup>
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import AppLayout from '@/layouts/AppLayout.vue';
import ConfirmDialog from '@/pages/storyboard/components/ConfirmDialog.vue';
import { apiDelete, apiGet, apiPost, uploadApi } from '@/utils/api';
import { onMounted, ref } from 'vue';
import ChapterList from './components/ChapterList.vue';
import NovelList from './components/NovelList.vue';

// 类型注释（仅用于文档，不进行类型检查）

const { toast } = useToast();
const { confirm } = useConfirm();

const isImporting = ref(false);
const importResult = ref(null);
const novels = ref([]);
const selectedNovel = ref(null);

// 选择小说文件
const selectNovelFile = async () => {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.doc,.docx,.pdf';
        input.multiple = false;

        input.onchange = async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
                // 自动开始导入流程
                await autoImportNovel(files[0]);
            }
        };

        input.click();
    } catch (error) {
        console.error('选择文件失败:', error);
        toast.error('选择文件失败');
    }
};

// 自动导入小说
const autoImportNovel = async (file) => {
    // 验证输入
    if (!file) {
        toast.error('请选择小说文件');
        return;
    }

    isImporting.value = true;
    importResult.value = null;

    try {
        // 上传文件
        const uploadResult = await uploadApi.uploadFile(file, {
            folder: 'novels',
        });

        if (uploadResult.success) {
            // 文件上传成功后，调用导入API
            const result = await apiPost('/novels/import-url', { url: uploadResult.data.url });

            if (result.success) {
                importResult.value = {
                    success: true,
                    message: result.message,
                    data: result.data,
                };

                toast.success(result.message);
                // 重新加载小说列表
                loadNovels();
            } else {
                importResult.value = {
                    success: false,
                    message: result.message || '导入失败',
                };
                toast.error(result.message || '导入失败');
            }
        } else {
            importResult.value = {
                success: false,
                message: uploadResult.message || '文件上传失败',
            };
            toast.error(uploadResult.message || '文件上传失败');
        }
    } catch (error) {
        console.error('导入小说失败:', error);
        importResult.value = {
            success: false,
            message: '网络错误，请稍后重试',
        };
        toast.error('网络错误，请稍后重试');
    } finally {
        isImporting.value = false;
    }
};

// 加载小说列表
const loadNovels = async () => {
    try {
        const result = await apiGet('/novels');

        if (result.success) {
            novels.value = result.data.novels || result.data || [];
        }
    } catch (error) {
        console.error('加载小说列表失败:', error);
    }
};

// 选择小说
const selectNovel = async (novel) => {
    selectedNovel.value = novel;
};

// 删除小说
const deleteNovel = async (novel) => {
    const confirmed = await confirm({
        title: '确认删除',
        message: `确定要删除小说"${novel.title}"吗？此操作不可逆。`,
        confirmText: '删除',
        cancelText: '取消',
        variant: 'destructive',
    });

    if (!confirmed) return;

    try {
        const result = await apiDelete(`/novels/${novel.id}`);
        if (result.success) {
            toast.success('小说删除成功');
            novels.value = novels.value.filter((n) => n.id !== novel.id);

            // 如果删除的是当前选中的小说，清空选择
            if (selectedNovel.value?.id === novel.id) {
                selectedNovel.value = null;
            }
        } else {
            toast.error(result.message || '小说删除失败');
        }
    } catch (error) {
        console.error('删除小说失败:', error);
        toast.error('网络错误，请稍后重试');
    }
};

// 组件挂载时加载小说列表
onMounted(() => {
    loadNovels();
});
</script>
