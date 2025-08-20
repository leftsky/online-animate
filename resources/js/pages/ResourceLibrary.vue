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
        <div v-if="activeTab === 'characters'" class="h-[calc(100vh-200px)] flex gap-6">
          <!-- 左侧人物列表 -->
          <div class="w-80 flex flex-col">
            <!-- 搜索和操作 -->
            <div class="mb-4 space-y-3">
              <Input
                v-model="searchQuery"
                placeholder="搜索人物..."
              >
                <template #prefix>
                  <Search class="w-4 h-4 text-muted-foreground" />
                </template>
              </Input>
              <div class="flex gap-2">
                <Button @click="showAddDialog = true" class="flex-1">
                  <Plus class="w-4 h-4 mr-2" />
                  添加人物
                </Button>
                <Button @click="showBatchUploadDialog = true" variant="outline" class="flex-1">
                  <Upload class="w-4 h-4 mr-2" />
                  批量上传
                </Button>
              </div>
            </div>

            <!-- 无限滚动人物列表 -->
            <div class="flex-1 overflow-y-auto space-y-2 pr-2" @scroll="handleScroll">
              <div
                v-for="character in filteredResources"
                :key="character.id"
                class="group relative bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-all cursor-pointer"
                :class="{ 'border-primary bg-primary/5': selectedCharacter?.id === character.id }"
                @click="selectResource(character)"
              >
                <div class="flex items-center gap-3">
                  <!-- 人物头像 -->
                  <div class="w-12 h-12 bg-muted rounded-full overflow-hidden flex-shrink-0">
                    <img
                      v-if="character.image_path"
                      :src="character.image_path"
                      :alt="character.name"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Users class="w-6 h-6" />
                    </div>
                  </div>

                  <!-- 人物信息 -->
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-sm text-foreground truncate">{{ character.name }}</h3>
                    <p v-if="character.description" class="text-xs text-muted-foreground truncate mt-0.5">{{ character.description }}</p>
                    <div class="flex items-center gap-2 mt-1">
                       <span class="text-xs text-muted-foreground">{{ getGenderText((character as MediaCharacter).gender) }}</span>
                       <span v-if="(character as MediaCharacter).age" class="text-xs text-muted-foreground">{{ (character as MediaCharacter).age }}岁</span>
                     </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
                          <MoreVertical class="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="deleteResource(character)">
                          <Trash2 class="w-4 h-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              <!-- 加载更多指示器 -->
              <div v-if="loading" class="text-center py-4">
                <div class="text-sm text-muted-foreground">加载中...</div>
              </div>

              <!-- 空状态 -->
              <div v-if="filteredResources.length === 0 && !loading" class="text-center py-8">
                <div class="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                  <Users class="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 class="text-sm font-medium text-foreground mb-1">暂无人物</h3>
                <p class="text-xs text-muted-foreground">点击上方按钮添加人物</p>
              </div>
            </div>
          </div>

          <!-- 中间Three.js画布 -->
          <div class="flex-1 bg-card border border-border rounded-lg overflow-hidden">
            <div class="w-full h-full flex items-center justify-center text-muted-foreground">
              <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Package class="w-8 h-8" />
                </div>
                <h3 class="text-lg font-medium mb-2">Three.js 画布</h3>
                <p class="text-sm">选择左侧人物查看3D模型</p>
              </div>
            </div>
          </div>

          <!-- 右侧对话框 -->
          <div class="w-80 bg-card border border-border rounded-lg p-4">
            <div class="h-full flex flex-col">
              <div class="mb-4">
                <h3 class="text-lg font-medium text-foreground">对话框</h3>
                <p class="text-sm text-muted-foreground">与人物进行对话交互</p>
              </div>
              
              <!-- 对话内容区域 -->
              <div class="flex-1 bg-muted/30 rounded-lg p-3 mb-4 overflow-y-auto">
                <div class="text-center text-muted-foreground text-sm">
                  选择人物开始对话
                </div>
              </div>
              
              <!-- 输入框 -->
              <div class="flex gap-2">
                <Input placeholder="输入消息..." class="flex-1" />
                <Button size="sm">
                  发送
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 其他标签页保持原有布局 -->
        <div v-else class="space-y-6">
          <!-- 资源列表 -->
          <div>
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
                <Button @click="showAddDialog = true" class="whitespace-nowrap">
                  <Plus class="w-4 h-4 mr-2" />
                  添加{{ getCurrentTabTitle() }}
                </Button>
                <Button @click="showBatchUploadDialog = true" variant="outline" class="whitespace-nowrap">
                  <Upload class="w-4 h-4 mr-2" />
                  批量上传
                </Button>
              </div>
            </div>

            <!-- 资源网格 -->
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              <div
                v-for="resource in filteredResources"
                :key="resource.id"
                class="group relative bg-card border border-border rounded-lg p-2 hover:border-primary/50 transition-all cursor-pointer"
                @click="selectResource(resource)"
              >
                <!-- 资源图片 -->
                <div class="aspect-square bg-muted rounded-md mb-2 overflow-hidden">
                  <img
                    v-if="resource.image_path"
                    :src="resource.image_path"
                    :alt="resource.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Image class="w-6 h-6" />
                  </div>
                </div>

                <!-- 资源信息 -->
                <div class="space-y-0.5">
                  <h3 class="font-medium text-xs text-foreground truncate">{{ resource.name }}</h3>
                  <p v-if="resource.description" class="text-xs text-muted-foreground truncate">{{ resource.description }}</p>
                </div>

                <!-- 操作按钮 -->
                <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
                        <MoreVertical class="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="deleteResource(resource)">
                        <Trash2 class="w-4 h-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

            <!-- 分页组件 - 只在非人物库标签页显示 -->
            <div v-if="pagination.total > 0 && activeTab !== 'characters'" class="mt-6">
              <Pagination
                :total="Number(pagination.total)"
                :limit="Number(pagination.limit)"
                :offset="Number(pagination.offset)"
                @update:offset="handleOffsetChange"
                @update:limit="handleLimitChange"
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

      <!-- 批量上传弹窗 -->
      <BatchUploadDialog
        v-model:open="showBatchUploadDialog"
        :resource-type="activeTab === 'scenarios' ? 'scenario' : activeTab === 'characters' ? 'character' : 'item'"
        @upload-complete="handleBatchUploadComplete"
      />

      <!-- 人物详情弹窗 -->
      <CharacterDetailModal
        v-model:open="showCharacterDetail"
        :character="selectedCharacter"
        @character-updated="handleCharacterUpdated"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Library, 
  Image, 
  Users, 
  Package, 
  Search, 
  Plus, 
  MoreVertical, 
  ChevronDown,
  Trash2,
  Upload
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/composables/useToast';
import AppLayout from '@/layouts/AppLayout.vue';
import Pagination from '@/components/ui/pagination/Pagination.vue';
import BatchUploadDialog from '@/components/BatchUploadDialog.vue';
import CharacterDetailModal from './components/CharacterDetailModal.vue';
import { mediaApi } from '@/utils/api';
import { type MediaScenario, type MediaCharacter, type MediaItem } from '@/services/mediaApi';

// 面包屑导航
const breadcrumbs = [
  { title: '工作台', href: '/dashboard' },
  { title: '资源库', href: '/resource-library' }
];

// 标签页配置
const tabs = [
  { key: 'characters', title: '人物库', icon: Users },
  { key: 'scenarios', title: '场景库', icon: Image },
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
const activeTab = ref('characters');
const searchQuery = ref('');
const selectedStatus = ref('');
const selectedGender = ref('');
const selectedItemType = ref('');
const showAddDialog = ref(false);
const showGenderDropdown = ref(false);
const showBatchUploadDialog = ref(false);
const showCharacterDetail = ref(false);
const selectedCharacter = ref<MediaCharacter | null>(null);
const loading = ref(false);
const hasMore = ref(true);

// 新资源数据
const newResource = ref({
  name: '',
  description: '',
  gender: 0,
  age: '' as string
});

// 真实数据
const resources = ref<(MediaScenario | MediaCharacter | MediaItem)[]>([]);
const pagination = ref({
  total: 0,
  limit: 20,
  offset: 0,
  has_more: false
});

// 计算属性
const filteredResources = computed(() => {
  // 确保resources.value是数组
  if (!Array.isArray(resources.value)) {
    return [];
  }
  
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
  
  // 如果是人物类型，设置选中的人物
  if (activeTab.value === 'characters' && 'gender' in resource) {
    selectedCharacter.value = resource as MediaCharacter;
    // 可以在这里添加Three.js画布更新逻辑
  } else {
    // 其他类型资源打开详情弹窗
    if (activeTab.value === 'characters') {
      showCharacterDetail.value = true;
    }
  }
};

// 处理无限滚动
const handleScroll = async (event: Event) => {
  const target = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;
  
  // 当滚动到底部附近时加载更多
  if (scrollHeight - scrollTop <= clientHeight + 100 && !loading.value && hasMore.value) {
    await loadMoreCharacters();
  }
};

// 加载更多人物
const loadMoreCharacters = async () => {
  if (activeTab.value !== 'characters' || loading.value || !hasMore.value) {
    return;
  }
  
  loading.value = true;
  try {
    const params = {
      limit: pagination.value.limit,
      offset: resources.value.length, // 使用当前数据长度作为偏移
      search: searchQuery.value,
      gender: selectedGender.value ? Number(selectedGender.value) : undefined
    };
    
    const response = await mediaApi.getCharacters(params);
    
    if (response.data && Array.isArray(response.data)) {
      const newCharacters = response.data;
      if (newCharacters.length > 0) {
        resources.value = [...resources.value, ...newCharacters];
      }
      
      // 检查是否还有更多数据
      hasMore.value = newCharacters.length === pagination.value.limit;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error('加载更多人物失败:', error);
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
};

// 处理人物信息更新
const handleCharacterUpdated = (updatedCharacter: MediaCharacter) => {
  // 更新选中的角色
  selectedCharacter.value = updatedCharacter;
  
  // 更新资源列表中的对应角色
  const index = resources.value.findIndex(r => r.id === updatedCharacter.id);
  if (index !== -1) {
    resources.value[index] = updatedCharacter;
  }
  
  // 显示成功消息
  const { toast } = useToast();
  toast.success('人物信息更新成功');
};

// 删除资源
const deleteResource = async (resource: any) => {
  const { toast } = useToast();
  
  if (!confirm(`确定要删除"${resource.name}"吗？此操作不可恢复。`)) {
    return;
  }

  try {
    let response;
    if (activeTab.value === 'scenarios') {
      response = await mediaApi.deleteScenario(resource.id);
    } else if (activeTab.value === 'characters') {
      response = await mediaApi.deleteCharacter(resource.id);
    } else if (activeTab.value === 'items') {
      response = await mediaApi.deleteItem(resource.id);
    }

    if (response?.success) {
      toast.success('删除成功');
      loadResources(); // 重新加载资源列表
    } else {
      toast.error(response?.message || '删除失败');
    }
  } catch (error) {
    console.error('删除资源失败:', error);
    toast.error('删除失败，请重试');
  }
};

// 分页处理
const handleOffsetChange = (newOffset: number) => {
  pagination.value.offset = newOffset;
  loadResources();
};

const handleLimitChange = (newLimit: number) => {
  pagination.value.limit = newLimit;
  pagination.value.offset = 0; // 重置到第一页
  loadResources();
};

// 批量上传完成处理
const handleBatchUploadComplete = (results: any[]) => {
  const { toast } = useToast();
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  if (successCount > 0) {
    toast.success(`成功上传 ${successCount} 个文件`);
    loadResources(); // 重新加载资源列表
  }
  
  if (failCount > 0) {
    toast.error(`${failCount} 个文件上传失败`);
  }
};



const selectGender = (gender: number) => {
  newResource.value.gender = gender;
  showGenderDropdown.value = false;
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
        description: newResource.value.description
      });
    } else if (activeTab.value === 'characters') {
      response = await mediaApi.createCharacter({
        name: newResource.value.name,
        description: newResource.value.description,
        gender: newResource.value.gender,
        age: newResource.value.age ? parseInt(newResource.value.age) : undefined
      });
    } else if (activeTab.value === 'items') {
      response = await mediaApi.createItem({
        name: newResource.value.name,
        description: newResource.value.description
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
    gender: 0,
    age: ''
  };
};

// 加载资源数据
const loadResources = async () => {
  loading.value = true;
  try {
    let response: any = null;
    
    if (activeTab.value === 'characters') {
      // 人物库使用无限滚动，初始加载第一页
      const characterParams = {
        limit: pagination.value.limit,
        offset: 0, // 总是从0开始
        search: searchQuery.value,
        gender: selectedGender.value ? Number(selectedGender.value) : undefined
      };
      
      response = await mediaApi.getCharacters(characterParams);
      
      // 确保resources.value是数组
      if (Array.isArray(response.data)) {
        resources.value = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        resources.value = response.data.data;
      } else {
        resources.value = [];
      }
      
      // 设置是否还有更多数据
      hasMore.value = resources.value.length === pagination.value.limit;
    } else {
      // 其他标签页使用传统分页
      const params = {
        limit: pagination.value.limit,
        offset: pagination.value.offset,
        search: searchQuery.value,
        status: selectedStatus.value ? Number(selectedStatus.value) : undefined
      };
      
      if (activeTab.value === 'scenarios') {
        response = await mediaApi.getScenarios(params);
      } else if (activeTab.value === 'items') {
        const itemParams = { ...params, type: selectedItemType.value };
        response = await mediaApi.getItems(itemParams);
      }
      
      // 只有在response存在时才处理数据
      if (response) {
        // 确保resources.value是数组
        if (Array.isArray(response.data)) {
          resources.value = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          resources.value = response.data.data;
        } else {
          resources.value = [];
        }
        
        // 处理分页信息
        if (response.data && response.data.pagination) {
          const paginationData = response.data.pagination;
          pagination.value = {
            total: Number(paginationData.total || 0),
            limit: Number(paginationData.limit || 20),
            offset: Number(paginationData.offset || 0),
            has_more: paginationData.has_more || false
          };
        }
      } else {
        resources.value = [];
      }
    }
  } catch (error) {
    console.error('加载资源失败:', error);
    const { toast } = useToast();
    toast.error('加载资源失败');
    // 确保在错误时也设置为空数组
    resources.value = [];
  } finally {
    loading.value = false;
  }
};

// 搜索处理
const handleSearch = () => {
  if (activeTab.value === 'characters') {
    // 人物库重置无限滚动状态
    hasMore.value = true;
  } else {
    // 其他标签页重置分页
    pagination.value.offset = 0;
  }
  loadResources();
};

// 监听搜索和标签页变化
watch([searchQuery, activeTab], () => {
  handleSearch();
});

// 监听筛选条件变化
watch([selectedGender, selectedStatus, selectedItemType], () => {
  handleSearch();
});

// 生命周期
onMounted(() => {
  loadResources();
});


</script>
