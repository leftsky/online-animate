<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-h-[90vh] max-w-4xl">
            <DialogHeader>
                <DialogTitle>源码查看 - {{ item?.elementName }}</DialogTitle>
                <DialogDescription> 查看此分镜内容的YAML动画脚本 </DialogDescription>
            </DialogHeader>

            <div class="space-y-4">
                <!-- 基本信息 -->
                <div class="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4">
                    <div>
                        <label class="text-sm font-medium text-muted-foreground">内容名称</label>
                        <p class="text-sm">{{ item?.elementName }}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-muted-foreground">元素类型</label>
                        <p class="text-sm">{{ item?.elementType }}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-muted-foreground">图层顺序</label>
                        <p class="text-sm">{{ item?.layerOrder }}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-muted-foreground">持续时间</label>
                        <p class="text-sm">{{ item?.duration }}</p>
                    </div>
                </div>

                <!-- YAML源码 -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium">YAML动画脚本</label>
                        <Button variant="outline" size="sm" @click="copyToClipboard" class="h-8">
                            <Copy class="mr-1 h-4 w-4" />
                            复制
                        </Button>
                    </div>

                    <div class="relative">
                        <pre class="max-h-96 overflow-auto rounded-lg border bg-muted p-4 text-sm"><code>{{ formattedScript }}</code></pre>

                        <!-- 空状态 -->
                        <div v-if="!item?.animationScript" class="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/50">
                            <div class="text-center text-muted-foreground">
                                <Code class="mx-auto mb-2 h-8 w-8" />
                                <p class="text-sm">暂无动画脚本</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 图片资源信息 -->
                <div v-if="item?.imagePath" class="space-y-2">
                    <label class="text-sm font-medium">图片资源</label>
                    <div class="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                        <img :src="item.imagePath" :alt="item.elementName" class="h-12 w-12 rounded object-cover" />
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium">{{ getFileName(item.imagePath) }}</p>
                            <p class="text-xs text-muted-foreground">{{ item.imagePath }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="close">关闭</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Code, Copy } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useToast } from '../../../composables/useToast';
import type { StoryboardItem } from './types';

const isOpen = ref(false);
const item = ref<StoryboardItem | null>(null);

const { toast } = useToast();

// 格式化YAML脚本
const formattedScript = computed(() => {
    if (!item.value?.animationScript) return '';

    // 简单的YAML格式化
    return item.value.animationScript
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n');
});

// 获取文件名
const getFileName = (path: string) => {
    return path.split('/').pop() || path;
};

// 复制到剪贴板
const copyToClipboard = async () => {
    if (!item.value?.animationScript) {
        toast.error('没有可复制的内容');
        return;
    }

    try {
        await navigator.clipboard.writeText(item.value.animationScript);
        toast.success('源码已复制到剪贴板');
    } catch (error) {
        console.error('复制失败:', error);
        toast.error('复制失败，请手动复制');
    }
};

// 打开对话框
const open = (storyboardItem: StoryboardItem) => {
    item.value = storyboardItem;
    isOpen.value = true;
};

// 关闭对话框
const close = () => {
    isOpen.value = false;
    item.value = null;
};

defineExpose({ open, close });
</script>
