<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Play, Edit3, Trash2, Plus, Copy, Eye, EyeOff, Image } from 'lucide-vue-next';
import { AnimationParser } from '../../lib/AnimationParser';
import { uploadImage } from '../../utils/upload';
import { sceneContentApi, uploadApi } from '../../utils/api';
import { useToast } from '../../composables/useToast';
import { useConfirm } from '../../composables/useConfirm';
import CreateContentDialog from './CreateContentDialog.vue';
import ConfirmDialog from './ConfirmDialog.vue';

interface StoryboardItem {
    id: string;
    name: string;
    duration: number;
    visible: boolean;
    selected: boolean;
    animation: any; // 解析后的动画数据
    script: string; // 原始动画脚本
    imagePath?: string; // 图片路径
    thumbnail?: string; // 缩略图路径
}

const emit = defineEmits<{
    selectItem: [item: StoryboardItem];
    playItem: [item: StoryboardItem];
    editItem: [item: StoryboardItem];
    deleteItem: [itemId: string];
    duplicateItem: [item: StoryboardItem];
    toggleVisibility: [itemId: string];
    addNewItem: [];
}>();

// 默认示例动画数据（空数组，移除默认内容）
const defaultAnimations: any[] = [];

// 分镜列表数据
const storyboardItems = ref<StoryboardItem[]>([]);
const loading = ref(false);

// 组合式函数
const { toast } = useToast();
const { confirm } = useConfirm();

// 组件引用
const createContentDialog = ref<InstanceType<typeof CreateContentDialog>>();

// 从API数据转换为StoryboardItem
const convertApiDataToStoryboardItem = (apiData: any): StoryboardItem => {
    try {
        let animation = null;
        let duration = 3;
        
        if (apiData.animation_script) {
            const parsedAnimations = AnimationParser.parse(apiData.animation_script);
            animation = parsedAnimations[0];
            duration = parseDuration(animation?.duration || 3000);
        }
        
        return {
            id: apiData.id.toString(),
            name: apiData.element_name,
            duration,
            visible: apiData.status === 1,
            selected: false,
            animation,
            script: apiData.animation_script || '',
            imagePath: apiData.element_source,
            thumbnail: apiData.element_source
        };
    } catch (error) {
        console.error('转换API数据失败:', error);
        return {
            id: apiData.id.toString(),
            name: apiData.element_name || '未知项目',
            duration: 3,
            visible: apiData.status === 1,
            selected: false,
            animation: null,
            script: apiData.animation_script || '',
            imagePath: apiData.element_source,
            thumbnail: apiData.element_source
        };
    }
};

// 从API加载分镜内容数据
const loadStoryboardData = async () => {
    loading.value = true;
    try {
        console.log('开始加载分镜内容数据...');
        const response = await sceneContentApi.getList({ scene_id: 1 });
        
        if (response.success && response.data) {
            const apiData = response.data.data || response.data;
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

// 解析持续时间为数字（秒）
const parseDuration = (duration: string | number | undefined): number => {
    // 如果是undefined或null，返回默认值
    if (!duration) {
        return 3;
    }
    
    // 如果已经是数字，假设是毫秒，转换为秒
    if (typeof duration === 'number') {
        return duration / 1000;
    }
    
    // 转换为字符串并解析
    const durationStr = String(duration);
    const match = durationStr.match(/(\d+(?:\.\d+)?)(s|ms)?/);
    if (!match) return 3;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 's';
    
    return unit === 'ms' ? value / 1000 : value;
};

// 格式化时间显示
const formatTime = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
};

// 选中项目
const selectItem = (item: StoryboardItem) => {
    storyboardItems.value.forEach(i => i.selected = false);
    item.selected = true;
    emit('selectItem', item);
};

// 播放项目
const playItem = (item: StoryboardItem) => {
    emit('playItem', item);
};

// 编辑项目
const editItem = (item: StoryboardItem) => {
    emit('editItem', item);
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

// 复制项目
const duplicateItem = (item: StoryboardItem) => {
    const newItem: StoryboardItem = {
        ...item,
        id: Date.now().toString(),
        name: `${item.name} (副本)`,
        selected: false
    };
    
    const index = storyboardItems.value.findIndex(i => i.id === item.id);
    storyboardItems.value.splice(index + 1, 0, newItem);
    emit('duplicateItem', newItem);
};

// 切换可见性
const toggleVisibility = (itemId: string) => {
    const item = storyboardItems.value.find(i => i.id === itemId);
    if (item) {
        item.visible = !item.visible;
        emit('toggleVisibility', itemId);
    }
};

// 添加新项目
const addNewItem = () => {
    if (loading.value) return;
    createContentDialog.value?.open();
};

// 处理创建内容确认
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
        
        // 2. 准备API数据，使用用户输入的名称
        const animationScript = `${data.elementName.toLowerCase().replace(/\s+/g, '_')}:
  duration: 3s
  easing: ease-in-out
  keyframes:
    - time: 0s, x: 0, y: 0, opacity: 1, scale: 1
    - time: 3s, x: 0, y: 0, opacity: 1, scale: 1`;
        
        const createData = {
            scene_id: 1,
            element_name: data.elementName,
            element_type: 'image',
            element_source: uploadResult.data.url,
            animation_script: animationScript,
            layer_order: storyboardItems.value.length + 1,
            status: 1
        };
        
        // 3. 调用API创建分镜内容
        const createResult = await sceneContentApi.create(createData);
        
        if (createResult.success && createResult.data) {
            // 4. 转换API数据为本地数据格式
            const newItem = convertApiDataToStoryboardItem(createResult.data);
            
            // 5. 添加到本地列表
            storyboardItems.value.push(newItem);
            
            // 6. 自动选中新添加的项目
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

// 图片加载错误处理
const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    // 可以在这里设置默认图片或显示占位符
};

// 上传图片
const uploadImageForItem = async (item: StoryboardItem) => {
    if (loading.value) return;
    
    try {
        loading.value = true;
        toast.info('正在上传图片...');
        
        const uploadResult = await uploadImage({
            folder: 'storyboard'
        });
        
        if (uploadResult.success && uploadResult.data) {
            toast.info('正在更新分镜内容...');
            
            // 调用API更新分镜内容
            const updateResult = await sceneContentApi.update(parseInt(item.id), {
                element_source: uploadResult.data.url
            });
            
            if (updateResult.success) {
                // 更新本地数据
                item.imagePath = uploadResult.data.url;
                item.thumbnail = uploadResult.data.url;
                toast.success('图片更新成功！');
            } else {
                toast.error('更新失败', updateResult.message);
            }
        } else {
            toast.error('图片上传失败', uploadResult.message);
        }
    } catch (error) {
        console.error('图片上传出错:', error);
        toast.error('图片上传出错，请重试');
    } finally {
        loading.value = false;
    }
};

// 计算总时长
const totalDuration = computed(() => {
    return storyboardItems.value.reduce((total, item) => total + item.duration, 0);
});

// 计算选中项目数量
const selectedCount = computed(() => {
    return storyboardItems.value.filter(item => item.selected).length;
});

// 组件挂载时初始化
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
                <span>总时长: {{ formatTime(totalDuration) }}</span>
                <span v-if="selectedCount > 0">已选择: {{ selectedCount }} 项</span>
            </div>
        </div>

        <!-- 分镜项目列表 -->
        <div class="flex-1 overflow-y-auto">
            <div class="space-y-1 p-2">
                <div
                    v-for="(item, index) in storyboardItems"
                    :key="item.id"
                    :class="[
                        'group relative rounded-lg border-2 p-3 transition-all cursor-pointer',
                        item.selected 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-transparent bg-muted/20 hover:bg-muted/40'
                    ]"
                    @click="selectItem(item)"
                >
                    <!-- 序号标识 -->
                    <div class="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {{ index + 1 }}
                    </div>

                    <!-- 主要内容 -->
                    <div class="flex items-start justify-between">
                        <!-- 左侧图片缩略图 -->
                        <div class="flex items-start space-x-3">
                            <div class="relative flex-shrink-0">
                                <div 
                                    class="w-12 h-12 rounded-md overflow-hidden bg-muted border cursor-pointer hover:bg-muted-foreground/10 transition-colors"
                                    @click.stop="uploadImageForItem(item)"
                                    :title="item.imagePath ? '点击更换图片' : '点击上传图片'"
                                >
                                    <img 
                                        v-if="item.thumbnail || item.imagePath"
                                        :src="item.thumbnail || item.imagePath" 
                                        :alt="item.name"
                                        class="w-full h-full object-cover"
                                        @error="handleImageError"
                                    />
                                    <div v-else class="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground bg-muted-foreground/10">
                                        <Image class="h-3 w-3 mb-0.5" />
                                        <span class="text-xs">上传</span>
                                    </div>
                                </div>
                                <!-- 动画类型标识 -->
                                <div v-if="item.animation?.loop" class="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                                    <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                            </div>
                            
                            <!-- 文本信息 -->
                            <div class="flex-1 min-w-0">
                                <!-- 名称和时长 -->
                                <div class="flex items-center space-x-2">
                                    <h4 class="font-medium text-sm truncate">{{ item.name }}</h4>
                                    <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                        {{ formatTime(item.duration) }}
                                    </span>
                                </div>

                                <!-- 动画信息预览 -->
                                <div class="mt-1 text-xs text-muted-foreground">
                                    <div v-if="item.animation" class="flex items-center space-x-2">
                                        <span>缓动: {{ item.animation.easing || 'linear' }}</span>
                                        <span v-if="item.animation.loop" class="text-orange-600 font-medium">循环</span>
                                    </div>
                                    <div class="mt-0.5 flex items-center space-x-2">
                                        <span>关键帧: {{ item.animation?.keyframes?.length || 0 }} 个</span>
                                        <span v-if="item.imagePath" class="text-green-600">有图片</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 操作按钮 -->
                        <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <!-- 可见性切换 -->
                            <button
                                @click.stop="toggleVisibility(item.id)"
                                :class="[
                                    'rounded p-1 hover:bg-accent',
                                    item.visible ? 'text-muted-foreground' : 'text-muted-foreground/50'
                                ]"
                                :title="item.visible ? '隐藏' : '显示'"
                            >
                                <Eye v-if="item.visible" class="h-3 w-3" />
                                <EyeOff v-else class="h-3 w-3" />
                            </button>

                            <!-- 上传图片 -->
                            <button
                                @click.stop="uploadImageForItem(item)"
                                class="rounded p-1 text-purple-600 hover:bg-accent"
                                title="上传图片"
                            >
                                <Image class="h-3 w-3" />
                            </button>

                            <!-- 播放 -->
                            <button
                                @click.stop="playItem(item)"
                                class="rounded p-1 text-green-600 hover:bg-accent"
                                title="播放动画"
                            >
                                <Play class="h-3 w-3" />
                            </button>

                            <!-- 编辑 -->
                            <button
                                @click.stop="editItem(item)"
                                class="rounded p-1 text-blue-600 hover:bg-accent"
                                title="编辑动画"
                            >
                                <Edit3 class="h-3 w-3" />
                            </button>

                            <!-- 复制 -->
                            <button
                                @click.stop="duplicateItem(item)"
                                class="rounded p-1 text-orange-600 hover:bg-accent"
                                title="复制动画"
                            >
                                <Copy class="h-3 w-3" />
                            </button>

                            <!-- 删除 -->
                            <button
                                @click.stop="deleteItem(item.id)"
                                class="rounded p-1 text-destructive hover:bg-accent"
                                title="删除动画"
                            >
                                <Trash2 class="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    <!-- 进度条（如果需要显示播放进度） -->
                    <div v-if="item.selected" class="mt-2">
                        <div class="h-1 w-full rounded-full bg-muted">
                            <div class="h-1 rounded-full bg-primary transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="border-t bg-muted/30 px-4 py-2">
            <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">
                    拖拽重新排序 • 点击选择 • 右键菜单
                </span>
                <div class="flex items-center space-x-2">
                    <button class="text-xs text-muted-foreground hover:text-foreground">全选</button>
                    <span class="text-muted-foreground">|</span>
                    <button class="text-xs text-muted-foreground hover:text-foreground">清空</button>
                </div>
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

/* 选中状态的动画效果 */
@keyframes selectPulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
    70% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

.border-primary {
    animation: selectPulse 1s ease-out;
}
</style>
