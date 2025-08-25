<template>
  <AppLayout>
    <div class="container mx-auto py-6">
      <div class="space-y-6">
        <!-- 页面标题 -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">小说管理</h1>
            <p class="text-muted-foreground">
              管理已导入的小说，查看章节内容，支持文件导入和删除
            </p>
          </div>
        </div>

        <!-- 导入结果 -->
        <div v-if="importResult" class="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-4">导入结果</h3>
            <div v-if="importResult.success" class="space-y-3">
              <div class="flex items-center space-x-2 text-green-600">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="font-medium">{{ importResult.message }}</span>
              </div>
              <div v-if="importResult.data" class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-muted-foreground">小说ID:</span>
                  <span class="ml-2 font-mono">{{ importResult.data.novel_id }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">标题:</span>
                  <span class="ml-2">{{ importResult.data.title }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">章节数:</span>
                  <span class="ml-2">{{ importResult.data.chapter_count }}</span>
                </div>
              </div>
            </div>
            <div v-else class="flex items-center space-x-2 text-red-600">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span class="font-medium">{{ importResult.message }}</span>
            </div>
          </div>
        </div>

        <!-- 主要内容区域 - 左右分栏 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 左侧：小说列表 -->
          <div class="lg:col-span-1">
            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold">小说列表</h3>
                  <button
                    type="button"
                    @click="selectNovelFile"
                    :disabled="isImporting"
                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
                    title="导入新小说"
                  >
                    <span v-if="isImporting" class="mr-1">
                      <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    <svg v-else class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    {{ isImporting ? '导入中' : '导入' }}
                  </button>
                </div>
                
                <div v-if="novels.length === 0" class="text-center py-8 text-muted-foreground">
                  暂无小说数据
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="novel in novels"
                    :key="novel.id"
                    @click="selectNovel(novel)"
                    :class="[
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedNovel?.id === novel.id
                        ? 'border-primary bg-primary/5 hover:bg-primary/10'
                        : 'bg-background hover:bg-accent/50'
                    ]"
                  >
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium truncate">{{ novel.title }}</h4>
                      <p class="text-sm text-muted-foreground truncate">
                        章节数: {{ novel.chapters?.length || 0 }} | 
                        {{ formatDate(novel.created_at) }}
                      </p>
                    </div>
                    <div class="flex items-center space-x-1 ml-2">
                      <button
                        @click.stop="deleteNovel(novel)"
                        class="inline-flex items-center justify-center p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="删除小说"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：章节列表 -->
          <div class="lg:col-span-2">
            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold">
                    {{ selectedNovel ? `${selectedNovel.title} - 章节列表` : '请选择小说查看章节' }}
                  </h3>
                  <div v-if="selectedNovel" class="text-sm text-muted-foreground">
                    共 {{ totalChapters }} 章
                  </div>
                </div>

                <!-- 章节列表 -->
                <div v-if="!selectedNovel" class="text-center py-12 text-muted-foreground">
                  <svg class="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p>请从左侧选择小说查看章节内容</p>
                </div>

                <div v-else-if="paginatedChapters.length === 0" class="text-center py-8 text-muted-foreground">
                  暂无章节数据
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="chapter in paginatedChapters"
                    :key="chapter.id"
                    class="p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h4 class="font-medium mb-2">{{ chapter.title }}</h4>
                        <p class="text-sm text-muted-foreground mb-2">
                          第{{ chapter.chapter_number }}章 | 
                          字数: {{ chapter.word_count }}
                        </p>
                        <p class="text-sm text-muted-foreground line-clamp-3">
                          {{ chapter.content }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 分页控件 -->
                <div v-if="selectedNovel && totalChapters > 0" class="mt-6 flex items-center justify-between">
                  <div class="text-sm text-muted-foreground">
                    显示 {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalChapters) }} 条，共 {{ totalChapters }} 条
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      @click="changePage(currentPage - 1)"
                      :disabled="currentPage <= 1"
                      class="inline-flex items-center justify-center p-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                      </svg>
                    </button>
                    <span class="text-sm">
                      第 {{ currentPage }} 页，共 {{ totalPages }} 页
                    </span>
                    <button
                      @click="changePage(currentPage + 1)"
                      :disabled="currentPage >= totalPages"
                      class="inline-flex items-center justify-center p-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import AppLayout from '@/layouts/AppLayout.vue'
import { apiGet, apiPost, apiDelete, uploadApi } from '@/utils/api'

interface Chapter {
  id: number
  title: string
  content: string
  chapter_number: number
  word_count: number
}

interface Novel {
  id: number
  title: string
  description: string
  author: string
  cover_image: string | null
  source_file_url: string
  status: number
  created_at: string
  updated_at: string
  chapters?: Chapter[]
}

interface ImportResult {
  success: boolean
  message: string
  data?: {
    novel_id: number
    title: string
    chapter_count: number
    file_url: string
  }
}

const { toast } = useToast()

const isImporting = ref(false)
const importResult = ref<ImportResult | null>(null)
const novels = ref<Novel[]>([])
const selectedNovel = ref<Novel | null>(null)
const chapters = ref<Chapter[]>([])

// 分页相关
const pageSize = 10
const currentPage = ref(1)
const totalChapters = ref(0)

const totalPages = computed(() => {
  return Math.ceil(totalChapters.value / pageSize)
})

// 选择小说文件
const selectNovelFile = async () => {
  try {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.doc,.docx,.pdf'
    input.multiple = false
    
    input.onchange = async (e: Event) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        // 自动开始导入流程
        await autoImportNovel(files[0])
      }
    }
    
    input.click()
  } catch (error) {
    console.error('选择文件失败:', error)
    toast.error('选择文件失败')
  }
}

// 自动导入小说
const autoImportNovel = async (file: File) => {
  // 验证输入
  if (!file) {
    toast.error('请选择小说文件')
    return
  }

  isImporting.value = true
  importResult.value = null

  try {
    // 上传文件
    const uploadResult = await uploadApi.uploadFile(file, {
      folder: 'novels'
    })
    
    if (uploadResult.success) {
      // 文件上传成功后，调用导入API
      const result = await apiPost('/novels/import-url', { url: uploadResult.data.url })
      
      if (result.success) {
        importResult.value = {
          success: true,
          message: result.message,
          data: result.data
        }
        
        toast.success(result.message)
        // 重新加载小说列表
        loadNovels()
      } else {
        importResult.value = {
          success: false,
          message: result.message || '导入失败'
        }
        toast.error(result.message || '导入失败')
      }
    } else {
      importResult.value = {
        success: false,
        message: uploadResult.message || '文件上传失败'
      }
      toast.error(uploadResult.message || '文件上传失败')
    }
  } catch (error) {
    console.error('导入小说失败:', error)
    importResult.value = {
      success: false,
      message: '网络错误，请稍后重试'
    }
    toast.error('网络错误，请稍后重试')
  } finally {
    isImporting.value = false
  }
}

// 加载小说列表
const loadNovels = async () => {
  try {
    const result = await apiGet('/novels')
    
    if (result.success) {
      novels.value = result.data.novels || result.data || []
    }
  } catch (error) {
    console.error('加载小说列表失败:', error)
  }
}

// 选择小说
const selectNovel = async (novel: Novel) => {
  selectedNovel.value = novel
  currentPage.value = 1
  await loadChapters(novel.id)
}

// 加载章节列表
const loadChapters = async (novelId: number) => {
  try {
    const result = await apiGet(`/novels/${novelId}/chapters?limit=1000&offset=0`)
    
    if (result.success && result.data) {
      chapters.value = result.data
      totalChapters.value = result.data.length
    } else {
      chapters.value = []
      totalChapters.value = 0
    }
  } catch (error) {
    console.error('加载章节列表失败:', error)
    chapters.value = []
    totalChapters.value = 0
  }
}

// 删除小说
const deleteNovel = async (novel: Novel) => {
  if (!confirm(`确定要删除小说 "${novel.title}" 吗？此操作不可逆。`)) {
    return
  }

  try {
    const result = await apiDelete(`/novels/${novel.id}`)
    if (result.success) {
      toast.success('小说删除成功')
      novels.value = novels.value.filter(n => n.id !== novel.id)
      
      // 如果删除的是当前选中的小说，清空选择
      if (selectedNovel.value?.id === novel.id) {
        selectedNovel.value = null
        chapters.value = []
        totalChapters.value = 0
        currentPage.value = 1
      }
    } else {
      toast.error(result.message || '小说删除失败')
    }
  } catch (error) {
    console.error('删除小说失败:', error)
    toast.error('网络错误，请稍后重试')
  }
}

// 分页计算
const paginatedChapters = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return chapters.value.slice(start, end)
})

// 切换页面
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 组件挂载时加载小说列表
onMounted(() => {
  loadNovels()
})
</script>
