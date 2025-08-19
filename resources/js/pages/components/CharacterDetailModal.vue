<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-6xl max-h-[90vh] p-0">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle>人物详情 - {{ character?.name || '未命名' }}</DialogTitle>
        <DialogDescription>
          查看和编辑人物的详细信息、主图和各种视图
        </DialogDescription>
      </DialogHeader>

      <div class="flex h-[70vh] min-h-[600px] gap-4">
        <!-- 左侧信息面板 -->
        <div class="w-80 p-6 overflow-y-auto">
          <!-- 主图预览 -->
          <div class="mb-6">
            <h4 class="text-md font-medium mb-3">主图</h4>
            <div
              class="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              :class="{ 'ring-2 ring-primary': selectedImage === 'main' }" @click="handleMainImageClick">
              <img v-if="character?.image_path" :src="character.image_path" :alt="character.name"
                class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <Image class="w-8 h-8 text-muted-foreground" />
              </div>
              <!-- 上传提示 -->
              <div
                class="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span v-if="!isUploading" class="text-white text-sm font-medium">点击上传图片</span>
                <span v-else class="text-white text-sm font-medium">上传中...</span>
              </div>
            </div>
            <!-- 隐藏的文件输入 -->
            <input ref="mainImageInput" type="file" accept="image/*" class="hidden" @change="handleMainImageUpload" />
          </div>

          <!-- 基本信息 -->
          <div class="space-y-4 mb-6">
            <div>
              <h3 class="text-lg font-semibold mb-2">基本信息</h3>
              <div class="space-y-2 text-sm">
                <div><span class="text-muted-foreground">姓名:</span> {{ character?.name }}</div>
                <div><span class="text-muted-foreground">性别:</span> {{ getGenderText(character?.gender) }}</div>
                <div v-if="character?.age"><span class="text-muted-foreground">年龄:</span> {{ character.age }}岁</div>
                <div v-if="character?.description"><span class="text-muted-foreground">描述:</span> {{
                  character.description }}</div>
              </div>
            </div>
          </div>

          <!-- 四视图 -->
          <div class="mb-6" v-if="additionalResources?.fourViews">
            <h4 class="text-md font-medium mb-3">四视图</h4>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="(view, key) in fourViewsConfig" :key="key"
                class="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                :class="{ 'ring-2 ring-primary': selectedImage === `fourViews.${key}` }"
                @click="switchToImage('fourViews', key)">
                <img v-if="additionalResources.fourViews[key]" :src="additionalResources.fourViews[key]"
                  :alt="view.label" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Image class="w-4 h-4 text-muted-foreground" />
                </div>
                <div class="absolute bottom-1 left-1 right-1">
                  <div class="bg-black/70 text-white text-xs px-1 py-0.5 rounded text-center">
                    {{ view.label }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间Canvas区域 -->
        <div class="flex-1 p-6">
          <canvas ref="canvasElement" class="w-full h-full rounded-lg"></canvas>
        </div>

        <!-- 右侧身体部位面板 -->
        <div class="w-80 p-6 overflow-y-auto">
          <!-- 身体部位 -->
          <div>
            <h4 class="text-md font-medium mb-3">身体部位</h4>
            <div class="space-y-4">
              <div v-for="(part, partKey) in bodyPartsConfig" :key="partKey">
                <h5 class="text-sm font-medium mb-2">{{ part.label }}</h5>
                <div class="grid grid-cols-2 gap-1">
                  <div v-for="(view, viewKey) in fourViewsConfig" :key="viewKey"
                    class="relative aspect-square bg-muted rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    :class="{ 'ring-2 ring-primary': selectedImage === `bodyParts.${partKey}.${viewKey}` }"
                    @click="switchToImage('bodyParts', `${partKey}.${viewKey}`)">
                    <img v-if="additionalResources?.bodyParts?.[partKey]?.[viewKey]"
                      :src="additionalResources.bodyParts[partKey][viewKey]" :alt="`${part.label} ${view.label}`"
                      class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <Image class="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div class="absolute bottom-0 left-0 right-0">
                      <div class="bg-black/70 text-white text-xs px-1 py-0.5 text-center">
                        {{ view.label }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick, watch } from 'vue';
import { Image } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CanvasManager } from '@/lib/animation/CanvasManager';
import { YamlAnimationPlayer } from '@/lib/animation/YamlAnimationPlayer';
import { type AnimationData } from '@/lib/AnimationParser';
import { mediaApi } from '@/utils/api';
import { uploadApi } from '@/utils/api';
import { type MediaCharacter } from '@/services/mediaApi';
import { useToast } from '@/composables/useToast';

interface Props {
  open: boolean;
  character: MediaCharacter | null;
}

interface Emits {
  (e: 'update:open', open: boolean): void;
  (e: 'character-updated', character: MediaCharacter): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Toast
const { toast } = useToast();

// Canvas相关
const canvasElement = ref<HTMLCanvasElement>();
let canvasManager: CanvasManager | null = null;
let yamlPlayer: YamlAnimationPlayer | null = null;
const selectedImage = ref<string>('main');
const isPlaying = ref(false);

// 文件上传相关
const mainImageInput = ref<HTMLInputElement>();
const isUploading = ref(false);

// 性别选项
const genderOptions = [
  { value: 0, label: '未知' },
  { value: 1, label: '男性' },
  { value: 2, label: '女性' },
  { value: 3, label: '其他' }
];

// 四视图配置
const fourViewsConfig = {
  front: { label: '正面' },
  back: { label: '背面' },
  left: { label: '左侧' },
  right: { label: '右侧' }
};

// 身体部位配置
const bodyPartsConfig = {
  head: { label: '头部' },
  torso: { label: '躯干' },
  leftArm: { label: '左臂' },
  rightArm: { label: '右臂' },
  leftLeg: { label: '左腿' },
  rightLeg: { label: '右腿' }
};

// 解析additional_resources
const additionalResources = computed(() => {
  if (!props.character?.additional_resources) return null;
  try {
    // 如果additional_resources是数组，取第一个元素作为JSON字符串
    const resourcesData = Array.isArray(props.character.additional_resources)
      ? props.character.additional_resources[0]
      : props.character.additional_resources;

    if (typeof resourcesData === 'string') {
      return JSON.parse(resourcesData);
    }
    return null;
  } catch {
    return null;
  }
});

// 获取性别文本
const getGenderText = (gender?: number) => {
  const option = genderOptions.find(g => g.value === gender);
  return option ? option.label : '未知';
};

// 生成默认动画数据
const generateDefaultAnimationData = (imagePath?: string): AnimationData => {
  const media = imagePath || props.character?.image_path || '';

  // 获取Canvas的实际尺寸来计算中心位置
  let canvasWidth = 800;
  let canvasHeight = 600;

  if (canvasManager) {
    const dimensions = canvasManager.getDimensions();
    canvasWidth = dimensions.width;
    canvasHeight = dimensions.height;
  }

  console.log('🎯 计算动画初始位置，Canvas尺寸:', { canvasWidth, canvasHeight });

  return {
    name: "default",
    description: "默认动画",
    media: media,
    width: 300,
    height: 400,
    zindex: 1,
    initialPosition: {
      x: "50%",  // 动态计算画布中心X坐标
      y: "50%", // 动态计算画布中心Y坐标
      scaleX: 1.0,
      scaleY: 1.0,
      opacity: 1.0,
      rotation: 0
    },
    animationSequences: [
      // 轻微浮动动画
      {
        id: 'gentle_float',
        name: "轻微浮动",
        description: "轻微浮动动画",
        duration: 3000,
        easing: 'ease-in-out',
        keyframes: [
          {
            startTime: 0,
            duration: 1500,
            scaleX: 1.0,
            scaleY: 1.0,
            opacity: 1.0,
            rotation: 0
          },
          {
            startTime: 1500,
            duration: 1500,
            scaleX: 1.4,
            scaleY: 1.4,
            opacity: 1.0,
            rotation: 0
          },
          {
            startTime: 3000,
            duration: 0,
            scaleX: 1.0,
            scaleY: 1.0,
            opacity: 1.0,
            rotation: 0
          }
        ]
      }
    ]
  };
};

// 初始化Canvas
const initCanvas = async () => {
  if (!canvasElement.value) return;

  destroyCanvas();

  const canvasContainer = canvasElement.value.parentElement;
  if (!canvasContainer) return;

  const rect = canvasContainer.getBoundingClientRect();
  console.log('🎯 计算Canvas尺寸，容器尺寸:', { width: rect.width, height: rect.height });
  const width = Math.max(rect.width, 400);
  const height = Math.max(rect.height, 300);

  canvasElement.value.width = width;
  canvasElement.value.height = height;

  canvasManager = new CanvasManager(canvasElement.value, {
    width: width,
    height: height
  } as any);

  await initYamlPlayer();
};

// 销毁Canvas资源
const destroyCanvas = () => {
  if (isPlaying.value) {
    pauseAnimation();
  }

  if (yamlPlayer) {
    yamlPlayer.clear();
    yamlPlayer = null;
  }

  if (canvasManager) {
    canvasManager.dispose();
    canvasManager = null;
  }

  isPlaying.value = false;
  selectedImage.value = 'main';
};

// 初始化 YAML 播放器
const initYamlPlayer = async () => {
  if (!canvasManager) return;

  if (yamlPlayer) {
    yamlPlayer.clear();
    yamlPlayer = null;
  }

  yamlPlayer = new YamlAnimationPlayer(canvasManager);
  const defaultAnimationData = generateDefaultAnimationData();
  await yamlPlayer.setAnimationData(defaultAnimationData);
};

// 开始播放动画
const startAnimation = async () => {
  if (!yamlPlayer || !yamlPlayer.isReady()) return;

  yamlPlayer.play();
  isPlaying.value = true;
};

// 暂停动画
const pauseAnimation = () => {
  if (yamlPlayer) {
    yamlPlayer.pause();
    isPlaying.value = false;
  }
};

// 加载主图
const loadMainImage = async () => {
  if (!yamlPlayer || !props.character?.image_path) return;

  const mainImageAnimationData = generateDefaultAnimationData(props.character.image_path);
  await yamlPlayer.setAnimationData(mainImageAnimationData);
  selectedImage.value = 'main';
};

// 加载指定图片
const loadImage = async (imageUrl: string) => {
  if (!yamlPlayer || !imageUrl) return;

  const imageAnimationData = generateDefaultAnimationData(imageUrl);
  await yamlPlayer.setAnimationData(imageAnimationData);
  yamlPlayer.play();
};

// 处理主图点击
const handleMainImageClick = () => {
  // 触发文件选择
  mainImageInput.value?.click();
};

// 处理主图上传
const handleMainImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || !props.character) return;

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    toast.error('请选择图片文件');
    return;
  }

  // 验证文件大小 (最大50MB)
  if (file.size > 50 * 1024 * 1024) {
    toast.error('文件大小不能超过50MB');
    return;
  }

  isUploading.value = true;

  try {
    // 使用项目现有的上传API
    const uploadResult = await uploadApi.uploadFile(file, { type: 'image' });

    if (uploadResult.success && uploadResult.data?.url) {
      // 使用项目现有的人物更新API
      const updateResult = await mediaApi.updateCharacter(props.character.id, {
        image_path: uploadResult.data.url
      });

      if (updateResult.success) {
        // 通知父组件更新数据
        if (props.character) {
          const updatedCharacter = {
            ...props.character,
            image_path: uploadResult.data.url
          };
          emit('character-updated', updatedCharacter);
        }

        // 重新加载Canvas
        await loadMainImage();

        // 显示成功消息
        toast.success('主图更新成功');
      } else {
        throw new Error(updateResult.message || '更新失败');
      }
    } else {
      throw new Error(uploadResult.message || '上传失败');
    }
  } catch (error) {
    console.error('上传失败:', error);
    toast.error('上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
  } finally {
    isUploading.value = false;
    // 清空文件输入
    if (target) {
      target.value = '';
    }
  }
};

// 切换到指定图片
const switchToImage = (category: string, path: string) => {
  if (!additionalResources.value) {
    // 如果没有数据，只更新选中状态，不加载图片
    selectedImage.value = `${category}.${path}`;
    return;
  }

  let imageUrl = '';
  if (category === 'fourViews') {
    imageUrl = additionalResources.value.fourViews?.[path];
  } else if (category === 'bodyParts') {
    const [partKey, viewKey] = path.split('.');
    imageUrl = additionalResources.value.bodyParts?.[partKey]?.[viewKey];
  }

  if (imageUrl) {
    loadImage(imageUrl);
    selectedImage.value = `${category}.${path}`;
  } else {
    // 如果没有图片，只更新选中状态
    selectedImage.value = `${category}.${path}`;
  }
};

// 监听对话框开关状态
watch(() => props.open, async (newOpen) => {
  if (newOpen) {
    // 对话框打开时初始化Canvas
    await nextTick();
    await initCanvas();
    // 初始加载主图并自动播放动画
    await loadMainImage();
    // 自动开始播放动画
    setTimeout(() => {
      startAnimation();
    }, 500); // 延迟500ms确保初始化完成
  } else {
    // 对话框关闭时销毁Canvas资源
    destroyCanvas();
  }
}, { immediate: true });

// 组件卸载时清理
onUnmounted(() => {
  // 组件卸载时清理资源
  destroyCanvas();
});
</script>
