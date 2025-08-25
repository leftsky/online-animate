<template>
    <div class="flex h-full w-full flex-col rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur-sm">
        <!-- 标题栏 -->
        <div class="sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b border-border bg-background/95 p-2">
            <div class="flex flex-col">
                <h3 class="text-sm font-medium text-foreground">动作库</h3>
                <div class="text-xs text-muted-foreground">选择和应用动画</div>
            </div>

            <!-- 按钮组 -->
            <div class="flex gap-2">
                <!-- 上传按钮 -->
                <el-button type="primary" size="small" @click="handleUploadClick" :loading="isUploading">
                    <el-icon><Upload /></el-icon>
                    {{ isUploading ? '批量上传中...' : '批量上传动作' }}
                </el-button>

                <!-- 预览动画按钮 -->
                <el-button type="info" size="small" @click="handlePreviewAnimations" :disabled="filteredAnimations.length === 0">
                    <el-icon><View /></el-icon>
                    预览{{ filteredAnimations.length }}个动画
                </el-button>
            </div>
        </div>

        <!-- 可滚动内容区域 -->
        <div class="flex-1 space-y-3 overflow-y-auto p-3">
            <!-- 搜索栏 -->
            <div class="relative">
                <el-input v-model="searchQuery" placeholder="搜索动画..." size="small" @input="handleSearch" />
                <el-icon class="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground">
                    <Search />
                </el-icon>
            </div>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="flex items-center justify-center py-8">
                <el-icon class="h-6 w-6 animate-spin text-muted-foreground">
                    <Loading />
                </el-icon>
                <span class="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>

            <!-- 动画列表 -->
            <div v-else-if="filteredAnimations.length > 0" class="space-y-2">
                <div
                    v-for="animation in filteredAnimations"
                    :key="animation.id"
                    class="group rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm"
                >
                    <!-- 动画信息 -->
                    <div class="mb-2">
                        <h4 class="text-sm font-medium text-foreground">{{ animation.name }}</h4>
                        <p v-if="animation.description" class="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {{ animation.description }}
                        </p>
                    </div>

                    <!-- 动画属性 -->
                    <div class="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span class="flex items-center gap-1">
                            <el-icon><Clock /></el-icon>
                            {{ formatDuration(animation.duration) }}
                        </span>
                        <span class="flex items-center gap-1">
                            <el-icon><VideoPlay /></el-icon>
                            {{ typeof animation.frame_count === 'string' ? parseInt(animation.frame_count) || 0 : animation.frame_count }}帧
                        </span>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="flex items-center gap-2">
                        <el-button type="primary" size="small" class="flex-1" @click="applyAnimation(animation)">
                            <el-icon><VideoPlay /></el-icon>
                            应用动画
                        </el-button>
                        <el-button type="info" size="small" @click="previewAnimation(animation)">
                            <el-icon><View /></el-icon>
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="flex flex-col items-center justify-center py-8 text-center">
                <el-icon class="h-12 w-12 text-muted-foreground/50">
                    <Box />
                </el-icon>
                <p class="mt-2 text-sm text-muted-foreground">
                    {{ searchQuery ? '未找到相关动画' : '暂无可用动画' }}
                </p>
            </div>

            <!-- 分页控制 -->
            <div v-if="total > limit" class="flex items-center justify-between border-t border-border pt-3">
                <span class="text-xs text-muted-foreground"> 共 {{ total }} 个动画 </span>
                <div class="flex items-center gap-2">
                    <el-button type="default" size="small" :disabled="offset === 0" @click="loadPage(offset - limit)">
                        <el-icon><ArrowLeft /></el-icon>
                    </el-button>
                    <span class="text-xs text-muted-foreground"> {{ Math.floor(offset / limit) + 1 }} / {{ Math.ceil(total / limit) }} </span>
                    <el-button type="default" size="small" :disabled="offset + limit >= total" @click="loadPage(offset + limit)">
                        <el-icon><ArrowRight /></el-icon>
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { apiGet, apiPost, uploadApi } from '@/utils/api';
import { ArrowLeft, ArrowRight, Box, Clock, Loading, VideoPlay, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { Search, Upload } from 'lucide-vue-next';
import { computed, onMounted, ref, watch } from 'vue';

// Props
defineProps({
    modelId: {
        type: [String, Number],
        default: null,
    },
});

// Emits
const emit = defineEmits(['animation-selected', 'animation-preview', 'batch-animation-preview']);

// 响应式数据
const searchQuery = ref('');
const isLoading = ref(false);
const animations = ref([]);
const total = ref(0);
const limit = ref(20);
const offset = ref(0);

// 上传相关状态
const isUploading = ref(false);

// 计算属性
const filteredAnimations = computed(() => {
    return animations.value;
});

// 方法
const loadAnimations = async () => {
    try {
        isLoading.value = true;

        const params = {
            limit: limit.value,
            offset: offset.value,
        };

        // 添加搜索参数
        if (searchQuery.value.trim()) {
            params.search = searchQuery.value.trim();
        }

        const response = await apiGet('/media_animations', { params });
        if (response.success) {
            animations.value = response.data.items || [];
            total.value = response.data.total || 0;
        }
    } catch (error) {
        console.error('加载动画失败:', error);
        animations.value = [];
        total.value = 0;
    } finally {
        isLoading.value = false;
    }
};

const handleSearch = () => {
    offset.value = 0;
    loadAnimations();
};

const loadPage = (newOffset) => {
    offset.value = Math.max(0, newOffset);
    loadAnimations();
};

const applyAnimation = (animation) => {
    emit('animation-selected', animation);
};

const previewAnimation = (animation) => {
    emit('animation-preview', animation);
};

const formatDuration = (duration) => {
    // 确保 duration 是数字类型
    const numDuration = typeof duration === 'string' ? parseFloat(duration) : duration;

    if (isNaN(numDuration)) {
        return '0s';
    }

    if (numDuration < 1) {
        return `${Math.round(numDuration * 1000)}ms`;
    }
    return `${numDuration.toFixed(1)}s`;
};

// 上传相关方法
const handleUploadClick = () => {
    // 创建隐藏的文件输入，支持多选
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fbx,.json,.yaml,.yml';
    input.multiple = true; // 支持多选
    input.style.display = 'none';

    input.onchange = async (event) => {
        const target = event.target;
        if (target.files && target.files.length > 0) {
            const files = Array.from(target.files);
            console.log(
                `选择了 ${files.length} 个文件:`,
                files.map((f) => f.name),
            );

            // 批量处理文件
            await processBatchUpload(files);
        }

        // 清理DOM
        document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
};

const processBatchUpload = async (files) => {
    try {
        isUploading.value = true;

        const results = {
            success: 0,
            failed: 0,
            errors: [],
        };

        console.log(`开始批量上传 ${files.length} 个文件...`);

        // 并发处理所有文件，但限制并发数量避免过载
        const batchSize = 3; // 每次处理3个文件
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            console.log(
                `处理批次 ${Math.floor(i / batchSize) + 1}:`,
                batch.map((f) => f.name),
            );

            // 并发处理当前批次
            const batchPromises = batch.map(async (file) => {
                try {
                    await processSingleFile(file);
                    results.success++;
                    console.log(`文件 ${file.name} 上传成功`);
                } catch (error) {
                    results.failed++;
                    const errorMsg = `文件 ${file.name} 上传失败: ${error instanceof Error ? error.message : '未知错误'}`;
                    results.errors.push(errorMsg);
                    console.error(errorMsg);
                }
            });

            // 等待当前批次完成
            await Promise.all(batchPromises);

            // 批次间短暂延迟，避免服务器过载
            if (i + batchSize < files.length) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        // 显示批量上传结果
        if (results.success > 0) {
            await loadAnimations(); // 刷新动画列表
            ElMessage.success(`批量上传完成！成功: ${results.success} 个，失败: ${results.failed} 个`);
        }

        if (results.failed > 0) {
            console.error('批量上传错误:', results.errors);
            // 可以选择是否显示详细错误信息
            if (results.errors.length <= 5) {
                results.errors.forEach((error) => ElMessage.error(error));
            } else {
                ElMessage.error(`有 ${results.failed} 个文件上传失败，请查看控制台了解详情`);
            }
        }

        console.log('批量上传完成:', results);
    } catch (error) {
        console.error('批量上传过程出错:', error);
        ElMessage.error('批量上传过程出错: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
        isUploading.value = false;
    }
};

const processSingleFile = async (file) => {
    // 解析文件名获取基本信息
    const fileName = file.name.replace(/\.[^/.]+$/, ''); // 移除文件扩展名
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // 先上传文件
    const uploadResponse = await uploadApi.uploadFile(file, {
        folder: 'animations',
    });

    if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error('文件上传失败: ' + uploadResponse.message);
    }

    const sourceFileUrl = uploadResponse.data.url || uploadResponse.data.path;

    // 根据文件类型解析动画数据
    let animationData = {};

    if (fileExtension === 'fbx') {
        // FBX文件：使用默认值
        animationData = {
            name: fileName,
            description: `从FBX文件导入: ${fileName}`,
            duration: 1.0, // 默认1秒
            frame_count: 30, // 默认30帧
            loop_type: 'none',
            animation_tracks: {
                tracks: [
                    {
                        name: 'root',
                        type: 'position',
                        keyframes: [
                            { time: 0, value: [0, 0, 0] },
                            { time: 1.0, value: [0, 0, 0] },
                        ],
                    },
                ],
            },
            source_file_url: sourceFileUrl,
        };
    } else if (fileExtension === 'json' || fileExtension === 'yaml' || fileExtension === 'yml') {
        // JSON/YAML文件：尝试解析内容
        try {
            const text = await file.text();
            const parsed = fileExtension === 'json' ? JSON.parse(text) : parseYaml(text);

            animationData = {
                name: fileName,
                description: parsed.description || `从${fileExtension.toUpperCase()}文件导入: ${fileName}`,
                duration: parsed.duration || 1.0,
                frame_count: parsed.frame_count || Math.ceil((parsed.duration || 1.0) * 30),
                loop_type: parsed.loop_type || 'none',
                animation_tracks: parsed.animation_tracks || {
                    tracks: [
                        {
                            name: 'root',
                            type: 'position',
                            keyframes: [
                                { time: 0, value: [0, 0, 0] },
                                { time: parsed.duration || 1.0, value: [0, 0, 0] },
                            ],
                        },
                    ],
                },
                source_file_url: sourceFileUrl,
            };
        } catch (parseError) {
            console.warn('文件解析失败，使用默认值:', parseError);
            // 解析失败时使用默认值
            animationData = {
                name: fileName,
                description: `从${fileExtension.toUpperCase()}文件导入: ${fileName}`,
                duration: 1.0,
                frame_count: 30,
                loop_type: 'none',
                animation_tracks: {
                    tracks: [
                        {
                            name: 'root',
                            type: 'position',
                            keyframes: [
                                { time: 0, value: [0, 0, 0] },
                                { time: 1.0, value: [0, 0, 0] },
                            ],
                        },
                    ],
                },
                source_file_url: sourceFileUrl,
            };
        }
    }

    // 调用API创建动画
    const response = await apiPost('/media_animations', animationData);

    if (!response.success) {
        throw new Error(response.message || '创建动画记录失败');
    }

    return response.data;
};

// 简单的YAML解析函数（如果需要的话）
const parseYaml = (text) => {
    // 这里可以集成js-yaml库，或者使用简单的解析逻辑
    // 暂时返回空对象，让JSON解析处理
    try {
        return JSON.parse(text);
    } catch {
        return {};
    }
};

// 批量预览动画
const handlePreviewAnimations = () => {
    if (filteredAnimations.value.length > 0) {
        emit('batch-animation-preview', filteredAnimations.value);
    }
};

// 刷新方法
const refresh = async () => {
    await loadAnimations();
};

// 暴露刷新方法给父组件
defineExpose({
    refresh,
});

// 监听器
watch(searchQuery, () => {
    offset.value = 0;
});

// 生命周期
onMounted(() => {
    loadAnimations();
});
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
