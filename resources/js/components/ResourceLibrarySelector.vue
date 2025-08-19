<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="w-4/5 h-4/5 max-w-none">
      <!-- 头部 -->
      <DialogHeader>
        <DialogTitle>{{ title || "选择资源" }}</DialogTitle>
        <DialogDescription>
          从资源库中选择图片资源来添加到分镜内容中
        </DialogDescription>
      </DialogHeader>

      <!-- 搜索栏 -->
      <div class="p-4 border-b border-border">
        <div class="flex gap-2">
          <div class="relative flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索资源..."
              class="w-full px-3 py-2 pl-10 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
              @keydown.enter="search"
            />
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
          </div>
          <Button @click="search" :disabled="loading" class="px-4">
            <Search class="w-4 h-4 mr-2" />
            搜索
          </Button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 flex min-h-0">
        <!-- 左侧分类 -->
        <div class="w-48 border-r border-border p-4 bg-muted/20">
          <h4 class="font-medium mb-3 text-foreground">分类</h4>
          <div class="space-y-1">
            <button
              @click="selectCategory('')"
              :class="[
                'w-full text-left px-3 py-2 rounded-md transition-colors text-sm',
                !selectedCategory
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              ]"
            >
              全部分类
            </button>
            <button
              v-for="category in categories"
              :key="category.key"
              @click="selectCategory(category.key)"
              :class="[
                'w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex items-center gap-2',
                selectedCategory === category.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              ]"
            >
              <component :is="category.icon" class="w-4 h-4" />
              {{ category.name }}
            </button>
          </div>
        </div>

        <!-- 右侧资源网格 -->
        <div class="flex-1 p-4 overflow-auto bg-background">
          <div v-if="loading" class="flex items-center justify-center h-full">
            <div class="text-center">
              <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p class="text-muted-foreground">加载中...</p>
            </div>
          </div>

          <div
            v-else-if="resources.length === 0"
            class="flex items-center justify-center h-full"
          >
            <div class="text-center text-muted-foreground">
              <Image class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无资源</p>
              <p class="text-sm mt-1">请先上传一些资源到资源库</p>
            </div>
          </div>

          <div v-else class="grid grid-cols-4 gap-4">
            <div
              v-for="resource in resources"
              :key="resource.id"
              @click="selectResource(resource)"
              :class="[
                'relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-lg group',
                selectedResource?.id === resource.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50 hover:bg-accent/50',
              ]"
            >
              <!-- 图片容器 -->
              <div class="aspect-square bg-muted rounded-t-lg overflow-hidden">
                <img
                  v-if="resource.image_path"
                  :src="resource.image_path"
                  :alt="resource.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  @error="handleImageError"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center bg-muted"
                >
                  <Image class="w-8 h-8 text-muted-foreground" />
                </div>
              </div>

              <!-- 资源信息 -->
              <div class="p-3 bg-card">
                <p class="text-sm font-medium text-foreground truncate mb-1">
                  {{ resource.name || "未命名" }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ getCategoryName(resource.type) }}
                </p>
              </div>

              <!-- 选中状态指示器 -->
              <div
                v-if="selectedResource?.id === resource.id"
                class="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
              >
                <Check class="w-4 h-4 text-primary-foreground" />
              </div>

              <!-- 悬停时的选择提示 -->
              <div
                v-if="selectedResource?.id !== resource.id"
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center"
              >
                <span class="text-white text-sm font-medium">点击选择</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <DialogFooter>
        <Button variant="outline" @click="close" class="px-4">取消</Button>
        <Button @click="confirm" :disabled="!selectedResource" class="px-4">
          <Check class="w-4 h-4 mr-2" />
          确认选择
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Search, Image, Check, Loader2, Mountain, User, Package } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { mediaApi, type MediaScenario, type MediaCharacter, type MediaItem } from '@/services/mediaApi';

interface Props {
  visible: boolean;
  title?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'select', resource: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const loading = ref(false);
const searchQuery = ref('');
const selectedCategory = ref<string>('');
const selectedResource = ref<any>(null);
const resources = ref<any[]>([]);

// 分类配置
const categories = [
  { key: 'scenarios', name: '背景', icon: Mountain },
  { key: 'characters', name: '人物', icon: User },
  { key: 'items', name: '物品', icon: Package }
];

// 计算属性：控制对话框显示
const isOpen = computed({
  get: () => props.visible,
  set: (value) => {
    if (!value) {
      emit('close');
    }
  }
});

// 方法
const close = () => {
  emit('close');
};

const search = async () => {
  await loadResources();
};

const selectCategory = (category: string) => {
  selectedCategory.value = category;
  loadResources();
};

const selectResource = (resource: any) => {
  selectedResource.value = resource;
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-muted"><Image class="w-8 h-8 text-muted-foreground" /></div>';
  }
};

const getCategoryName = (type: string) => {
  const category = categories.find(cat => cat.key === type);
  return category ? category.name : '未分类';
};

const confirm = () => {
  if (selectedResource.value) {
    // 转换为统一的资源格式
    const resource = {
      id: selectedResource.value.id,
      name: selectedResource.value.name,
      url: selectedResource.value.image_path,
      type: selectedResource.value.type,
      category: getCategoryName(selectedResource.value.type)
    };
    emit('select', resource);
    close();
  }
};

const loadResources = async () => {
  loading.value = true;
  try {
    // 构建搜索参数
    const params: any = {
      limit: 50,
      offset: 0
    };

    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    let allResources: any[] = [];

    // 根据选中的分类加载对应类型的资源
    if (!selectedCategory.value) {
      // 加载所有类型的资源
      const [scenariosRes, charactersRes, itemsRes] = await Promise.all([
        mediaApi.getScenarios(params),
        mediaApi.getCharacters(params),
        mediaApi.getItems(params)
      ]);

      allResources = [
        ...scenariosRes.data.map((item: MediaScenario) => ({
          ...item,
          type: 'scenarios'
        })),
        ...charactersRes.data.map((item: MediaCharacter) => ({
          ...item,
          type: 'characters'
        })),
        ...itemsRes.data.map((item: MediaItem) => ({
          ...item,
          type: 'items'
        }))
      ];
    } else {
      // 加载指定类型的资源
      let response;
      if (selectedCategory.value === 'scenarios') {
        response = await mediaApi.getScenarios(params);
        allResources = response.data.map((item: MediaScenario) => ({
          ...item,
          type: 'scenarios'
        }));
      } else if (selectedCategory.value === 'characters') {
        response = await mediaApi.getCharacters(params);
        allResources = response.data.map((item: MediaCharacter) => ({
          ...item,
          type: 'characters'
        }));
      } else if (selectedCategory.value === 'items') {
        response = await mediaApi.getItems(params);
        allResources = response.data.map((item: MediaItem) => ({
          ...item,
          type: 'items'
        }));
      }
    }

    // 过滤出有图片的资源
    resources.value = allResources.filter(resource => resource.image_path);

  } catch (error) {
    console.error('加载资源失败:', error);
  } finally {
    loading.value = false;
  }
};

// 监听visible变化，当打开时加载资源
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    loadResources();
  }
});

// 生命周期
onMounted(() => {
  if (props.visible) {
    loadResources();
  }
});
</script>
