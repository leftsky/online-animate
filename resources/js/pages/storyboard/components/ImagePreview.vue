<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-h-[90vh] max-w-4xl p-0">
            <DialogHeader class="p-6 pb-4">
                <DialogTitle>{{ alt || '图片预览' }}</DialogTitle>
            </DialogHeader>

            <div class="px-6 pb-6">
                <div class="relative overflow-hidden rounded-lg bg-muted">
                    <img v-if="src" :src="src" :alt="alt" class="h-auto max-h-[70vh] w-full object-contain" />
                    <div v-else class="flex h-64 w-full items-center justify-center">
                        <Image class="h-16 w-16 text-muted-foreground" />
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from 'lucide-vue-next';
import { ref } from 'vue';

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
