<script setup lang="ts">
import UserInfo from '@/components/UserInfo.vue';
import { type User } from '@/types';
import { usePage } from '@inertiajs/vue3';
import { ChevronsUpDown } from 'lucide-vue-next';
import UserMenuContent from './UserMenuContent.vue';

const page = usePage<any>();
const user = page.props.auth.user as User;
</script>

<template>
    <div class="p-4">
        <el-dropdown trigger="click" placement="top">
            <div class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-accent hover:text-accent-foreground">
                <UserInfo :user="user" />
                <ChevronsUpDown class="size-4 text-muted-foreground" />
            </div>
            <template #dropdown>
                <el-dropdown-menu class="w-56">
                    <UserMenuContent :user="user" />
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>
