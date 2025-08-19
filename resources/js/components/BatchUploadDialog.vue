<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>批量上传{{ resourceTypeText }}</DialogTitle>
        <DialogDescription>
          拖拽图片文件到此处，将自动创建{{ resourceTypeText }}资源
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- 上传区域 -->
        <div
          ref="dropZone"
          class="border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors"
          :class="{
            'border-primary bg-primary/5': isDragOver,
            'hover:border-primary/50': !isDragOver
          }"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @click="triggerFileInput"
        >
          <div class="space-y-4">
            <div class="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Upload class="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p class="text-sm font-medium text-foreground">拖拽文件到此处</p>
              <p class="text-xs text-muted-foreground mt-1">
                支持 JPG、PNG、GIF、WebP 格式，单个文件最大 50MB
              </p>
            </div>
            <Button variant="outline" size="sm" @click.stop="triggerFileInput">
              选择文件上传
            </Button>
          </div>
        </div>

        <!-- 文件输入 -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- 上传进度 -->
        <div v-if="uploadingFiles.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium">上传进度</h4>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="file in uploadingFiles"
              :key="file.id"
              class="flex items-center justify-between p-2 bg-muted rounded"
            >
              <div class="flex items-center space-x-2 flex-1 min-w-0">
                <div class="w-8 h-8 bg-background rounded flex items-center justify-center">
                  <Image class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ file.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ formatFileSize(file.size) }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <div v-if="file.status === 'uploading'" class="text-xs text-muted-foreground">
                  {{ file.progress }}%
                </div>
                <div v-else-if="file.status === 'success'" class="text-xs text-green-600">
                  成功
                </div>
                <div v-else-if="file.status === 'error'" class="text-xs text-red-600">
                  失败
                </div>
                <Button
                  v-if="file.status === 'uploading'"
                  variant="ghost"
                  size="sm"
                  @click="cancelUpload(file.id)"
                >
                  <X class="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 上传结果 -->
        <div v-if="uploadResults.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium">上传结果</h4>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div
              v-for="result in uploadResults"
              :key="result.id"
              class="flex items-center justify-between p-2 bg-muted rounded"
            >
              <div class="flex items-center space-x-2 flex-1 min-w-0">
                <div class="w-8 h-8 bg-background rounded flex items-center justify-center">
                  <Check v-if="result.success" class="w-4 h-4 text-green-600" />
                  <X v-else class="w-4 h-4 text-red-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ result.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ result.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeDialog">关闭</Button>
        <Button 
          v-if="uploadingFiles.length > 0" 
          @click="retryFailedUploads"
          :disabled="!hasFailedUploads"
        >
          重试失败
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { Upload, Image, X, Check } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/composables/useToast';
import { mediaApi } from '@/services/mediaApi';

interface Props {
  open: boolean;
  resourceType: 'scenario' | 'character' | 'item';
}

interface Emits {
  (e: 'update:open', open: boolean): void;
  (e: 'upload-complete', results: UploadResult[]): void;
}

interface UploadingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface UploadResult {
  id: string;
  name: string;
  success: boolean;
  message: string;
  resource?: any;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { toast } = useToast();

// 响应式数据
const dropZone = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();
const isDragOver = ref(false);
const uploadingFiles = ref<UploadingFile[]>([]);
const uploadResults = ref<UploadResult[]>([]);

// 计算属性
const resourceTypeText = computed(() => {
  const typeMap = {
    scenario: '场景',
    character: '人物',
    item: '物品'
  };
  return typeMap[props.resourceType];
});

const hasFailedUploads = computed(() => {
  return uploadingFiles.value.some(file => file.status === 'error');
});

// 方法
const closeDialog = () => {
  emit('update:open', false);
  // 清理数据
  uploadingFiles.value = [];
  uploadResults.value = [];
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = false;
  
  const files = Array.from(e.dataTransfer?.files || []);
  handleFiles(files);
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  handleFiles(files);
  // 清空input值，允许重复选择相同文件
  target.value = '';
};

const handleFiles = (files: File[]) => {
  const validFiles = files.filter(file => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!validTypes.includes(file.type)) {
      toast.error(`${file.name} 格式不支持`);
      return false;
    }
    
    if (file.size > maxSize) {
      toast.error(`${file.name} 文件过大`);
      return false;
    }
    
    return true;
  });

  if (validFiles.length === 0) return;

  // 添加到上传队列
  validFiles.forEach(file => {
    const uploadingFile: UploadingFile = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    };
    uploadingFiles.value.push(uploadingFile);
  });

  // 开始上传
  uploadFiles(validFiles);
};

const uploadFiles = async (files: File[]) => {
  for (const file of files) {
    const uploadingFile = uploadingFiles.value.find(f => f.file === file);
    if (!uploadingFile) continue;

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        if (uploadingFile.progress < 90) {
          uploadingFile.progress += Math.random() * 10;
        }
      }, 100);

      // 上传文件
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', props.resourceType);

      const response = await fetch('/web/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      clearInterval(progressInterval);
      uploadingFile.progress = 100;

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();
      
      if (result.success) {
        uploadingFile.status = 'success';
        
        // 自动创建资源
        const resourceData = {
          name: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名
          image_path: result.data.url,
          description: '',
          category: '',
          status: 1
        };

        let resourceResponse;
        if (props.resourceType === 'scenario') {
          resourceResponse = await mediaApi.createScenario({
            ...resourceData,
            generation_prompt: '',
            tags: []
          });
        } else if (props.resourceType === 'item') {
          resourceResponse = await mediaApi.createItem({
            ...resourceData,
            generation_prompt: '',
            type: '',
            properties: [],
            tags: []
          });
        }

        const uploadResult: UploadResult = {
          id: uploadingFile.id,
          name: uploadingFile.name,
          success: true,
          message: '上传并创建资源成功',
          resource: resourceResponse?.data
        };
        uploadResults.value.push(uploadResult);
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      uploadingFile.status = 'error';
      uploadingFile.error = error instanceof Error ? error.message : '上传失败';
      
      const uploadResult: UploadResult = {
        id: uploadingFile.id,
        name: uploadingFile.name,
        success: false,
        message: uploadingFile.error
      };
      uploadResults.value.push(uploadResult);
    }
  }

  // 上传完成后通知父组件
  if (uploadResults.value.length > 0) {
    emit('upload-complete', uploadResults.value);
  }
};

const cancelUpload = (fileId: string) => {
  const index = uploadingFiles.value.findIndex(f => f.id === fileId);
  if (index > -1) {
    uploadingFiles.value.splice(index, 1);
  }
};

const retryFailedUploads = () => {
  const failedFiles = uploadingFiles.value.filter(f => f.status === 'error');
  if (failedFiles.length > 0) {
    // 重置失败的文件状态
    failedFiles.forEach(file => {
      file.status = 'uploading';
      file.progress = 0;
      file.error = undefined;
    });
    
    // 重新上传
    const files = failedFiles.map(f => f.file);
    uploadFiles(files);
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>
