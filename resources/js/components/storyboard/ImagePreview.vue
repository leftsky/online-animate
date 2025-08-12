<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl max-h-[90vh] p-0">
      <DialogHeader class="p-6 pb-4">
        <DialogTitle>{{ alt || '图片预览' }}</DialogTitle>
      </DialogHeader>
      
      <div class="px-6 pb-6">
        <div class="relative bg-muted rounded-lg overflow-hidden">
          <img 
            v-if="src" 
            :src="src" 
            :alt="alt"
            class="w-full h-auto max-h-[70vh] object-contain"
          />
          <div v-else class="w-full h-64 flex items-center justify-center">
            <Image class="w-16 h-16 text-muted-foreground" />
            <span class="ml-4 text-muted-foreground">暂无图片</span>
          </div>
        </div>
        
        <!-- 图片信息 -->
        <div v-if="src" class="mt-4 text-sm text-muted-foreground">
          <div class="flex items-center gap-4">
            <span>文件路径: {{ src }}</span>
          </div>
        </div>
      </div>
      
      <DialogFooter class="p-6 pt-0">
        <Button variant="outline" @click="close">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Image } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  src?: string;
  alt?: string;
}

const props = defineProps<Props>();

const isOpen = ref(false);

const open = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};

defineExpose({ open, close });
</script>
