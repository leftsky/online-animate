<script setup lang="ts">
import NavFooter from '@/components/NavFooter.vue';
import NavMain from '@/components/NavMain.vue';
import NavUser from '@/components/NavUser.vue';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/vue3';
import { BookOpen, Clapperboard, Folder, LayoutGrid, Library, PlayCircle, Users, BookText } from 'lucide-vue-next';
import AppLogo from './AppLogo.vue';

const mainNavItems: NavItem[] = [
    {
        title: '工作台',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: '分镜画板',
        href: '/storyboard',
        icon: Clapperboard,
    },
    {
        title: '小说管理',
        href: '/novel-management',
        icon: BookText,
    },
    {
        title: '资源库',
        href: '/resource-library',
        icon: Library,
    },
    {
        title: '人物库',
        href: '/character-library',
        icon: Users,
    },
    {
        title: '人物动作调试',
        href: '/character-animation-debug',
        icon: PlayCircle,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Github 仓库',
        href: 'https://github.com/laravel/vue-starter-kit',
        icon: Folder,
    },
    {
        title: '使用文档',
        href: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];
</script>

<template>
    <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" as-child>
                        <Link :href="route('dashboard')">
                            <AppLogo />
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
            <NavMain :items="mainNavItems" />
        </SidebarContent>

        <SidebarFooter>
            <NavFooter :items="footerNavItems" />
            <NavUser />
        </SidebarFooter>
    </Sidebar>
    <slot />
</template>
