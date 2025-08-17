<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>添加分镜内容</DialogTitle>
        <DialogDescription>
          选择一张图片来创建新的分镜内容
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-4">
                        <!-- 内容名称输入 -->
                <div class="space-y-2">
                    <Label>内容名称</Label>
                    <Input 
                        v-model="elementName"
                        type="text" 
                        placeholder="请输入分镜内容名称"
                    />
                </div>
        
        <!-- 文件选择区域 -->
        <div class="space-y-2">
          <Label>选择图片</Label>
          <div 
            class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
            @click="selectFile"
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
          >
            <div v-if="!selectedFile" class="space-y-2">
              <div class="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Upload class="w-6 h-6 text-muted-foreground" />
              </div>
              <p class="text-sm text-muted-foreground">
                点击选择图片或拖拽到此处
              </p>
              <p class="text-xs text-muted-foreground">
                支持 JPG、PNG、GIF、WebP 格式
              </p>
            </div>
            
            <!-- 预览区域 -->
            <div v-else class="space-y-2">
              <img :src="previewUrl" alt="预览" class="mx-auto max-h-32 rounded" />
              <p class="text-sm font-medium">{{ selectedFile.name }}</p>
              <p class="text-xs text-muted-foreground">
                {{ formatFileSize(selectedFile.size) }}
              </p>
              <Button variant="outline" size="sm" @click.stop="clearFile">
                重新选择
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="cancel">取消</Button>
        <Button @click="confirm" :disabled="!selectedFile || !elementName.trim() || loading">
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
          {{ loading ? '创建中...' : '确认添加' }}
        </Button>
      </DialogFooter>
      
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="image/*"
        @change="handleFileSelect"
      />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Upload, Loader2 } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const isOpen = ref(false);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string>('');
const elementName = ref<string>('');
const loading = ref(false);
const fileInput = ref<HTMLInputElement>();

const emit = defineEmits<{
  confirm: [data: { file: File; elementName: string }];
}>();

// 打开对话框
const open = () => {
  isOpen.value = true;
  clearFile();
};

// 关闭对话框
const close = () => {
  isOpen.value = false;
  clearFile();
};

// 选择文件
const selectFile = () => {
  fileInput.value?.click();
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    setSelectedFile(files[0]);
  }
};

// 处理拖拽
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  }
};

// 设置选中的文件
const setSelectedFile = (file: File) => {
  selectedFile.value = file;
  
  // 创建预览URL
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

// 清除文件
const clearFile = () => {
  selectedFile.value = null;
  previewUrl.value = '';
  elementName.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 取消
const cancel = () => {
  close();
};

// 确认
const confirm = () => {
  if (selectedFile.value && elementName.value.trim()) {
    emit('confirm', {
      file: selectedFile.value,
      elementName: elementName.value.trim()
    });
  }
};

// 设置加载状态
const setLoading = (state: boolean) => {
  loading.value = state;
};

// 暴露方法
defineExpose({
  open,
  close,
  setLoading
});
</script>
