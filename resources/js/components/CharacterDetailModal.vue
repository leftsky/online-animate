<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-6xl max-h-[90vh] p-0">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle>人物详情 - {{ character?.name || '未命名' }}</DialogTitle>
        <DialogDescription>
          查看和编辑人物的详细信息、主图和各种视图
        </DialogDescription>
      </DialogHeader>

      <div class="flex h-[70vh] min-h-[600px]">
        <!-- 左侧Canvas区域 -->
        <div class="flex-1 p-6 pr-3">
          <div class="w-full h-full bg-muted rounded-lg overflow-hidden">
            <canvas ref="canvasElement" class="w-full h-full"></canvas>
          </div>
        </div>

        <!-- 右侧详情面板 -->
        <div class="w-80 p-6 pl-3 overflow-y-auto">
          <!-- 基本信息 -->
          <div class="space-y-4 mb-6">
            <div>
              <h3 class="text-lg font-semibold mb-2">基本信息</h3>
              <div class="space-y-2 text-sm">
                <div><span class="text-muted-foreground">姓名:</span> {{ character?.name }}</div>
                <div><span class="text-muted-foreground">性别:</span> {{ getGenderText(character?.gender) }}</div>
                <div v-if="character?.age"><span class="text-muted-foreground">年龄:</span> {{ character.age }}岁</div>
                <div v-if="character?.description"><span class="text-muted-foreground">描述:</span> {{ character.description }}</div>
              </div>
            </div>
          </div>

          <!-- 主图预览 -->
          <div class="mb-6">
            <h4 class="text-md font-medium mb-3">主图</h4>
            <div 
              class="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              :class="{ 'ring-2 ring-primary': selectedImage === 'main' }"
              @click="handleMainImageClick"
            >
              <img 
                v-if="character?.image_path" 
                :src="character.image_path" 
                :alt="character.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <Image class="w-8 h-8 text-muted-foreground" />
              </div>
              <!-- 上传提示 -->
              <div class="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span v-if="!isUploading" class="text-white text-sm font-medium">点击上传图片</span>
                <span v-else class="text-white text-sm font-medium">上传中...</span>
              </div>
            </div>
            <!-- 隐藏的文件输入 -->
            <input
              ref="mainImageInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleMainImageUpload"
            />
          </div>

          <!-- 四视图 -->
          <div class="mb-6" v-if="additionalResources?.fourViews">
            <h4 class="text-md font-medium mb-3">四视图</h4>
            <div class="grid grid-cols-2 gap-2">
              <div 
                v-for="(view, key) in fourViewsConfig" 
                :key="key"
                class="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                :class="{ 'ring-2 ring-primary': selectedImage === `fourViews.${key}` }"
                @click="switchToImage('fourViews', key)"
              >
                <img 
                  v-if="additionalResources.fourViews[key]" 
                  :src="additionalResources.fourViews[key]" 
                  :alt="view.label"
                  class="w-full h-full object-cover"
                />
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

          <!-- 身体部位 -->
          <div v-if="additionalResources?.bodyParts">
            <h4 class="text-md font-medium mb-3">身体部位</h4>
            <div class="space-y-4">
              <div v-for="(part, partKey) in bodyPartsConfig" :key="partKey">
                <h5 class="text-sm font-medium mb-2">{{ part.label }}</h5>
                <div class="grid grid-cols-2 gap-1">
                  <div 
                    v-for="(view, viewKey) in fourViewsConfig" 
                    :key="viewKey"
                    class="relative aspect-square bg-muted rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    :class="{ 'ring-2 ring-primary': selectedImage === `bodyParts.${partKey}.${viewKey}` }"
                    @click="switchToImage('bodyParts', `${partKey}.${viewKey}`)"
                  >
                    <img 
                      v-if="additionalResources.bodyParts[partKey]?.[viewKey]" 
                      :src="additionalResources.bodyParts[partKey][viewKey]" 
                      :alt="`${part.label} ${view.label}`"
                      class="w-full h-full object-cover"
                    />
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
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { Image } from 'lucide-vue-next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CanvasManager } from '@/lib/animation/CanvasManager';
import { FabricImage } from 'fabric';
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
const selectedImage = ref<string>('main');

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

// 初始化Canvas
const initCanvas = async () => {
  if (!canvasElement.value) return;
  
  try {
    // 销毁现有的canvas
    if (canvasManager) {
      canvasManager.dispose();
    }
    
    // 创建新的canvas管理器
    canvasManager = new CanvasManager(canvasElement.value);
    
    // 加载主图
    await loadMainImage();
  } catch (error) {
    console.error('Canvas初始化失败:', error);
  }
};

// 加载主图
const loadMainImage = async () => {
  if (!canvasManager || !props.character?.image_path) return;
  
  try {
    const canvas = canvasManager.getCanvas();
    canvas.clear();
    
    const img = await FabricImage.fromURL(props.character.image_path, {
      crossOrigin: 'anonymous'
    });
    
    // 计算缩放比例以适应画布
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const imgWidth = img.width || 1;
    const imgHeight = img.height || 1;
    
    const scaleX = canvasWidth / imgWidth;
    const scaleY = canvasHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY) * 0.8; // 留一些边距
    
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    });
    
    canvas.add(img);
    canvas.renderAll();
    selectedImage.value = 'main';
  } catch (error) {
    console.error('加载主图失败:', error);
  }
};

// 加载指定图片
const loadImage = async (imageUrl: string) => {
  if (!canvasManager || !imageUrl) return;
  
  try {
    const canvas = canvasManager.getCanvas();
    canvas.clear();
    
    const img = await FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous'
    });
    
    // 计算缩放比例以适应画布
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const imgWidth = img.width || 1;
    const imgHeight = img.height || 1;
    
    const scaleX = canvasWidth / imgWidth;
    const scaleY = canvasHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY) * 0.8; // 留一些边距
    
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    });
    
    canvas.add(img);
    canvas.renderAll();
  } catch (error) {
    console.error('加载图片失败:', error);
  }
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
  if (!additionalResources.value) return;
  
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
  }
};

// 监听弹窗打开状态
watch(() => props.open, async (newOpen) => {
  if (newOpen && props.character) {
    await nextTick();
    await initCanvas();
  }
});

// 监听人物变化
watch(() => props.character, async (newCharacter) => {
  if (newCharacter && props.open) {
    await nextTick();
    await initCanvas();
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (canvasManager) {
    canvasManager.dispose();
  }
});
</script>
