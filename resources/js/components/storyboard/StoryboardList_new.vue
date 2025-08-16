<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, Image } from 'lucide-vue-next';
import { VueDraggable } from 'vue-draggable-plus';
import { sceneContentApi, uploadApi } from '../../utils/api';
import { useToast } from '../../composables/useToast';
import { useConfirm } from '../../composables/useConfirm';
import CreateContentDialog from './CreateContentDialog.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import StoryboardItem from './StoryboardItem.vue';
import type { StoryboardItem as StoryboardItemType, ApiSceneContent } from './types';

const emit = defineEmits<{
    selectItem: [item: StoryboardItemType];
    playItem: [item: StoryboardItemType];
    editItem: [item: StoryboardItemType];
    deleteItem: [itemId: string];
    duplicateItem: [item: StoryboardItemType];
    toggleVisibility: [itemId: string];
    addNewItem: [];
}>();

// 分镜列表数据
const storyboardItems = ref<StoryboardItemType[]>([]);
const loading = ref(false);

// 组合式函数
const { toast } = useToast();
const { confirm } = useConfirm();

// 组件引用
const createContentDialog = ref<InstanceType<typeof CreateContentDialog>>();

// 从API数据转换为StoryboardItem
const convertApiDataToStoryboardItem = (apiData: ApiSceneContent): StoryboardItemType => {
    const duration = parseDurationToString(apiData.animation_script);
    
    return {
        id: apiData.id.toString(),
        elementName: apiData.element_name,
        duration,
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
        console.log('开始加载分镜内容数据...');
        const response = await sceneContentApi.getList({ scene_id: 1 });
        
        if (response.success && response.data) {
            // 后端现在直接返回数组，不再包含分页信息
            const apiData = Array.isArray(response.data) ? response.data : [];
            storyboardItems.value = apiData.map(convertApiDataToStoryboardItem);
            console.log('分镜内容数据加载成功:', storyboardItems.value.length, '项');
        } else {
            console.error('加载分镜内容失败:', response.message);
            storyboardItems.value = [];
        }
    } catch (error) {
        console.error('加载分镜内容出错:', error);
        storyboardItems.value = [];
    } finally {
        loading.value = false;
    }
};

// 初始化默认数据（现在从API加载）
const initializeStoryboard = () => {
    loadStoryboardData();
};

// 从动画脚本解析持续时间并格式化为字符串
const parseDurationToString = (animationScript: string): string => {
    if (!animationScript) return '3.0s';
    
    // 简单解析YAML中的duration字段
    const durationMatch = animationScript.match(/duration:\s*([^\n\r]+)/i);
    if (durationMatch) {
        const duration = durationMatch[1].trim();
        return duration.endsWith('s') ? duration : duration + 's';
    }
    
    return '3.0s';
};

// 格式化时间显示
const formatTime = (durationStr: string): string => {
    return durationStr; // 直接返回字符串格式
};

// 选中项目
const selectItem = (item: StoryboardItemType) => {
    storyboardItems.value.forEach(i => i.selected = false);
    item.selected = true;
    emit('selectItem', item);
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
    // TODO: 实现源码查看功能
    console.log('查看源码:', item.animationScript);
};

const handleManageAnimations = (item: StoryboardItemType) => {
    // TODO: 实现动画管理功能
    console.log('管理动画:', item);
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
const onDragEnd = (evt: any) => {
    // 更新layerOrder
    storyboardItems.value.forEach((item, index) => {
        item.layerOrder = index + 1;
    });
    
    console.log('拖拽排序完成，新的顺序:', storyboardItems.value.map(item => ({ 
        id: item.id, 
        name: item.elementName, 
        layerOrder: item.layerOrder 
    })));
};

// 添加新项目
const addNewItem = () => {
    if (loading.value) return;
    createContentDialog.value?.open();
};

// 处理创建内容对话框的确认事件
const handleCreateContent = async (data: { file: File; elementName: string }) => {
    try {
        createContentDialog.value?.setLoading(true);
        toast.info('正在上传图片...');

        // 1. 上传图片
        const uploadResult = await uploadApi.uploadFile(data.file, {
            type: 'image',
            folder: 'storyboard'
        });

        if (!uploadResult.success || !uploadResult.data) {
            toast.error('图片上传失败', uploadResult.message);
            return;
        }

        toast.info('正在创建分镜内容...');

        // 2. 准备API数据
        const elementName = data.elementName;
        const animationScript = `${elementName.toLowerCase().replace(/\s+/g, '_')}:
  duration: 3s
  easing: ease-in-out
  keyframes:
    - time: 0s, x: 0, y: 0, opacity: 1, scale: 1
    - time: 3s, x: 0, y: 0, opacity: 1, scale: 1`;

        const createData = {
            scene_id: 1,
            element_name: elementName,
            element_type: 'image',
            element_source: uploadResult.data.url,
            animation_script: animationScript,
            layer_order: storyboardItems.value.length + 1,
            status: 1
        };

        // 3. 调用API创建分镜内容
        const createResult = await sceneContentApi.create(createData);
        
        if (createResult.success && createResult.data) {
            const newItem = convertApiDataToStoryboardItem(createResult.data);
            storyboardItems.value.push(newItem);
            
            // 选中新创建的项目
            storyboardItems.value.forEach(item => item.selected = false);
            newItem.selected = true;
            
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
        const seconds = parseFloat(item.duration.replace('s', '')) || 0;
        return total + seconds;
    }, 0);
});

const selectedCount = computed(() => {
    return storyboardItems.value.filter(item => item.selected).length;
});

// 生命周期
onMounted(() => {
    initializeStoryboard();
});
</script>

<template>
    <div class="flex h-full flex-col bg-card">
        <!-- 标题栏 -->
        <div class="flex items-center justify-between border-b px-4 py-3">
            <div class="flex items-center space-x-2">
                <h3 class="text-lg font-semibold">分镜内容</h3>
                <span class="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {{ storyboardItems.length }} 项
                </span>
            </div>
            <button
                @click="addNewItem"
                :disabled="loading"
                class="flex items-center rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                title="添加新动画"
            >
                <Plus class="mr-1 h-4 w-4" />
                <span v-if="loading">处理中...</span>
                <span v-else>新建</span>
            </button>
        </div>

        <!-- 统计信息 -->
        <div class="border-b bg-muted/30 px-4 py-2">
            <div class="flex items-center justify-between text-sm text-muted-foreground">
                <span>总时长: {{ formatTime(totalDuration + 's') }}</span>
                <span v-if="selectedCount > 0">已选择: {{ selectedCount }} 项</span>
            </div>
        </div>

        <!-- 分镜项目列表 -->
        <div class="flex-1 overflow-y-auto">
            <VueDraggable
                v-model="storyboardItems"
                :animation="200"
                handle=".drag-handle"
                class="space-y-2 p-3"
                @end="onDragEnd"
            >
                <StoryboardItem
                    v-for="item in storyboardItems"
                    :key="item.id"
                    :item="item"
                    @update-name="handleUpdateName"
                    @toggle-visibility="handleToggleVisibility"
                    @view-source="handleViewSource"
                    @manage-animations="handleManageAnimations"
                    @duplicate="handleDuplicate"
                    @delete="deleteItem"
                    @select="selectItem"
                />
            </VueDraggable>
            
            <!-- 空状态 -->
            <div v-if="storyboardItems.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                <div class="rounded-full bg-muted p-4">
                    <Image class="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 class="mt-4 text-lg font-medium">还没有分镜内容</h3>
                <p class="mt-2 text-sm text-muted-foreground">点击上方的"新建"按钮添加第一个分镜内容</p>
                <button
                    @click="addNewItem"
                    :disabled="loading"
                    class="mt-4 flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus class="mr-2 h-4 w-4" />
                    立即开始
                </button>
            </div>
        </div>
        
        <!-- 对话框组件 -->
        <CreateContentDialog 
            ref="createContentDialog" 
            @confirm="handleCreateContent" 
        />
        <ConfirmDialog />
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
