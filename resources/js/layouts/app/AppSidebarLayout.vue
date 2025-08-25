<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue';
import AppSidebarHeader from '@/components/AppSidebarHeader.vue';
import type { BreadcrumbItemType } from '@/types';

interface Props {
    breadcrumbs?: BreadcrumbItemType[];
}

withDefaults(defineProps<Props>(), {
    breadcrumbs: () => [],
});
</script>

<template>
    <el-container class="h-screen overflow-hidden">
        <el-aside width="250px" class="border-r border-border">
            <AppSidebar />
        </el-aside>
        <el-container>
            <el-header height="60px" class="border-b border-border p-0">
                <AppSidebarHeader :breadcrumbs="breadcrumbs" />
            </el-header>
            <el-main class="p-0">
                <slot />
            </el-main>
        </el-container>
    </el-container>
</template>
