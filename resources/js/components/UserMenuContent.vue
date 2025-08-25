<script setup lang="ts">
import UserInfo from '@/components/UserInfo.vue';
import type { User } from '@/types';
import { Link } from '@inertiajs/vue3';
import { LogOut, Settings } from 'lucide-vue-next';

interface Props {
    user: User;
}

defineProps<Props>();
</script>

<template>
    <!-- 用户信息 -->
    <el-dropdown-item disabled>
        <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserInfo :user="user" :show-email="true" />
        </div>
    </el-dropdown-item>
    
    <!-- 分割线 -->
    <div class="h-px bg-border mx-2 my-1"></div>
    
    <!-- 设置 -->
    <el-dropdown-item>
        <Link class="flex items-center w-full" :href="route('profile.edit')">
            <Settings class="mr-2 h-4 w-4" />
            设置
        </Link>
    </el-dropdown-item>
    
    <!-- 分割线 -->
    <div class="h-px bg-border mx-2 my-1"></div>
    
    <!-- 退出登录 -->
    <el-dropdown-item>
        <Link class="flex items-center w-full" method="post" :href="route('logout')">
            <LogOut class="mr-2 h-4 w-4" />
            退出登录
        </Link>
    </el-dropdown-item>
</template>
