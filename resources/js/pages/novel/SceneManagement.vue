<template>
    <AppLayout :breadcrumbs="breadcrumbs">
        <div class="container mx-auto p-6">
            <div class="mb-6">
                <h1 class="text-3xl font-bold text-foreground">分镜管理</h1>
                <p class="text-muted-foreground mt-2">管理已创建的分镜，查看分镜内容，支持分镜编辑和动画制作</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 分镜列表 -->
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-semibold">分镜列表</h3>
                            <Button variant="outline">
                                <Plus class="w-4 h-4 mr-2" />
                                新建分镜
                            </Button>
                        </div>
                        
                        <div class="py-12 text-center text-muted-foreground">
                            <svg class="mx-auto mb-4 h-12 w-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <p>暂无分镜数据</p>
                            <p class="text-sm mt-1">点击"新建分镜"开始创建</p>
                        </div>
                    </div>
                </div>

                <!-- 分镜详情 -->
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div class="p-6">
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold">分镜详情</h3>
                            <p class="text-sm text-muted-foreground">请从左侧选择分镜查看详情</p>
                        </div>
                        
                        <div class="py-12 text-center text-muted-foreground">
                            <svg class="mx-auto mb-4 h-12 w-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <p>请选择分镜查看详情</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-vue-next';
import AppLayout from '@/layouts/AppLayout.vue';

// 面包屑导航
const breadcrumbs = [
    { title: '工作台', href: '/dashboard' },
    { title: '内容管理', href: '#' },
    { title: '分镜管理', href: '/scene-management' },
];
</script>
