<template>
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
        <p>请从左侧选择小说查看章节</p>
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
                {{ chapter.content_preview || chapter.content }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="selectedNovel && totalChapters > 0" class="mt-6">
        <Pagination
          :total="totalChapters"
          :limit="pageSize"
          :offset="(currentPage - 1) * pageSize"
          @update:offset="handleOffsetChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Pagination from '@/components/ui/pagination/Pagination.vue'

// 定义props
const props = defineProps({
  selectedNovel: {
    type: Object,
    default: null
  },
  chapters: {
    type: Array,
    default: () => []
  },
  totalChapters: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 5
  }
})

// 定义事件
const emit = defineEmits(['changePage'])

// 分页计算
const paginatedChapters = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize
  const end = start + props.pageSize
  return props.chapters.slice(start, end)
})

// 处理分页偏移量变化
const handleOffsetChange = (newOffset) => {
  const newPage = Math.floor(newOffset / props.pageSize) + 1
  emit('changePage', newPage)
}
</script>
