<template>
  <div class="flex items-center justify-between px-2">
    <div class="flex-1 text-sm text-muted-foreground">
      显示第 {{ startItem }} - {{ endItem }} 项，共 {{ total }} 项
    </div>
    <div class="flex items-center space-x-6 lg:space-x-8">
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">每页显示</p>
        <Select v-model="currentLimit" @update:model-value="handleLimitChange">
          <SelectTrigger class="h-8 w-[70px]">
            <SelectContent>
              <SelectItem v-for="option in limitOptions" :key="option" :value="option">
                {{ option }}
              </SelectItem>
            </SelectContent>
          </SelectTrigger>
        </Select>
      </div>
      <div class="flex w-[100px] items-center justify-center text-sm font-medium">
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="currentPage === 1"
          @click="goToPage(1)"
        >
          <span class="sr-only">第一页</span>
          <ChevronsLeft class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <span class="sr-only">上一页</span>
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <span class="sr-only">下一页</span>
          <ChevronRight class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="currentPage === totalPages"
          @click="goToPage(totalPages)"
        >
          <span class="sr-only">最后一页</span>
          <ChevronsRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

interface Props {
  total: number;
  limit: number;
  offset: number;
  limitOptions?: number[];
}

interface Emits {
  (e: 'update:offset', offset: number): void;
  (e: 'update:limit', limit: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  limitOptions: () => [10, 20, 50, 100]
});

const emit = defineEmits<Emits>();

const currentLimit = ref(props.limit);

// 计算属性
const currentPage = computed(() => Math.floor(props.offset / props.limit) + 1);
const totalPages = computed(() => Math.ceil(props.total / props.limit));
const startItem = computed(() => props.offset + 1);
const endItem = computed(() => Math.min(props.offset + props.limit, props.total));

// 方法
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  const newOffset = (page - 1) * props.limit;
  emit('update:offset', newOffset);
};

const handleLimitChange = (newLimit: number) => {
  emit('update:limit', newLimit);
  // 重置到第一页
  emit('update:offset', 0);
};

// 监听limit变化
watch(() => props.limit, (newLimit) => {
  currentLimit.value = newLimit;
});
</script>
