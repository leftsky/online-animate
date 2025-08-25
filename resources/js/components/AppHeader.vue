<script setup lang="ts">
import AppLogo from '@/components/AppLogo.vue';
import AppLogoIcon from '@/components/AppLogoIcon.vue';
import UserMenuContent from '@/components/UserMenuContent.vue';
import { getInitials } from '@/composables/useInitials';
import type { BreadcrumbItem, NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/vue3';
import { route } from 'ziggy-js';
import { BookOpen, Folder, LayoutGrid, Menu, Search } from 'lucide-vue-next';
import { computed, ref } from 'vue';

interface Props {
    breadcrumbs?: BreadcrumbItem[];
}

const props = withDefaults(defineProps<Props>(), {
    breadcrumbs: () => [],
});

const page = usePage();
const auth = computed(() => page.props.auth as any);
const mobileMenuVisible = ref(false);

const isCurrentRoute = (url: string) => {
    return page.url === url;
};

const activeItemStyles = computed(() => (url: string) => (isCurrentRoute(url) ? 'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100' : ''));

const mainNavItems: NavItem[] = [
    {
        title: '工作台',
        href: '/dashboard',
        icon: LayoutGrid,
    },
];

const rightNavItems: NavItem[] = [
    {
        title: '代码仓库',
        href: 'https://github.com/laravel/vue-starter-kit',
        icon: Folder,
    },
    {
        title: '使用文档',
        href: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

// 获取当前激活的菜单项
const getActiveIndex = () => {
    const currentUrl = page.url;
    for (let i = 0; i < mainNavItems.length; i++) {
        const item = mainNavItems[i];
        if (item.href === currentUrl) {
            return String(i + 1);
        }
    }
    return '1';
};
</script>

<template>
    <div>
        <div class="border-b border-sidebar-border/80">
            <div class="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                <!-- Mobile Menu -->
                <div class="lg:hidden">
                    <el-button 
                        type="text" 
                        size="small" 
                        class="mr-2 h-9 w-9 p-0" 
                        @click="mobileMenuVisible = true"
                    >
                        <Menu class="h-5 w-5" />
                    </el-button>
                    
                    <!-- 移动端抽屉菜单 -->
                    <el-drawer
                        v-model="mobileMenuVisible"
                        direction="ltr"
                        size="300px"
                        :with-header="false"
                    >
                        <div class="p-6">
                            <div class="flex justify-start text-left mb-6">
                                <AppLogoIcon class="size-6 fill-current text-black dark:text-white" />
                            </div>
                            <div class="flex h-full flex-1 flex-col justify-between space-y-4 py-6">
                                <nav class="-mx-3 space-y-1">
                                    <Link
                                        v-for="item in mainNavItems"
                                        :key="item.title"
                                        :href="item.href || '#'"
                                        class="flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
                                        :class="activeItemStyles(item.href || '')"
                                        @click="mobileMenuVisible = false"
                                    >
                                        <component v-if="item.icon" :is="item.icon" class="h-5 w-5" />
                                        {{ item.title }}
                                    </Link>
                                </nav>
                                <div class="flex flex-col space-y-4">
                                    <a
                                        v-for="item in rightNavItems"
                                        :key="item.title"
                                        :href="item.href || '#'"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="flex items-center space-x-2 text-sm font-medium"
                                    >
                                        <component v-if="item.icon" :is="item.icon" class="h-5 w-5" />
                                        <span>{{ item.title }}</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </el-drawer>
                </div>

                <Link :href="route('dashboard')" class="flex items-center gap-x-2">
                    <AppLogo class="hidden h-6 xl:block" />
                </Link>

                <!-- Desktop Menu - 使用 Element Plus -->
                <div class="hidden h-full lg:flex lg:flex-1">
                    <el-menu 
                        :default-active="getActiveIndex()" 
                        mode="horizontal"
                        class="ml-10 border-0 h-full"
                    >
                        <el-menu-item 
                            v-for="(item, index) in mainNavItems" 
                            :key="index"
                            :index="String(index + 1)"
                            class="h-full flex items-center"
                        >
                            <Link :href="item.href || '#'" class="flex items-center h-full">
                                <component v-if="item.icon" :is="item.icon" class="mr-2 h-4 w-4" />
                                {{ item.title }}
                            </Link>
                        </el-menu-item>
                    </el-menu>
                </div>

                <div class="ml-auto flex items-center space-x-2">
                    <div class="relative flex items-center space-x-1">
                        <el-button 
                            type="text" 
                            size="small" 
                            class="group h-9 w-9 p-0 cursor-pointer"
                        >
                            <Search class="size-5 opacity-80 group-hover:opacity-100" />
                        </el-button>

                        <div class="hidden space-x-1 lg:flex">
                            <template v-for="item in rightNavItems" :key="item.title">
                                <el-tooltip :content="item.title" placement="bottom">
                                    <el-button 
                                        type="text" 
                                        size="small" 
                                        class="group h-9 w-9 p-0 cursor-pointer"
                                    >
                                        <a :href="item.href || '#'" target="_blank" rel="noopener noreferrer">
                                            <span class="sr-only">{{ item.title }}</span>
                                            <component :is="item.icon" class="size-5 opacity-80 group-hover:opacity-100" />
                                        </a>
                                    </el-button>
                                </el-tooltip>
                            </template>
                        </div>
                    </div>

                    <!-- 用户菜单 - 使用 Element Plus -->
                    <el-dropdown trigger="click" placement="bottom-end">
                        <el-button 
                            type="text" 
                            size="small" 
                            class="relative size-10 w-auto rounded-full p-1 focus-within:ring-2 focus-within:ring-primary"
                        >
                            <el-avatar 
                                :size="32" 
                                :src="auth.user?.avatar" 
                                class="overflow-hidden rounded-full"
                            >
                                {{ getInitials(auth.user?.name) }}
                            </el-avatar>
                        </el-button>
                        <template #dropdown>
                            <el-dropdown-menu class="w-56">
                                <UserMenuContent :user="auth.user" />
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </div>
        </div>

        <!-- 面包屑导航 - 使用 Element Plus -->
        <div v-if="props.breadcrumbs.length > 1" class="flex w-full border-b border-sidebar-border/70">
            <div class="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
                        <Link v-if="index < breadcrumbs.length - 1 && item.href" :href="item.href" class="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
                            {{ item.title }}
                        </Link>
                        <span v-else class="text-neutral-900 dark:text-neutral-100">{{ item.title }}</span>
                    </el-breadcrumb-item>
                </el-breadcrumb>
            </div>
        </div>
    </div>
</template>
