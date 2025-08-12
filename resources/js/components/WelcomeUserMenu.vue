<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/composables/useAppearance';
import { getInitials } from '@/composables/useInitials';
import { Link, usePage } from '@inertiajs/vue3';
import { LogOut, Monitor, Moon, Settings, Sun, User } from 'lucide-vue-next';
import { computed } from 'vue';

const page = usePage();
const auth = computed(() => page.props.auth);
const { appearance, updateAppearance } = useAppearance();

const themeOptions = [
    { value: 'light', icon: Sun, label: '浅色主题' },
    { value: 'dark', icon: Moon, label: '深色主题' },
    { value: 'system', icon: Monitor, label: '跟随系统' },
] as const;
</script>

<template>
    <DropdownMenu>
        <DropdownMenuTrigger :as-child="true">
            <Button
                variant="ghost"
                size="icon"
                class="relative size-10 w-auto rounded-full p-1 focus-within:ring-2 focus-within:ring-primary"
            >
                <Avatar class="size-8 overflow-hidden rounded-full">
                    <AvatarImage v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name" />
                    <AvatarFallback class="rounded-lg bg-neutral-200 font-semibold text-black dark:bg-neutral-700 dark:text-white">
                        {{ auth.user ? getInitials(auth.user.name) : 'U' }}
                    </AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel class="p-0 font-normal">
                <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar class="h-8 w-8 overflow-hidden rounded-lg">
                        <AvatarImage v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name" />
                        <AvatarFallback class="rounded-lg text-black dark:text-white">
                            {{ auth.user ? getInitials(auth.user.name) : 'U' }}
                        </AvatarFallback>
                    </Avatar>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                        <span class="truncate font-medium">{{ auth.user?.name || '游客' }}</span>
                        <span v-if="auth.user?.email" class="truncate text-xs text-muted-foreground">{{ auth.user.email }}</span>
                    </div>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem v-if="auth.user" :as-child="true">
                    <Link class="block w-full" :href="route('dashboard')" as="button">
                        <User class="mr-2 h-4 w-4" />
                        进入控制台
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem class="p-2">
                    <div class="flex items-center justify-between w-full">
                        <span class="text-sm font-medium">主题设置</span>
                    </div>
                    <div class="flex items-center gap-1 mt-2">
                        <button
                            v-for="theme in themeOptions"
                            :key="theme.value"
                            @click="updateAppearance(theme.value)"
                            :class="[
                                'flex items-center justify-center p-1.5 rounded-md transition-colors text-xs',
                                appearance === theme.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                            ]"
                            :title="theme.label"
                        >
                            <component :is="theme.icon" class="h-3 w-3" />
                        </button>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator v-if="auth.user" />
            <DropdownMenuItem v-if="auth.user" :as-child="true">
                <Link class="block w-full" method="post" :href="route('logout')" as="button">
                    <LogOut class="mr-2 h-4 w-4" />
                    退出登录
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem v-else :as-child="true">
                <Link class="block w-full" :href="route('login')" as="button">
                    <User class="mr-2 h-4 w-4" />
                    登录
                </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>