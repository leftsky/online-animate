<script setup lang="ts">
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/vue3';
import { ChevronDown } from 'lucide-vue-next';
import { ref, computed, onMounted, watch } from 'vue';
import { useSidebar } from '@/components/ui/sidebar';

const props = defineProps<{
    items: NavItem[];
}>();

const page = usePage();
const expandedMenus = ref<Set<string>>(new Set());
const { state: sidebarState } = useSidebar();

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

const toggleMenu = (title: string) => {
    if (expandedMenus.value.has(title)) {
        expandedMenus.value.delete(title);
    } else {
        expandedMenus.value.add(title);
    }
};

const isMenuExpanded = (title: string) => {
    return expandedMenus.value.has(title);
};

// 检查是否有子菜单被选中
const hasActiveChild = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some(child => child.href === page.url);
};

// 检查侧边栏是否收起
const isSidebarCollapsed = computed(() => sidebarState.value === 'collapsed');
</script>

<template>
    <SidebarGroup class="px-2 py-0">
        <SidebarGroupLabel>平台</SidebarGroupLabel>
        <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.title">
                <!-- 有子菜单的项目 -->
                <div v-if="item.children && item.children.length > 0">
                    <SidebarMenuSubButton 
                        @click="toggleMenu(item.title)" 
                        class="pl-2 cursor-pointer"
                        :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground': hasActiveChild(item) }"
                    >
                        <component :is="item.icon" />
                        <span>{{ item.title }}</span>
                        <ChevronDown 
                            class="ml-auto h-4 w-4 transition-transform" 
                            :class="{ 'rotate-180': isMenuExpanded(item.title) }" 
                        />
                    </SidebarMenuSubButton>
                    
                    <!-- 子菜单项 - 根据展开状态和侧边栏状态控制显示 -->
                    <div v-if="isMenuExpanded(item.title) && !isSidebarCollapsed" class="ml-3">
                        <SidebarMenuSubItem v-for="child in item.children" :key="child.title">
                            <SidebarMenuButton as-child :is-active="child.href === page.url" class="pl-6">
                                <Link v-if="child.href" :href="child.href">
                                    <component :is="child.icon" />
                                    <span>{{ child.title }}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuSubItem>
                    </div>
                </div>
                
                <!-- 没有子菜单的项目 -->
                <SidebarMenuButton v-else as-child :is-active="item.href === page.url">
                    <Link v-if="item.href" :href="item.href">
                        <component :is="item.icon" />
                        <span>{{ item.title }}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    </SidebarGroup>
</template>
