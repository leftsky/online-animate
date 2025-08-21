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

                        <!-- 无限滚动人物列表 -->
                        <div class="flex-1 space-y-2 overflow-y-auto pr-2" @scroll="handleScroll">
                            <CharacterCard
                                v-for="character in filteredResources"
                                :key="character.id"
                                :character="character"
                                :is-selected="selectedCharacter?.id === character.id"
                                @select="selectResource"
                                @upload-model="handleModelUploadClick"
                                @delete="deleteResource"
                            />

                            <div v-if="loading" class="py-4 text-center">
                                <div class="text-sm text-muted-foreground">加载中...</div>
                            </div>

                            <div v-if="filteredResources.length === 0 && !loading" class="py-8 text-center">
                                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <Users class="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 class="mb-1 text-sm font-medium text-foreground">暂无人物</h3>
                                <p class="text-xs text-muted-foreground">点击上方按钮添加人物</p>
                            </div>
                        </div>
                    </div>

                    <div class="relative flex-1 overflow-hidden rounded-lg border border-border bg-card">
                        <canvas ref="threeCanvas" class="h-full w-full" :class="{ 'opacity-0': !currentModelUrl }"></canvas>

                        <!-- 覆盖层 -->
                        <div
                            v-if="!currentModelUrl || isLoadingModel"
                            class="absolute inset-0 flex items-center justify-center bg-card text-muted-foreground"
                        >
                            <!-- 加载中状态 -->
                            <div v-if="isLoadingModel" class="text-center">
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
                            v-if="currentModelUrl && selectedCharacter && !isLoadingModel"
                            class="absolute left-4 top-4 rounded-lg border border-border bg-background/80 p-3 text-sm backdrop-blur-sm"
                        >
                            <h4 class="font-medium text-foreground">{{ selectedCharacter.name }}</h4>
                            <p class="mt-1 text-xs text-muted-foreground">3D模型预览</p>
                        </div>
                    </div>

                    <!-- 右侧区域 -->
                    <div class="flex h-[calc(100vh-200px)] w-80 flex-col rounded-lg border border-border bg-card">
                        <!-- 模型控制面板 -->
                        <div v-if="currentModelUrl && selectedCharacter && !isLoadingModel" class="border-b border-border">
                            <ModelControlPanel
                                ref="controlPanelRef"
                                :model-name="selectedCharacter.name"
                                :model="currentModel"
                                :available-animations="availableAnimations"
                                @animation-play="handleAnimationPlay"
                                @animation-pause="handleAnimationPause"
                                @animation-stop="handleAnimationStop"
                                @model-update="handleModelUpdate"
                                @toggle-bounding-box="handleToggleBoundingBox"
                                @toggle-skeleton="handleToggleSkeleton"
                            />
                        </div>

                        <!-- 对话框 -->
                        <div class="flex min-h-0 flex-1 flex-col p-4">
                            <div class="mb-3">
                                <h3 class="text-base font-medium text-foreground">对话框</h3>
                                <p class="text-xs text-muted-foreground">与人物进行对话交互</p>
                            </div>

                            <!-- 对话内容区域 -->
                            <div class="mb-3 flex-1 overflow-y-auto rounded-lg bg-muted/30 p-3">
                                <div class="text-center text-sm text-muted-foreground">选择人物开始对话</div>
                            </div>

                            <!-- 输入框 -->
                            <div class="flex gap-2">
                                <Input placeholder="输入消息..." class="flex-1" />
                                <Button size="sm"> 发送 </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 添加人物对话框 -->
            <AddCharacterDialog v-model:open="showAddDialog" :loading="loading" @submit="handleAddResource" />

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
import { computed, markRaw, onMounted, ref, toRaw, watch } from 'vue';
import AddCharacterDialog from './components/AddCharacterDialog.vue';
import CharacterCard from './components/CharacterCard.vue';

import { useModelController } from '@/lib/three/ModelController';
import { useThreeJSManager } from '@/lib/three/ThreeJSBaseManager';
import { type MediaCharacter } from '@/services/mediaApi';
import { mediaApi, uploadApi } from '@/utils/api';
import * as THREE from 'three';

const { threeScene, threeRenderer, threeControls, initThreeJS, handleResize, addMixer } = useThreeJSManager();
const {
    loadCharacterModel,
    availableAnimations,
    init: initModelController,
    isLoadingModel,
    currentModelUrl,
    currentModel,
    modelMixer,
} = useModelController();

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
const loading = ref(false);
const hasMore = ref(true);
const modelFileInput = ref<HTMLInputElement>();
const isUploadingModel = ref(false);
const currentUploadingCharacter = ref<MediaCharacter | null>(null);

// 模型控制面板相关状态
const controlPanelRef = ref<InstanceType<typeof ModelControlPanel> | null>(null);
const currentAnimationAction = ref<THREE.AnimationAction | null>(null);

// 显示控制相关状态
const boundingBoxHelper = ref<THREE.BoxHelper | null>(null);
const skeletonHelper = ref<THREE.SkeletonHelper | null>(null);

// 真实数据
const resources = ref<MediaCharacter[]>([]);

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

// 检查人物是否有模型文件
const hasModelFile = (character: MediaCharacter): boolean => {
    if (!character.additional_resources) return false;
    try {
        const resourcesData = Array.isArray(character.additional_resources) ? character.additional_resources[0] : character.additional_resources;

        if (typeof resourcesData === 'string') {
            const parsed = JSON.parse(resourcesData);
            return !!parsed.modelFile;
        } else if (typeof resourcesData === 'object' && resourcesData !== null) {
            const modelFile = (resourcesData as any).modelFile;
            return typeof modelFile === 'string' && modelFile.trim().length > 0;
        }
    } catch {
        return false;
    }
    return false;
};

// 清空模型显示
const clearModelDisplay = () => {
    currentModelUrl.value = null;
    isLoadingModel.value = false;

    if (currentModel.value && threeScene.value) {
        threeScene.value.remove(toRaw(currentModel.value));
        currentModel.value = null;
    }

    if (boundingBoxHelper.value && threeScene.value) {
        threeScene.value.remove(toRaw(boundingBoxHelper.value));
        boundingBoxHelper.value = null;
    }
    if (skeletonHelper.value && threeScene.value) {
        threeScene.value.remove(toRaw(skeletonHelper.value));
        skeletonHelper.value = null;
    }

    if (currentAnimationAction.value) {
        currentAnimationAction.value = null;
    }
    availableAnimations.value = [];
};

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
                    const resourcesData = Array.isArray(character.additional_resources)
                        ? character.additional_resources[0]
                        : character.additional_resources;
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
                additional_resources: [updatedResources],
            });

            if (updateResult.success) {
                const index = resources.value.findIndex((r) => r.id === character.id);
                if (index !== -1) {
                    const updatedCharacter = {
                        ...character,
                        additional_resources: [updatedResources],
                    };
                    resources.value[index] = updatedCharacter;
                }

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

    if (hasModelFile(resource)) {
        initModelController(threeScene.value as THREE.Scene, threeControls.value as any);
        await loadCharacterModel(resource);
        addMixer('model', modelMixer.value as THREE.AnimationMixer);
    } else {
        clearModelDisplay();
    }
};

// 处理无限滚动
const handleScroll = async (event: Event) => {
    const target = event.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    if (scrollHeight - scrollTop <= clientHeight + 100 && !loading.value && hasMore.value) {
        await loadMoreCharacters();
    }
};

// 加载更多人物
const loadMoreCharacters = async () => {
    if (loading.value || !hasMore.value) {
        return;
    }

    loading.value = true;
    try {
        const params = {
            limit: 20,
            offset: resources.value.length,
            search: searchQuery.value,
            gender: selectedGender.value ? Number(selectedGender.value) : undefined,
        };

        const response = await mediaApi.getCharacters(params);

        if (response.data && Array.isArray(response.data)) {
            const newCharacters = response.data;
            if (newCharacters.length > 0) {
                resources.value = [...resources.value, ...newCharacters];
            }

            hasMore.value = newCharacters.length === 20;
        } else {
            hasMore.value = false;
        }
    } catch (error) {
        console.error('加载更多人物失败:', error);
        hasMore.value = false;
    } finally {
        loading.value = false;
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
    loading.value = true;
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
    } finally {
        loading.value = false;
    }
};

// 加载资源数据
const loadResources = async () => {
    loading.value = true;
    try {
        const characterParams = {
            limit: 20,
            offset: 0,
            search: searchQuery.value,
            gender: selectedGender.value ? Number(selectedGender.value) : undefined,
        };

        const response = await mediaApi.getCharacters(characterParams);

        if (Array.isArray(response.data)) {
            resources.value = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            resources.value = response.data.data;
        } else {
            resources.value = [];
        }

        hasMore.value = resources.value.length === 20;
    } catch (error) {
        console.error('加载人物失败:', error);
        toast.error('加载人物失败');
        resources.value = [];
    } finally {
        loading.value = false;

        if (!selectedCharacter.value && resources.value.length > 0) {
            const firstCharacterWithModel = resources.value.find((resource) => hasModelFile(resource));

            if (firstCharacterWithModel) {
                selectResource(firstCharacterWithModel);
            }
        }
    }
};

// 搜索处理
const handleSearch = () => {
    hasMore.value = true;
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

    if (threeRenderer.value) {
        toRaw(threeRenderer.value).dispose();
    }

    if (threeControls.value) {
        toRaw(threeControls.value).dispose();
    }
};

watch(() => false, cleanup);

// 模型控制面板事件处理方法
const handleAnimationPlay = (animationIndex: number) => {
    if (!currentModel.value || !availableAnimations.value[animationIndex]) return;

    try {
        const animation = availableAnimations.value[animationIndex];

        if (currentAnimationAction.value) {
            currentAnimationAction.value.stop();
        }

        if (animation.clip && modelMixer.value) {
            currentAnimationAction.value = modelMixer.value.clipAction(animation.clip);
            currentAnimationAction.value.reset();
            currentAnimationAction.value.play();

            controlPanelRef.value?.setAnimationState(true);
        }
    } catch (error) {
        console.error('播放动画失败:', error);
        toast.error('播放动画失败');
    }
};

const handleAnimationPause = () => {
    if (currentAnimationAction.value) {
        currentAnimationAction.value.paused = true;
        controlPanelRef.value?.setAnimationState(false);
    }
};

const handleAnimationStop = () => {
    if (currentAnimationAction.value) {
        currentAnimationAction.value.stop();
        currentAnimationAction.value = null;
        controlPanelRef.value?.setAnimationState(false);
    }
};

const handleModelUpdate = (updateData: { type: string; value: any }) => {
    if (!currentModel.value) return;

    try {
        const model = toRaw(currentModel.value);

        switch (updateData.type) {
            case 'position':
                model.position.set(updateData.value.x, updateData.value.y, updateData.value.z);
                break;
            case 'rotation':
                model.rotation.set(updateData.value.x, updateData.value.y, updateData.value.z);
                break;
            case 'scale':
                model.scale.setScalar(updateData.value);
                break;
        }
    } catch (error) {
        console.error('更新模型参数失败:', error);
        toast.error('更新模型参数失败');
    }
};

// 处理边界框显示切换
const handleToggleBoundingBox = (show: boolean) => {
    if (!currentModel.value || !threeScene.value) return;

    try {
        if (show) {
            if (!boundingBoxHelper.value) {
                boundingBoxHelper.value = markRaw(new THREE.BoxHelper(toRaw(currentModel.value), 0x00ff00));
                threeScene.value.add(toRaw(boundingBoxHelper.value));
            }
        } else {
            if (boundingBoxHelper.value) {
                threeScene.value.remove(toRaw(boundingBoxHelper.value));
                boundingBoxHelper.value = null;
            }
        }
    } catch (error) {
        console.error('切换边界框显示失败:', error);
        toast.error('切换边界框显示失败');
    }
};

// 处理骨骼显示切换
const handleToggleSkeleton = (show: boolean) => {
    if (!currentModel.value || !threeScene.value) return;

    try {
        if (show) {
            let skeleton: THREE.Skeleton | null = null;
            currentModel.value.traverse((child: any) => {
                if (child.isSkinnedMesh && child.skeleton) {
                    skeleton = child.skeleton;
                }
            });

            if (skeleton && !skeletonHelper.value) {
                skeletonHelper.value = markRaw(new THREE.SkeletonHelper(toRaw(currentModel.value)));
                threeScene.value.add(toRaw(skeletonHelper.value));
            } else if (!skeleton) {
                console.warn('模型中未找到骨骼数据');
                toast.warning('该模型没有骨骼数据');
            }
        } else {
            if (skeletonHelper.value) {
                threeScene.value.remove(toRaw(skeletonHelper.value));
                skeletonHelper.value = null;
            }
        }
    } catch (error) {
        console.error('切换骨骼显示失败:', error);
        toast.error('切换骨骼显示失败');
    }
};
</script>
