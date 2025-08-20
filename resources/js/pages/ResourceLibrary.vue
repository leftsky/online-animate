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
                       <!-- 模型文件状态指示器 -->
                       <span v-if="hasModelFile(character as MediaCharacter)" class="inline-flex items-center gap-1 text-xs text-green-600">
                         <div class="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                         模型
                       </span>
                     </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <!-- 模型文件上传按钮 -->
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="h-6 w-6 p-0" 
                      @click.stop="handleModelUploadClick(character as MediaCharacter)"
                      :title="getModelFileStatus(character as MediaCharacter)"
                    >
                      <Package class="w-3 h-3" :class="hasModelFile(character as MediaCharacter) ? 'text-green-600' : 'text-muted-foreground'" />
                    </Button>
                    
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
          <div class="flex-1 bg-card border border-border rounded-lg overflow-hidden relative">
            <!-- Three.js Canvas -->
            <canvas 
              ref="threeCanvas" 
              class="w-full h-full" 
              :class="{ 'opacity-0': !currentModelUrl }"
            ></canvas>
            
            <!-- 覆盖层 -->
            <div 
              v-if="!currentModelUrl || isLoadingModel" 
              class="absolute inset-0 flex items-center justify-center text-muted-foreground bg-card"
            >
              <!-- 加载中状态 -->
              <div v-if="isLoadingModel" class="text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center animate-spin">
                  <Package class="w-8 h-8" />
                </div>
                <h3 class="text-lg font-medium mb-2">加载模型中...</h3>
                <p class="text-sm">请稍候</p>
              </div>
              
              <!-- 默认状态 -->
              <div v-else class="text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Package class="w-8 h-8" />
                </div>
                <h3 class="text-lg font-medium mb-2">Three.js 画布</h3>
                <p class="text-sm">选择左侧有模型的人物查看3D模型</p>
              </div>
            </div>
            
            <!-- 模型信息显示 -->
            <div 
              v-if="currentModelUrl && selectedCharacter && !isLoadingModel" 
              class="absolute top-4 left-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-3 text-sm"
            >
              <h4 class="font-medium text-foreground">{{ selectedCharacter.name }}</h4>
              <p class="text-muted-foreground text-xs mt-1">3D模型预览</p>
            </div>
            
            <!-- 模型控制面板 -->
            <div 
              v-if="currentModelUrl && selectedCharacter && !isLoadingModel && showControlPanel" 
              class="absolute bottom-4 right-4 z-10 max-w-sm max-h-96"
            >
              <ModelControlPanel
                ref="controlPanelRef"
                :model-name="selectedCharacter.name"
                :model="currentModel"
                :available-animations="availableAnimations"
                @close="showControlPanel = false"
                @animation-play="handleAnimationPlay"
                @animation-pause="handleAnimationPause"
                @animation-stop="handleAnimationStop"
                @model-update="handleModelUpdate"
              />
            </div>
            
            <!-- 控制面板切换按钮 -->
            <div 
              v-if="currentModelUrl && selectedCharacter && !isLoadingModel && !showControlPanel" 
              class="absolute bottom-4 right-4"
            >
              <Button 
                @click="showControlPanel = true"
                variant="outline"
                size="sm"
                class="bg-background/80 backdrop-blur-sm"
              >
                <Settings class="w-4 h-4 mr-2" />
                模型控制
              </Button>
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


      
      <!-- 隐藏的模型文件输入 -->
      <input 
        ref="modelFileInput" 
        type="file" 
        accept=".glb,.gltf,.fbx,.obj,.dae,.3ds,.blend" 
        class="hidden" 
        @change="handleModelFileUpload" 
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, markRaw, toRaw } from 'vue';
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
  Upload,
  Settings
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
import ModelControlPanel from '@/components/ModelControlPanel.vue';

import { mediaApi, uploadApi } from '@/utils/api';
import { type MediaScenario, type MediaCharacter, type MediaItem } from '@/services/mediaApi';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

// Toast
const { toast } = useToast();

// 响应式数据
const activeTab = ref('characters');
const searchQuery = ref('');
const selectedStatus = ref('');
const selectedGender = ref('');
const selectedItemType = ref('');
const showAddDialog = ref(false);
const showGenderDropdown = ref(false);
const showBatchUploadDialog = ref(false);
const selectedCharacter = ref<MediaCharacter | null>(null);
const loading = ref(false);
const hasMore = ref(true);
const modelFileInput = ref<HTMLInputElement>();
const isUploadingModel = ref(false);
const currentUploadingCharacter = ref<MediaCharacter | null>(null);
const currentModelUrl = ref<string | null>(null);
const isLoadingModel = ref(false);
const threeCanvas = ref<HTMLCanvasElement>();
const threeScene = ref<THREE.Scene | null>(null);
const threeRenderer = ref<THREE.WebGLRenderer | null>(null);
const threeCamera = ref<THREE.PerspectiveCamera | null>(null);
const threeControls = ref<OrbitControls | null>(null);
const currentModel = ref<THREE.Group | null>(null);

// 模型控制面板相关状态
const showControlPanel = ref(false);
const controlPanelRef = ref<InstanceType<typeof ModelControlPanel> | null>(null);
const availableAnimations = ref<Array<{ name: string; duration: number; clip?: any }>>([]);
const animationMixer = ref<THREE.AnimationMixer | null>(null);
const currentAnimationAction = ref<THREE.AnimationAction | null>(null);

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

// 检查人物是否有模型文件
const hasModelFile = (character: MediaCharacter): boolean => {
  if (!character.additional_resources) return false;
  try {
    const resourcesData = Array.isArray(character.additional_resources)
      ? character.additional_resources[0]
      : character.additional_resources;
    
    if (typeof resourcesData === 'string') {
      const parsed = JSON.parse(resourcesData);
      return !!parsed.modelFile;
    } else if (typeof resourcesData === 'object' && resourcesData !== null) {
      // modelFile现在是一个简单的URL字符串
      const modelFile = (resourcesData as any).modelFile;
      return typeof modelFile === 'string' && modelFile.trim().length > 0;
    }
  } catch {
    return false;
  }
  return false;
};

// 获取模型文件状态文本
const getModelFileStatus = (character: MediaCharacter): string => {
  return hasModelFile(character) ? '已上传模型文件' : '上传模型文件';
};

// 初始化Three.js场景
const initThreeJS = () => {
  if (!threeCanvas.value) return;
  
  const canvas = threeCanvas.value;
  const rect = canvas.getBoundingClientRect();
  
  // 创建场景
  threeScene.value = markRaw(new THREE.Scene());
  threeScene.value.background = new THREE.Color(0xf5f5f5);
  
  // 创建相机
  threeCamera.value = markRaw(new THREE.PerspectiveCamera(
    75,
    rect.width / rect.height,
    0.1,
    1000
  ));
  threeCamera.value.position.set(0, 1, 3);
  
  // 创建渲染器
  threeRenderer.value = markRaw(new THREE.WebGLRenderer({ 
    canvas: canvas,
    antialias: true,
    alpha: true
  }));
  threeRenderer.value.setSize(rect.width, rect.height);
  threeRenderer.value.setPixelRatio(window.devicePixelRatio);
  threeRenderer.value.shadowMap.enabled = true;
  threeRenderer.value.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // 创建控制器
  threeControls.value = markRaw(new OrbitControls(threeCamera.value, canvas));
  threeControls.value.enableDamping = true;
  threeControls.value.dampingFactor = 0.05;
  threeControls.value.target.set(0, 1, 0);
  
  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  threeScene.value.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  threeScene.value.add(directionalLight);
  
  // 添加地面
  const groundGeometry = new THREE.PlaneGeometry(10, 10);
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  threeScene.value.add(ground);
  
  // 开始渲染循环
  originalAnimate();
};

// 动画循环
const animate = () => {
  if (!threeRenderer.value || !threeScene.value || !threeCamera.value) return;
  
  requestAnimationFrame(animate);
  
  if (threeControls.value) {
    toRaw(threeControls.value).update();
  }
  
  toRaw(threeRenderer.value).render(toRaw(threeScene.value), toRaw(threeCamera.value));
};

// 处理窗口大小变化
const handleResize = () => {
  if (!threeCanvas.value || !threeCamera.value || !threeRenderer.value) return;
  
  const rect = threeCanvas.value.getBoundingClientRect();
  const camera = toRaw(threeCamera.value);
  const renderer = toRaw(threeRenderer.value);
  
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
};

// 加载人物模型
const loadCharacterModel = async (character: MediaCharacter) => {
  if (!character.additional_resources || !threeScene.value) return;
  
  try {
      const resourcesData = Array.isArray(character.additional_resources)
        ? character.additional_resources[0]
        : character.additional_resources;
      
      let modelFileUrl: string | null = null;
      if (typeof resourcesData === 'string') {
        const parsed = JSON.parse(resourcesData);
        // 处理简单URL字符串格式
        modelFileUrl = typeof parsed.modelFile === 'string' ? parsed.modelFile : parsed.modelFile?.url;
      } else if (typeof resourcesData === 'object' && resourcesData !== null) {
        // modelFile现在可能是简单的URL字符串或对象
        const modelFile = (resourcesData as any).modelFile;
        modelFileUrl = typeof modelFile === 'string' ? modelFile : modelFile?.url;
      }
    
    if (modelFileUrl && typeof modelFileUrl === 'string' && modelFileUrl.trim().length > 0) {
      isLoadingModel.value = true;
      currentModelUrl.value = modelFileUrl;
      
      // 移除之前的模型
      if (currentModel.value) {
        threeScene.value.remove(toRaw(currentModel.value));
        currentModel.value = null;
      }
      
      // 加载新模型
      const loader = new GLTFLoader();
      
      try {
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            modelFileUrl,
            resolve,
            undefined,
            reject
          );
        });
        
        const model = gltf.scene;
        
        // 设置模型属性
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // 计算模型边界框并居中
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // 将模型移动到原点，但保持在地面上
        model.position.sub(center);
        // 确保模型底部在地面上（Y=0）
        model.position.y = size.y / 2;
        
        // 缩放模型以适应视图
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.setScalar(scale);
        
        // 重新调整Y位置以确保缩放后仍在地面上
        model.position.y = (size.y * scale) / 2;
        
        // 添加到场景
        threeScene.value.add(model);
        currentModel.value = markRaw(model);
        
        // 解析动画
        parseModelAnimations(gltf);
        
        // 显示控制面板
        showControlPanel.value = true;
        
        console.log('模型加载成功:', modelFileUrl);
      } catch (loadError) {
        console.error('模型加载失败:', loadError);
        toast.error('模型加载失败');
      }
    }
  } catch (error) {
    console.error('解析模型文件失败:', error);
  } finally {
    isLoadingModel.value = false;
  }
};

// 清空模型显示
const clearModelDisplay = () => {
  currentModelUrl.value = null;
  isLoadingModel.value = false;
  
  // 移除当前模型
  if (currentModel.value && threeScene.value) {
    threeScene.value.remove(toRaw(currentModel.value));
    currentModel.value = null;
  }
  
  // 清理动画相关状态
  if (animationMixer.value) {
    animationMixer.value = null;
  }
  if (currentAnimationAction.value) {
    currentAnimationAction.value = null;
  }
  availableAnimations.value = [];
  showControlPanel.value = false;
  
  console.log('清空模型显示');
};

// 处理模型文件上传点击
const handleModelUploadClick = (character: MediaCharacter) => {
  currentUploadingCharacter.value = character;
  modelFileInput.value?.click();
};

// 处理模型文件上传
const handleModelFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  const character = currentUploadingCharacter.value;

  if (!file || !character) return;

  // 验证文件类型
  const allowedTypes = ['.glb', '.gltf', '.fbx', '.obj', '.dae', '.3ds', '.blend'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    toast.error('请选择支持的模型文件格式');
    return;
  }

  // 验证文件大小 (最大100MB)
  if (file.size > 100 * 1024 * 1024) {
    toast.error('文件大小不能超过100MB');
    return;
  }

  isUploadingModel.value = true;

  try {
    // 使用项目现有的上传API
    const uploadResult = await uploadApi.uploadFile(file, { 
      type: 'model',
      folder: 'models'
    });

    if (uploadResult.success && uploadResult.data?.url) {
      // 解析现有的additional_resources
      let currentResources = {};
      if (character.additional_resources) {
        try {
          const resourcesData = Array.isArray(character.additional_resources)
            ? character.additional_resources[0]
            : character.additional_resources;
          if (typeof resourcesData === 'string') {
            currentResources = JSON.parse(resourcesData);
          }
        } catch {
          currentResources = {};
        }
      }

      // 更新additional_resources字段 - 只保存URL字符串
      const updatedResources = {
        ...currentResources,
        modelFile: uploadResult.data.url
      };

      // 使用项目现有的人物更新API
      const updateResult = await mediaApi.updateCharacter(character.id, {
        additional_resources: updatedResources
      });

      if (updateResult.success) {
        // 更新本地数据
        const index = resources.value.findIndex(r => r.id === character.id);
        if (index !== -1) {
          const updatedCharacter = {
            ...character,
            additional_resources: updatedResources
          };
          resources.value[index] = updatedCharacter;
        }

        // 显示成功消息
        toast.success('模型文件上传成功');
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
    isUploadingModel.value = false;
    currentUploadingCharacter.value = null;
    // 清空文件输入
    if (target) {
      target.value = '';
    }
  }
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
    
    // 如果人物有模型文件，加载并显示模型
    if (hasModelFile(resource as MediaCharacter)) {
      loadCharacterModel(resource as MediaCharacter);
    } else {
      // 清空模型显示
      clearModelDisplay();
    }
    // 可以在这里添加Three.js画布更新逻辑
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
onMounted(async () => {
  loadResources();
  
  // 等待DOM更新后初始化Three.js
  await nextTick();
  if (threeCanvas.value) {
    initThreeJS();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
  }
});

// 组件卸载时清理资源
const cleanup = () => {
  window.removeEventListener('resize', handleResize);
  
  if (threeRenderer.value) {
    toRaw(threeRenderer.value).dispose();
  }
  
  if (threeControls.value) {
    toRaw(threeControls.value).dispose();
  }
};

// 在组件卸载时清理
watch(() => false, cleanup);

// 模型控制面板事件处理方法
const handleAnimationPlay = (animationIndex: number) => {
  if (!currentModel.value || !availableAnimations.value[animationIndex]) return;
  
  try {
    const animation = availableAnimations.value[animationIndex];
    
    // 停止当前动画
    if (currentAnimationAction.value) {
      currentAnimationAction.value.stop();
    }
    
    // 播放新动画
    if (animation.clip && animationMixer.value) {
      currentAnimationAction.value = animationMixer.value.clipAction(animation.clip);
      currentAnimationAction.value.reset();
      currentAnimationAction.value.play();
      
      // 更新控制面板状态
      controlPanelRef.value?.setAnimationState(true);
      
      console.log('播放动画:', animation.name);
    }
  } catch (error) {
    console.error('播放动画失败:', error);
    toast.error('播放动画失败');
  }
};

const handleAnimationPause = () => {
  if (currentAnimationAction.value) {
    currentAnimationAction.value.paused = true;
    controlPanelRef.value?.setAnimationState(false);
    console.log('暂停动画');
  }
};

const handleAnimationStop = () => {
  if (currentAnimationAction.value) {
    currentAnimationAction.value.stop();
    currentAnimationAction.value = null;
    controlPanelRef.value?.setAnimationState(false);
    console.log('停止动画');
  }
};

const handleModelUpdate = (updateData: { type: string; value: any }) => {
  if (!currentModel.value) return;
  
  try {
    const model = toRaw(currentModel.value);
    
    switch (updateData.type) {
      case 'position':
        model.position.set(updateData.value.x, updateData.value.y, updateData.value.z);
        break;
      case 'rotation':
        model.rotation.set(updateData.value.x, updateData.value.y, updateData.value.z);
        break;
      case 'scale':
        model.scale.setScalar(updateData.value);
        break;
    }
    
    console.log('更新模型参数:', updateData.type, updateData.value);
  } catch (error) {
    console.error('更新模型参数失败:', error);
    toast.error('更新模型参数失败');
  }
};

// 解析模型动画
const parseModelAnimations = (gltf: any) => {
  const animations: Array<{ name: string; duration: number; clip: any }> = [];
  
  if (gltf.animations && gltf.animations.length > 0) {
    // 创建动画混合器
    if (currentModel.value) {
      animationMixer.value = markRaw(new THREE.AnimationMixer(toRaw(currentModel.value)));
    }
    
    // 解析所有动画
    gltf.animations.forEach((clip: any, index: number) => {
      animations.push({
        name: clip.name || `动画 ${index + 1}`,
        duration: Math.round(clip.duration * 1000), // 转换为毫秒
        clip: markRaw(clip)
      });
    });
  }
  
  availableAnimations.value = animations;
  console.log('解析到动画:', animations.length, '个');
};

// 动画循环更新
const updateAnimations = () => {
  if (animationMixer.value) {
    animationMixer.value.update(0.016); // 假设60fps
  }
};

// 修改animate函数以包含动画更新
const originalAnimate = () => {
  if (!threeRenderer.value || !threeScene.value || !threeCamera.value) return;
  
  requestAnimationFrame(originalAnimate);
  
  // 更新动画
  updateAnimations();
  
  // 更新控制器
  if (threeControls.value) {
    toRaw(threeControls.value).update();
  }
  
  // 渲染场景
  toRaw(threeRenderer.value).render(toRaw(threeScene.value), toRaw(threeCamera.value));
};


</script>
