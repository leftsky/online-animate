<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-7xl max-h-[95vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>动画管理 - {{ item?.elementName }}</DialogTitle>
        <DialogDescription> 管理此分镜内容的动画效果和初始位置 </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-3 gap-4 h-[75vh] overflow-hidden">
        <!-- 左侧：基础设置 -->
        <div class="space-y-4 overflow-y-auto custom-scrollbar">
          <!-- 媒体设置 -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium flex items-center gap-2">
              <Settings class="w-4 h-4" />
              媒体设置
            </h3>
            <div class="p-4 border rounded-lg space-y-4">
              <div class="space-y-1">
                <Label class="text-xs">图片路径</Label>
                <Input
                  v-model="animationData.media"
                  type="text"
                  placeholder="输入图片URL或路径"
                  class="h-8 text-xs"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">宽度</Label>
                  <Input
                    v-model="animationData.width"
                    type="number"
                    placeholder="自动"
                    class="h-8 text-xs"
                  />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">高度</Label>
                  <Input
                    v-model="animationData.height"
                    type="number"
                    placeholder="自动"
                    class="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 基础位置设置 -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium flex items-center gap-2">
              <Settings class="w-4 h-4" />
              基础位置设置
            </h3>
            <div class="p-4 border rounded-lg space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">X 位置</Label>
                  <Input
                    v-model="animationData.initialPosition!.x"
                    type="number"
                    placeholder="0"
                    class="h-8 text-xs"
                  />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">Y 位置</Label>
                  <Input
                    v-model="animationData.initialPosition!.y"
                    type="number"
                    placeholder="0"
                    class="h-8 text-xs"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">X轴缩放</Label>
                  <Input
                    v-model="animationData.initialPosition!.scaleX"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="1"
                    class="h-8 text-xs"
                  />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">Y轴缩放</Label>
                  <Input
                    v-model="animationData.initialPosition!.scaleY"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="1"
                    class="h-8 text-xs"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">透明度</Label>
                  <Input
                    v-model="animationData.initialPosition!.opacity"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    placeholder="1"
                    class="h-8 text-xs"
                  />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">旋转角度</Label>
                  <Input
                    v-model="animationData.initialPosition!.rotation"
                    type="number"
                    placeholder="0"
                    class="h-8 text-xs"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                @click="resetInitialPosition"
                class="w-full h-7 text-xs"
              >
                <RotateCcw class="w-3 h-3 mr-1" />
                重置为默认值
              </Button>
            </div>
          </div>
        </div>

        <!-- 中间：动画库和当前动画列表 -->
        <div class="space-y-4 overflow-hidden flex flex-col">
          <!-- 动画效果库 -->
          <div class="space-y-2">
            <h3 class="text-sm font-medium flex items-center gap-2">
              <Sparkles class="w-4 h-4" />
              动画效果库
            </h3>
            <div class="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              <div
                v-for="(preset, key) in animationPresets"
                :key="key"
                class="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                @click="addAnimation(preset)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium">{{ preset.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ preset.description }}</p>
                  </div>
                  <Plus class="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          <!-- 当前动画列表 -->
          <div class="flex-1 space-y-2 overflow-hidden flex flex-col">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium">当前动画效果</h3>
            </div>

            <!-- 动画列表 -->
            <div class="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
              <div
                v-for="(animation, index) in animationData.animationSequences!"
                :key="animation.id"
                class="flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-accent transition-colors"
                :class="{
                  'opacity-50': draggedIndex === index,
                  'border-primary': draggedOverIndex === index && draggedIndex !== index
                }"
                draggable="true"
                @dragover="onDragOver($event, index)"
                @drop="onDrop(index)"
                @dragend="onDragEnd"
                @dragstart="onDragStart(index)"
              >
                <!-- 拖拽手柄 -->
                <div class="flex flex-col gap-1 cursor-move opacity-50 hover:opacity-100">
                  <div class="w-1 h-1 bg-muted-foreground rounded-full"></div>
                  <div class="w-1 h-1 bg-muted-foreground rounded-full"></div>
                  <div class="w-1 h-1 bg-muted-foreground rounded-full"></div>
                </div>
                
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium">{{ animation.name }}</p>
                    <span class="text-xs bg-muted px-2 py-1 rounded"
                      >{{ animation.duration }}ms</span
                    >
                  </div>
                  <p class="text-xs text-muted-foreground">
                    {{ animation.easing || "ease" }}
                  </p>
                </div>

                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="editAnimation(index)"
                    class="h-8 w-8 p-0"
                  >
                    <Edit class="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="removeAnimation(index)"
                    class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 class="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <!-- 空状态 -->
              <div
                v-if="animationData.animationSequences!.length === 0"
                class="text-center py-8 text-muted-foreground"
              >
                <Zap class="w-8 h-8 mx-auto mb-2" />
                <p class="text-sm">还没有添加动画效果</p>
                <p class="text-xs">从上方选择动画效果添加</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：实时YAML文件搜索 -->
        <div class="space-y-4 overflow-hidden flex flex-col">
          <!-- YAML脚本预览 -->
          <div class="flex-1 space-y-2 overflow-hidden flex flex-col">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">实时YAML脚本</label>
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground">{{ yamlLineCount }} 行</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  @click="applyYamlChanges" 
                  class="h-7 text-xs"
                  :disabled="loading"
                >
                  <Loader2 v-if="loading" class="w-3 h-3 mr-1 animate-spin" />
                  应用更改
                </Button>
              </div>
            </div>
            <div class="flex-1 relative overflow-hidden">
              <textarea
                v-model="editableYaml"
                class="bg-muted p-3 rounded text-xs overflow-auto h-full w-full resize-none border-0 focus:ring-2 focus:ring-ring focus:outline-none yaml-textarea"
                placeholder="在此编辑YAML脚本..."
                spellcheck="false"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="close">取消</Button>
        <Button @click="saveAnimations" :disabled="loading">
          <Loader2 v-if="loading" class="w-4 h-4 mr-1 animate-spin" />
          保存动画
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 动画编辑对话框 -->
  <Dialog v-model:open="isEditDialogOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>编辑动画 - {{ editingAnimation?.name }}</DialogTitle>
        <DialogDescription>
          修改动画的基本属性和关键帧设置
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4" v-if="editingAnimation">
        <!-- 基本信息 -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium">基本信息</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label class="text-xs">动画名称</Label>
              <Input v-model="editingAnimation.name" class="h-8 text-xs" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">持续时间 (ms)</Label>
              <Input v-model="editingAnimation.duration" type="number" min="100" step="100" class="h-8 text-xs" />
            </div>
          </div>
          <div class="space-y-1">
            <Label class="text-xs">缓动函数</Label>
            <Input v-model="editingAnimation.easing" placeholder="ease-in-out" class="h-8 text-xs" />
          </div>
          <div class="space-y-1">
            <Label class="text-xs">描述</Label>
            <Input v-model="editingAnimation.description" class="h-8 text-xs" />
          </div>
        </div>

        <!-- 关键帧编辑 -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium">关键帧设置</h3>
            <Button variant="outline" size="sm" @click="addKeyframe" class="h-7 text-xs">
              <Plus class="w-3 h-3 mr-1" />
              添加关键帧
            </Button>
          </div>
          
          <div class="space-y-2 max-h-60 overflow-y-auto">
            <div 
              v-for="(keyframe, index) in editingAnimation.keyframes" 
              :key="index"
              class="p-3 border rounded-lg space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium">关键帧 {{ index + 1 }}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  @click="removeKeyframe(index)" 
                  class="h-6 w-6 p-0 text-destructive"
                >
                  <Trash2 class="w-3 h-3" />
                </Button>
              </div>
              
              <div class="grid grid-cols-2 gap-2">
                <div class="space-y-1">
                  <Label class="text-xs">时间 (ms)</Label>
                  <Input v-model="keyframe.startTime" type="number" min="0" class="h-7 text-xs" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">持续时间 (ms)</Label>
                  <Input v-model="keyframe.duration" type="number" min="0" class="h-7 text-xs" />
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-2">
                <div class="space-y-1">
                  <Label class="text-xs">X</Label>
                  <Input v-model="keyframe.x" type="number" class="h-7 text-xs" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">Y</Label>
                  <Input v-model="keyframe.y" type="number" class="h-7 text-xs" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">透明度</Label>
                  <Input v-model="keyframe.opacity" type="number" min="0" max="1" step="0.1" class="h-7 text-xs" />
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-2">
                <div class="space-y-1">
                  <Label class="text-xs">X缩放</Label>
                  <Input v-model="keyframe.scaleX" type="number" min="0" step="0.1" class="h-7 text-xs" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">Y缩放</Label>
                  <Input v-model="keyframe.scaleY" type="number" min="0" step="0.1" class="h-7 text-xs" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">旋转</Label>
                  <Input v-model="keyframe.rotation" type="number" class="h-7 text-xs" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancelEdit">取消</Button>
        <Button @click="saveEdit">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Plus, Edit, Trash2, Zap, Loader2, Settings, Sparkles, RotateCcw } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '../../../composables/useToast';
import { sceneContentApi } from '../../../utils/api';
import { AnimationParser, type AnimationData, type AnimationSequence, type InitialPosition } from '@/lib/AnimationParser';
import type { StoryboardItem } from './types';
import { animationPresets } from './animationPresets';

const emit = defineEmits<{
  animationSaved: [item: StoryboardItem];
}>();

const isOpen = ref(false);
const item = ref<StoryboardItem | null>(null);
const loading = ref(false);

// 动画编辑相关
const isEditDialogOpen = ref(false);
const editingAnimation = ref<AnimationSequence | null>(null);
const editingIndex = ref<number>(-1);

// 拖拽排序相关
const draggedIndex = ref<number>(-1);
const draggedOverIndex = ref<number>(-1);

// 默认初始位置
const DEFAULT_INITIAL_POSITION: InitialPosition = {
  x: 0,
  y: 0,
  opacity: 1,
  scaleX: 1,
  scaleY: 1,
  rotation: 0
};

// 可编辑的YAML内容
const editableYaml = ref<string>('');

// 标志：是否正在应用YAML更改（避免无限循环）
const isApplyingYaml = ref(false);

// 完整的动画数据
const animationData = ref<AnimationData>({
  media: undefined,
  name: undefined,
  description: undefined,
  width: undefined,
  height: undefined,
  initialPosition: { ...DEFAULT_INITIAL_POSITION },
  animationSequences: []
});

const { toast } = useToast();

// 监听animationData变化，实时更新YAML
watch(animationData, (newData) => {
  // 如果正在应用YAML更改，跳过自动更新
  if (isApplyingYaml.value) return;
  
  try {
    editableYaml.value = AnimationParser.parseJsonToYaml(newData);
  } catch (error) {
    console.error('自动更新YAML失败:', error);
  }
}, { deep: true });

// 计算属性：生成YAML脚本
const generatedYaml = computed(() => {
  try {
    return AnimationParser.parseJsonToYaml(animationData.value);
  } catch (error) {
    console.error('生成YAML失败:', error);
    return '# YAML生成失败，请检查动画数据';
  }
});

// 计算属性：YAML行数
const yamlLineCount = computed(() => {
  return generatedYaml.value.split('\n').length;
});

// 添加动画
const addAnimation = (preset: AnimationSequence) => {
  animationData.value.animationSequences!.push(preset);
  toast.success(`已添加 ${preset.name} 动画`);
};

// 删除动画
const removeAnimation = (index: number) => {
  const animation = animationData.value.animationSequences![index];
  animationData.value.animationSequences!.splice(index, 1);
  toast.success(`已删除 ${animation.name} 动画`);
};

// 编辑动画（暂时简单实现）
const editAnimation = (index: number) => {
  editingIndex.value = index;
  editingAnimation.value = { ...animationData.value.animationSequences![index] };
  isEditDialogOpen.value = true;
};

// 添加关键帧
const addKeyframe = () => {
  if (!editingAnimation.value) return;
  
  // 确保keyframes数组存在
  if (!editingAnimation.value.keyframes) {
    editingAnimation.value.keyframes = [];
  }
  
  const newKeyframe = {
    startTime: 0,
    duration: 1000,
    x: 0,
    y: 0,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    rotation: 0
  };
  
  editingAnimation.value.keyframes.push(newKeyframe);
};

// 删除关键帧
const removeKeyframe = (index: number) => {
  if (!editingAnimation.value || !editingAnimation.value.keyframes) return;
  editingAnimation.value.keyframes.splice(index, 1);
};

// 取消编辑
const cancelEdit = () => {
  isEditDialogOpen.value = false;
  editingAnimation.value = null;
  editingIndex.value = -1;
};

// 保存编辑
const saveEdit = () => {
  if (!editingAnimation.value || editingIndex.value === -1) return;
  
  // 更新动画数据
  animationData.value.animationSequences![editingIndex.value] = { ...editingAnimation.value };
  
  // 关闭对话框
  cancelEdit();
  
  toast.success('动画编辑已保存');
};

// 拖拽排序相关方法
const onDragStart = (index: number) => {
  draggedIndex.value = index;
};

const onDragOver = (e: DragEvent, index: number) => {
  e.preventDefault();
  draggedOverIndex.value = index;
};

const onDrop = (index: number) => {
  if (draggedIndex.value === -1 || draggedIndex.value === index) return;
  
  // 重新排序动画
  const animations = [...animationData.value.animationSequences!];
  const draggedItem = animations[draggedIndex.value];
  animations.splice(draggedIndex.value, 1);
  animations.splice(index, 0, draggedItem);
  
  animationData.value.animationSequences = animations;
  
  // 重置拖拽状态
  draggedIndex.value = -1;
  draggedOverIndex.value = -1;
  
  toast.success('动画顺序已更新');
};

const onDragEnd = () => {
  draggedIndex.value = -1;
  draggedOverIndex.value = -1;
};

// 重置初始位置
const resetInitialPosition = () => {
  animationData.value.initialPosition = { ...DEFAULT_INITIAL_POSITION };
  toast.success('已重置为默认值');
};

// 应用YAML更改
const applyYamlChanges = () => {
  if (isApplyingYaml.value) return; // 避免无限循环
  isApplyingYaml.value = true;

  try {
    const parsedData = AnimationParser.parseYamlToJson(editableYaml.value);
    console.log('应用YAML更改 - 解析后的数据:', parsedData);
    
    if (parsedData) {
      // 直接更新完整的动画数据
      animationData.value = { ...parsedData };
      
      // 确保字段被正确初始化
      if (!animationData.value.initialPosition) {
        animationData.value.initialPosition = { ...DEFAULT_INITIAL_POSITION };
      }
      if (!animationData.value.animationSequences) {
        animationData.value.animationSequences = [];
      }
      
      console.log('应用YAML更改 - 更新后的动画列表:', animationData.value.animationSequences);
      toast.success('YAML更改已应用');
    } else {
      toast.error('YAML解析失败，请检查格式');
    }
  } catch (error) {
    console.error('应用YAML更改失败:', error);
    toast.error('应用YAML更改失败，请重试');
  } finally {
    isApplyingYaml.value = false;
  }
};

// 保存动画
const saveAnimations = async () => {
  if (!item.value) return;

  loading.value = true;
  try {
    // 调用API保存动画脚本
    const response = await sceneContentApi.update(parseInt(item.value.id), {
      animation_script: generatedYaml.value
    });

    if (response.success) {
      // 更新本地item的动画脚本
      item.value.animationScript = generatedYaml.value;

      // 通知父组件数据已更新
      emit('animationSaved', item.value);

      toast.success('动画保存成功！');
      close();
    } else {
      toast.error('保存失败', response.message);
    }
  } catch (error) {
    console.error('保存动画失败:', error);
    toast.error('保存动画失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 解析现有动画脚本
const parseExistingAnimations = (animationScript: string) => {
  if (!animationScript) return;

  isApplyingYaml.value = true; // 设置标志，避免触发watch
  
  try {
    const parsedData = AnimationParser.parseYamlToJson(animationScript);
    console.log('AnimationManager - 解析后的数据:', parsedData);

    if (parsedData) {
      // 直接更新完整的动画数据
      animationData.value = { ...parsedData };
      
      // 确保字段被正确初始化
      if (!animationData.value.initialPosition) {
        animationData.value.initialPosition = { ...DEFAULT_INITIAL_POSITION };
      }
      if (!animationData.value.animationSequences) {
        animationData.value.animationSequences = [];
      }

      // 同步更新editableYaml
      editableYaml.value = animationScript;
    }
  } catch (error) {
    console.error('解析动画脚本失败:', error);
    toast.error('解析动画脚本失败，将使用默认值');
  } finally {
    isApplyingYaml.value = false; // 重置标志
  }
};

// 初始化动画数据
const initAnimationData = () => {
  animationData.value = {
    media: undefined,
    name: undefined,
    description: undefined,
    width: undefined,
    height: undefined,
    initialPosition: { ...DEFAULT_INITIAL_POSITION },
    animationSequences: []
  };
  editableYaml.value = '';
};

// 打开对话框
const open = (storyboardItem: StoryboardItem) => {
  item.value = storyboardItem;
  initAnimationData();

  // 解析现有的动画脚本
  if (storyboardItem.animationScript) {
    parseExistingAnimations(storyboardItem.animationScript);
  }

  isOpen.value = true;
};

// 关闭对话框
const close = () => {
  isOpen.value = false;
  item.value = null;
  
  // 重置编辑状态
  isEditDialogOpen.value = false;
  editingAnimation.value = null;
  editingIndex.value = -1;
  
  // 重置拖拽状态
  draggedIndex.value = -1;
  draggedOverIndex.value = -1;
  
  initAnimationData();
};

defineExpose({ open, close });
</script>

<style scoped>
/* 自定义滚动条样式 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground)) hsl(var(--muted));
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

.custom-scrollbar::-webkit-scrollbar-corner {
  background: hsl(var(--muted));
}

/* YAML文本框样式 */
.yaml-textarea {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  line-height: 1.4;
  white-space: pre;
  word-break: break-all;
  color: hsl(var(--foreground));
  background: hsl(var(--muted));
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .grid-cols-3 {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .h-\[75vh\] {
    height: auto;
    max-height: 70vh;
  }
}
</style>
