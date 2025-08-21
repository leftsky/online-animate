<template>
    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="min-h-screen bg-background">
            <div class="container mx-auto p-6">
                <!-- 页面标题 -->
                <div class="mb-6">
                    <h1 class="text-3xl font-bold text-foreground">资源库</h1>
                    <p class="mt-2 text-muted-foreground">管理您的场景和物品资源</p>
                </div>

                <!-- 标签页 -->
                <div class="mb-6">
                    <div class="border-b border-border">
                        <nav class="-mb-px flex space-x-8">
                            <button
                                v-for="tab in tabs"
                                :key="tab.key"
                                @click="activeTab = tab.key"
                                :class="[
                                    'border-b-2 px-1 py-2 text-sm font-medium transition-colors',
                                    activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                                ]"
                            >
                                <component :is="tab.icon" class="mr-2 inline h-4 w-4" />
                                {{ tab.title }}
                            </button>
                        </nav>
                    </div>
                </div>

                <!-- 内容区域 -->
                <div class="space-y-6">
                    <!-- 资源列表 -->
                    <div>
                        <!-- 搜索和筛选 -->
                        <div class="mb-4 flex flex-col gap-4 sm:flex-row">
                            <div class="flex-1">
                                <Input v-model="searchQuery" placeholder="搜索资源..." class="max-w-md">
                                    <template #prefix>
                                        <Search class="h-4 w-4 text-muted-foreground" />
                                    </template>
                                </Input>
                            </div>
                            <div class="flex gap-2">
                                <Button @click="showAddDialog = true" class="whitespace-nowrap">
                                    <Plus class="mr-2 h-4 w-4" />
                                    添加{{ getCurrentTabTitle() }}
                                </Button>
                                <Button @click="showBatchUploadDialog = true" variant="outline" class="whitespace-nowrap">
                                    <Upload class="mr-2 h-4 w-4" />
                                    批量上传
                                </Button>
                            </div>
                        </div>

                        <!-- 资源网格 -->
                        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                            <div
                                v-for="resource in filteredResources"
                                :key="resource.id"
                                class="group relative cursor-pointer rounded-lg border border-border bg-card p-2 transition-all hover:border-primary/50"
                                @click="selectResource(resource)"
                            >
                                <!-- 资源图片 -->
                                <div class="mb-2 aspect-square overflow-hidden rounded-md bg-muted">
                                    <img
                                        v-if="resource.image_path"
                                        :src="resource.image_path"
                                        :alt="resource.name"
                                        class="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
                                        <Image class="h-6 w-6" />
                                    </div>
                                </div>

                                <!-- 资源信息 -->
                                <div class="space-y-0.5">
                                    <h3 class="truncate text-xs font-medium text-foreground">
                                        {{ resource.name }}
                                    </h3>
                                    <p v-if="resource.description" class="truncate text-xs text-muted-foreground">
                                        {{ resource.description }}
                                    </p>
                                </div>

                                <!-- 操作按钮 -->
                                <div class="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger as-child>
                                            <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
                                                <MoreVertical class="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem @click="deleteResource(resource)">
                                                <Trash2 class="mr-2 h-4 w-4" />
                                                删除
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        <!-- 空状态 -->
                        <div v-if="filteredResources.length === 0" class="py-12 text-center">
                            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <component :is="getCurrentTabIcon()" class="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 class="mb-2 text-lg font-medium text-foreground">暂无{{ getCurrentTabTitle() }}</h3>
                            <p class="mb-4 text-muted-foreground">点击上方按钮添加您的第一个{{ getCurrentTabTitle() }}</p>
                        </div>

                        <!-- 分页组件 -->
                        <div v-if="pagination.total > 0" class="mt-6">
                            <Pagination
                                :total="Number(pagination.total)"
                                :limit="Number(pagination.limit)"
                                :offset="Number(pagination.offset)"
                                @update:offset="handleOffsetChange"
                                @update:limit="handleLimitChange"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 添加资源对话框 -->
            <Dialog v-model:open="showAddDialog">
                <DialogContent class="max-w-md">
                    <DialogHeader>
                        <DialogTitle>添加{{ getCurrentTabTitle() }}</DialogTitle>
                        <DialogDescription> 创建新的{{ getCurrentTabTitle() }}资源 </DialogDescription>
                    </DialogHeader>

                    <form @submit.prevent="handleAddResource" class="space-y-4">
                        <div class="space-y-2">
                            <Label for="name">名称</Label>
                            <Input id="name" v-model="newResource.name" placeholder="输入名称" required />
                        </div>

                        <div class="space-y-2">
                            <Label for="description">描述</Label>
                            <Textarea id="description" v-model="newResource.description" placeholder="输入描述" rows="3" />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" @click="showAddDialog = false">取消</Button>
                            <Button type="submit" :disabled="loading">添加</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <!-- 批量上传弹窗 -->
            <BatchUploadDialog
                v-model:open="showBatchUploadDialog"
                :resource-type="activeTab === 'scenarios' ? 'scenario' : 'item'"
                @upload-complete="handleBatchUploadComplete"
            />
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import BatchUploadDialog from '@/components/BatchUploadDialog.vue';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/ui/pagination/Pagination.vue';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/composables/useToast';
import AppLayout from '@/layouts/AppLayout.vue';
import { Image, Library, MoreVertical, Plus, Search, Trash2, Upload } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';

import { type MediaItem, type MediaScenario } from '@/services/mediaApi';
import { mediaApi } from '@/utils/api';

// 面包屑导航
const breadcrumbs = [
    { title: '工作台', href: '/dashboard' },
    { title: '资源库', href: '/resource-library' },
];

// 标签页配置
const tabs = [
    { key: 'scenarios', title: '场景库', icon: Image },
    { key: 'items', title: '物品库', icon: Library },
];

// Toast
const { toast } = useToast();

// 响应式数据
const activeTab = ref('scenarios');
const searchQuery = ref('');
const selectedStatus = ref('');
const selectedItemType = ref('');
const showAddDialog = ref(false);
const showBatchUploadDialog = ref(false);
const loading = ref(false);

// 新资源数据
const newResource = ref({
    name: '',
    description: '',
});

// 真实数据
const resources = ref<(MediaScenario | MediaItem)[]>([]);
const pagination = ref({
    total: 0,
    limit: 20,
    offset: 0,
    has_more: false,
});

// 计算属性
const filteredResources = computed(() => {
    if (!Array.isArray(resources.value)) {
        return [];
    }

    let filtered = resources.value.filter((resource) => {
        if (activeTab.value === 'scenarios') return 'generation_prompt' in resource;
        if (activeTab.value === 'items') return 'type' in resource;
        return false;
    });

    if (searchQuery.value) {
        filtered = filtered.filter(
            (resource) =>
                resource.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                resource.description?.toLowerCase().includes(searchQuery.value.toLowerCase()),
        );
    }

    return filtered;
});

// 方法
const getCurrentTabTitle = () => {
    const tab = tabs.find((t) => t.key === activeTab.value);
    return tab ? tab.title.replace('库', '') : '';
};

const getCurrentTabIcon = () => {
    const tab = tabs.find((t) => t.key === activeTab.value);
    return tab ? tab.icon : Library;
};

const selectResource = (resource: any) => {
    console.log('选择资源:', resource);
};

// 删除资源
const deleteResource = async (resource: any) => {
    if (!confirm(`确定要删除"${resource.name}"吗？此操作不可恢复。`)) {
        return;
    }

    try {
        let response;
        if (activeTab.value === 'scenarios') {
            response = await mediaApi.deleteScenario(resource.id);
        } else if (activeTab.value === 'items') {
            response = await mediaApi.deleteItem(resource.id);
        }

        if (response?.success) {
            toast.success('删除成功');
            loadResources();
        } else {
            toast.error(response?.message || '删除失败');
        }
    } catch (error) {
        console.error('删除资源失败:', error);
        toast.error('删除失败，请重试');
    }
};

// 分页处理
const handleOffsetChange = (newOffset: number) => {
    pagination.value.offset = newOffset;
    loadResources();
};

const handleLimitChange = (newLimit: number) => {
    pagination.value.limit = newLimit;
    pagination.value.offset = 0;
    loadResources();
};

// 批量上传完成处理
const handleBatchUploadComplete = (results: any[]) => {
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
        toast.success(`成功上传 ${successCount} 个文件`);
        loadResources();
    }

    if (failCount > 0) {
        toast.error(`${failCount} 个文件上传失败`);
    }
};

const handleAddResource = async () => {
    if (!newResource.value.name.trim()) {
        toast.error('请输入资源名称');
        return;
    }

    loading.value = true;
    try {
        let response;

        if (activeTab.value === 'scenarios') {
            response = await mediaApi.createScenario({
                name: newResource.value.name,
                description: newResource.value.description,
            });
        } else if (activeTab.value === 'items') {
            response = await mediaApi.createItem({
                name: newResource.value.name,
                description: newResource.value.description,
            });
        }

        if (response?.success) {
            toast.success('资源添加成功');
            showAddDialog.value = false;
            resetForm();
            loadResources();
        } else {
            toast.error(response?.message || '添加失败');
        }
    } catch (error) {
        console.error('添加资源失败:', error);
        toast.error('添加资源失败，请重试');
    } finally {
        loading.value = false;
    }
};

const resetForm = () => {
    newResource.value = {
        name: '',
        description: '',
    };
};

// 加载资源数据
const loadResources = async () => {
    loading.value = true;
    try {
        const params = {
            limit: pagination.value.limit,
            offset: pagination.value.offset,
            search: searchQuery.value,
            status: selectedStatus.value ? Number(selectedStatus.value) : undefined,
        };

        let response: any = null;

        if (activeTab.value === 'scenarios') {
            response = await mediaApi.getScenarios(params);
        } else if (activeTab.value === 'items') {
            const itemParams = { ...params, type: selectedItemType.value };
            response = await mediaApi.getItems(itemParams);
        }

        if (response) {
            if (Array.isArray(response.data)) {
                resources.value = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                resources.value = response.data.data;
            } else {
                resources.value = [];
            }

            if (response.data && response.data.pagination) {
                const paginationData = response.data.pagination;
                pagination.value = {
                    total: Number(paginationData.total || 0),
                    limit: Number(paginationData.limit || 20),
                    offset: Number(paginationData.offset || 0),
                    has_more: paginationData.has_more || false,
                };
            }
        } else {
            resources.value = [];
        }
    } catch (error) {
        console.error('加载资源失败:', error);
        toast.error('加载资源失败');
        resources.value = [];
    } finally {
        loading.value = false;
    }
};

// 搜索处理
const handleSearch = () => {
    pagination.value.offset = 0;
    loadResources();
};

// 监听搜索和标签页变化
watch([searchQuery, activeTab], () => {
    handleSearch();
});

// 监听筛选条件变化
watch([selectedStatus, selectedItemType], () => {
    handleSearch();
});

// 生命周期
import { onMounted } from 'vue';

onMounted(() => {
    loadResources();
});
</script>
