<template>
  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="py-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-foreground">动画解析器测试工具</h1>
        <p class="text-muted-foreground mt-2">
          测试 AnimationParser 的 JSON 和 YAML 实时双向转换功能
        </p>
      </div>
      
      <div class="h-[calc(100vh-200px)]">
        <AnimationParserTester />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue'
import AnimationParserTester from '@/components/AnimationParserTester.vue'

const breadcrumbs = [
  { title: '动画解析器测试', href: '/animation-parser-test' }
]
</script>
