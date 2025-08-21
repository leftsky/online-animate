<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="h-4/5 w-4/5 max-w-none">
            <!-- 头部 -->
            <DialogHeader>
                <DialogTitle>{{ title || '选择资源' }}</DialogTitle>
                <DialogDescription> 从资源库中选择图片资源来添加到分镜内容中 </DialogDescription>
            </DialogHeader>

            <!-- 搜索栏 -->
            <div class="border-b border-border p-4">
                <div class="flex gap-2">
                    <div class="relative flex-1">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="搜索资源..."
                            class="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                            @keydown.enter="search"
                        />
                        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                    </div>
                    <Button @click="search" :disabled="loading" class="px-4">
                        <Search class="mr-2 h-4 w-4" />
                        搜索
                    </Button>
                </div>
            </div>

            <!-- 内容区域 -->
            <div class="flex min-h-0 flex-1">
                <!-- 左侧分类 -->
                <div class="w-48 border-r border-border bg-muted/20 p-4">
                    <h4 class="mb-3 font-medium text-foreground">分类</h4>
                    <div class="space-y-1">
                        <button
                            @click="selectCategory('')"
                            :class="[
                                'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                                !selectedCategory
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            ]"
                        >
                            全部分类
                        </button>
                        <button
                            v-for="category in categories"
                            :key="category.key"
                            @click="selectCategory(category.key)"
                            :class="[
                                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                                selectedCategory === category.key
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            ]"
                        >
                            <component :is="category.icon" class="h-4 w-4" />
                            {{ category.name }}
                        </button>
                    </div>
                </div>

                <!-- 右侧资源网格 -->
                <div class="flex-1 overflow-auto bg-background p-4">
                    <div v-if="loading" class="flex h-full items-center justify-center">
                        <div class="text-center">
                            <Loader2 class="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                            <p class="text-muted-foreground">加载中...</p>
                        </div>
                    </div>

                    <div v-else-if="resources.length === 0" class="flex h-full items-center justify-center">
                        <div class="text-center text-muted-foreground">
                            <Image class="mx-auto mb-2 h-12 w-12 opacity-50" />
                            <p>暂无资源</p>
                            <p class="mt-1 text-sm">请先上传一些资源到资源库</p>
                        </div>
                    </div>

                    <div v-else class="grid grid-cols-4 gap-4">
                        <div
                            v-for="resource in resources"
                            :key="resource.id"
                            @click="selectResource(resource)"
                            :class="[
                                'group relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-lg',
                                selectedResource?.id === resource.id
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-border hover:border-primary/50 hover:bg-accent/50',
                            ]"
                        >
                            <!-- 图片容器 -->
                            <div class="aspect-square overflow-hidden rounded-t-lg bg-muted">
                                <img
                                    v-if="resource.image_path"
                                    :src="resource.image_path"
                                    :alt="resource.name"
                                    class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    @error="handleImageError"
                                />
                                <div v-else class="flex h-full w-full items-center justify-center bg-muted">
                                    <Image class="h-8 w-8 text-muted-foreground" />
                                </div>
                            </div>

                            <!-- 资源信息 -->
                            <div class="bg-card p-3">
                                <p class="mb-1 truncate text-sm font-medium text-foreground">
                                    {{ resource.name || '未命名' }}
                                </p>
                                <p class="text-xs text-muted-foreground">
                                    {{ getCategoryName(resource.type) }}
                                </p>
                            </div>

                            <!-- 选中状态指示器 -->
                            <div
                                v-if="selectedResource?.id === resource.id"
                                class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg"
                            >
                                <Check class="h-4 w-4 text-primary-foreground" />
                            </div>

                            <!-- 悬停时的选择提示 -->
                            <div
                                v-if="selectedResource?.id !== resource.id"
                                class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            >
                                <span class="text-sm font-medium text-white">点击选择</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部操作 -->
            <DialogFooter>
                <Button variant="outline" @click="close" class="px-4">取消</Button>
                <Button @click="confirm" :disabled="!selectedResource" class="px-4">
                    <Check class="mr-2 h-4 w-4" />
                    确认选择
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mediaApi, type MediaCharacter, type MediaItem, type MediaScenario } from '@/services/mediaApi';
import { Check, Image, Loader2, Mountain, Package, Search, User } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';

interface Props {
    visible: boolean;
    title?: string;
}

interface Emits {
    (e: 'close'): void;
    (e: 'select', resource: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const loading = ref(false);
const searchQuery = ref('');
const selectedCategory = ref<string>('');
const selectedResource = ref<any>(null);
const resources = ref<any[]>([]);

// 分类配置
const categories = [
    { key: 'scenarios', name: '背景', icon: Mountain },
    { key: 'characters', name: '人物', icon: User },
    { key: 'items', name: '物品', icon: Package },
];

// 计算属性：控制对话框显示
const isOpen = computed({
    get: () => props.visible,
    set: (value) => {
        if (!value) {
            emit('close');
        }
    },
});

// 方法
const close = () => {
    emit('close');
};

const search = async () => {
    await loadResources();
};

const selectCategory = (category: string) => {
    selectedCategory.value = category;
    loadResources();
};

const selectResource = (resource: any) => {
    selectedResource.value = resource;
};

const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
        parent.innerHTML =
            '<div class="w-full h-full flex items-center justify-center bg-muted"><Image class="w-8 h-8 text-muted-foreground" /></div>';
    }
};

const getCategoryName = (type: string) => {
    const category = categories.find((cat) => cat.key === type);
    return category ? category.name : '未分类';
};

const confirm = () => {
    if (selectedResource.value) {
        // 转换为统一的资源格式
        const resource = {
            id: selectedResource.value.id,
            name: selectedResource.value.name,
            url: selectedResource.value.image_path,
            type: selectedResource.value.type,
            category: getCategoryName(selectedResource.value.type),
        };
        emit('select', resource);
        close();
    }
};

const loadResources = async () => {
    loading.value = true;
    try {
        // 构建搜索参数
        const params: any = {
            limit: 50,
            offset: 0,
        };

        if (searchQuery.value) {
            params.search = searchQuery.value;
        }

        let allResources: any[] = [];

        // 根据选中的分类加载对应类型的资源
        if (!selectedCategory.value) {
            // 加载所有类型的资源
            const [scenariosRes, charactersRes, itemsRes] = await Promise.all([
                mediaApi.getScenarios(params),
                mediaApi.getCharacters(params),
                mediaApi.getItems(params),
            ]);

            allResources = [
                ...scenariosRes.data.map((item: MediaScenario) => ({
                    ...item,
                    type: 'scenarios',
                })),
                ...charactersRes.data.map((item: MediaCharacter) => ({
                    ...item,
                    type: 'characters',
                })),
                ...itemsRes.data.map((item: MediaItem) => ({
                    ...item,
                    type: 'items',
                })),
            ];
        } else {
            // 加载指定类型的资源
            let response;
            if (selectedCategory.value === 'scenarios') {
                response = await mediaApi.getScenarios(params);
                allResources = response.data.map((item: MediaScenario) => ({
                    ...item,
                    type: 'scenarios',
                }));
            } else if (selectedCategory.value === 'characters') {
                response = await mediaApi.getCharacters(params);
                allResources = response.data.map((item: MediaCharacter) => ({
                    ...item,
                    type: 'characters',
                }));
            } else if (selectedCategory.value === 'items') {
                response = await mediaApi.getItems(params);
                allResources = response.data.map((item: MediaItem) => ({
                    ...item,
                    type: 'items',
                }));
            }
        }

        // 过滤出有图片的资源
        resources.value = allResources.filter((resource) => resource.image_path);
    } catch (error) {
        console.error('加载资源失败:', error);
    } finally {
        loading.value = false;
    }
};

// 监听visible变化，当打开时加载资源
watch(
    () => props.visible,
    (newVisible) => {
        if (newVisible) {
            loadResources();
        }
    },
);

// 生命周期
onMounted(() => {
    if (props.visible) {
        loadResources();
    }
});
</script>
