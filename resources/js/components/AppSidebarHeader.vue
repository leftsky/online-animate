<script setup lang="ts">
import type { BreadcrumbItemType } from '@/types';
import { Link } from '@inertiajs/vue3';
import { Menu } from 'lucide-vue-next';

defineProps<{
    breadcrumbs?: BreadcrumbItemType[];
}>();
</script>

<template>
    <header
        class="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/70 px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 md:px-4"
    >
        <div class="flex items-center gap-2">
            <!-- 移动端菜单按钮 -->
            <button class="-ml-1 rounded-lg p-2 hover:bg-accent">
                <Menu class="h-4 w-4" />
            </button>

            <!-- 面包屑导航 - 使用 Element Plus -->
            <template v-if="breadcrumbs.length > 0">
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
                        <Link
                            v-if="index < breadcrumbs.length - 1 && item.href"
                            :href="item.href"
                            class="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                            {{ item.title }}
                        </Link>
                        <span v-else class="text-neutral-900 dark:text-neutral-100">{{ item.title }}</span>
                    </el-breadcrumb-item>
                </el-breadcrumb>
            </template>
        </div>
    </header>
</template>
