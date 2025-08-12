<script setup lang="ts">
import { Head } from '@inertiajs/vue3';

import AppearanceTabs from '@/components/AppearanceTabs.vue';
import HeadingSmall from '@/components/HeadingSmall.vue';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/AppLayout.vue';
import SettingsLayout from '@/layouts/settings/Layout.vue';

const breadcrumbItems: BreadcrumbItem[] = [
    {
        title: '外观设置',
        href: '/settings/appearance',
    },
];
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbItems">
        <Head title="外观设置" />

        <SettingsLayout>
            <div class="space-y-6">
                <HeadingSmall title="外观设置" description="更新您账户的外观设置" />
                <AppearanceTabs />
            </div>
        </SettingsLayout>
    </AppLayout>
</template>
