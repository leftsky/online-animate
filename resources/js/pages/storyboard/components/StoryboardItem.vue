<template>
  <div class="group relative bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors"
    :class="{ 'opacity-50': !item.visible }">
    <!-- 主要内容区域 -->
    <div class="flex items-center gap-3 p-3 cursor-pointer" @click="toggleExpanded">
      <!-- 拖拽手柄 -->
      <div class="drag-handle cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical class="w-4 h-4" />
      </div>

      <!-- 缩略图 -->
      <div
        class="relative w-16 h-16 rounded-md overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        @click="previewImage">
        <img v-if="item.imagePath" :src="item.imagePath" :alt="item.elementName" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center">
          <Image class="w-6 h-6 text-muted-foreground" />
        </div>
      </div>

      <!-- 内容名称 -->
      <div class="flex-1 min-w-0">
        <!-- 编辑模式 -->
        <input v-if="isEditing" ref="nameInput" v-model="editingName" type="text"
          class="w-full px-2 py-1 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
          @keydown.enter="confirmEdit" @keydown.esc="cancelEdit" @blur="confirmEdit" />
        <!-- 显示模式 -->
        <div v-else class="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors"
          @click="startEdit" :title="item.elementName">
          {{ item.elementName }}
        </div>
        <div class="text-xs text-muted-foreground mt-1">
          图层 {{ item.layerOrder }} • {{ item.duration }}
        </div>
      </div>

      <!-- 显示/隐藏切换 -->
      <button class="p-1 text-muted-foreground hover:text-foreground transition-colors" @click.stop="toggleVisibility"
        :title="item.visible ? '隐藏' : '显示'">
        <Eye v-if="item.visible" class="w-4 h-4" />
        <EyeOff v-else class="w-4 h-4" />
      </button>

      <!-- 展开/收起箭头 -->
      <button class="p-1 text-muted-foreground hover:text-foreground transition-all duration-200"
        @click.stop="toggleExpanded" :title="isExpanded ? '收起' : '展开'">
        <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isExpanded }" />
      </button>

      <!-- 下拉菜单 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <MoreVertical class="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem @click="viewSource">
            <Code class="w-4 h-4 mr-2" />
            查看源码
          </DropdownMenuItem>
          <DropdownMenuItem @click="manageAnimations">
            <Zap class="w-4 h-4 mr-2" />
            管理动画
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="duplicateItem">
            <Copy class="w-4 h-4 mr-2" />
            复制
          </DropdownMenuItem>
          <DropdownMenuItem @click="deleteItem" class="text-destructive">
            <Trash2 class="w-4 h-4 mr-2" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- 展开区域 -->
    <div v-if="isExpanded" class="border-t border-border bg-muted/20 p-4 space-y-3">
      <!-- 动画效果列表 -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium">动画效果</h4>
          <Button variant="outline" size="sm" @click="addAnimation" class="h-7 text-xs">
            <Plus class="w-3 h-3 mr-1" />
            添加动画
          </Button>
        </div>

        <!-- 动画列表 -->
        <div class="space-y-1">
          <div v-for="(animation, index) in animations" :key="index"
            class="flex items-center justify-between p-2 bg-background rounded border text-xs">
            <div class="flex items-center gap-2">
              <Zap class="w-3 h-3 text-primary" />
              <span class="font-medium">{{ animation.name }}</span>
              <span class="text-muted-foreground">{{ animation.duration }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Button variant="ghost" size="sm" @click="editAnimation" class="h-6 w-6 p-0">
                <Edit class="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" @click="removeAnimation"
                class="h-6 w-6 p-0 text-destructive hover:text-destructive">
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="animations.length === 0" class="text-center py-4 text-muted-foreground">
            <Zap class="w-6 h-6 mx-auto mb-1" />
            <p class="text-xs">还没有添加动画效果</p>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="flex items-center gap-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" @click="viewSource"
          class="h-7 text-xs hover:bg-gray-50 transition-colors">
          <Code class="w-3 h-3 mr-1" />
          查看源码
        </Button>
        <Button variant="outline" size="sm" @click="previewAnimation"
          class="h-7 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 active:scale-95">
          <Play class="w-3 h-3 mr-1 animate-pulse" />
          <span class="font-medium">预览动画</span>
        </Button>
      </div>
    </div>

    <!-- 图片预览组件 -->
    <ImagePreview ref="imagePreview" :src="item.imagePath" :alt="item.elementName" />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import {
  GripVertical,
  Image,
  Eye,
  EyeOff,
  ChevronDown,
  MoreVertical,
  Code,
  Zap,
  Copy,
  Trash2,
  Plus,
  Edit,
  Play
} from 'lucide-vue-next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ImagePreview from './ImagePreview.vue';
import { AnimationParser } from '@/lib/AnimationParser';
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
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 编辑状态
const isEditing = ref(false);
const editingName = ref('');
const nameInput = ref<HTMLInputElement>();
const imagePreview = ref<InstanceType<typeof ImagePreview>>();

// 展开状态
const isExpanded = ref(false);

// 动画数据（从AnimationParser解析）
const animations = computed(() => {
  if (!props.item.animationScript) {
    return [];
  }

  try {
    const parsedData = AnimationParser.parseYamlToJson(props.item.animationScript);
    return parsedData.animationSequences || [];
  } catch (error) {
    return [];
  }
});

// 开始编辑名称
const startEdit = () => {
  isEditing.value = true;
  editingName.value = props.item.elementName;
  nextTick(() => {
    nameInput.value?.focus();
    nameInput.value?.select();
  });
};

// 确认编辑
const confirmEdit = () => {
  if (editingName.value.trim() && editingName.value !== props.item.elementName) {
    emit('updateName', props.item.id, editingName.value.trim());
  }
  isEditing.value = false;
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  editingName.value = props.item.elementName;
};

// 切换显示/隐藏
const toggleVisibility = () => {
  emit('toggleVisibility', props.item.id);
};

// 预览图片
const previewImage = () => {
  if (props.item.imagePath) {
    imagePreview.value?.open();
  }
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

// 展开/收起
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

// 动画管理方法
const addAnimation = () => {
  emit('manageAnimations', props.item);
};

const editAnimation = () => {
  emit('manageAnimations', props.item);
};

const removeAnimation = () => {
  // 删除动画功能通过管理动画弹窗处理
  emit('manageAnimations', props.item);
};

const previewAnimation = () => {
  emit('previewAnimation', props.item);
};
</script>

<style scoped>
.drag-handle {
  touch-action: none;
}
</style>
