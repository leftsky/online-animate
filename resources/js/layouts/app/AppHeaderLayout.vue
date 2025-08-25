<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import type { BreadcrumbItemType } from '@/types';

interface Props {
    breadcrumbs?: BreadcrumbItemType[];
}

withDefaults(defineProps<Props>(), {
    breadcrumbs: () => [],
});
</script>

<template>
    <el-container class="h-screen">
        <el-header height="60px" class="border-b border-border p-0">
            <AppHeader :breadcrumbs="breadcrumbs" />
        </el-header>
        <el-main>
            <slot />
        </el-main>
    </el-container>
</template>
