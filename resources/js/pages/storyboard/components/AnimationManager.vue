<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-7xl max-h-[95vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>动画管理 - {{ item?.elementName }}</DialogTitle>
        <DialogDescription>
          管理此分镜内容的动画效果和初始位置
        </DialogDescription>
      </DialogHeader>

      <div class="flex gap-6 h-[75vh] overflow-hidden">
        <!-- 左侧：设置面板 -->
        <div class="w-1/3 space-y-4 overflow-y-auto">
          <!-- 媒体设置 -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium flex items-center gap-2">
              <Settings class="w-4 h-4" />
              媒体设置
            </h3>
            <div class="p-4 border rounded-lg space-y-4">
              <div class="space-y-1">
                <Label class="text-xs">图片路径</Label>
                <Input v-model="animationMedia" type="text" placeholder="输入图片URL或路径" class="h-8 text-xs" />
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">宽度</Label>
                  <Input v-model="animationWidth" type="number" placeholder="自动" class="h-8 text-xs" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">高度</Label>
                  <Input v-model="animationHeight" type="number" placeholder="自动" class="h-8 text-xs" />
                </div>
              </div>
            </div>
          </div>

          <!-- 初始位置设置 -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium flex items-center gap-2">
              <Settings class="w-4 h-4" />
              初始位置设置
            </h3>
            <div class="p-4 border rounded-lg space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">X 位置</Label>
                  <Input v-model="initialPosition.x" type="number" placeholder="0" class="h-8 text-xs" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">Y 位置</Label>
                  <Input v-model="initialPosition.y" type="number" placeholder="0" class="h-8 text-xs" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">透明度</Label>
                  <Input v-model="initialPosition.opacity" type="number" min="0" max="1" step="0.1" placeholder="1"
                    class="h-8 text-xs" />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">缩放</Label>
                  <Input v-model="initialPosition.scale" type="number" min="0" step="0.1" placeholder="1"
                    class="h-8 text-xs" />
                </div>
              </div>

              <div class="space-y-1">
                <Label class="text-xs">旋转角度</Label>
                <Input v-model="initialPosition.rotation" type="number" placeholder="0" class="h-8 text-xs" />
              </div>

              <Button variant="outline" size="sm" @click="resetInitialPosition" class="w-full h-7 text-xs">
                <RotateCcw class="w-3 h-3 mr-1" />
                重置为默认值
              </Button>
            </div>
          </div>

          <!-- 动画效果库 -->
          <div class="space-y-2">
            <h3 class="text-sm font-medium flex items-center gap-2">
              <Sparkles class="w-4 h-4" />
              动画效果库
            </h3>
            <div class="space-y-1 max-h-64 overflow-y-auto">
              <div v-for="(preset, key) in animationPresets" :key="key"
                class="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                @click="addAnimation(preset)">
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
        </div>

        <!-- 右侧：当前动画列表 -->
        <div class="flex-1 space-y-4 overflow-hidden flex flex-col">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium">当前动画效果</h3>
          </div>

          <!-- 动画列表 -->
          <div class="flex-1 space-y-2 overflow-y-auto">
            <div v-for="(animation, index) in currentAnimations" :key="animation.id"
              class="flex items-center gap-3 p-3 border rounded-lg">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium">{{ animation.name }}</p>
                  <span class="text-xs bg-muted px-2 py-1 rounded">{{ animation.duration }}</span>
                </div>
                <p class="text-xs text-muted-foreground">{{ animation.easing || 'ease' }}</p>
              </div>

              <div class="flex items-center gap-1">
                <Button variant="ghost" size="sm" @click="editAnimation(index)" class="h-8 w-8 p-0">
                  <Edit class="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" @click="removeAnimation(index)"
                  class="h-8 w-8 p-0 text-destructive hover:text-destructive">
                  <Trash2 class="w-3 h-3" />
                </Button>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="currentAnimations.length === 0" class="text-center py-8 text-muted-foreground">
              <Zap class="w-8 h-8 mx-auto mb-2" />
              <p class="text-sm">还没有添加动画效果</p>
              <p class="text-xs">从左侧选择动画效果添加</p>
            </div>
          </div>

          <!-- YAML脚本预览 -->
          <div class="space-y-2 flex-shrink-0">
            <label class="text-sm font-medium">生成的YAML脚本</label>
            <pre class="bg-muted p-3 rounded text-xs overflow-auto h-32"><code>{{ generatedYaml }}</code></pre>
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
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
const currentAnimations = ref<AnimationSequence[]>([]);

// 默认初始位置
const DEFAULT_INITIAL_POSITION: InitialPosition = {
  x: 0,
  y: 0,
  opacity: 1,
  scale: 1,
  rotation: 0
};

// 初始位置设置
const initialPosition = ref<InitialPosition>({ ...DEFAULT_INITIAL_POSITION });

// 保存原始动画数据的其他字段
const animationMedia = ref<string | undefined>(undefined);
const animationName = ref<string | undefined>(undefined);
const animationDescription = ref<string | undefined>(undefined);
const animationWidth = ref<number | undefined>(undefined);
const animationHeight = ref<number | undefined>(undefined);

const { toast } = useToast();

// 生成动画数据结构
const animationData = computed((): AnimationData => {
  return {
    media: animationMedia.value,
    name: animationName.value,
    description: animationDescription.value,
    width: animationWidth.value,
    height: animationHeight.value,
    initialPosition: initialPosition.value,
    animationSequences: currentAnimations.value
  };
});

// 计算属性：生成YAML脚本
const generatedYaml = computed(() => {
  try {
    return AnimationParser.parseJsonToYaml(animationData.value);
  } catch (error) {
    console.error('生成YAML失败:', error);
    return '# YAML生成失败，请检查动画数据';
  }
});

// 添加动画
const addAnimation = (preset: AnimationSequence) => {
  currentAnimations.value.push(preset);
  toast.success(`已添加 ${preset.name} 动画`);
};

// 删除动画
const removeAnimation = (index: number) => {
  const animation = currentAnimations.value[index];
  currentAnimations.value.splice(index, 1);
  toast.success(`已删除 ${animation.name} 动画`);
};

// 编辑动画（暂时简单实现）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const editAnimation = (index: number) => {
  toast.info('动画编辑功能正在开发中');
};

// 移除所有预览相关函数

// 重置初始位置
const resetInitialPosition = () => {
  initialPosition.value = { ...DEFAULT_INITIAL_POSITION };
  toast.success('已重置为默认值');
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
  if (!animationScript) {
    return;
  }

  try {
    // 使用AnimationParser解析
    const parsedData = AnimationParser.parseYamlToJson(animationScript);
    console.log('AnimationManager - 解析后的数据:', parsedData);

    if (parsedData) {
      // 保存原始数据的其他字段
      animationMedia.value = parsedData.media;
      animationName.value = parsedData.name;
      animationDescription.value = parsedData.description;
      animationWidth.value = parsedData.width;
      animationHeight.value = parsedData.height;
      
      // 设置初始位置
      if (parsedData.initialPosition) {
        initialPosition.value = { ...parsedData.initialPosition };
      }

      // 设置动画效果 - 使用animationSequences
      const animations = parsedData.animationSequences || [];
      console.log('AnimationManager - 动画序列:', animations);

      if (animations && animations.length > 0) {
        // 动画模式
        currentAnimations.value = animations.map((anim: any, index: number) => {
          // 根据动画的keyframes分析动画类型
          let animationName = '自定义动画';

          if (anim.keyframes && anim.keyframes.length >= 2) {
            const firstFrame = anim.keyframes[0];
            const lastFrame = anim.keyframes[anim.keyframes.length - 1];

            // 分析透明度变化
            if (firstFrame.opacity === 0 && lastFrame.opacity === 1) {
              animationName = '淡入';
            } else if (firstFrame.opacity === 1 && lastFrame.opacity === 0) {
              animationName = '淡出';
            }
            // 分析缩放变化
            else if (firstFrame.scale === 0 && lastFrame.scale === 1) {
              animationName = '缩放进入';
            } else if (firstFrame.scale === 1 && lastFrame.scale === 0) {
              animationName = '缩放退出';
            }
            // 分析位置变化
            else if (firstFrame.x !== lastFrame.x || firstFrame.y !== lastFrame.y) {
              if (firstFrame.x < lastFrame.x) {
                animationName = '右侧滑入';
              } else if (firstFrame.x > lastFrame.x) {
                animationName = '左侧滑入';
              } else if (firstFrame.y < lastFrame.y) {
                animationName = '下方滑入';
              } else if (firstFrame.y > lastFrame.y) {
                animationName = '上方滑入';
              }
            }
          }

          return {
            id: anim.id || `${Date.now()}_${index}`,
            name: animationName,
            description: `${animationName}动画效果`,
            duration: anim.duration || 1000,
            easing: anim.easing || "ease-in-out",
            keyframes: anim.keyframes || []
          };
        });

        console.log('AnimationManager - 最终动画列表:', currentAnimations.value);
      }
    }
  } catch (error) {
    console.error('解析动画脚本失败:', error);
    toast.error('解析动画脚本失败，将使用默认值');
  }
};

// 打开对话框
const open = (storyboardItem: StoryboardItem) => {
  item.value = storyboardItem;
  currentAnimations.value = [];

  // 重置初始位置为默认值
  initialPosition.value = { ...DEFAULT_INITIAL_POSITION };
  
  // 重置其他字段
  animationMedia.value = undefined;
  animationName.value = undefined;
  animationDescription.value = undefined;
  animationWidth.value = undefined;
  animationHeight.value = undefined;

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
  currentAnimations.value = [];

  // 重置初始位置
  initialPosition.value = { ...DEFAULT_INITIAL_POSITION };
  
  // 重置其他字段
  animationMedia.value = undefined;
  animationName.value = undefined;
  animationDescription.value = undefined;
  animationWidth.value = undefined;
  animationHeight.value = undefined;
};

defineExpose({ open, close });
</script>
