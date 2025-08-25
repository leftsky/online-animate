<script setup lang="ts">
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/vue3';
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
    items: NavItem[];
}>();

const page = usePage();
const expandedMenus = ref<Set<string>>(new Set());

// 初始化展开状态：如果当前页面是子菜单，则展开对应的母菜单
const initializeExpandedMenus = () => {
    const currentUrl = page.url;
    // 检查当前页面是否是某个子菜单，如果是则展开对应的母菜单
    props.items.forEach((item: NavItem) => {
        if (item.children && item.children.some((child: NavItem) => child.href === currentUrl)) {
            expandedMenus.value.add(item.title);
        }
    });
};

// 在组件挂载时初始化展开状态
onMounted(() => {
    initializeExpandedMenus();
});

// 监听页面变化，自动展开对应的母菜单
watch(() => page.url, (newUrl) => {
    props.items.forEach((item: NavItem) => {
        if (item.children && item.children.some((child: NavItem) => child.href === newUrl)) {
            expandedMenus.value.add(item.title);
        }
    });
});

// 获取当前激活的菜单项
const getActiveIndex = () => {
    const currentUrl = page.url;
    // 检查主菜单项
    for (let i = 0; i < props.items.length; i++) {
        const item = props.items[i];
        if (item.href === currentUrl) {
            return String(i + 1);
        }
        // 检查子菜单项
        if (item.children) {
            for (let j = 0; j < item.children.length; j++) {
                const child = item.children[j];
                if (child.href === currentUrl) {
                    return `${i + 1}-${j + 1}`;
                }
            }
        }
    }
    return '1';
};
</script>

<template>
    <el-menu 
        :default-active="getActiveIndex()" 
        class="border-0 h-full"
        @open="(key: string) => expandedMenus.add(key)"
        @close="(key: string) => expandedMenus.delete(key)"
    >
        <template v-for="(item, index) in items" :key="item.title">
            <!-- 有子菜单的项目 -->
            <el-sub-menu v-if="item.children && item.children.length > 0" :index="String(index + 1)">
                <template #title>
                    <component :is="item.icon" class="mr-2 h-4 w-4" />
                    <span>{{ item.title }}</span>
                </template>
                <el-menu-item 
                    v-for="(child, childIndex) in item.children" 
                    :key="child.title"
                    :index="`${index + 1}-${childIndex + 1}`"
                >
                    <Link v-if="child.href" :href="child.href" class="flex items-center w-full">
                        <component :is="child.icon" class="mr-2 h-4 w-4" />
                        <span>{{ child.title }}</span>
                    </Link>
                </el-menu-item>
            </el-sub-menu>
            
            <!-- 没有子菜单的项目 -->
            <el-menu-item v-else :index="String(index + 1)">
                <Link v-if="item.href" :href="item.href" class="flex items-center w-full">
                    <component :is="item.icon" class="mr-2 h-4 w-4" />
                    <span>{{ item.title }}</span>
                </Link>
            </el-menu-item>
        </template>
    </el-menu>
</template>
