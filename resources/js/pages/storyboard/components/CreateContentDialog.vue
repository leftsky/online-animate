<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>添加分镜内容</DialogTitle>
                <DialogDescription> 上传图片或从资源库选择图片来创建新的分镜内容 </DialogDescription>
            </DialogHeader>

            <div class="space-y-4">
                <!-- 内容名称输入 -->
                <div class="space-y-2">
                    <Label>内容名称</Label>
                    <Input v-model="elementName" type="text" placeholder="请输入分镜内容名称" />
                </div>

                <!-- 模式选择 -->
                <div class="space-y-2">
                    <Label>选择方式</Label>
                    <div class="flex gap-2">
                        <Button variant="outline" :class="{ 'bg-primary text-primary-foreground': mode === 'upload' }" @click="setMode('upload')">
                            <Upload class="mr-2 h-4 w-4" />
                            上传文件
                        </Button>
                        <Button variant="outline" :class="{ 'bg-primary text-primary-foreground': mode === 'select' }" @click="setMode('select')">
                            <Image class="mr-2 h-4 w-4" />
                            选择资源
                        </Button>
                    </div>
                </div>

                <!-- 文件上传区域 -->
                <div v-if="mode === 'upload'" class="space-y-2">
                    <Label>上传图片</Label>
                    <div
                        class="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:bg-muted/50"
                        @click="triggerFileUpload"
                        @drop="handleFileDrop"
                        @dragover.prevent
                        @dragenter.prevent
                    >
                        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect" />
                        <div v-if="!selectedFile" class="space-y-2">
                            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Upload class="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p class="text-sm text-muted-foreground">点击上传或拖拽图片到此处</p>
                            <p class="text-xs text-muted-foreground">支持 jpg, png, gif, webp 格式</p>
                        </div>

                        <!-- 文件预览 -->
                        <div v-else class="space-y-2">
                            <img :src="filePreviewUrl" alt="预览" class="mx-auto max-h-32 rounded object-cover" />
                            <p class="text-sm font-medium">{{ selectedFile.name }}</p>
                            <p class="text-xs text-muted-foreground">
                                {{ formatFileSize(selectedFile.size) }}
                            </p>
                            <Button variant="outline" size="sm" @click.stop="clearFile"> 重新选择 </Button>
                        </div>
                    </div>
                </div>

                <!-- 资源选择区域 -->
                <div v-if="mode === 'select'" class="space-y-2">
                    <Label>选择图片</Label>
                    <div
                        class="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:bg-muted/50"
                        @click="openResourceSelector"
                    >
                        <div v-if="!selectedResource" class="space-y-2">
                            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Image class="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p class="text-sm text-muted-foreground">点击从资源库选择图片</p>
                            <p class="text-xs text-muted-foreground">支持背景、人物、物品等资源</p>
                        </div>

                        <!-- 资源预览 -->
                        <div v-else class="space-y-2">
                            <img :src="selectedResource.url" alt="预览" class="mx-auto max-h-32 rounded object-cover" />
                            <p class="text-sm font-medium">{{ selectedResource.name }}</p>
                            <p class="text-xs text-muted-foreground">
                                {{ selectedResource.category }}
                            </p>
                            <Button variant="outline" size="sm" @click.stop="clearResource"> 重新选择 </Button>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="cancel">取消</Button>
                <Button @click="confirm" :disabled="!canConfirm || loading">
                    <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                    {{ loading ? '创建中...' : '确认添加' }}
                </Button>
            </DialogFooter>
        </DialogContent>

        <!-- 资源选择器 -->
        <ResourceLibrarySelector
            :visible="resourceSelectorVisible"
            title="选择图片资源"
            @close="closeResourceSelector"
            @select="handleResourceSelect"
        />
    </Dialog>
</template>

<script setup lang="ts">
import ResourceLibrarySelector from '@/components/ResourceLibrarySelector.vue';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Loader2, Upload } from 'lucide-vue-next';
import { computed, ref } from 'vue';

const isOpen = ref(false);
const mode = ref<'upload' | 'select'>('upload'); // 默认选择上传模式
const selectedFile = ref<File | null>(null);
const selectedResource = ref<any>(null);
const filePreviewUrl = ref<string>('');
const elementName = ref<string>('');
const loading = ref(false);
const resourceSelectorVisible = ref(false);
const fileInput = ref<HTMLInputElement>();

// 计算属性：是否可以确认
const canConfirm = computed(() => {
    if (!elementName.value.trim()) return false;

    if (mode.value === 'upload') {
        return !!selectedFile.value;
    } else {
        return !!selectedResource.value;
    }
});

const emit = defineEmits<{
    confirm: [data: { file?: File; resource?: any; elementName: string; mode: 'upload' | 'select' }];
}>();

// 设置模式
const setMode = (newMode: 'upload' | 'select') => {
    mode.value = newMode;
    // 切换模式时清除之前的选择
    if (newMode === 'upload') {
        selectedResource.value = null;
    } else {
        selectedFile.value = null;
        filePreviewUrl.value = '';
    }
};

// 触发文件上传
const triggerFileUpload = () => {
    fileInput.value?.click();
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        selectedFile.value = file;
        // 创建预览URL
        filePreviewUrl.value = URL.createObjectURL(file);
    }
};

// 处理文件拖拽
const handleFileDrop = (event: DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            selectedFile.value = file;
            filePreviewUrl.value = URL.createObjectURL(file);
        }
    }
};

// 清除文件
const clearFile = () => {
    selectedFile.value = null;
    if (filePreviewUrl.value) {
        URL.revokeObjectURL(filePreviewUrl.value);
        filePreviewUrl.value = '';
    }
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 打开对话框
const open = () => {
    isOpen.value = true;
    clearAll();
};

// 关闭对话框
const close = () => {
    isOpen.value = false;
    clearAll();
};

// 打开资源选择器
const openResourceSelector = () => {
    resourceSelectorVisible.value = true;
};

// 关闭资源选择器
const closeResourceSelector = () => {
    resourceSelectorVisible.value = false;
};

// 处理资源选择
const handleResourceSelect = (resource: any) => {
    selectedResource.value = resource;
    resourceSelectorVisible.value = false;
};

// 清除资源
const clearResource = () => {
    selectedResource.value = null;
};

// 清除所有
const clearAll = () => {
    selectedFile.value = null;
    selectedResource.value = null;
    elementName.value = '';
    if (filePreviewUrl.value) {
        URL.revokeObjectURL(filePreviewUrl.value);
        filePreviewUrl.value = '';
    }
};

// 取消
const cancel = () => {
    close();
};

// 确认
const confirm = () => {
    if (!elementName.value.trim()) return;

    const data: any = {
        elementName: elementName.value.trim(),
        mode: mode.value,
    };

    if (mode.value === 'upload' && selectedFile.value) {
        data.file = selectedFile.value;
    } else if (mode.value === 'select' && selectedResource.value) {
        data.resource = selectedResource.value;
    }

    emit('confirm', data);
};

// 设置加载状态
const setLoading = (state: boolean) => {
    loading.value = state;
};

// 暴露方法
defineExpose({
    open,
    close,
    setLoading,
});
</script>
