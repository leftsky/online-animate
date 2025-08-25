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
            <el-card class="p-4">
                <div class="flex items-center space-x-4">
                    <div class="flex-1">
                        <label for="novel-select" class="block text-sm font-medium text-foreground mb-2">选择小说</label>
                        <el-select 
                            v-model="selectedNovelId" 
                            @change="onNovelChange" 
                            :disabled="isLoading"
                            placeholder="请选择小说"
                            class="w-full"
                        >
                            <el-option 
                                v-for="novel in novels" 
                                :key="novel.id" 
                                :label="novel.title"
                                :value="novel.id"
                            />
                        </el-select>
                    </div>
                    <div class="flex-1">
                        <label for="chapter-search" class="block text-sm font-medium text-foreground mb-2">选择章节</label>
                        <el-autocomplete
                            v-model="chapterSearchQuery"
                            :fetch-suggestions="querySearch"
                            placeholder="输入章节标题或序号搜索"
                            :disabled="!selectedNovelId || isLoading"
                            clearable
                            class="w-full"
                            @select="handleChapterSelect"
                            :trigger-on-focus="true"
                        />
                    </div>
                </div>
                
                <!-- 加载状态 -->
                <div v-if="isLoading" class="mt-4 flex items-center justify-center py-2">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span class="ml-2 text-sm text-muted-foreground">加载中...</span>
                </div>
            </el-card>

            <!-- 主要内容区域 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 左侧：视频列表 -->
                <el-card>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="text-lg font-semibold">视频列表</span>
                        </div>
                    </template>
                    
                    <div v-if="!selectedChapterId" class="text-center py-8 text-muted-foreground">
                        请先选择章节
                    </div>
                    <div v-else-if="currentVideos.length === 0" class="text-center py-8">
                        <Video class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p class="text-muted-foreground">暂无视频数据</p>
                        <p class="text-sm text-muted-foreground">点击"新建视频"开始创建</p>
                    </div>
                    <div v-else>
                        <!-- 视频列表 -->
                        <el-table 
                            v-loading="isLoading"
                            :data="paginatedVideos" 
                            @row-click="selectVideo"
                            :row-class-name="getVideoRowClass"
                            stripe
                            highlight-current-row
                        >
                            <el-table-column prop="title" label="标题" min-width="120">
                                <template #default="{ row }">
                                    <div class="flex items-center space-x-2">
                                        <Video class="text-primary w-4 h-4" />
                                        <span class="font-medium">{{ row.title || '未命名视频' }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="created_at" label="创建时间" width="120">
                                <template #default="{ row }">
                                    {{ formatDate(row.created_at) }}
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="duration" label="时长" width="80">
                                <template #default="{ row }">
                                    {{ formatDuration(row.duration) }}
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="status" label="状态" width="100">
                                <template #default="{ row }">
                                    <el-tag :type="getVideoStatusType(row.status)" size="small">
                                        {{ getVideoStatusText(row.status) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            
                            <el-table-column label="操作" width="120" fixed="right">
                                <template #default="{ row }">
                                    <el-button 
                                        type="primary" 
                                        size="small" 
                                        @click.stop="selectVideo(row)"
                                    >
                                        选择
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        
                        <!-- 分页器 -->
                        <div class="mt-4 flex justify-center">
                            <el-pagination
                                v-model:current-page="currentPage"
                                v-model:page-size="pageSize"
                                :page-sizes="[10, 20, 50]"
                                :total="currentVideos.length"
                                layout="total, sizes, prev, pager, next, jumper"
                                @size-change="handleSizeChange"
                                @current-change="handleCurrentChange"
                            />
                        </div>
                    </div>
                </el-card>

                <!-- 右侧：分镜列表 -->
                <el-card>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <span class="text-lg font-semibold">分镜列表</span>
                            <el-button type="primary" size="small" :disabled="!selectedVideoId">
                                <Film class="mr-1 w-4 h-4" />
                                新建分镜
                            </el-button>
                        </div>
                    </template>
                    
                    <div v-if="!selectedVideoId" class="text-center py-8 text-muted-foreground">
                        请先选择视频
                    </div>
                    <div v-else-if="currentScenes.length === 0" class="text-center py-8">
                        <Film class="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p class="text-muted-foreground">暂无分镜数据</p>
                        <p class="text-sm text-muted-foreground">该视频还没有分镜内容</p>
                    </div>
                    <div v-else>
                        <!-- 分镜列表 -->
                        <el-table 
                            v-loading="isLoading"
                            :data="paginatedScenes" 
                            @row-click="selectScene"
                            :row-class-name="getSceneRowClass"
                            stripe
                            highlight-current-row
                        >
                            <el-table-column prop="order" label="序号" width="80">
                                <template #default="{ row }">
                                    <span class="text-sm font-medium text-muted-foreground">
                                        #{{ row.order || row.id }}
                                    </span>
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="title" label="标题" min-width="120">
                                <template #default="{ row }">
                                    <div class="flex items-center space-x-2">
                                        <Film class="text-primary w-4 h-4" />
                                        <span class="font-medium">{{ row.title || '未命名分镜' }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="created_at" label="创建时间" width="120">
                                <template #default="{ row }">
                                    {{ formatDate(row.created_at) }}
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="duration" label="时长" width="80">
                                <template #default="{ row }">
                                    {{ formatDuration(row.duration) }}
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="status" label="状态" width="100">
                                <template #default="{ row }">
                                    <el-tag :type="getSceneStatusType(row.status)" size="small">
                                        {{ getSceneStatusText(row.status) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            
                            <el-table-column label="操作" width="120" fixed="right">
                                <template #default="{ row }">
                                    <el-button 
                                        type="primary" 
                                        size="small" 
                                        @click.stop="selectScene(row)"
                                    >
                                        选择
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        
                        <!-- 分页器 -->
                        <div class="mt-4 flex justify-center">
                            <el-pagination
                                v-model:current-page="sceneCurrentPage"
                                v-model:page-size="scenePageSize"
                                :page-sizes="[10, 20, 50]"
                                :total="currentScenes.length"
                                layout="total, sizes, prev, pager, next, jumper"
                                @size-change="handleSceneSizeChange"
                                @current-change="handleSceneCurrentChange"
                            />
                        </div>
                    </div>
                </el-card>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Video, Film } from 'lucide-vue-next';
import AppLayout from '@/layouts/AppLayout.vue';
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

// 分页状态
const currentPage = ref(1);
const pageSize = ref(10);
const sceneCurrentPage = ref(1);
const scenePageSize = ref(10);

// 计算属性
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
                // 自动加载并选择第一个章节
                await loadChaptersAndSelectFirst();
            }
        }
    } catch (error) {
        console.error('加载小说失败:', error);
        toast.error('加载小说失败');
    } finally {
        isLoading.value = false;
    }
};

// 加载章节并自动选择第一个
const loadChaptersAndSelectFirst = async () => {
    if (!selectedNovelId.value) return;
    
    try {
        isLoading.value = true;
        // 加载前20个章节，选择第一个
        const response = await apiGet(`/novels/${selectedNovelId.value}/chapters?limit=20`);
        if (response.success && response.data.chapters && response.data.chapters.length > 0) {
            const firstChapter = response.data.chapters[0];
            selectedChapterId.value = firstChapter.id;
            // 自动加载该章节的视频
            await loadVideos();
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
    // 不再需要清空章节列表，因为使用远程搜索
    currentPage.value = 1;
    sceneCurrentPage.value = 1;
    // 自动加载并选择第一个章节
    await loadChaptersAndSelectFirst();
};

const selectVideo = async (video) => {
    selectedVideoId.value = video.id;
    selectedSceneId.value = null;
    sceneCurrentPage.value = 1;
    await loadScenes();
};

const selectScene = (scene) => {
    selectedSceneId.value = scene.id;
};

// 自动补全搜索建议
const querySearch = async (queryString, cb) => {
    if (!selectedNovelId.value) {
        cb([]);
        return;
    }
    
    try {
        // 使用现有的章节列表接口，通过查询参数过滤
        // 如果 queryString 为空，返回所有章节；否则进行搜索
        const queryParam = queryString ? `&q=${encodeURIComponent(queryString)}` : '';
        const response = await apiGet(`/novels/${selectedNovelId.value}/chapters?limit=20${queryParam}`);
        
        if (response.success) {
            const suggestions = (response.data.chapters || []).map(chapter => ({
                value: `第${chapter.chapter_number}章 ${chapter.title}`,
                chapter: chapter
            }));
            cb(suggestions);
        } else {
            cb([]);
        }
    } catch (error) {
        console.error('搜索章节失败:', error);
        cb([]);
    }
};

// 处理章节选择
const handleChapterSelect = (item) => {
    if (item && item.chapter) {
        selectedChapterId.value = item.chapter.id;
        loadVideos(); // 直接加载视频，不再调用onChapterSelect
    }
};

// 分页处理方法
const handleSizeChange = (val) => {
    pageSize.value = val;
    currentPage.value = 1;
};

const handleCurrentChange = (val) => {
    currentPage.value = val;
};

const handleSceneSizeChange = (val) => {
    scenePageSize.value = val;
    sceneCurrentPage.value = 1;
};

const handleSceneCurrentChange = (val) => {
    sceneCurrentPage.value = val;
};

// 表格行样式
const getVideoRowClass = ({ row }) => {
    return selectedVideoId.value === row.id ? 'bg-primary/10 border-primary' : '';
};

const getSceneRowClass = ({ row }) => {
    return selectedSceneId.value === row.id ? 'bg-primary/10 border-primary' : '';
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

const getVideoStatusType = (status) => {
    switch (status) {
        case 'pending':
            return 'warning';
        case 'in_progress':
            return 'primary';
        case 'completed':
            return 'success';
        default:
            return 'info';
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

const getSceneStatusType = (status) => {
    switch (status) {
        case 'pending':
            return 'warning';
        case 'in_progress':
            return 'primary';
        case 'completed':
            return 'success';
        default:
            return 'info';
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
    // 不再自动加载章节，用户需要手动选择小说后点击"加载章节"按钮
});

// 监听选择变化
watch(selectedNovelId, () => {
    if (selectedNovelId.value) {
        // 不再自动加载章节，用户需要手动输入搜索
    }
});

watch(selectedVideoId, () => {
    if (selectedVideoId.value) {
        loadScenes();
    }
});
</script>
