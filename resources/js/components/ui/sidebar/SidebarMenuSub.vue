<script setup lang="ts">
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <ul
        data-sidebar="menu-badge"
        :class="
            cn(
                'flex min-w-0 flex-col gap-1 py-0.5',
                'group-data-[collapsible=icon]:hidden',
                props.class,
            )
        "
    >
        <slot />
    </ul>
</template>
