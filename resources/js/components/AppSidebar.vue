<script setup lang="ts">
import NavMain from '@/components/NavMain.vue';
import NavUser from '@/components/NavUser.vue';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/vue3';
import { BookText, Clapperboard, Database, FileText, Film, LayoutGrid, Library, PlayCircle, Users, Video } from 'lucide-vue-next';
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
        title: '文案/策划',
        icon: FileText,
        children: [
            {
                title: '小说管理',
                href: '/novel-management',
                icon: BookText,
            },
            {
                title: '视频管理',
                href: '/video-management',
                icon: Video,
            },
            {
                title: '分镜管理',
                href: '/scene-management',
                icon: Film,
            },
        ],
    },
    {
        title: '资源',
        icon: Database,
        children: [
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
        ],
    },
];
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- 侧边栏头部 -->
        <div class="border-b border-border p-4">
            <Link href="/dashboard" class="flex items-center">
                <AppLogo />
            </Link>
        </div>

        <!-- 主导航菜单 -->
        <div class="flex-1">
            <NavMain :items="mainNavItems" />
        </div>

        <!-- 底部用户信息 -->
        <div class="border-t border-border">
            <NavUser />
        </div>
    </div>
</template>
