<template>
    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="space-y-6">
            <!-- 页面标题和描述 -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight">视频管理</h1>
                    <p class="text-muted-foreground">
                        管理已创建的视频，查看分镜内容，支持视频制作和导出
                    </p>
                </div>
            </div>

            <!-- 选择区域 -->
            <Card class="p-4">
                <div class="flex items-center space-x-4">
                    <div class="flex-1">
                        <Label for="novel-select">选择小说</Label>
                        <Select v-model="selectedNovelId" @update:model-value="onNovelChange" :disabled="isLoading">
                            <SelectTrigger id="novel-select" class="w-full">
                                <SelectValue placeholder="请选择小说" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem 
                                    v-for="novel in novels" 
                                    :key="novel.id" 
                                    :value="novel.id"
                                >
                                    {{ novel.title }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="flex-1">
                        <Label for="chapter-search">搜索章节</Label>
                        <Input 
                            id="chapter-search"
                            v-model="chapterSearchQuery" 
                            placeholder="输入章节标题或序号搜索"
                            @input="onChapterSearch"
                            :disabled="!selectedNovelId || isLoading"
                        />
                        <!-- 章节选择下拉框 -->
                        <div v-if="selectedNovelId && filteredChapters.length > 0" class="mt-2">
                            <Select v-model="selectedChapterId" @update:model-value="onChapterSelect" :disabled="isLoading">
                                <SelectTrigger class="w-full">
                                    <SelectValue placeholder="选择章节" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem 
                                        v-for="chapter in filteredChapters" 
                                        :key="chapter.id" 
                                        :value="chapter.id"
                                    >
                                        第{{ chapter.chapter_number }}章 {{ chapter.title }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                
                <!-- 加载状态 -->
                <div v-if="isLoading" class="mt-4 flex items-center justify-center py-2">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span class="ml-2 text-sm text-muted-foreground">加载中...</span>
                </div>
            </Card>

            <!-- 主要内容区域 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 左侧：视频列表 -->
                <Card>
                    <CardHeader>
                        <CardTitle>视频列表</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div v-if="!selectedChapterId" class="text-center py-8 text-muted-foreground">
                            请先选择章节
                        </div>
                        <div v-else-if="isLoading" class="text-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <span class="text-muted-foreground">加载视频中...</span>
                        </div>
                        <div v-else-if="currentVideos.length === 0" class="text-center py-8">
                            <Video class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p class="text-muted-foreground">暂无视频数据</p>
                            <p class="text-sm text-muted-foreground">点击"新建视频"开始创建</p>
                        </div>
                        <div v-else class="space-y-3">
                            <div 
                                v-for="video in currentVideos" 
                                :key="video.id"
                                @click="selectVideo(video)"
                                class="p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent"
                                :class="{ 'bg-accent border-primary': selectedVideoId === video.id }"
                            >
                                <div class="flex items-center space-x-3">
                                    <Video class="w-8 h-8 text-primary flex-shrink-0" />
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-medium truncate">{{ video.title || '未命名视频' }}</h4>
                                        <div class="text-sm text-muted-foreground space-x-4">
                                            <span>创建时间: {{ formatDate(video.created_at) }}</span>
                                            <span v-if="video.duration">时长: {{ formatDuration(video.duration) }}</span>
                                        </div>
                                        <div class="text-xs text-muted-foreground mt-1">
                                            状态: {{ getVideoStatusText(video.status) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <!-- 右侧：分镜列表 -->
                <Card>
                    <CardHeader>
                        <CardTitle>分镜列表</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div v-if="!selectedVideoId" class="text-center py-8 text-muted-foreground">
                            请先选择视频
                        </div>
                        <div v-else-if="isLoading" class="text-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <span class="text-muted-foreground">加载分镜中...</span>
                        </div>
                        <div v-else-if="currentScenes.length === 0" class="text-center py-8">
                            <Film class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p class="text-muted-foreground">暂无分镜数据</p>
                            <p class="text-sm text-muted-foreground">该视频还没有分镜内容</p>
                        </div>
                        <div v-else class="space-y-3">
                            <div 
                                v-for="scene in currentScenes" 
                                :key="scene.id"
                                @click="selectScene(scene)"
                                class="p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent"
                                :class="{ 'bg-accent border-primary': selectedSceneId === scene.id }"
                            >
                                <div class="flex items-center space-x-3">
                                    <Film class="w-8 h-8 text-primary flex-shrink-0" />
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center space-x-2">
                                            <span class="text-sm font-medium text-muted-foreground">#{{ scene.order || scene.id }}</span>
                                            <h4 class="font-medium truncate">{{ scene.title || '未命名分镜' }}</h4>
                                        </div>
                                        <div class="text-sm text-muted-foreground space-x-4 mt-1">
                                            <span>创建时间: {{ formatDate(scene.created_at) }}</span>
                                            <span v-if="scene.duration">时长: {{ formatDuration(scene.duration) }}</span>
                                        </div>
                                        <div class="text-xs text-muted-foreground mt-1">
                                            状态: {{ getSceneStatusText(scene.status) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Video, Film } from 'lucide-vue-next';
import AppLayout from '@/layouts/AppLayout.vue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { apiGet } from '@/utils/api';
import { useToast } from '@/composables/useToast';

const { toast } = useToast();

// 面包屑导航
const breadcrumbs = [
    { title: '工作台', href: '/dashboard' },
    { title: '内容管理', href: '/novel-management' },
    { title: '视频管理', href: '/video-management' },
];

// 响应式数据
const novels = ref([]);
const chapters = ref([]);
const videos = ref([]);
const scenes = ref([]);

// 选择状态
const selectedNovelId = ref(null);
const selectedChapterId = ref(null);
const selectedVideoId = ref(null);
const selectedSceneId = ref(null);

// 搜索状态
const chapterSearchQuery = ref('');
const isLoading = ref(false);

// 计算属性
const filteredChapters = computed(() => {
    if (!selectedNovelId.value) return [];
    if (!chapterSearchQuery.value) {
        return chapters.value.filter(chapter => chapter.novel_id === selectedNovelId.value);
    }
    const query = chapterSearchQuery.value.toLowerCase();
    return chapters.value.filter(chapter => 
        chapter.novel_id === selectedNovelId.value && 
        (chapter.title.toLowerCase().includes(query) || 
         chapter.chapter_number.toString().includes(query))
    );
});

const currentVideos = computed(() => {
    if (!selectedChapterId.value) return [];
    return videos.value.filter(video => video.chapter_id === selectedChapterId.value);
});

const currentScenes = computed(() => {
    if (!selectedVideoId.value) return [];
    return scenes.value.filter(scene => scene.video_id === selectedVideoId.value);
});

// API调用方法
const loadNovels = async () => {
    try {
        isLoading.value = true;
        const response = await apiGet('/novels');
        if (response.success) {
            novels.value = response.data.novels || [];
            // 默认选择第一个小说
            if (novels.value.length > 0) {
                selectedNovelId.value = novels.value[0].id;
                await loadChapters();
            }
        }
    } catch (error) {
        console.error('加载小说失败:', error);
        toast.error('加载小说失败');
    } finally {
        isLoading.value = false;
    }
};

const loadChapters = async () => {
    if (!selectedNovelId.value) return;
    
    try {
        isLoading.value = true;
        const response = await apiGet(`/novels/${selectedNovelId.value}/chapters`);
        if (response.success) {
            chapters.value = response.data.chapters || [];
            // 默认选择第一个章节
            if (chapters.value.length > 0) {
                selectedChapterId.value = chapters.value[0].id;
                await loadVideos();
            }
        }
    } catch (error) {
        console.error('加载章节失败:', error);
        toast.error('加载章节失败');
    } finally {
        isLoading.value = false;
    }
};

const loadVideos = async () => {
    if (!selectedChapterId.value) return;
    
    try {
        isLoading.value = true;
        const response = await apiGet(`/videos/chapters/${selectedChapterId.value}`);
        if (response.success) {
            videos.value = response.data.videos || [];
            // 默认选择第一个视频
            if (videos.value.length > 0) {
                selectedVideoId.value = videos.value[0].id;
                await loadScenes();
            }
        }
    } catch (error) {
        console.error('加载视频失败:', error);
        toast.error('加载视频失败');
    } finally {
        isLoading.value = false;
    }
};

const loadScenes = async () => {
    if (!selectedVideoId.value) return;
    
    try {
        isLoading.value = true;
        const response = await apiGet(`/videos/${selectedVideoId.value}/scenes`);
        if (response.success) {
            scenes.value = response.data.scenes || [];
            // 默认选择第一个分镜
            if (scenes.value.length > 0) {
                selectedSceneId.value = scenes.value[0].id;
            }
        }
    } catch (error) {
        console.error('加载分镜失败:', error);
        toast.error('加载分镜失败');
    } finally {
        isLoading.value = false;
    }
};

// 事件处理方法
const onNovelChange = async () => {
    selectedChapterId.value = null;
    selectedVideoId.value = null;
    selectedSceneId.value = null;
    chapterSearchQuery.value = '';
    await loadChapters();
};

const onChapterSelect = async () => {
    await loadVideos();
};

const selectVideo = async (video) => {
    selectedVideoId.value = video.id;
    selectedSceneId.value = null;
    await loadScenes();
};

const selectScene = (scene) => {
    selectedSceneId.value = scene.id;
};

const onChapterSearch = () => {
    // 搜索逻辑已在计算属性中实现
    // 当用户输入搜索关键词时，自动过滤章节
    // 用户可以从过滤结果中看到可选的章节
    console.log('Searching chapters for query:', chapterSearchQuery.value);
};

// 工具方法
const getVideoStatusText = (status) => {
    switch (status) {
        case 'pending':
            return '待制作';
        case 'in_progress':
            return '制作中';
        case 'completed':
            return '已完成';
        default:
            return '未知';
    }
};

const getSceneStatusText = (status) => {
    switch (status) {
        case 'pending':
            return '待制作';
        case 'in_progress':
            return '制作中';
        case 'completed':
            return '已完成';
        default:
            return '未知';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
};

const formatDuration = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

// 生命周期
onMounted(async () => {
    await loadNovels();
});

// 监听选择变化
watch(selectedNovelId, () => {
    if (selectedNovelId.value) {
        loadChapters();
    }
});

watch(selectedChapterId, () => {
    if (selectedChapterId.value) {
        loadVideos();
    }
});

watch(selectedVideoId, () => {
    if (selectedVideoId.value) {
        loadScenes();
    }
});
</script>
