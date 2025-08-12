<script setup lang="ts">
import { ref, computed } from 'vue';
import { Play, Edit3, Trash2, Plus, Copy, Eye, EyeOff, Image } from 'lucide-vue-next';
import { AnimationParser } from '../../lib/AnimationParser';
import { uploadImage } from '../../utils/upload';

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

// 默认示例动画数据
const defaultAnimations = [
    {
        id: '1',
        name: '旋转缩放动画',
        imagePath: '/images/sample/character1.png',
        thumbnail: '/images/sample/character1_thumb.png',
        script: `image1:
  duration: 3s
  easing: ease-in-out
  loop: true
  keyframes:
    - time: 0s, rotate: 0deg, scale: 1, position: [100, 100], opacity: 1
    - time: 1.5s, rotate: 180deg, scale: 1.5, position: [200, 150], opacity: 0.8
    - time: 3s, rotate: 360deg, scale: 1, position: [300, 100], opacity: 1`
    },
    {
        id: '2', 
        name: '弹跳动画',
        imagePath: '/images/sample/ball.png',
        thumbnail: '/images/sample/ball_thumb.png',
        script: `image2:
  duration: 2s
  easing: bounce
  keyframes:
    - time: 0s, x: 0, y: 0, scaleX: 1, scaleY: 1
    - time: 1s, x: 100, y: 50, scaleX: 1.2, scaleY: 0.8
    - time: 2s, x: 200, y: 0, scaleX: 1, scaleY: 1`
    },
    {
        id: '3',
        name: '淡入淡出',
        imagePath: '/images/sample/star.png',
        thumbnail: '/images/sample/star_thumb.png',
        script: `image3:
  duration: 4s
  easing: ease-in-out
  keyframes:
    - time: 0s, opacity: 0, scale: 0.8
    - time: 2s, opacity: 1, scale: 1.2
    - time: 4s, opacity: 0, scale: 0.8`
    }
];

// 分镜列表数据
const storyboardItems = ref<StoryboardItem[]>([]);

// 初始化默认数据
const initializeStoryboard = () => {
    storyboardItems.value = defaultAnimations.map(anim => {
        try {
            const parsedAnimations = AnimationParser.parse(anim.script);
            const animation = parsedAnimations[0];
            
            return {
                id: anim.id,
                name: anim.name,
                duration: parseDuration(animation?.duration || 3000), // AnimationParser 返回毫秒数
                visible: true,
                selected: anim.id === '1', // 默认选中第一个
                animation,
                script: anim.script,
                imagePath: anim.imagePath,
                thumbnail: anim.thumbnail
            };
        } catch (error) {
            console.error('解析动画失败:', error);
            return {
                id: anim.id,
                name: anim.name,
                duration: 3,
                visible: true,
                selected: false,
                animation: null,
                script: anim.script,
                imagePath: anim.imagePath,
                thumbnail: anim.thumbnail
            };
        }
    });
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
const deleteItem = (itemId: string) => {
    const index = storyboardItems.value.findIndex(item => item.id === itemId);
    if (index > -1) {
        storyboardItems.value.splice(index, 1);
        emit('deleteItem', itemId);
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
    emit('addNewItem');
};

// 图片加载错误处理
const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    // 可以在这里设置默认图片或显示占位符
};

// 上传图片
const uploadImageForItem = async (item: StoryboardItem) => {
    try {
        console.log('开始上传图片...');
        
        const result = await uploadImage({
            folder: 'storyboard'
        });
        
        if (result.success && result.data) {
            item.imagePath = result.data.url;
            item.thumbnail = result.data.url;
            console.log('图片上传成功:', item.name, result.data);
        } else {
            console.error('图片上传失败:', result.message);
            alert('图片上传失败: ' + result.message);
        }
    } catch (error) {
        console.error('图片上传出错:', error);
        alert('图片上传出错，请重试');
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

// 初始化
initializeStoryboard();
</script>

<template>
    <div class="flex h-full flex-col bg-card">
        <!-- 标题栏 -->
        <div class="flex items-center justify-between border-b px-4 py-3">
            <div class="flex items-center space-x-2">
                <h3 class="text-lg font-semibold">分镜列表</h3>
                <span class="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {{ storyboardItems.length }} 项
                </span>
            </div>
            <button
                @click="addNewItem"
                class="flex items-center rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                title="添加新动画"
            >
                <Plus class="mr-1 h-4 w-4" />
                新建
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
