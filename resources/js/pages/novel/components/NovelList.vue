<template>
  <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">小说列表</h3>
        <button
          type="button"
          @click="$emit('import')"
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
          @click="$emit('select', novel)"
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
              章节数: {{ novel.chapters_count || 0 }} | 
              {{ formatDate(novel.created_at) }}
            </p>
          </div>
          <div class="flex items-center space-x-1 ml-2">
            <button
              @click.stop="$emit('delete', novel)"
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
</template>

<script setup>
// 定义props
defineProps({
  novels: {
    type: Array,
    default: () => []
  },
  selectedNovel: {
    type: Object,
    default: null
  },
  isImporting: {
    type: Boolean,
    default: false
  }
})

// 定义事件
defineEmits(['select', 'delete', 'import'])

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>
