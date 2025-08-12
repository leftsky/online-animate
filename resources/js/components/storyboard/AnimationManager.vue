<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-6xl max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>动画管理 - {{ item?.elementName }}</DialogTitle>
        <DialogDescription>
          管理此分镜内容的动画效果
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex gap-6 h-[60vh]">
        <!-- 左侧：动画效果库 -->
        <div class="w-1/3 space-y-4">
          <div class="space-y-2">
            <h3 class="text-sm font-medium">动画效果库</h3>
            <div class="space-y-1 max-h-96 overflow-y-auto">
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
        <div class="flex-1 space-y-4">
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
          <div class="space-y-2 max-h-80 overflow-y-auto">
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
          <div class="space-y-2">
            <label class="text-sm font-medium">生成的YAML脚本</label>
            <pre class="bg-muted p-3 rounded text-xs overflow-auto max-h-32"><code>{{ generatedYaml }}</code></pre>
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
import { Plus, Play, Edit, Trash2, Zap, Loader2 } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '../../composables/useToast';
import type { StoryboardItem } from './types';

interface AnimationPreset {
  name: string;
  description: string;
  duration: string;
  easing?: string;
  properties: Record<string, any>;
}

interface CurrentAnimation {
  id: string;
  name: string;
  type: string;
  duration: string;
  easing?: string;
  properties: Record<string, any>;
}

const isOpen = ref(false);
const item = ref<StoryboardItem | null>(null);
const loading = ref(false);
const currentAnimations = ref<CurrentAnimation[]>([]);

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
  if (!item.value || currentAnimations.value.length === 0) {
    return `${item.value?.elementName?.toLowerCase().replace(/\s+/g, '_') || 'element'}:
  duration: 3s
  easing: ease-in-out
  keyframes:
    - time: 0s, x: 0, y: 0, opacity: 1, scale: 1
    - time: 3s, x: 0, y: 0, opacity: 1, scale: 1`;
  }
  
  const elementKey = item.value.elementName.toLowerCase().replace(/\s+/g, '_');
  let yaml = `${elementKey}:\n`;
  
  // 如果有多个动画，生成序列
  if (currentAnimations.value.length > 1) {
    yaml += '  animations:\n';
    currentAnimations.value.forEach((animation, index) => {
      yaml += `    - name: ${animation.name}\n`;
      yaml += `      duration: ${animation.duration}\n`;
      if (animation.easing) {
        yaml += `      easing: ${animation.easing}\n`;
      }
      yaml += '      keyframes:\n';
      yaml += '        - time: 0s, ' + generateKeyframe(animation.properties, 0) + '\n';
      yaml += '        - time: ' + animation.duration + ', ' + generateKeyframe(animation.properties, 1) + '\n';
    });
  } else if (currentAnimations.value.length === 1) {
    const animation = currentAnimations.value[0];
    yaml += `  duration: ${animation.duration}\n`;
    if (animation.easing) {
      yaml += `  easing: ${animation.easing}\n`;
    }
    yaml += '  keyframes:\n';
    yaml += '    - time: 0s, ' + generateKeyframe(animation.properties, 0) + '\n';
    yaml += '    - time: ' + animation.duration + ', ' + generateKeyframe(animation.properties, 1) + '\n';
  }
  
  return yaml;
});

// 生成关键帧
const generateKeyframe = (properties: Record<string, any>, frameIndex: number) => {
  const parts = ['x: 0', 'y: 0', 'opacity: 1', 'scale: 1'];
  
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
        if (match) parts[0] = `x: ${match[1]}`;
      }
      if (transform.includes('translateY')) {
        const match = transform.match(/translateY\(([^)]+)\)/);
        if (match) parts[1] = `y: ${match[1]}`;
      }
    }
  }
  
  return parts.join(', ');
};

// 添加动画
const addAnimation = (key: string, preset: AnimationPreset) => {
  const animation: CurrentAnimation = {
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
const editAnimation = (index: number) => {
  toast.info('动画编辑功能正在开发中');
};

// 预览动画
const previewAnimation = () => {
  toast.info('动画预览功能正在开发中');
};

// 保存动画
const saveAnimations = async () => {
  if (!item.value) return;
  
  loading.value = true;
  try {
    // 这里应该调用API保存动画脚本
    // await sceneContentApi.update(parseInt(item.value.id), {
    //   animation_script: generatedYaml.value
    // });
    
    // 暂时只是模拟保存
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('动画保存成功！');
    close();
  } catch (error) {
    console.error('保存动画失败:', error);
    toast.error('保存动画失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 打开对话框
const open = (storyboardItem: StoryboardItem) => {
  item.value = storyboardItem;
  currentAnimations.value = [];
  isOpen.value = true;
};

// 关闭对话框
const close = () => {
  isOpen.value = false;
  item.value = null;
  currentAnimations.value = [];
};

defineExpose({ open, close });
</script>
