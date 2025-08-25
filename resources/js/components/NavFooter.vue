<script setup lang="ts">
import { type NavItem } from '@/types';

interface Props {
    items: NavItem[];
    class?: string;
}

defineProps<Props>();
</script>

<template>
    <div :class="`p-4 ${$props.class || ''}`">
        <el-menu class="border-0">
            <el-menu-item v-for="item in items" :key="item.title" class="text-muted-foreground hover:text-foreground">
                <a :href="item.href" target="_blank" rel="noopener noreferrer" class="flex items-center">
                    <component :is="item.icon" class="mr-2 h-4 w-4" />
                    <span>{{ item.title }}</span>
                </a>
            </el-menu-item>
        </el-menu>
    </div>
</template>
