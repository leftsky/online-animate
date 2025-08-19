<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { Plus, Image, Zap, Code, Play } from 'lucide-vue-next';
import { VueDraggable } from 'vue-draggable-plus';
import { Button } from '@/components/ui/button';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { AnimationParser } from '@/lib/AnimationParser';
import { sceneContentApi, uploadApi } from '@/utils/api';
import CreateContentDialog from './CreateContentDialog.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import StoryboardItem from './StoryboardItem.vue';
import SourceCodeViewer from './SourceCodeViewer.vue';
import AnimationManager from './AnimationManager.vue';
import type { StoryboardItem as StoryboardItemType, ApiSceneContent } from './types';

const emit = defineEmits<{
    selectItem: [item: StoryboardItemType];
    playItem: [item: StoryboardItemType];
    editItem: [item: StoryboardItemType];
    deleteItem: [itemId: string];
    duplicateItem: [item: StoryboardItemType];
    toggleVisibility: [itemId: string];
    addNewItem: [];
    previewAnimation: [item: StoryboardItemType];
    updateItem: [item: StoryboardItemType];
    changeImage: [item: StoryboardItemType, resource: any];
    playAllStoryboards: [items: StoryboardItemType[]];
}>();

// 分镜列表数据
const storyboardItems = ref<StoryboardItemType[]>([]);
const loading = ref(false);
const selectedItemId = ref<string | null>(null);

// 标题编辑状态
const isEditingTitle = ref(false);
const editingTitle = ref('');
const titleInput = ref<HTMLInputElement>();

// 计算属性：选中的项目
const selectedItem = computed(() => {
  return storyboardItems.value.find(item => item.id === selectedItemId.value) || null;
});

// 计算属性：选中项目的动画数据
const selectedItemAnimations = computed(() => {
  if (!selectedItem.value?.animationScript) {
    return [];
  }

  try {
    const parsedData = AnimationParser.parseYamlToJson(selectedItem.value.animationScript);
    return parsedData.animationSequences || [];
  } catch {
    return [];
  }
});

// 获取初始位置信息
const getInitialPosition = () => {
  if (!selectedItem.value?.animationScript) {
    return { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 };
  }

  try {
    const parsedData = AnimationParser.parseYamlToJson(selectedItem.value.animationScript);
    return {
      x: parsedData.initialPosition?.x || 0,
      y: parsedData.initialPosition?.y || 0,
      scaleX: parsedData.initialPosition?.scaleX || 1,
      scaleY: parsedData.initialPosition?.scaleY || 1,
      opacity: parsedData.initialPosition?.opacity || 1
    };
  } catch {
    return { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 };
  }
};

// 标题编辑相关函数
const startTitleEdit = () => {
  if (!selectedItem.value) return;
  isEditingTitle.value = true;
  editingTitle.value = selectedItem.value.elementName;
  nextTick(() => {
    titleInput.value?.focus();
    titleInput.value?.select();
  });
};

const confirmTitleEdit = () => {
  if (selectedItem.value && editingTitle.value.trim() && editingTitle.value !== selectedItem.value.elementName) {
    handleUpdateName(selectedItem.value.id, editingTitle.value.trim());
  }
  isEditingTitle.value = false;
};

const cancelTitleEdit = () => {
  isEditingTitle.value = false;
  editingTitle.value = selectedItem.value?.elementName || '';
};

// 组合式函数
const { toast } = useToast();
const { confirm } = useConfirm();

// 组件引用
const createContentDialog = ref<InstanceType<typeof CreateContentDialog>>();
const sourceCodeViewer = ref<InstanceType<typeof SourceCodeViewer>>();
const animationManager = ref<InstanceType<typeof AnimationManager>>();

// 从API数据转换为StoryboardItem
const convertApiDataToStoryboardItem = (apiData: ApiSceneContent): StoryboardItemType => {
    return {
        id: apiData.id.toString(),
        elementName: apiData.element_name,
        duration: parseDurationToString(apiData.animation_script),
        visible: apiData.status === 1,
        selected: false,
        layerOrder: apiData.layer_order,
        animationScript: apiData.animation_script || '',
        imagePath: apiData.element_source || '',
        thumbnail: apiData.element_source || '',
        elementType: apiData.element_type,
        status: apiData.status
    };
};

// 从API加载分镜内容数据
const loadStoryboardData = async () => {
    loading.value = true;
    try {
        const response = await sceneContentApi.getList({ scene_id: 1 });

        if (response.success && response.data) {
            const apiData = Array.isArray(response.data) ? response.data : [];
            storyboardItems.value = apiData.map(convertApiDataToStoryboardItem);
        } else {
            storyboardItems.value = [];
        }
    } catch (error) {
        console.error('加载分镜内容出错:', error);
        storyboardItems.value = [];
    } finally {
        loading.value = false;
    }
};

// 从动画脚本解析持续时间并格式化为字符串
const parseDurationToString = (animationScript: string): string => {
    if (!animationScript) return '3.0s';

    try {
        // 使用 AnimationParser 解析 YAML
        const animationData = AnimationParser.parseYamlToJson(animationScript);

        // 从动画序列中获取总持续时间
        if (animationData.animationSequences && animationData.animationSequences.length > 0) {
            const totalDuration = animationData.animationSequences.reduce((total, seq) => {
                return total + (seq.duration || 0);
            }, 0);

            // 转换毫秒为秒
            const seconds = totalDuration / 1000;
            return `${seconds}s`;
        }
    } catch (error) {
        console.warn('解析动画脚本持续时间失败:', error);
    }

    return '3.0s';
};


// 选中项目
const selectItem = (itemId: string) => {
  // 如果点击的是当前选中的项目，则取消选中
  if (selectedItemId.value === itemId) {
    selectedItemId.value = null;
    storyboardItems.value.forEach(i => i.selected = false);
  } else {
    // 选中新项目
    selectedItemId.value = itemId;
    storyboardItems.value.forEach(i => i.selected = false);
    const item = storyboardItems.value.find(i => i.id === itemId);
    if (item) {
      item.selected = true;
      emit('selectItem', item);
    }
  }
};

// 处理选中项目的动画管理
const handleSelectedItemManageAnimations = () => {
  if (selectedItem.value) {
    animationManager.value?.open(selectedItem.value);
  }
};

// 处理选中项目的查看源码
const handleSelectedItemViewSource = () => {
  if (selectedItem.value) {
    sourceCodeViewer.value?.open(selectedItem.value);
  }
};

// 处理选中项目的预览动画
const handleSelectedItemPreviewAnimation = () => {
  if (selectedItem.value) {
    emit('previewAnimation', selectedItem.value);
  }
};

// StoryboardItem组件事件处理
const handleUpdateName = async (id: string, name: string) => {
    try {
        loading.value = true;
        const response = await sceneContentApi.update(parseInt(id), { element_name: name });

        if (response.success) {
            const item = storyboardItems.value.find(i => i.id === id);
            if (item) {
                item.elementName = name;
            }
            toast.success('名称更新成功！');
        } else {
            toast.error('名称更新失败', response.message);
        }
    } catch (error) {
        console.error('更新名称出错:', error);
        toast.error('更新名称出错，请重试');
    } finally {
        loading.value = false;
    }
};

const handleToggleVisibility = async (id: string) => {
    try {
        const item = storyboardItems.value.find(i => i.id === id);
        if (!item) return;

        const newStatus = item.visible ? 0 : 1;
        const response = await sceneContentApi.update(parseInt(id), { status: newStatus });

        if (response.success) {
            item.visible = !item.visible;
            toast.success(item.visible ? '已显示' : '已隐藏');
        } else {
            toast.error('状态更新失败', response.message);
        }
    } catch (error) {
        console.error('切换显示状态出错:', error);
        toast.error('切换显示状态出错，请重试');
    }
};

const handleViewSource = (item: StoryboardItemType) => {
    sourceCodeViewer.value?.open(item);
};

const handleManageAnimations = (item: StoryboardItemType) => {
    animationManager.value?.open(item);
};

const handlePreviewAnimation = (item: StoryboardItemType) => {
    emit('previewAnimation', item);
};

// 处理动画保存成功后的更新
const handleAnimationSaved = (updatedItem: StoryboardItemType) => {
    const index = storyboardItems.value.findIndex(item => item.id === updatedItem.id);
    if (index > -1) {
        // 更新本地数据
        storyboardItems.value[index].animationScript = updatedItem.animationScript;
        storyboardItems.value[index].duration = parseDurationToString(updatedItem.animationScript);
    }
};

const handleDuplicate = async (item: StoryboardItemType) => {
    try {
        loading.value = true;
        toast.info('正在复制...');

        const createData = {
            scene_id: 1,
            element_name: `${item.elementName} (副本)`,
            element_type: item.elementType,
            element_source: item.imagePath,
            animation_script: item.animationScript,
            layer_order: storyboardItems.value.length + 1,
            status: item.status
        };

        const response = await sceneContentApi.create(createData);
        if (response.success && response.data) {
            const newItem = convertApiDataToStoryboardItem(response.data);
            storyboardItems.value.push(newItem);
            toast.success('复制成功！');
        } else {
            toast.error('复制失败', response.message);
        }
    } catch (error) {
        console.error('复制内容出错:', error);
        toast.error('复制内容出错，请重试');
    } finally {
        loading.value = false;
    }
};

// 删除项目
const deleteItem = async (itemId: string) => {
    if (loading.value) return;

    const confirmed = await confirm({
        title: '删除确认',
        message: '确定要删除这个分镜内容吗？此操作不可撤销。',
        confirmText: '删除',
        cancelText: '取消',
        variant: 'destructive'
    });

    if (!confirmed) return;

    try {
        loading.value = true;
        toast.info('正在删除...');

        // 调用API删除
        const response = await sceneContentApi.delete(parseInt(itemId));

        if (response.success) {
            // 从本地列表移除
            const index = storyboardItems.value.findIndex(item => item.id === itemId);
            if (index > -1) {
                storyboardItems.value.splice(index, 1);
            }

            toast.success('分镜内容删除成功！');
            emit('deleteItem', itemId);
        } else {
            toast.error('删除失败', response.message);
        }
    } catch (error) {
        console.error('删除分镜内容出错:', error);
        toast.error('删除出错，请重试');
    } finally {
        loading.value = false;
    }
};

// 拖拽排序处理
const onDragEnd = async (event: any) => {
    try {
        // 获取拖拽信息
        const { oldIndex, newIndex } = event;
        
        // 如果没有位置变化，不需要更新
        if (oldIndex === newIndex) {
            return;
        }

        // 获取被拖动的项目
        const draggedItem = storyboardItems.value[newIndex];
        const draggedId = parseInt(draggedItem.id.toString());

        // 获取目标位置前的项目ID
        let targetId: number | null = null;
        if (newIndex > 0) {
            targetId = parseInt(storyboardItems.value[newIndex - 1].id.toString());
        }

        console.log('拖拽排序:', {
            draggedId,
            targetId,
            oldIndex,
            newIndex
        });

        // 调用重排序接口
        const response = await sceneContentApi.reorder({
            scene_id: 1, // 当前分镜ID，这里可能需要动态获取
            dragged_id: draggedId,
            target_id: targetId
        });

        if (response.success) {
            // 更新本地数据
            storyboardItems.value = response.data;
            
            // 更新本地layerOrder
            storyboardItems.value.forEach((item, index) => {
                item.layerOrder = index + 1;
            });

            toast.success('排序更新成功');
        } else {
            toast.error('排序更新失败', response.message);
        }
    } catch (error) {
        console.error('拖拽排序失败:', error);
        toast.error('排序更新失败，请重试');
    }
};

// 添加新项目
const addNewItem = () => {
    if (loading.value) return;
    createContentDialog.value?.open();
};

// 处理创建内容对话框的确认事件
const handleCreateContent = async (data: { file?: File; resource?: any; elementName: string; mode: 'upload' | 'select' }) => {
    try {
        createContentDialog.value?.setLoading(true);
        
        let mediaUrl: string;
        
        if (data.mode === 'upload' && data.file) {
            // 上传模式：上传文件
            toast.info('正在上传图片...');
            const uploadResult = await uploadApi.uploadFile(data.file, {
                type: 'image',
                folder: 'storyboard'
            });

            if (!uploadResult.success || !uploadResult.data) {
                toast.error('图片上传失败', uploadResult.message);
                return;
            }
            
            mediaUrl = uploadResult.data.url;
        } else if (data.mode === 'select' && data.resource) {
            // 选择模式：使用已有资源
            mediaUrl = data.resource.url;
        } else {
            toast.error('数据格式错误');
            return;
        }

        toast.info('正在创建分镜内容...');

        // 准备动画数据，使用 AnimationParser 的 JSON 结构体
        const elementName = data.elementName;
        const animationData = {
            name: elementName,
            media: mediaUrl,
            initialPosition: {
                x: 0,
                y: 0,
                scaleX: 1,
                opacity: 1,
                rotation: 0
            },
            animationSequences: [{
                name: elementName.toLowerCase().replace(/\s+/g, '_'),
                duration: 3000,
                easing: 'ease-in-out',
                keyframes: [
                    {
                        startTime: 0,
                        duration: 3000,
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scaleX: 1
                    }
                ]
            }]
        };

        // 转换为 YAML 格式
        const animationScript = AnimationParser.parseJsonToYaml(animationData);

        const createData = {
            scene_id: 1,
            element_name: elementName,
            element_type: 'image',
            element_source: mediaUrl,
            animation_script: animationScript,
            layer_order: storyboardItems.value.length + 1,
            status: 1
        };

        // 调用API创建分镜内容
        const createResult = await sceneContentApi.create(createData);

        if (createResult.success && createResult.data) {
            const newItem = convertApiDataToStoryboardItem(createResult.data);
            storyboardItems.value.push(newItem);

            // 选中新创建的项目
            storyboardItems.value.forEach(item => item.selected = false);
            newItem.selected = true;
            selectedItemId.value = newItem.id;

            toast.success('分镜内容创建成功！');
            createContentDialog.value?.close();
            emit('selectItem', newItem);
        } else {
            toast.error('创建分镜内容失败', createResult.message);
        }
    } catch (error) {
        console.error('添加分镜内容出错:', error);
        toast.error('添加分镜内容出错，请重试');
    } finally {
        createContentDialog.value?.setLoading(false);
    }
};

// 计算属性
const totalDuration = computed(() => {
    return storyboardItems.value.reduce((total, item) => {
        if (!item.animationScript) return total;

        try {
            // 使用 AnimationParser 解析 YAML 获取准确的持续时间
            const animationData = AnimationParser.parseYamlToJson(item.animationScript);

            if (animationData.animationSequences && animationData.animationSequences.length > 0) {
                const itemDuration = animationData.animationSequences.reduce((sum, seq) => {
                    return sum + (seq.duration || 0);
                }, 0);

                // 转换毫秒为秒
                return total + (itemDuration / 1000);
            }
        } catch {
            // 解析失败时使用 item.duration 作为后备
            const seconds = parseFloat(item.duration.replace('s', '')) || 0;
            return total + seconds;
        }

        return total;
    }, 0);
});

// 生命周期
onMounted(() => {
    loadStoryboardData();
});

// 编辑位置信息
const editingPosition = ref({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1
});

// 监听选中项目变化，同步编辑状态
watch(selectedItem, (newItem) => {
    if (newItem) {
        const position = getInitialPosition();
        editingPosition.value = { ...position };
    }
}, { immediate: true });

// 保存位置变化
const savePositionChanges = async () => {
    if (!selectedItem.value) return;
    
    try {
        // 获取当前编辑的值
        const newPosition = {
            x: Number(editingPosition.value.x),
            y: Number(editingPosition.value.y),
            scaleX: Number(editingPosition.value.scaleX),
            scaleY: Number(editingPosition.value.scaleY),
            opacity: Number(editingPosition.value.opacity)
        } as const;

        // 获取原始值
        const originalPosition = getInitialPosition();
        
        // 检查是否有变化
        const hasChanges = 
            newPosition.x !== originalPosition.x ||
            newPosition.y !== originalPosition.y ||
            newPosition.scaleX !== originalPosition.scaleX ||
            newPosition.scaleY !== originalPosition.scaleY ||
            newPosition.opacity !== originalPosition.opacity;

        if (!hasChanges) {
            console.log('属性没有变化，跳过保存');
            return;
        }

        console.log('检测到属性变化，开始保存:', {
            original: originalPosition,
            new: newPosition
        });

        // 解析YAML脚本并更新
        const animationData = AnimationParser.parseYamlToJson(selectedItem.value.animationScript);
        if (animationData.initialPosition) {
            animationData.initialPosition.x = newPosition.x;
            animationData.initialPosition.y = newPosition.y;
            animationData.initialPosition.scaleX = newPosition.scaleX;
            animationData.initialPosition.scaleY = newPosition.scaleY;
            animationData.initialPosition.opacity = newPosition.opacity;

            const newAnimationScript = AnimationParser.parseJsonToYaml(animationData);
            
            // 更新项目的动画脚本
            const updatedItem = {
                ...selectedItem.value,
                animationScript: newAnimationScript
            };
            
            // 提交到接口
            await submitToApi(updatedItem);
            
            // 触发更新事件
            emit('updateItem', updatedItem);
            
            // 重新同步编辑状态，确保显示最新数据
            await nextTick();
            const latestPosition = getInitialPosition();
            editingPosition.value = { ...latestPosition };
            
            // 显示保存成功提示
            toast.success('属性已保存到服务器');
        }
    } catch (error) {
        console.error('保存位置变化失败:', error);
        toast.error('保存失败，请重试');
    }
};

// 提交到API接口
const submitToApi = async (updatedItem: StoryboardItemType) => {
    try {
        const response = await sceneContentApi.update(Number(updatedItem.id), {
            element_name: updatedItem.elementName,
            animation_script: updatedItem.animationScript,
            layer_order: updatedItem.layerOrder
        });

        if (response.success && response.code === 200) {
            console.log('分镜内容更新成功:', response.message);
            
            // 更新本地数据状态
            const index = storyboardItems.value.findIndex(item => item.id === updatedItem.id);
            if (index !== -1) {
                storyboardItems.value[index] = {
                    ...storyboardItems.value[index],
                    ...updatedItem
                };
                console.log('本地数据已同步更新');
            }
            
            return response;
        } else {
            throw new Error(response.message || '保存失败');
        }
        
    } catch (error) {
        console.error('API保存失败:', error);
        throw error; // 重新抛出错误，让上层处理
    }
};

// 播放所有分镜
const playAllStoryboards = () => {
    if (storyboardItems.value.length === 0) {
        toast.info('没有分镜内容可播放');
        return;
    }

    console.log('播放本分镜 - 所有分镜内容:', storyboardItems.value);
    // 触发播放整个分镜序列的事件
    emit('playAllStoryboards', storyboardItems.value);
};

// 处理图片更换
const handleChangeImage = async (item: StoryboardItemType, resource: any) => {
    console.log('更换图片:', item.elementName, resource);
    
    try {
        // 更新动画脚本中的媒体路径
        const animationData = AnimationParser.parseYamlToJson(item.animationScript);
        if (animationData) {
            animationData.media = resource.url;
            
            const newAnimationScript = AnimationParser.parseJsonToYaml(animationData);
            
            // 创建更新后的项目
            const updatedItem = {
                ...item,
                element_source: resource.url,
                imagePath: resource.url,
                thumbnail: resource.url,
                animationScript: newAnimationScript
            };
            
            // 提交到API
            await submitToApi(updatedItem);
            
            // 触发更新事件
            emit('updateItem', updatedItem);
            
            toast.success('图片更换成功');
        }
    } catch (error) {
        console.error('更换图片失败:', error);
        toast.error('更换图片失败，请重试');
    }
};

</script>

<template>
    <div class="flex h-full flex-col bg-card">
        <!-- 分镜列表头部 -->
        <div class="flex items-center justify-between p-3 border-b">
            <h3 class="text-sm font-medium">分镜内容 {{ storyboardItems.length }}项</h3>
            <Button variant="outline" size="sm" @click="addNewItem" :disabled="loading"
                class="flex items-center rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                title="添加新动画">
                <Plus class="mr-1 h-4 w-4" />
                <span v-if="loading">处理中...</span>
                <span v-else>新建</span>
            </Button>
        </div>

        <!-- 统计信息和播放按钮 -->
        <div class="flex items-center justify-between p-3 border-b bg-muted/20">
            <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <span>总时长: {{ totalDuration }}</span>
                <span>已选择: {{ selectedItemId ? '1项' : '0项' }}</span>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                @click="playAllStoryboards" 
                class="h-7 px-2 text-xs bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200"
                :disabled="storyboardItems.length === 0"
            >
                <Play class="w-3 h-3 mr-1" />
                播放本分镜
            </Button>
        </div>

        <!-- 分镜项目列表 -->
        <div class="flex-1 overflow-y-auto">
            <VueDraggable v-model="storyboardItems" :animation="200" handle=".drag-handle" class="space-y-2 p-3"
                @end="onDragEnd">
                <StoryboardItem v-for="item in storyboardItems" :key="item.id" :item="item"
                    @update-name="handleUpdateName" @toggle-visibility="handleToggleVisibility"
                    @view-source="handleViewSource" @manage-animations="handleManageAnimations"
                    @preview-animation="handlePreviewAnimation" @duplicate="handleDuplicate" @delete="deleteItem"
                    @select="selectItem" @change-image="handleChangeImage" />
            </VueDraggable>

            <!-- 空状态 -->
            <div v-if="storyboardItems.length === 0"
                class="flex flex-col items-center justify-center py-12 text-center">
                <div class="rounded-full bg-muted p-4">
                    <Image class="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 class="mt-4 text-lg font-medium">还没有分镜内容</h3>
                <p class="mt-2 text-sm text-muted-foreground">点击上方的"新建"按钮添加第一个分镜内容</p>
                <button @click="addNewItem" :disabled="loading"
                    class="mt-4 flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus class="mr-2 h-4 w-4" />
                    立即开始
                </button>
            </div>
        </div>

        <!-- 固定的底部展开区域 -->
        <div v-if="selectedItem" class="border-t bg-muted/20 p-3 space-y-2">
            <!-- 选中项目的详细信息 -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <!-- 编辑模式 -->
                    <input v-if="isEditingTitle" ref="titleInput" v-model="editingTitle" type="text"
                        class="px-2 py-1 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                        @keydown.enter="confirmTitleEdit" @keydown.esc="cancelTitleEdit" @blur="confirmTitleEdit" />
                    <!-- 显示模式 -->
                    <h4 v-else class="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                        @click="startTitleEdit">
                        {{ selectedItem.elementName }} - 动画效果 ({{ selectedItemAnimations.length }}个动画 • {{ selectedItem.duration }})
                    </h4>
                </div>
            </div>
            
            <!-- 属性设置 -->
            <div class="space-y-2">
                <div class="grid grid-cols-3 gap-2 text-xs">
                    <div class="p-2 bg-background rounded border">
                        <div class="font-medium text-muted-foreground mb-1">初始位置</div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-1">
                                <span class="w-3">X:</span>
                                <input v-model="editingPosition.x" type="number" 
                                    class="w-full px-1 py-0.5 text-xs bg-transparent border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                    @blur="savePositionChanges" @keydown.enter="savePositionChanges" />
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="w-3">Y:</span>
                                <input v-model="editingPosition.y" type="number" 
                                    class="w-full px-1 py-0.5 text-xs bg-transparent border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                    @blur="savePositionChanges" @keydown.enter="savePositionChanges" />
                            </div>
                        </div>
                    </div>
                    <div class="p-2 bg-background rounded border">
                        <div class="font-medium text-muted-foreground mb-1">缩放</div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-1">
                                <span class="w-3">X:</span>
                                <input v-model="editingPosition.scaleX" type="number" step="0.1" min="0.1" max="5"
                                    class="w-full px-1 py-0.5 text-xs bg-transparent border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                    @blur="savePositionChanges" @keydown.enter="savePositionChanges" />
                            </div>
                            <div class="flex items-center gap-1">
                                <span class="w-3">Y:</span>
                                <input v-model="editingPosition.scaleY" type="number" step="0.1" min="0.1" max="5"
                                    class="w-full px-1 py-0.5 text-xs bg-transparent border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                    @blur="savePositionChanges" @keydown.enter="savePositionChanges" />
                            </div>
                        </div>
                    </div>
                    <div class="p-2 bg-background rounded border">
                        <div class="font-medium text-muted-foreground mb-1">透明度</div>
                        <div class="flex items-center gap-1">
                            <input v-model="editingPosition.opacity" type="number" step="0.1" min="0" max="1"
                                class="w-full px-1 py-0.5 text-xs bg-transparent border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                @blur="savePositionChanges" @keydown.enter="savePositionChanges" />
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 快捷操作 -->
            <div class="flex items-center gap-1 pt-2 border-t border-border">
                <Button variant="outline" size="sm" @click="handleSelectedItemViewSource"
                    class="h-7 px-2 text-xs">
                    <Code class="w-3 h-3 mr-1" />
                    查看源码
                </Button>
                <Button variant="outline" size="sm" @click="handleSelectedItemManageAnimations" 
                    class="h-7 px-2 text-xs">
                    <Zap class="w-3 h-3 mr-1" />
                    管理动画
                </Button>
                <Button variant="outline" size="sm" @click="handleSelectedItemPreviewAnimation"
                    class="h-7 px-2 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 active:scale-95">
                    <Play class="w-3 h-3 mr-1 animate-pulse" />
                    预览动画
                </Button>
            </div>
        </div>

        <!-- 对话框组件 -->
        <CreateContentDialog ref="createContentDialog" @confirm="handleCreateContent" />
        <ConfirmDialog />
        <SourceCodeViewer ref="sourceCodeViewer" />
        <AnimationManager ref="animationManager" @animation-saved="handleAnimationSaved" />
    </div>
</template>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
