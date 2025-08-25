<script setup lang="ts">
import UserInfo from '@/components/UserInfo.vue';
import { type SharedData, type User } from '@/types';
import { usePage } from '@inertiajs/vue3';
import { ChevronsUpDown } from 'lucide-vue-next';
import UserMenuContent from './UserMenuContent.vue';

const page = usePage<SharedData>();
const user = page.props.auth.user as User;
</script>

<template>
    <div class="p-4">
        <el-dropdown trigger="click" placement="top">
            <div class="flex items-center justify-between w-full cursor-pointer p-2 rounded-lg hover:bg-accent hover:text-accent-foreground">
                <UserInfo :user="user" />
                <ChevronsUpDown class="ml-auto size-4" />
            </div>
            <template #dropdown>
                <el-dropdown-menu class="w-56">
                    <UserMenuContent :user="user" />
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>
