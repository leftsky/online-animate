<template>
    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="min-h-screen bg-background">
            <div class="container mx-auto p-6">
                <!-- 页面标题 -->
                <div class="mb-6">
                    <h1 class="text-3xl font-bold text-foreground">人物库</h1>
                    <p class="mt-2 text-muted-foreground">管理您的人物角色和3D模型资源</p>
                </div>

                <div class="flex h-[calc(100vh-200px)] gap-6">
                    <!-- 左侧人物列表 -->
                    <div class="flex w-80 flex-col">
                        <!-- 搜索和操作 -->
                        <div class="mb-4 space-y-3">
                            <Input v-model="searchQuery" placeholder="搜索人物...">
                                <template #prefix>
                                    <Search class="h-4 w-4 text-muted-foreground" />
                                </template>
                            </Input>
                            <div class="flex gap-2">
                                <Button @click="showAddDialog = true" class="flex-1">
                                    <Plus class="mr-2 h-4 w-4" />
                                    添加人物
                                </Button>
                            </div>
                        </div>

                        <!-- 人物列表 -->
                        <div class="flex-1 space-y-2 overflow-y-auto pr-2">
                            <CharacterCard
                                v-for="character in filteredResources"
                                :key="character.id"
                                :character="character"
                                :is-selected="selectedCharacter?.id === character.id"
                                @select="selectResource"
                                @upload-model="handleModelUploadClick"
                                @delete="deleteResource"
                            />

                            <div v-if="loadStatus === 'loading'" class="py-4 text-center">
                                <div class="text-sm text-muted-foreground">加载中...</div>
                            </div>

                            <div v-if="filteredResources.length === 0 && loadStatus !== 'loading'" class="py-8 text-center">
                                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <Users class="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 class="mb-1 text-sm font-medium text-foreground">暂无人物</h3>
                                <p class="text-xs text-muted-foreground">点击上方按钮添加人物</p>
                            </div>
                        </div>

                        <!-- 分页控制 -->
                        <div v-if="totalNum > 0" class="mt-4 flex items-center justify-between">
                            <div class="text-sm text-muted-foreground">共 {{ totalNum }} 个人物</div>
                            <div class="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    :disabled="loadStatus === 'no-more' || loadStatus === 'loading'"
                                    @click="nextPage"
                                >
                                    加载更多
                                </Button>
                                <span v-if="loadStatus === 'no-more'" class="text-xs text-muted-foreground"> 已加载全部 </span>
                            </div>
                        </div>
                    </div>

                    <div class="relative flex-1 overflow-hidden rounded-lg border border-border bg-card">
                        <canvas ref="threeCanvas" class="h-full w-full" :class="{ 'opacity-0': modelStatus === 'loading' }"></canvas>

                        <!-- 覆盖层 -->
                        <div
                            v-if="modelStatus === 'loading' || modelStatus === 'created' || modelStatus === 'inited'"
                            class="absolute inset-0 flex items-center justify-center bg-card text-muted-foreground"
                        >
                            <!-- 加载中状态 -->
                            <div v-if="modelStatus === 'loading'" class="text-center">
                                <div class="mx-auto mb-4 flex h-16 w-16 animate-spin items-center justify-center rounded-full bg-muted">
                                    <Package class="h-8 w-8" />
                                </div>
                                <h3 class="mb-2 text-lg font-medium">加载模型中...</h3>
                                <p class="text-sm">请稍候</p>
                            </div>

                            <!-- 默认状态 -->
                            <div v-else class="text-center">
                                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <Package class="h-8 w-8" />
                                </div>
                                <h3 class="mb-2 text-lg font-medium">Three.js 画布</h3>
                                <p class="text-sm">选择左侧有模型的人物查看3D模型</p>
                            </div>
                        </div>

                        <!-- 模型信息显示 -->
                        <div
                            v-if="modelStatus === 'loaded' && selectedCharacter"
                            class="absolute left-4 top-4 rounded-lg border border-border bg-background/80 p-3 text-sm backdrop-blur-sm"
                        >
                            <h4 class="font-medium text-foreground">{{ selectedCharacter.name }}</h4>
                            <p class="text-xs text-muted-foreground">3D模型预览</p>
                        </div>
                    </div>

                    <!-- 右侧区域 -->
                    <div class="flex w-80 flex-col rounded-lg border border-border bg-card">
                        <!-- 模型控制面板 -->
                        <ModelControlPanel
                            ref="controlPanelRef"
                            :model-name="selectedCharacter.name"
                            :model-init-params="modelInitParams"
                            :available-animations="availableAnimations"
                            @animation-play="handleAnimationPlay"
                            @animation-pause="handleAnimationPause"
                            @animation-stop="handleAnimationStop"
                            @model-update="modelController.updateParams"
                            @toggle-bounding-box="handleToggleBoundingBox"
                            @toggle-skeleton="handleToggleSkeleton"
                            v-if="modelStatus === 'loaded' && selectedCharacter"
                        />
                    </div>
                </div>
            </div>

            <!-- 添加人物对话框 -->
            <AddCharacterDialog v-model:open="showAddDialog" :loading="loadStatus === 'loading'" @submit="handleAddResource" />

            <!-- 隐藏的模型文件输入 -->
            <input ref="modelFileInput" type="file" accept=".glb,.gltf,.fbx,.obj,.dae,.3ds,.blend" class="hidden" @change="handleModelFileUpload" />
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import ModelControlPanel from '@/components/ModelControlPanel.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/composables/useToast';
import AppLayout from '@/layouts/AppLayout.vue';
import { Package, Plus, Search, Users } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import AddCharacterDialog from './components/AddCharacterDialog.vue';
import CharacterCard from './components/CharacterCard.vue';

import { useModelController } from '@/lib/three/ModelController';
import { useThreeJSManager } from '@/lib/three/ThreeJSBaseManager';
import { type MediaCharacter } from '@/services/mediaApi';
import { mediaApi, uploadApi } from '@/utils/api';
import { usePagination } from 'vue3-help';

const threeManager = useThreeJSManager();
const { destroyThreeJS, initThreeJS, handleResize } = threeManager;
const modelController = useModelController(threeManager);
const {
    load,
    animations: availableAnimations,
    status: modelStatus,
    clear: clearModelDisplay,
    toggleBoundingBox: handleToggleBoundingBox,
    toggleSkeleton: handleToggleSkeleton,
} = modelController;
const modelInitParams = ref<any>({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
});

// 面包屑导航
const breadcrumbs = [
    { title: '工作台', href: '/dashboard' },
    { title: '人物库', href: '/character-library' },
];

// Toast
const { toast } = useToast();
const threeCanvas = ref<HTMLCanvasElement>();

// 响应式数据
const searchQuery = ref('');
const selectedGender = ref('');
const showAddDialog = ref(false);

const selectedCharacter = ref<MediaCharacter | null>(null);
const modelFileInput = ref<HTMLInputElement>();
const isUploadingModel = ref(false);
const currentUploadingCharacter = ref<MediaCharacter | null>(null);

// 模型控制面板相关状态
const controlPanelRef = ref<InstanceType<typeof ModelControlPanel> | null>(null);

// 使用usePagination管理分页
const { fullList, nextPage, loadStatus, totalNum } = usePagination({
    api: (params: any) => mediaApi.getCharacters(params),
    pageSize: 20,
    initParams: {
        search: searchQuery.value,
        gender: selectedGender.value ? Number(selectedGender.value) : undefined,
    },
    cacheNextPageAtFirst: false,
    autoCacheNextPage: false,
});

// 真实数据
const resources = computed(() => fullList.value);

// 计算属性
const filteredResources = computed(() => {
    if (!Array.isArray(resources.value)) {
        return [];
    }

    let filtered = resources.value;

    if (searchQuery.value) {
        filtered = filtered.filter(
            (resource) =>
                resource.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                resource.description?.toLowerCase().includes(searchQuery.value.toLowerCase()),
        );
    }

    if (selectedGender.value) {
        filtered = filtered.filter((resource) => resource.gender === Number(selectedGender.value));
    }

    return filtered;
});

// 处理模型文件上传点击
const handleModelUploadClick = (character: MediaCharacter) => {
    currentUploadingCharacter.value = character;
    modelFileInput.value?.click();
};

// 处理模型文件上传
const handleModelFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    const character = currentUploadingCharacter.value;

    if (!file || !character) return;

    const allowedTypes = ['.glb', '.gltf', '.fbx', '.obj', '.dae', '.3ds', '.blend'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
        toast.error('请选择支持的模型文件格式');
        return;
    }

    if (file.size > 100 * 1024 * 1024) {
        toast.error('文件大小不能超过100MB');
        return;
    }

    isUploadingModel.value = true;

    try {
        const uploadResult = await uploadApi.uploadFile(file, {
            type: 'model',
            folder: 'models',
        });

        if (uploadResult.success && uploadResult.data?.url) {
            let currentResources = {};
            if (character.additional_resources) {
                try {
                    const resourcesData = character.additional_resources;
                    if (typeof resourcesData === 'string') {
                        currentResources = JSON.parse(resourcesData);
                    }
                } catch {
                    currentResources = {};
                }
            }

            const updatedResources = {
                ...currentResources,
                modelFile: uploadResult.data.url,
            };

            const updateResult = await mediaApi.updateCharacter(character.id, {
                additional_resources: updatedResources,
            });

            if (updateResult.success) {
                // 重新加载数据以获取最新状态
                await loadResources();

                toast.success('模型文件上传成功');
            } else {
                throw new Error(updateResult.message || '更新失败');
            }
        } else {
            throw new Error(uploadResult.message || '上传失败');
        }
    } catch (error) {
        console.error('上传失败:', error);
        toast.error('上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
        isUploadingModel.value = false;
        currentUploadingCharacter.value = null;
        if (target) {
            target.value = '';
        }
    }
};

const selectResource = async (resource: MediaCharacter) => {
    selectedCharacter.value = resource;

    if (resource.additional_resources) {
        await load(resource.additional_resources?.modelFile);
        modelInitParams.value = modelController.getModelParams();
    } else {
        clearModelDisplay();
    }
};

// 删除资源
const deleteResource = async (resource: MediaCharacter) => {
    if (!confirm(`确定要删除"${resource.name}"吗？此操作不可恢复。`)) {
        return;
    }

    try {
        const response = await mediaApi.deleteCharacter(resource.id);

        if (response?.success) {
            toast.success('删除成功');
            loadResources();
        } else {
            toast.error(response?.message || '删除失败');
        }
    } catch (error) {
        console.error('删除人物失败:', error);
        toast.error('删除失败，请重试');
    }
};

const handleAddResource = async (data: { name: string; description: string; gender: number; age?: number }) => {
    try {
        const response = await mediaApi.createCharacter({
            name: data.name,
            description: data.description,
            gender: data.gender,
            age: data.age,
        });

        if (response?.success) {
            toast.success('人物添加成功');
            showAddDialog.value = false;
            loadResources();
        } else {
            toast.error(response?.message || '添加失败');
        }
    } catch (error) {
        console.error('添加人物失败:', error);
        toast.error('添加人物失败，请重试');
    }
};

// 加载资源数据
const loadResources = async () => {
    try {
        // 使用usePagination的nextPage方法重新加载数据
        await nextPage(true);

        if (!selectedCharacter.value && resources.value.length > 0) {
            const firstCharacterWithModel = resources.value.find((resource: MediaCharacter) => resource.additional_resources);

            if (firstCharacterWithModel) {
                selectResource(firstCharacterWithModel);
            }
        }
    } catch (error) {
        console.error('加载人物失败:', error);
        toast.error('加载人物失败');
    }
};

// 搜索处理
const handleSearch = () => {
    loadResources();
};

// 监听搜索和筛选条件变化
watch([searchQuery, selectedGender], () => {
    handleSearch();
});

// 生命周期
onMounted(async () => {
    loadResources();

    if (threeCanvas.value) {
        initThreeJS(threeCanvas.value);
        window.addEventListener('resize', handleResize);
    }
});

// 组件卸载时清理资源
const cleanup = () => {
    window.removeEventListener('resize', handleResize);

    destroyThreeJS();
};

watch(() => false, cleanup);

// 模型控制面板事件处理方法
const handleAnimationPlay = (animationIndex: number) => {
    const success = modelController.play(animationIndex);
    if (success) {
        controlPanelRef.value?.setAnimationState(true);
        console.log('播放动画成功');
    } else {
        toast.error('播放动画失败');
    }
};

const handleAnimationPause = () => {
    const success = modelController.pause();
    if (success) {
        controlPanelRef.value?.setAnimationState(false);
    }
};

const handleAnimationStop = () => {
    const success = modelController.stop();
    if (success) {
        controlPanelRef.value?.setAnimationState(false);
    }
};
</script>
