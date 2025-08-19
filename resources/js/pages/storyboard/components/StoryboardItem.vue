<template>
  <div class="group relative bg-card rounded-lg border transition-colors cursor-pointer"
    :class="{ 
      'opacity-50': !item.visible,
      'border-primary bg-primary/5': item.selected,
      'border-border hover:bg-accent/50': !item.selected 
    }"
    @click="selectItem">
    <!-- 主要内容区域 -->
    <div class="flex items-center gap-2 p-2">
      <!-- 拖拽手柄 -->
      <div class="drag-handle cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        @click.stop>
        <GripVertical class="w-3 h-3" />
      </div>

      <!-- 缩略图 - 支持点击更换 -->
      <div
        class="relative w-12 h-12 rounded-md overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group/thumbnail"
        @click.stop="openResourceSelector">
        <img v-if="item.imagePath" :src="item.imagePath" :alt="item.elementName" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <Image class="w-4 h-4 text-muted-foreground" />
        </div>
        <!-- 更换图片提示 -->
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover/thumbnail:opacity-100 transition-opacity flex items-center justify-center">
          <span class="text-xs text-white font-medium">更换</span>
        </div>
      </div>

      <!-- 内容名称和时长 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <div class="text-sm font-medium truncate" :title="item.elementName">
            {{ item.elementName }}
          </div>
          <span class="text-xs text-muted-foreground">• {{ item.duration }}</span>
        </div>
      </div>

      <!-- 预览动画按钮 -->
      <button class="p-1 text-muted-foreground hover:text-foreground transition-colors" @click.stop="previewAnimation"
        title="预览动画">
        <Play class="w-3 h-3" />
      </button>

      <!-- 显示/隐藏切换 -->
      <button class="p-1 text-muted-foreground hover:text-foreground transition-colors" @click.stop="toggleVisibility"
        :title="item.visible ? '隐藏' : '显示'">
        <Eye v-if="item.visible" class="w-3 h-3" />
        <EyeOff v-else class="w-3 h-3" />
      </button>

      <!-- 下拉菜单 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="p-1 text-muted-foreground hover:text-foreground transition-colors" @click.stop>
            <MoreVertical class="w-3 h-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem @click="openResourceSelector">
            <Image class="w-4 h-4 mr-2" />
            更换图片
          </DropdownMenuItem>
          <DropdownMenuItem @click="viewSource">
            <Code class="w-4 h-4 mr-2" />
            查看源码
          </DropdownMenuItem>
          <DropdownMenuItem @click="manageAnimations">
            <Zap class="w-4 h-4 mr-2" />
            管理动画
          </DropdownMenuItem>
          <DropdownMenuItem @click="duplicateItem">
            <Copy class="w-4 h-4 mr-2" />
            复制
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="deleteItem" class="text-destructive">
            <Trash2 class="w-4 h-4 mr-2" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- 图片预览组件 -->
    <ImagePreview ref="imagePreview" :src="item.imagePath" :alt="item.elementName" />
    
    <!-- 资源选择器 -->
    <ResourceLibrarySelector
      :visible="resourceSelectorVisible" 
      title="选择图片资源"
      @close="closeResourceSelector"
      @select="handleResourceSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  GripVertical,
  Image,
  Eye,
  EyeOff,
  MoreVertical,
  Code,
  Zap,
  Copy,
  Trash2,
  Play
} from 'lucide-vue-next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ImagePreview from './ImagePreview.vue';
import ResourceLibrarySelector from '@/components/ResourceLibrarySelector.vue';
import type { StoryboardItem } from './types';

interface Props {
  item: StoryboardItem;
}

interface Emits {
  updateName: [id: string, name: string];
  toggleVisibility: [id: string];
  viewSource: [item: StoryboardItem];
  manageAnimations: [item: StoryboardItem];
  duplicate: [item: StoryboardItem];
  delete: [id: string];
  previewAnimation: [item: StoryboardItem];
  select: [id: string];
  changeImage: [item: StoryboardItem, resource: any];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 编辑状态
const imagePreview = ref<InstanceType<typeof ImagePreview>>();
const resourceSelectorVisible = ref(false);

// 切换显示/隐藏
const toggleVisibility = () => {
  emit('toggleVisibility', props.item.id);
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
  console.log('选择资源:', resource);
  emit('changeImage', props.item, resource);
  closeResourceSelector();
};

// 预览动画
const previewAnimation = () => {
  // 只触发预览动画，不触发选中逻辑
  emit('previewAnimation', props.item);
};

// 菜单操作
const viewSource = () => {
  emit('viewSource', props.item);
};

const manageAnimations = () => {
  emit('manageAnimations', props.item);
};

const duplicateItem = () => {
  emit('duplicate', props.item);
};

const deleteItem = () => {
  emit('delete', props.item.id);
};

// 选中/取消选中
const selectItem = () => {
  emit('select', props.item.id);
};
</script>

<style scoped>
.drag-handle {
  touch-action: none;
}
</style>
