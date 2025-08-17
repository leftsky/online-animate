<template>
  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="min-h-screen bg-background">
      <div class="container mx-auto p-6">
        <!-- 页面标题 -->
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-foreground">资源库</h1>
          <p class="text-muted-foreground mt-2">管理您的场景、人物和物品资源</p>
        </div>

        <!-- 标签页 -->
        <div class="mb-6">
          <div class="border-b border-border">
            <nav class="-mb-px flex space-x-8">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                @click="activeTab = tab.key"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                ]"
              >
                <component :is="tab.icon" class="w-4 h-4 inline mr-2" />
                {{ tab.title }}
              </button>
            </nav>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- 左侧：资源列表 -->
          <div class="lg:col-span-3">
            <!-- 搜索和筛选 -->
            <div class="mb-4 flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <Input
                  v-model="searchQuery"
                  placeholder="搜索资源..."
                  class="max-w-md"
                >
                  <template #prefix>
                    <Search class="w-4 h-4 text-muted-foreground" />
                  </template>
                </Input>
              </div>
              <div class="flex gap-2">
                <div class="relative">
                  <Button
                    variant="outline"
                    @click="showCategoryDropdown = !showCategoryDropdown"
                    class="w-40 justify-between"
                  >
                    {{ selectedCategory || '全部分类' }}
                    <ChevronDown class="w-4 h-4" />
                  </Button>
                  <div
                    v-if="showCategoryDropdown"
                    class="absolute top-full left-0 z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg"
                  >
                    <div class="p-1">
                      <div
                        class="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded"
                        @click="selectCategory('')"
                      >
                        全部分类
                      </div>
                      <div
                        v-for="category in categories"
                        :key="category"
                        class="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded"
                        @click="selectCategory(category)"
                      >
                        {{ category }}
                      </div>
                    </div>
                  </div>
                </div>
                <Button @click="showAddDialog = true" class="whitespace-nowrap">
                  <Plus class="w-4 h-4 mr-2" />
                  添加{{ getCurrentTabTitle() }}
                </Button>
              </div>
            </div>

            <!-- 资源网格 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div
                v-for="resource in filteredResources"
                :key="resource.id"
                class="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer"
                @click="selectResource(resource)"
              >
                <!-- 资源图片 -->
                <div class="aspect-square bg-muted rounded-md mb-3 overflow-hidden">
                  <img
                    v-if="resource.image_path"
                    :src="resource.image_path"
                    :alt="resource.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Image class="w-8 h-8" />
                  </div>
                </div>

                <!-- 资源信息 -->
                <div class="space-y-1">
                  <h3 class="font-medium text-sm text-foreground truncate">{{ resource.name }}</h3>
                  <p v-if="resource.category" class="text-xs text-muted-foreground">{{ resource.category }}</p>
                  <p v-if="resource.description" class="text-xs text-muted-foreground truncate">{{ resource.description }}</p>
                </div>

                <!-- 操作按钮 -->
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                    <MoreVertical class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredResources.length === 0" class="text-center py-12">
              <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <component :is="getCurrentTabIcon()" class="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 class="text-lg font-medium text-foreground mb-2">暂无{{ getCurrentTabTitle() }}</h3>
              <p class="text-muted-foreground mb-4">点击上方按钮添加您的第一个{{ getCurrentTabTitle() }}</p>
            </div>
          </div>

          <!-- 右侧：操作面板（仅人物库显示） -->
          <div v-if="activeTab === 'characters'" class="lg:col-span-1">
            <div class="bg-card border border-border rounded-lg p-4">
              <h3 class="font-medium text-foreground mb-4">文件管理</h3>
              
              <!-- 文件上传组件 -->
              <MediaUploader 
                type="character"
                @upload-complete="handleUploadComplete"
              />
            </div>
          </div>

          <!-- 右侧：批量上传面板（场景和物品库显示） -->
          <div v-if="activeTab === 'scenarios' || activeTab === 'items'" class="lg:col-span-1">
            <div class="bg-card border border-border rounded-lg p-4">
              <h3 class="font-medium text-foreground mb-4">批量上传</h3>
              <p class="text-sm text-muted-foreground mb-4">拖拽图片文件到此处，将自动创建{{ getCurrentTabTitle() }}资源</p>
              
              <!-- 文件上传组件 -->
              <MediaUploader 
                :type="activeTab === 'scenarios' ? 'scenario' : 'item'"
                :auto-create-resource="true"
                :on-create-resource="handleAutoCreateResource"
                @upload-complete="handleUploadComplete"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 添加资源对话框 -->
      <Dialog v-model:open="showAddDialog">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>添加{{ getCurrentTabTitle() }}</DialogTitle>
            <DialogDescription>
              创建新的{{ getCurrentTabTitle() }}资源
            </DialogDescription>
          </DialogHeader>

          <form @submit.prevent="handleAddResource" class="space-y-4">
            <div class="space-y-2">
              <Label for="name">名称</Label>
              <Input id="name" v-model="newResource.name" placeholder="输入名称" required />
            </div>

            <div class="space-y-2">
              <Label for="description">描述</Label>
              <Textarea id="description" v-model="newResource.description" placeholder="输入描述" rows="3" />
            </div>

            <div class="space-y-2">
              <Label for="category">分类</Label>
              <Input id="category" v-model="newResource.category" placeholder="输入分类" />
            </div>

            <div v-if="activeTab === 'characters'" class="space-y-2">
              <Label for="gender">性别</Label>
              <div class="relative">
                <Button
                  variant="outline"
                  @click="showGenderDropdown = !showGenderDropdown"
                  class="w-full justify-between"
                >
                  {{ getGenderText(newResource.gender) }}
                  <ChevronDown class="w-4 h-4" />
                </Button>
                <div
                  v-if="showGenderDropdown"
                  class="absolute top-full left-0 z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg"
                >
                  <div class="p-1">
                    <div
                      v-for="gender in genderOptions"
                      :key="gender.value"
                      class="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded"
                      @click="selectGender(gender.value)"
                    >
                      {{ gender.label }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="activeTab === 'characters'" class="space-y-2">
              <Label for="age">年龄</Label>
              <Input id="age" v-model="newResource.age" type="number" placeholder="输入年龄" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" @click="showAddDialog = false">取消</Button>
              <Button type="submit" :disabled="loading">添加</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { 
  Library, 
  Image, 
  Users, 
  Package, 
  Search, 
  Plus, 
  MoreVertical, 
  ChevronDown
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/composables/useToast';
import AppLayout from '@/layouts/AppLayout.vue';
import MediaUploader from '@/components/MediaUploader.vue';
import { mediaApi, type MediaScenario, type MediaCharacter, type MediaItem, type SearchParams } from '@/services/mediaApi';

// 面包屑导航
const breadcrumbs = [
  { title: '工作台', href: '/dashboard' },
  { title: '资源库', href: '/resource-library' }
];

// 标签页配置
const tabs = [
  { key: 'scenarios', title: '场景库', icon: Image },
  { key: 'characters', title: '人物库', icon: Users },
  { key: 'items', title: '物品库', icon: Package }
];

// 性别选项
const genderOptions = [
  { value: 0, label: '未知' },
  { value: 1, label: '男性' },
  { value: 2, label: '女性' },
  { value: 3, label: '其他' }
];

// 响应式数据
const activeTab = ref('scenarios');
const searchQuery = ref('');
const selectedCategory = ref('');
const selectedStatus = ref('');
const selectedGender = ref('');
const selectedItemType = ref('');
const showAddDialog = ref(false);
const showCategoryDropdown = ref(false);
const showGenderDropdown = ref(false);
const uploadedFiles = ref<any[]>([]);
const loading = ref(false);

// 新资源数据
const newResource = ref({
  name: '',
  description: '',
  category: '',
  gender: 0,
  age: '' as string
});

// 真实数据
const resources = ref<(MediaScenario | MediaCharacter | MediaItem)[]>([]);
const categories = ref<string[]>([]);

// 计算属性
const filteredResources = computed(() => {
  let filtered = resources.value.filter(resource => {
    if (activeTab.value === 'scenarios') return 'generation_prompt' in resource;
    if (activeTab.value === 'characters') return 'gender' in resource;
    if (activeTab.value === 'items') return 'type' in resource;
    return false;
  });
  
  if (searchQuery.value) {
    filtered = filtered.filter(resource => 
      resource.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (selectedCategory.value) {
    filtered = filtered.filter(resource => resource.category === selectedCategory.value);
  }
  
  return filtered;
});

// 方法
const getCurrentTabTitle = () => {
  const tab = tabs.find(t => t.key === activeTab.value);
  return tab ? tab.title.replace('库', '') : '';
};

const getCurrentTabIcon = () => {
  const tab = tabs.find(t => t.key === activeTab.value);
  return tab ? tab.icon : Library;
};

const getGenderText = (gender: number) => {
  const option = genderOptions.find(g => g.value === gender);
  return option ? option.label : '未知';
};

const selectResource = (resource: any) => {
  console.log('选择资源:', resource);
  // TODO: 实现资源选择逻辑
};

const selectCategory = (category: string) => {
  selectedCategory.value = category;
  showCategoryDropdown.value = false;
  loadResources();
};

const selectGender = (gender: number) => {
  newResource.value.gender = gender;
  showGenderDropdown.value = false;
};

const handleUploadComplete = (files: any[]) => {
  uploadedFiles.value = files;
  console.log('文件上传完成:', files);
};

const handleAutoCreateResource = async (file: any): Promise<any> => {
  try {
    console.log('自动创建资源:', file);
    
    let response;
    const resourceData = {
      name: '未命名',
      image_path: file.url,
      description: '',
      category: '',
      status: 1
    };
    
    if (activeTab.value === 'scenarios') {
      response = await mediaApi.createScenario({
        ...resourceData,
        generation_prompt: '',
        tags: []
      });
    } else if (activeTab.value === 'items') {
      response = await mediaApi.createItem({
        ...resourceData,
        generation_prompt: '',
        type: '',
        properties: [],
        tags: []
      });
    }
    
    if (response?.success) {
      const { toast } = useToast();
      toast.success(`已自动创建${getCurrentTabTitle()}资源`);
      // 重新加载资源列表
      loadResources();
      return response.data;
    }
  } catch (error) {
    console.error('自动创建资源失败:', error);
    const { toast } = useToast();
    toast.error('自动创建资源失败');
  }
};

const handleAddResource = async () => {
  if (!newResource.value.name.trim()) {
    const { toast } = useToast();
    toast.error('请输入资源名称');
    return;
  }

  loading.value = true;
  try {
    let response;
    
    if (activeTab.value === 'scenarios') {
      response = await mediaApi.createScenario({
        name: newResource.value.name,
        description: newResource.value.description,
        category: newResource.value.category
      });
    } else if (activeTab.value === 'characters') {
      response = await mediaApi.createCharacter({
        name: newResource.value.name,
        description: newResource.value.description,
        category: newResource.value.category,
        gender: newResource.value.gender,
        age: newResource.value.age ? parseInt(newResource.value.age) : undefined
      });
    } else if (activeTab.value === 'items') {
      response = await mediaApi.createItem({
        name: newResource.value.name,
        description: newResource.value.description,
        category: newResource.value.category
      });
    }

    if (response?.success) {
      const { toast } = useToast();
      toast.success('资源添加成功');
      showAddDialog.value = false;
      resetForm();
      loadResources(); // 重新加载资源列表
    } else {
      const { toast } = useToast();
      toast.error(response?.message || '添加失败');
    }
  } catch (error) {
    console.error('添加资源失败:', error);
    const { toast } = useToast();
    toast.error('添加资源失败，请重试');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  newResource.value = {
    name: '',
    description: '',
    category: '',
    gender: 0,
    age: ''
  };
};

// 加载资源数据
const loadResources = async () => {
  loading.value = true;
  try {
    const params: SearchParams = {
      limit: 50,
      offset: 0,
      search: searchQuery.value,
      category: selectedCategory.value,
      status: selectedStatus.value
    };

    let response;
    if (activeTab.value === 'scenarios') {
      response = await mediaApi.getScenarios(params);
      resources.value = response; // 直接使用返回的数组
      // 提取分类
      const allCategories = response.map((r: MediaScenario) => r.category).filter((c): c is string => Boolean(c));
      categories.value = [...new Set(allCategories)];
    } else if (activeTab.value === 'characters') {
      // 人物需要额外的性别筛选
      const characterParams = { ...params, gender: selectedGender.value };
      response = await mediaApi.getCharacters(characterParams);
      resources.value = response; // 直接使用返回的数组
      // 提取分类
      const allCategories = response.map((r: MediaCharacter) => r.category).filter((c): c is string => Boolean(c));
      categories.value = [...new Set(allCategories)];
    } else if (activeTab.value === 'items') {
      // 物品需要额外的类型筛选
      const itemParams = { ...params, type: selectedItemType.value };
      response = await mediaApi.getItems(itemParams);
      resources.value = response; // 直接使用返回的数组
      // 提取分类
      const allCategories = response.map((r: MediaItem) => r.category).filter((c): c is string => Boolean(c));
      categories.value = [...new Set(allCategories)];
    }
  } catch (error) {
    console.error('加载资源失败:', error);
    const { toast } = useToast();
    toast.error('加载资源失败');
  } finally {
    loading.value = false;
  }
};

// 监听搜索和标签页变化
watch([searchQuery, activeTab], () => {
  loadResources();
});

// 生命周期
onMounted(() => {
  loadResources();
});

onUnmounted(() => {
  // 移除点击外部关闭分类下拉菜单的监听器
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (event: MouseEvent) => {
  const dropdown = document.querySelector('.absolute.top-full.left-0.z-50.w-full.mt-1.bg-popover.border.border-border.rounded-md.shadow-lg');
  if (dropdown && !dropdown.contains(event.target as Node)) {
    showCategoryDropdown.value = false;
  }
};

document.addEventListener('click', handleClickOutside);
</script>
