<template>
    <ToastProvider>
        <AppLayout :breadcrumbs="breadcrumbs">
            <div class="min-h-screen bg-background">
                <div class="container mx-auto p-6">
                    <!-- 页面标题 -->
                    <div class="mb-6 flex items-center justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-foreground">人物动作调试</h1>
                            <p class="mt-2 text-muted-foreground">调试和测试3D人物模型的动画效果</p>
                        </div>
                        
                        <!-- AI动画搜索和选择 -->
                        <div class="flex items-center gap-3">
                            
                            <div class="relative">
                                <Input
                                    v-model="aiAnimationSearch"
                                    placeholder="搜索AI动画..."
                                    class="w-64 h-10"
                                    @input="searchAiAnimations"
                                    @focus="handleSearchFocus"
                                    @blur="handleSearchBlur"
                                    @keydown.enter="handleSearchEnter"
                                />
                                <Search class="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                
                                <!-- 搜索下拉选择窗口 -->
                                <div 
                                    v-if="showSearchDropdown && (aiAnimations.length > 0 || aiAnimationSearch.trim().length > 0)"
                                    class="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-background shadow-lg z-50"
                                >
                                    <div v-if="isLoadingAiAnimations" class="p-3 text-center text-sm text-muted-foreground">
                                        <Loader2 class="h-4 w-4 animate-spin mx-auto mb-2" />
                                        搜索中...
                                    </div>
                                    
                                    <div v-else-if="aiAnimations.length === 0 && aiAnimationSearch.trim().length > 0" class="p-3 text-center text-sm text-muted-foreground">
                                        未找到相关动画
                                    </div>
                                    
                                    <div v-else class="py-1">
                                        <div 
                                            v-for="animation in aiAnimations" 
                                            :key="animation.id"
                                            @click="selectAnimationFromDropdown(animation)"
                                            class="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                                        >
                                            <div class="flex flex-col">
                                                <span class="font-medium text-sm text-foreground">{{ animation.name }}</span>
                                                <span class="text-xs text-muted-foreground">
                                                    {{ animation.duration_formatted }} | {{ animation.confidence_percentage }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <Select v-model="selectedAiAnimation" @update:model-value="applyAiAnimation">
                                <SelectTrigger class="w-48 h-10">
                                    <SelectValue placeholder="选择AI动画" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem 
                                        v-for="animation in aiAnimations" 
                                        :key="animation.id" 
                                        :value="animation.id"
                                    >
                                        <div class="flex flex-col">
                                            <span class="font-medium">{{ animation.name }}</span>
                                            <span class="text-xs text-muted-foreground">
                                                {{ animation.duration_formatted }} | {{ animation.confidence_percentage }}
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem v-if="aiAnimations.length === 0" value="" disabled>
                                        暂无可用动画
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            
                            <Button 
                                @click="refreshAiAnimations" 
                                variant="outline" 
                                size="sm"
                                :disabled="isLoadingAiAnimations"
                            >
                                <RefreshCw v-if="!isLoadingAiAnimations" class="h-4 w-4" />
                                <Loader2 v-else class="h-4 w-4 animate-spin" />
                                {{ isLoadingAiAnimations ? '处理中' : '刷新' }}
                            </Button>
                        </div>
                    </div>

                    <div class="flex h-[calc(100vh-200px)] gap-6">
                        <!-- 左侧动作库面板 -->
                        <div class="w-80">
                            <ActionLibraryPanel
                                ref="actionLibraryRef"
                                :model-id="modelId"
                                @animation-selected="handleAnimationSelected"
                                @animation-preview="handleAnimationPreview"
                            />
                        </div>

                        <!-- 中央3D画布区域 -->
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
                                    <h3 class="mb-2 text-lg font-medium">3D模型画布</h3>
                                    <p class="text-sm">模型加载中，请稍候...</p>
                                </div>
                            </div>

                            <!-- 模型信息显示 -->
                            <div
                                v-if="modelStatus === 'loaded'"
                                class="absolute left-4 top-4 rounded-lg border border-border bg-background/80 p-3 text-sm backdrop-blur-sm"
                            >
                                <h4 class="font-medium text-foreground">{{ modelName }}</h4>
                                <p class="text-xs text-muted-foreground">3D模型预览</p>
                            </div>
                        </div>

                        <!-- 右侧AI对话面板 -->
                        <div class="w-80">
                            <AIChatPanel ref="aiChatPanelRef" @ai-action="handleAIAction" @ai-animation-generated="handleAIAnimationGenerated" />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    </ToastProvider>
</template>

<script setup lang="ts">
import ActionLibraryPanel from '@/components/ActionLibraryPanel.vue';
import { useToast } from '@/composables/useToast';
import AppLayout from '@/layouts/AppLayout.vue';
import { Package, Search, RefreshCw, Loader2 } from 'lucide-vue-next';
import { onMounted, ref, watch } from 'vue';
import AIChatPanel from './components/AIChatPanel.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet } from '@/utils/api';

import { useModelController } from '@/lib/three/ModelController';
import { useThreeJSManager } from '@/lib/three/ThreeJSBaseManager';
import ToastProvider from '@/components/ui/toast/ToastProvider.vue';

const threeManager = useThreeJSManager();
const { destroyThreeJS, initThreeJS, handleResize } = threeManager;
const modelController = useModelController(threeManager);
const {
    load,
    animations: availableAnimations,
    status: modelStatus,
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
    { title: '人物动作调试', href: '/character-animation-debug' },
];

// Toast
const { toast } = useToast();
const threeCanvas = ref<HTMLCanvasElement>();

// 动作库面板相关状态
const actionLibraryRef = ref<InstanceType<typeof ActionLibraryPanel> | null>(null);
const aiChatPanelRef = ref<InstanceType<typeof AIChatPanel> | null>(null);

// 模型名称和ID
const modelName = ref('调试模型');
const modelId = ref('debug-model-001');

// 默认模型URL
const defaultModelUrl = 'https://online-animate-qos.leftsky.top/models/2025/08/DY5l9zbaqO_1756016791.fbx';

// AI动画搜索相关状态
const aiAnimationSearch = ref('');
const selectedAiAnimation = ref<string>('');
const aiAnimations = ref<any[]>([]);
const isLoadingAiAnimations = ref(false);
let searchTimeout: number | null = null;
const showSearchDropdown = ref(false); // 控制搜索下拉窗口的显示

// 动作库相关方法
const handleAnimationSelected = async (animation: any) => {
    console.log('选择动画:', animation);
    
    try {
        // 检查是否有源文件URL
        if (animation.source_file_url && modelController) {
            console.log('从文件URL载入动画:', animation.source_file_url);
            console.log('当前可用动画数量:', availableAnimations.value.length);
            
            // 使用ModelController的importFBXAnimations方法载入动画文件
            const result = await modelController.importFBXAnimations(animation.source_file_url, {
                prefix: `${animation.name}_`,
                replaceExisting: false
            });
            
            console.log('载入结果:', result);
            console.log('载入后的动画数量:', availableAnimations.value.length);
            
            if (result.success && result.importedCount > 0) {
                // 载入成功，自动播放第一个载入的动画
                const animationIndex = availableAnimations.value.length - 1;
                console.log('准备播放动画索引:', animationIndex);
                
                if (animationIndex >= 0) {
                    handleAnimationPlay(animationIndex);
                }
                
                toast.success(`已载入动画: ${animation.name}`);
                console.log('动画载入成功:', result);
            } else {
                toast.error('载入动画失败: ' + (result.errors?.join(', ') || '未知错误'));
            }
        } else if (animation.animation_tracks && modelController) {
            // 如果没有源文件，尝试使用预设的动画轨道数据
            console.log('使用预设动画轨道数据');
            
            // 解析动画轨道数据
            const animationTracks = typeof animation.animation_tracks === 'string' 
                ? JSON.parse(animation.animation_tracks) 
                : animation.animation_tracks;
            
            // 创建动画数据
            const animationData = {
                name: animation.name,
                duration: typeof animation.duration === 'string' ? parseFloat(animation.duration) : animation.duration,
                frameCount: typeof animation.frame_count === 'string' ? parseInt(animation.frame_count) : animation.frame_count,
                loopType: animation.loop_type,
                tracks: animationTracks.tracks || []
            };
            
            // 添加到模型控制器
            const success = await modelController.addCustomAnimation(animationData);
            
            if (success) {
                // 自动播放新添加的动画
                const animationIndex = availableAnimations.value.length - 1;
                if (animationIndex >= 0) {
                    handleAnimationPlay(animationIndex);
                }
                
                toast.success(`已应用动画: ${animation.name}`);
                console.log('动画应用成功:', animationData);
            } else {
                toast.error('应用动画失败');
            }
        } else {
            toast.error('动画数据格式错误或缺少源文件');
        }
    } catch (error) {
        console.error('应用动画失败:', error);
        toast.error('应用动画失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
};

const handleAnimationPreview = (animation: any) => {
    console.log('预览动画:', animation);
    // TODO: 实现动画预览功能
    toast.info(`预览动画: ${animation.name}`);
};

// 防抖搜索AI动画
const searchAiAnimations = async () => {
    // 清除之前的定时器
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // 设置新的定时器，500ms后执行搜索
    searchTimeout = setTimeout(async () => {
        if (aiAnimationSearch.value.trim().length < 2) {
            // 如果搜索词少于2个字符，显示最近的动画
            await loadRecentAnimations();
            return;
        }
        
        try {
            isLoadingAiAnimations.value = true;
            const params = new URLSearchParams({
                search: aiAnimationSearch.value.trim(),
                successful_only: 'true',
                per_page: '20'
            });
            
            const response = await apiGet(`ai-skeleton-animations?${params.toString()}`);
            
            if (response.success) {
                aiAnimations.value = response.data.items;
            } else {
                toast.error('搜索AI动画失败');
            }
        } catch (error) {
            console.error('搜索AI动画失败:', error);
            toast.error('搜索AI动画失败');
        } finally {
            isLoadingAiAnimations.value = false;
        }
    }, 500);
};

// 加载最近的动画
const loadRecentAnimations = async () => {
    try {
        isLoadingAiAnimations.value = true;
        const params = new URLSearchParams({
            successful_only: 'true',
            per_page: '10',
            sort_by: 'created_at',
            sort_direction: 'desc'
        });
        
        const response = await apiGet(`ai-skeleton-animations?${params.toString()}`);
        
        if (response.success) {
            aiAnimations.value = response.data.items;
        }
    } catch (error) {
        console.error('加载最近动画失败:', error);
    } finally {
        isLoadingAiAnimations.value = false;
    }
};

// 搜索框聚焦时加载数据
const handleSearchFocus = async () => {
    showSearchDropdown.value = true;
    if (aiAnimations.value.length === 0) {
        await loadRecentAnimations();
    }
};

// 刷新AI动画列表
const refreshAiAnimations = async () => {
    try {
        isLoadingAiAnimations.value = true;
        const params = new URLSearchParams({
            successful_only: 'true',
            per_page: '20'
        });
        
        const response = await apiGet(`ai-skeleton-animations?${params.toString()}`);
 
        if (response.success) {
            aiAnimations.value = response.data.items;
            toast.success('刷新成功');
        } else {
            toast.error('刷新失败');
        }
    } catch (error) {
        console.error('刷新AI动画失败:', error);
        toast.error('刷新失败');
    } finally {
        isLoadingAiAnimations.value = false;
    }
};

// 应用选中的AI动画
const applyAiAnimation = async (animationId: string) => {
    if (!animationId) return;
    
    const selectedAnimation = aiAnimations.value.find(a => a.id === animationId);
    if (!selectedAnimation) return;
    
    try {
        // 调用ModelController的addCustomAnimation方法
        const success = await modelController.addCustomAnimation({
            name: selectedAnimation.name,
            duration: selectedAnimation.duration,
            tracks: selectedAnimation.animation_data.tracks || []
        });
        
        if (success) {
            toast.success(`成功应用动画: ${selectedAnimation.name}`);
            console.log(`应用AI动画: ${selectedAnimation.name}`);
            
            // 自动播放新添加的动画
            const animationIndex = availableAnimations.value.length - 1;
            if (animationIndex >= 0) {
                handleAnimationPlay(animationIndex);
            }
        } else {
            toast.error('应用动画失败');
        }
    } catch (error) {
        console.error('应用AI动画失败:', error);
        toast.error('应用动画失败');
    }
};

// 从搜索下拉选择动画
const selectAnimationFromDropdown = (animation: any) => {
    selectedAiAnimation.value = animation.id;
    applyAiAnimation(animation.id);
    showSearchDropdown.value = false; // 关闭下拉窗口
};

// 搜索框失去焦点时关闭下拉窗口
const handleSearchBlur = () => {
    setTimeout(() => {
        showSearchDropdown.value = false;
    }, 100); // 延迟关闭，避免误触发
};

// 搜索框回车键处理
const handleSearchEnter = async () => {
    if (aiAnimations.value.length > 0) {
        selectAnimationFromDropdown(aiAnimations.value[0]);
    }
};

// 动画控制方法
const handleAnimationPlay = (animationIndex: number) => {
    const success = modelController.play(animationIndex);
    if (success) {
        console.log('播放动画成功');
    } else {
        toast.error('播放动画失败');
    }
};

const handleAnimationPause = () => {
    const success = modelController.pause();
    if (success) {
        console.log('暂停动画成功');
    }
};

const handleAnimationStop = () => {
    const success = modelController.stop();
    if (success) {
        console.log('停止动画成功');
    }
};

// AI动作处理
const handleAIAction = (action: string) => {
    // 这里可以根据AI指令执行相应的模型控制操作
    // 例如：解析自然语言指令并转换为模型动作
    console.log('AI指令:', action);

    // 示例：简单的关键词匹配
    if (action.includes('走路') || action.includes('走')) {
        // 播放走路动画
        if (availableAnimations.value.length > 0) {
            handleAnimationPlay(0); // 假设第一个动画是走路
        }
    } else if (action.includes('挥手')) {
        // 播放挥手动画
        if (availableAnimations.value.length > 1) {
            handleAnimationPlay(1); // 假设第二个动画是挥手
        }
    } else {
    }
};

// AI动画生成处理
const handleAIAnimationGenerated = async (animation: { type: string; data: any; name: string; duration: number }) => {
    try {
        // 调用ModelController的addCustomAnimation方法
        const success = await modelController.addCustomAnimation({
            name: animation.name,
            duration: animation.data.animation_data.duration,
            tracks: animation.data.animation_data.tracks,
        });

        if (success) {
            // 自动播放新添加的动画
            const animationIndex = availableAnimations.value.length - 1;
            if (animationIndex >= 0) {
                handleAnimationPlay(animationIndex);
            }
        } else {
            throw new Error('添加动画失败');
        }
    } catch (error) {
        console.error('处理AI动画失败:', error);
        toast.error('AI动画处理失败');
    }
};

// 加载默认模型
const loadDefaultModel = async () => {
    try {
        await load(defaultModelUrl);
        modelInitParams.value = modelController.getModelParams();
    } catch (error) {
        console.error('加载默认模型失败:', error);
        toast.error('加载默认模型失败');
    }
};




// 生命周期
onMounted(async () => {
    if (threeCanvas.value) {
        initThreeJS(threeCanvas.value);
        window.addEventListener('resize', handleResize);

        // 加载默认模型
        await loadDefaultModel();
        
        // 初始化AI动画列表
        await refreshAiAnimations();
    }
});

// 组件卸载时清理资源
const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    destroyThreeJS();
};

watch(() => false, cleanup);
</script>
