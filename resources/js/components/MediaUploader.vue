<template>
    <div class="media-uploader">
        <!-- 拖拽上传区域 -->
        <div
            class="upload-dropzone"
            :class="{ 'drag-over': isDragOver }"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @click="triggerFileInput"
        >
            <Upload class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 class="mb-2 text-lg font-medium">
                {{ autoCreateResource ? '拖拽文件到此处' : '拖拽文件到此处' }}
            </h3>
            <p class="mb-4 text-muted-foreground">
                {{
                    autoCreateResource
                        ? '支持 JPG、PNG、GIF、WebP 格式，单个文件最大 50MB，将自动创建资源'
                        : '支持 JPG、PNG、GIF、WebP 格式，单个文件最大 50MB'
                }}
            </p>
            <Button variant="outline">
                {{ autoCreateResource ? '选择文件上传' : '选择文件' }}
            </Button>
            <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" @change="handleFileSelect" />
        </div>

        <!-- 上传进度 -->
        <div v-if="uploadingFiles.length > 0" class="upload-progress mt-6">
            <h4 class="mb-3 font-medium">上传进度</h4>
            <div class="space-y-2">
                <div v-for="file in uploadingFiles" :key="file.id" class="flex items-center gap-3 rounded-lg bg-muted p-3">
                    <div class="flex-1">
                        <div class="mb-1 flex items-center justify-between">
                            <span class="text-sm font-medium">{{ file.name }}</span>
                            <span class="text-xs text-muted-foreground">{{ file.progress }}%</span>
                        </div>
                        <div class="h-2 w-full rounded-full bg-background">
                            <div class="h-2 rounded-full bg-primary transition-all duration-300" :style="{ width: file.progress + '%' }"></div>
                        </div>
                    </div>
                    <Button v-if="file.status === 'uploading'" variant="ghost" size="sm" @click="cancelUpload(file.id)">
                        <X class="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>

        <!-- 已上传文件列表 -->
        <div v-if="uploadedFiles.length > 0" class="uploaded-files mt-6">
            <h4 class="mb-3 font-medium">已上传文件</h4>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <div v-for="file in uploadedFiles" :key="file.id" class="group relative">
                    <img :src="file.url" :alt="file.name" class="aspect-square w-full rounded-lg object-cover" />
                    <div
                        class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <Button variant="ghost" size="sm" @click="deleteFile(file.id)" class="text-white hover:bg-white/20 hover:text-white">
                            <Trash2 class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useToast } from '@/composables/useToast';
import type { MediaFile } from '@/services/mediaApi';
import axios from 'axios'; // 新增：导入 axios
import { Trash2, Upload, X } from 'lucide-vue-next';
import { ref } from 'vue';

interface Props {
    type?: string;
    resourceId?: number;
    onUploadComplete?: (files: MediaFile[]) => void;
    onCreateResource?: (file: MediaFile) => Promise<any>; // 新增：创建资源的回调
    autoCreateResource?: boolean; // 新增：是否自动创建资源
}

const props = withDefaults(defineProps<Props>(), {
    type: 'general',
    autoCreateResource: false,
});

const emit = defineEmits<{
    uploadComplete: [files: MediaFile[]];
    uploadError: [error: string];
}>();

// 响应式数据
const fileInput = ref<HTMLInputElement>();
const isDragOver = ref(false);
const uploadingFiles = ref<UploadFile[]>([]);
const uploadedFiles = ref<MediaFile[]>([]);

// 计算属性 - 已移除未使用的isUploading

// 类型定义
interface UploadFile {
    id: string;
    file: File;
    name: string;
    size: number;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    url?: string;
    error?: string;
}

// 方法
const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files) {
        addFiles(Array.from(target.files));
    }
};

const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = false;
};

const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = false;

    if (event.dataTransfer?.files) {
        addFiles(Array.from(event.dataTransfer.files));
    }
};

const addFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            const { toast } = useToast();
            toast.error(`文件 ${file.name} 不是有效的图片格式`);
            return false;
        }

        // 检查文件大小 (50MB)
        if (file.size > 50 * 1024 * 1024) {
            const { toast } = useToast();
            toast.error(`文件 ${file.name} 超过 50MB 限制`);
            return false;
        }

        return true;
    });

    if (validFiles.length === 0) return;

    // 添加到上传队列
    validFiles.forEach((file) => {
        const uploadFile: UploadFile = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'pending',
        };
        uploadingFiles.value.push(uploadFile);
    });

    // 开始上传
    startUpload();
};

const startUpload = async () => {
    const pendingFiles = uploadingFiles.value.filter((f) => f.status === 'pending');

    for (const uploadFile of pendingFiles) {
        uploadFile.status = 'uploading';

        try {
            // 模拟上传进度
            const progressInterval = setInterval(() => {
                if (uploadFile.progress < 90) {
                    uploadFile.progress += Math.random() * 20;
                }
            }, 200);

            // 使用UploadController进行单文件上传
            const formData = new FormData();
            formData.append('file', uploadFile.file);
            formData.append('type', 'image');
            formData.append('folder', `media/${props.type}`);

            const response = await axios.post('/web/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            clearInterval(progressInterval);
            uploadFile.progress = 100;
            uploadFile.status = 'completed';

            if (response.data.success) {
                // 构建MediaFile对象
                const mediaFile: MediaFile = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: uploadFile.name,
                    filename: uploadFile.name,
                    path: response.data.data.path,
                    url: response.data.data.url,
                    size: uploadFile.size,
                    mime_type: uploadFile.file.type,
                    extension: uploadFile.file.name.split('.').pop() || '',
                    type: props.type,
                    resource_id: props.resourceId,
                    user_id: 1, // 这里应该从认证信息获取
                    uploaded_at: new Date().toISOString(),
                };

                // 添加到已上传文件列表
                uploadedFiles.value.push(mediaFile);

                // 如果启用了自动创建资源，则调用回调
                if (props.autoCreateResource && props.onCreateResource) {
                    try {
                        await props.onCreateResource(mediaFile);
                    } catch (err) {
                        console.error('自动创建资源失败:', err);
                    }
                }

                const { toast } = useToast();
                toast.success(`文件 ${uploadFile.name} 上传成功`);
            } else {
                throw new Error(response.data.message || '上传失败');
            }
        } catch (error) {
            uploadFile.status = 'error';
            uploadFile.error = error instanceof Error ? error.message : '上传失败';
            const { toast } = useToast();
            toast.error(`文件 ${uploadFile.name} 上传失败`);
        }
    }

    // 清理已完成的上传
    setTimeout(() => {
        uploadingFiles.value = uploadingFiles.value.filter((f) => f.status !== 'completed');
    }, 2000);

    // 触发上传完成事件
    if (uploadedFiles.value.length > 0) {
        emit('uploadComplete', uploadedFiles.value);
        if (props.onUploadComplete) {
            props.onUploadComplete(uploadedFiles.value);
        }
    }
};

const cancelUpload = (fileId: string) => {
    const index = uploadingFiles.value.findIndex((f) => f.id === fileId);
    if (index > -1) {
        uploadingFiles.value.splice(index, 1);
    }
};

const deleteFile = async (fileId: string) => {
    try {
        // 直接从前端列表中移除文件，因为现在统一使用UploadController
        const index = uploadedFiles.value.findIndex((f) => f.id === fileId);
        if (index > -1) {
            uploadedFiles.value.splice(index, 1);
        }
        const { toast } = useToast();
        toast.success('文件已移除');
    } catch {
        const { toast } = useToast();
        toast.error('文件移除失败');
    }
};

// 暴露方法给父组件
defineExpose({
    uploadedFiles,
    clearFiles: () => {
        uploadedFiles.value = [];
    },
});
</script>

<style scoped>
.upload-dropzone {
    @apply cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50;
}

.upload-dropzone.drag-over {
    @apply border-primary bg-primary/5;
}

.upload-progress {
    @apply rounded-lg border border-border bg-card p-4;
}

.uploaded-files {
    @apply rounded-lg border border-border bg-card p-4;
}
</style>
