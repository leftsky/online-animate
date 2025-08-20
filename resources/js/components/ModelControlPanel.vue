<template>
  <div class="bg-card border border-border rounded-lg shadow-lg p-4 min-w-[400px]">
    <!-- 标题栏 -->    
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-foreground">模型控制</h3>
      <Button variant="ghost" size="sm" @click="$emit('close')">
        <X class="w-4 h-4" />
      </Button>
    </div>

    <!-- 模型信息 -->    
    <div v-if="modelName" class="mb-4 p-3 bg-muted/30 rounded-lg">
      <div class="text-sm font-medium text-foreground">{{ modelName }}</div>
      <div class="text-xs text-muted-foreground mt-1">当前加载的模型</div>
    </div>

    <!-- 动作控制 -->    
    <div class="mb-6">
      <h4 class="text-sm font-medium text-foreground mb-3 flex items-center">
        <Play class="w-4 h-4 mr-2" />
        动作控制
      </h4>
      
      <!-- 动作列表 -->      
      <div class="space-y-2 mb-3">
        <div 
          v-for="(animation, index) in availableAnimations" 
          :key="index"
          class="flex items-center justify-between p-2 bg-background border border-border rounded-md hover:border-primary/50 transition-colors cursor-pointer"
          :class="{ 'border-primary bg-primary/5': currentAnimation === index }"
          @click="selectAnimation(index)"
        >
          <div class="flex-1">
            <div class="text-sm font-medium text-foreground">{{ animation.name }}</div>
            <div class="text-xs text-muted-foreground">{{ animation.duration }}ms</div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            @click.stop="playAnimation(index)"
            :disabled="isPlaying"
          >
            <Play class="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <!-- 动画控制按钮 -->      
      <div class="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          @click="playCurrentAnimation"
          :disabled="isPlaying || currentAnimation === null"
          class="flex-1"
        >
          <Play class="w-3 h-3 mr-1" />
          播放
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          @click="pauseAnimation"
          :disabled="!isPlaying"
          class="flex-1"
        >
          <Pause class="w-3 h-3 mr-1" />
          暂停
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          @click="stopAnimation"
          :disabled="!isPlaying"
          class="flex-1"
        >
          <Square class="w-3 h-3 mr-1" />
          停止
        </Button>
      </div>
    </div>

    <!-- 模型参数调整 -->    
    <div>
      <h4 class="text-sm font-medium text-foreground mb-3 flex items-center">
        <Settings class="w-4 h-4 mr-2" />
        模型参数
      </h4>
      
      <!-- 位置控制 -->      
      <div class="mb-4">
        <label class="text-xs font-medium text-muted-foreground mb-2 block">位置</label>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="text-xs text-muted-foreground">X</label>
            <Input 
              v-model.number="modelParams.position.x" 
              type="number" 
              step="0.1" 
              class="h-8 text-xs"
              @input="updateModelPosition"
            />
          </div>
          <div>
            <label class="text-xs text-muted-foreground">Y</label>
            <Input 
              v-model.number="modelParams.position.y" 
              type="number" 
              step="0.1" 
              class="h-8 text-xs"
              @input="updateModelPosition"
            />
          </div>
          <div>
            <label class="text-xs text-muted-foreground">Z</label>
            <Input 
              v-model.number="modelParams.position.z" 
              type="number" 
              step="0.1" 
              class="h-8 text-xs"
              @input="updateModelPosition"
            />
          </div>
        </div>
      </div>
      
      <!-- 旋转控制 -->      
      <div class="mb-4">
        <label class="text-xs font-medium text-muted-foreground mb-2 block">旋转 (度)</label>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="text-xs text-muted-foreground">X</label>
            <Input 
              v-model.number="modelParams.rotation.x" 
              type="number" 
              step="1" 
              class="h-8 text-xs"
              @input="updateModelRotation"
            />
          </div>
          <div>
            <label class="text-xs text-muted-foreground">Y</label>
            <Input 
              v-model.number="modelParams.rotation.y" 
              type="number" 
              step="1" 
              class="h-8 text-xs"
              @input="updateModelRotation"
            />
          </div>
          <div>
            <label class="text-xs text-muted-foreground">Z</label>
            <Input 
              v-model.number="modelParams.rotation.z" 
              type="number" 
              step="1" 
              class="h-8 text-xs"
              @input="updateModelRotation"
            />
          </div>
        </div>
      </div>
      
      <!-- 缩放控制 -->      
      <div class="mb-4">
        <label class="text-xs font-medium text-muted-foreground mb-2 block">缩放</label>
        <div class="flex items-center gap-2">
          <Input 
            v-model.number="modelParams.scale" 
            type="number" 
            step="0.1" 
            min="0.1" 
            max="5" 
            class="h-8 text-xs flex-1"
            @input="updateModelScale"
          />
          <Button 
            variant="outline" 
            size="sm" 
            @click="resetScale"
            class="h-8 px-2 text-xs"
          >
            重置
          </Button>
        </div>
      </div>
      
      <!-- 重置按钮 -->      
      <Button 
        variant="outline" 
        size="sm" 
        @click="resetAllParams"
        class="w-full"
      >
        <RotateCcw class="w-3 h-3 mr-1" />
        重置所有参数
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  RotateCcw 
} from 'lucide-vue-next';

// Props
interface Props {
  modelName?: string;
  model?: any; // Three.js模型对象
  availableAnimations?: Array<{
    name: string;
    duration: number;
    clip?: any; // Three.js AnimationClip
  }>;
}

const props = withDefaults(defineProps<Props>(), {
  modelName: '',
  availableAnimations: () => []
});

// Emits
const emit = defineEmits<{
  close: [];
  animationPlay: [index: number];
  animationPause: [];
  animationStop: [];
  modelUpdate: [params: any];
}>();

// 状态
const currentAnimation = ref<number | null>(null);
const isPlaying = ref(false);

// 模型参数
const modelParams = reactive({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1
});

// 初始参数备份
const initialParams = reactive({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1
});

// 监听模型变化，更新参数
watch(() => props.model, (newModel) => {
  if (newModel) {
    // 更新当前参数
    modelParams.position.x = newModel.position.x;
    modelParams.position.y = newModel.position.y;
    modelParams.position.z = newModel.position.z;
    
    modelParams.rotation.x = (newModel.rotation.x * 180) / Math.PI;
    modelParams.rotation.y = (newModel.rotation.y * 180) / Math.PI;
    modelParams.rotation.z = (newModel.rotation.z * 180) / Math.PI;
    
    modelParams.scale = newModel.scale.x;
    
    // 备份初始参数
    Object.assign(initialParams.position, modelParams.position);
    Object.assign(initialParams.rotation, modelParams.rotation);
    initialParams.scale = modelParams.scale;
  }
}, { immediate: true });

// 动作控制方法
const selectAnimation = (index: number) => {
  currentAnimation.value = index;
};

const playAnimation = (index: number) => {
  currentAnimation.value = index;
  playCurrentAnimation();
};

const playCurrentAnimation = () => {
  if (currentAnimation.value !== null) {
    isPlaying.value = true;
    emit('animationPlay', currentAnimation.value);
  }
};

const pauseAnimation = () => {
  isPlaying.value = false;
  emit('animationPause');
};

const stopAnimation = () => {
  isPlaying.value = false;
  emit('animationStop');
};

// 参数更新方法
const updateModelPosition = () => {
  emit('modelUpdate', {
    type: 'position',
    value: { ...modelParams.position }
  });
};

const updateModelRotation = () => {
  emit('modelUpdate', {
    type: 'rotation',
    value: {
      x: (modelParams.rotation.x * Math.PI) / 180,
      y: (modelParams.rotation.y * Math.PI) / 180,
      z: (modelParams.rotation.z * Math.PI) / 180
    }
  });
};

const updateModelScale = () => {
  emit('modelUpdate', {
    type: 'scale',
    value: modelParams.scale
  });
};

const resetScale = () => {
  modelParams.scale = initialParams.scale;
  updateModelScale();
};

const resetAllParams = () => {
  Object.assign(modelParams.position, initialParams.position);
  Object.assign(modelParams.rotation, initialParams.rotation);
  modelParams.scale = initialParams.scale;
  
  updateModelPosition();
  updateModelRotation();
  updateModelScale();
};

// 暴露方法给父组件
defineExpose({
  setAnimationState: (playing: boolean) => {
    isPlaying.value = playing;
  },
  updateParams: (params: any) => {
    if (params.position) {
      Object.assign(modelParams.position, params.position);
    }
    if (params.rotation) {
      modelParams.rotation.x = (params.rotation.x * 180) / Math.PI;
      modelParams.rotation.y = (params.rotation.y * 180) / Math.PI;
      modelParams.rotation.z = (params.rotation.z * 180) / Math.PI;
    }
    if (params.scale !== undefined) {
      modelParams.scale = params.scale;
    }
  }
});
</script>