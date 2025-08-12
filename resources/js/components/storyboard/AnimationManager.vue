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
                  <Input
                    v-model="initialPosition.x"
                    type="number"
                    placeholder="0"
                    class="h-8 text-xs"
                  />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">Y 位置</Label>
                  <Input
                    v-model="initialPosition.y"
                    type="number"
                    placeholder="0"
                    class="h-8 text-xs"
                  />
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">透明度</Label>
                  <Input
                    v-model="initialPosition.opacity"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    placeholder="1"
                    class="h-8 text-xs"
                  />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">缩放</Label>
                  <Input
                    v-model="initialPosition.scale"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="1"
                    class="h-8 text-xs"
                  />
                </div>
              </div>
              
              <div class="space-y-1">
                <Label class="text-xs">旋转角度</Label>
                <Input
                  v-model="initialPosition.rotation"
                  type="number"
                  placeholder="0"
                  class="h-8 text-xs"
                />
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
          
          <!-- 动画效果库 -->
          <div class="space-y-2">
            <h3 class="text-sm font-medium flex items-center gap-2">
              <Sparkles class="w-4 h-4" />
              动画效果库
            </h3>
            <div class="space-y-1 max-h-64 overflow-y-auto">
              <div
                v-for="(preset, key) in animationPresets"
                :key="key"
                class="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                @click="addAnimation(key, preset)"
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
        </div>
        
        <!-- 右侧：当前动画列表 -->
        <div class="flex-1 space-y-4 overflow-hidden flex flex-col">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium">当前动画效果</h3>
            <Button
              variant="outline"
              size="sm"
              @click="previewAnimation"
              :disabled="currentAnimations.length === 0"
            >
              <Play class="w-4 h-4 mr-1" />
              预览
            </Button>
          </div>
          
          <!-- 动画列表 -->
          <div class="flex-1 space-y-2 overflow-y-auto">
            <div
              v-for="(animation, index) in currentAnimations"
              :key="animation.id"
              class="flex items-center gap-3 p-3 border rounded-lg"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium">{{ animation.name }}</p>
                  <span class="text-xs bg-muted px-2 py-1 rounded">{{ animation.duration }}</span>
                </div>
                <p class="text-xs text-muted-foreground">{{ animation.easing || 'ease' }}</p>
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
            <div v-if="currentAnimations.length === 0" class="text-center py-8 text-muted-foreground">
              <Zap class="w-8 h-8 mx-auto mb-2" />
              <p class="text-sm">还没有添加动画效果</p>
              <p class="text-xs">从左侧选择动画效果添加</p>
            </div>
          </div>
          
          <!-- 生成的YAML预览 -->
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
import { Plus, Play, Edit, Trash2, Zap, Loader2, Settings, Sparkles, RotateCcw } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '../../composables/useToast';
import { sceneContentApi } from '../../utils/api';
import { AnimationParser, type InitialPosition, type AnimationEffect } from '../../lib/AnimationParser';
import type { StoryboardItem } from './types';

const emit = defineEmits<{
  animationSaved: [item: StoryboardItem];
}>();

interface AnimationPreset {
  name: string;
  description: string;
  duration: string;
  easing?: string;
  properties: Record<string, any>;
}

const isOpen = ref(false);
const item = ref<StoryboardItem | null>(null);
const loading = ref(false);
const currentAnimations = ref<AnimationEffect[]>([]);

// 初始位置设置
const initialPosition = ref<InitialPosition>({
  x: 0,
  y: 0,
  opacity: 1,
  scale: 1,
  rotation: 0
});

const { toast } = useToast();

// 动画效果库
const animationPresets: Record<string, AnimationPreset> = {
  fadeIn: {
    name: '淡入',
    description: '从透明到不透明',
    duration: '1s',
    easing: 'ease-in-out',
    properties: { opacity: [0, 1] }
  },
  fadeOut: {
    name: '淡出',
    description: '从不透明到透明',
    duration: '1s',
    easing: 'ease-in-out',
    properties: { opacity: [1, 0] }
  },
  slideInLeft: {
    name: '左侧滑入',
    description: '从左侧滑入',
    duration: '0.5s',
    easing: 'ease-out',
    properties: { transform: ['translateX(-100%)', 'translateX(0)'] }
  },
  slideInRight: {
    name: '右侧滑入',
    description: '从右侧滑入',
    duration: '0.5s',
    easing: 'ease-out',
    properties: { transform: ['translateX(100%)', 'translateX(0)'] }
  },
  slideInUp: {
    name: '上方滑入',
    description: '从上方滑入',
    duration: '0.5s',
    easing: 'ease-out',
    properties: { transform: ['translateY(-100%)', 'translateY(0)'] }
  },
  slideInDown: {
    name: '下方滑入',
    description: '从下方滑入',
    duration: '0.5s',
    easing: 'ease-out',
    properties: { transform: ['translateY(100%)', 'translateY(0)'] }
  },
  scaleIn: {
    name: '缩放进入',
    description: '从小到大缩放',
    duration: '0.3s',
    easing: 'ease-out',
    properties: { transform: ['scale(0)', 'scale(1)'] }
  },
  scaleOut: {
    name: '缩放退出',
    description: '从大到小缩放',
    duration: '0.3s',
    easing: 'ease-in',
    properties: { transform: ['scale(1)', 'scale(0)'] }
  },
  rotateIn: {
    name: '旋转进入',
    description: '旋转180度进入',
    duration: '0.5s',
    easing: 'ease-out',
    properties: { transform: ['rotate(-180deg)', 'rotate(0)'] }
  },
  bounceIn: {
    name: '弹跳进入',
    description: '弹性进入效果',
    duration: '0.6s',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    properties: { transform: ['scale(0)', 'scale(1.1)', 'scale(0.9)', 'scale(1)'] }
  },
  shake: {
    name: '摇摆',
    description: '左右摇摆效果',
    duration: '0.5s',
    properties: { transform: ['translateX(0)', 'translateX(-10px)', 'translateX(10px)', 'translateX(-10px)', 'translateX(0)'] }
  },
  pulse: {
    name: '脉冲',
    description: '缩放脉冲效果',
    duration: '1s',
    properties: { transform: ['scale(1)', 'scale(1.05)', 'scale(1)'] }
  }
};

// 生成YAML脚本
const generatedYaml = computed(() => {
  const elementKey = item.value?.elementName?.toLowerCase().replace(/\s+/g, '_') || 'element';
  let yaml = `${elementKey}:\n`;
  
  // 添加初始位置
  yaml += '  initial:\n';
  yaml += `    x: ${initialPosition.value.x}\n`;
  yaml += `    y: ${initialPosition.value.y}\n`;
  yaml += `    opacity: ${initialPosition.value.opacity}\n`;
  yaml += `    scale: ${initialPosition.value.scale}\n`;
  if (initialPosition.value.rotation !== 0) {
    yaml += `    rotation: ${initialPosition.value.rotation}deg\n`;
  }
  
  if (currentAnimations.value.length === 0) {
    yaml += '  duration: 3s\n';
    yaml += '  easing: ease-in-out\n';
    yaml += '  keyframes:\n';
    yaml += '    - time: 0s, ' + generateInitialKeyframe() + '\n';
    yaml += '    - time: 3s, ' + generateInitialKeyframe() + '\n';
  } else if (currentAnimations.value.length === 1) {
    const animation = currentAnimations.value[0];
    yaml += `  duration: ${animation.duration}\n`;
    if (animation.easing) {
      yaml += `  easing: ${animation.easing}\n`;
    }
    yaml += '  keyframes:\n';
    yaml += '    - time: 0s, ' + generateInitialKeyframe() + '\n';
    yaml += '    - time: ' + animation.duration + ', ' + generateKeyframe(animation.properties, 1) + '\n';
  } else {
    yaml += '  animations:\n';
    currentAnimations.value.forEach((animation, index) => {
      yaml += `    - name: ${animation.name}\n`;
      yaml += `      duration: ${animation.duration}\n`;
      if (animation.easing) {
        yaml += `      easing: ${animation.easing}\n`;
      }
      yaml += '      keyframes:\n';
      if (index === 0) {
        yaml += '        - time: 0s, ' + generateInitialKeyframe() + '\n';
      } else {
        yaml += '        - time: 0s, ' + generateKeyframe(currentAnimations.value[index - 1].properties, 1) + '\n';
      }
      yaml += '        - time: ' + animation.duration + ', ' + generateKeyframe(animation.properties, 1) + '\n';
    });
  }
  
  return yaml;
});

// 生成初始关键帧
const generateInitialKeyframe = () => {
  const parts = [
    `x: ${initialPosition.value.x}`,
    `y: ${initialPosition.value.y}`,
    `opacity: ${initialPosition.value.opacity}`,
    `scale: ${initialPosition.value.scale}`
  ];
  
  if (initialPosition.value.rotation !== 0) {
    parts.push(`rotation: ${initialPosition.value.rotation}deg`);
  }
  
  return parts.join(', ');
};

// 生成关键帧
const generateKeyframe = (properties: Record<string, any>, frameIndex: number) => {
  const parts = [
    `x: ${initialPosition.value.x}`,
    `y: ${initialPosition.value.y}`,
    `opacity: ${initialPosition.value.opacity}`,
    `scale: ${initialPosition.value.scale}`
  ];
  
  for (const [key, value] of Object.entries(properties)) {
    if (key === 'opacity' && Array.isArray(value)) {
      parts[2] = `opacity: ${value[frameIndex] || value[value.length - 1]}`;
    } else if (key === 'transform' && Array.isArray(value)) {
      const transform = value[frameIndex] || value[value.length - 1];
      if (transform.includes('scale')) {
        const match = transform.match(/scale\(([^)]+)\)/);
        if (match) parts[3] = `scale: ${match[1]}`;
      }
      if (transform.includes('translateX')) {
        const match = transform.match(/translateX\(([^)]+)\)/);
        if (match) {
          const xValue = match[1];
          // 如果是百分比或像素值，转换为相对于初始位置的值
          if (xValue.includes('%')) {
            parts[0] = `x: ${xValue}`;
          } else if (xValue.includes('px')) {
            parts[0] = `x: ${parseInt(xValue) + initialPosition.value.x}`;
          } else {
            parts[0] = `x: ${xValue}`;
          }
        }
      }
      if (transform.includes('translateY')) {
        const match = transform.match(/translateY\(([^)]+)\)/);
        if (match) {
          const yValue = match[1];
          if (yValue.includes('%')) {
            parts[1] = `y: ${yValue}`;
          } else if (yValue.includes('px')) {
            parts[1] = `y: ${parseInt(yValue) + initialPosition.value.y}`;
          } else {
            parts[1] = `y: ${yValue}`;
          }
        }
      }
    }
  }
  
  if (initialPosition.value.rotation !== 0) {
    parts.push(`rotation: ${initialPosition.value.rotation}deg`);
  }
  
  return parts.join(', ');
};

// 添加动画
const addAnimation = (key: string, preset: AnimationPreset) => {
  const animation: AnimationEffect = {
    id: Date.now().toString(),
    name: preset.name,
    type: key,
    duration: preset.duration,
    easing: preset.easing,
    properties: preset.properties
  };
  
  currentAnimations.value.push(animation);
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

// 预览动画
const previewAnimation = () => {
  toast.info('动画预览功能正在开发中');
};

// 重置初始位置
const resetInitialPosition = () => {
  initialPosition.value = {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    rotation: 0
  };
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
    const parsedData = AnimationParser.parseNewFormat(animationScript);
    
    if (parsedData) {
      // 设置初始位置
      initialPosition.value = { ...parsedData.initial };
      
      // 设置动画效果
      if (parsedData.animations && parsedData.animations.length > 0) {
        // 多动画模式
        currentAnimations.value = parsedData.animations.map(anim => ({ ...anim }));
      } else if (parsedData.singleAnimation) {
        // 单动画模式，尝试识别动画类型
        const singleAnim = parsedData.singleAnimation;
        
        // 基于关键帧内容识别动画类型
        let animationType = 'custom';
        let animationName = '自定义动画';
        
        if (animationScript.includes('opacity')) {
          if (animationScript.includes('opacity: 0') && animationScript.includes('opacity: 1')) {
            animationType = 'fadeIn';
            animationName = '淡入';
          } else if (animationScript.includes('opacity: 1') && animationScript.includes('opacity: 0')) {
            animationType = 'fadeOut';
            animationName = '淡出';
          }
        }
        
        if (animationScript.includes('scale')) {
          if (animationScript.includes('scale: 0') && animationScript.includes('scale: 1')) {
            animationType = 'scaleIn';
            animationName = '缩放进入';
          }
        }
        
        if (animationScript.includes('translateX') || animationScript.includes('x:')) {
          if (animationScript.includes('-100%') || animationScript.includes('translateX(-')) {
            animationType = 'slideInLeft';
            animationName = '左侧滑入';
          } else if (animationScript.includes('100%') || animationScript.includes('translateX(')) {
            animationType = 'slideInRight';
            animationName = '右侧滑入';
          }
        }
        
        currentAnimations.value = [{
          id: Date.now().toString(),
          name: animationName,
          type: animationType,
          duration: singleAnim.duration,
          easing: singleAnim.easing,
          properties: {}
        }];
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
  initialPosition.value = {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    rotation: 0
  };
  
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
  initialPosition.value = {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    rotation: 0
  };
};

defineExpose({ open, close });
</script>
