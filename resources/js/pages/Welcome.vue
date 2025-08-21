<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import WelcomeUserMenu from '@/components/WelcomeUserMenu.vue';
import { initializeTheme } from '@/composables/useAppearance';
import { Head, Link } from '@inertiajs/vue3';
import { onMounted } from 'vue';

onMounted(() => {
    initializeTheme();
});
</script>

<template>
    <Head title="在线动画制作平台">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    </Head>
    <div class="min-h-screen bg-white transition-colors duration-300 dark:bg-gray-900">
        <!-- Navigation -->
        <nav class="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="flex h-16 items-center justify-between">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">动画工坊</h1>
                        </div>
                    </div>

                    <!-- Navigation Links -->
                    <div class="hidden md:block">
                        <div class="ml-10 flex items-baseline space-x-4">
                            <a
                                href="#features"
                                class="px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                >功能特色</a
                            >
                            <a
                                href="#pricing"
                                class="px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                >价格方案</a
                            >
                            <a
                                href="#about"
                                class="px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                >关于我们</a
                            >
                        </div>
                    </div>

                    <!-- Right side -->
                    <div class="flex items-center space-x-4">
                        <!-- User Menu -->
                        <WelcomeUserMenu />
                    </div>
                </div>
            </div>
        </nav>
        <!-- Hero Section -->
        <section class="px-4 pb-12 pt-24 sm:px-6 lg:px-8">
            <div class="mx-auto max-w-7xl">
                <div class="text-center">
                    <h1 class="hero-title animate-fade-in-up mb-6 text-4xl font-bold text-gray-900 dark:text-white md:text-6xl">
                        创造精彩
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">动画</span>
                    </h1>
                    <p class="hero-subtitle animate-fade-in-up-delay-1 mx-auto mb-8 max-w-3xl text-xl text-gray-600 dark:text-gray-300">
                        专业的在线动画制作平台，让您的创意变为现实。无需复杂软件，在浏览器中即可制作精美动画。
                    </p>
                    <div class="cta-buttons animate-fade-in-up-delay-2 mb-16 flex flex-col justify-center gap-4 sm:flex-row">
                        <Link
                            v-if="!$page.props.auth.user"
                            :href="route('register')"
                            class="transform rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                        >
                            免费开始创作
                        </Link>
                        <Link
                            v-else
                            :href="route('dashboard')"
                            class="transform rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                        >
                            进入工作台
                        </Link>
                        <button
                            class="rounded-lg border-2 border-gray-300 px-8 py-4 text-lg font-medium text-gray-700 transition-all hover:border-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500"
                        >
                            观看演示
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="bg-gray-50 py-20 dark:bg-gray-800">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="mb-16 text-center">
                    <h2 class="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">功能特色</h2>
                    <p class="text-xl text-gray-600 dark:text-gray-300">强大的功能，简单的操作</p>
                </div>
                <div class="grid gap-8 md:grid-cols-3">
                    <div
                        class="feature-card animate-fade-in-up-delay-3 transform rounded-xl bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl dark:bg-gray-900"
                    >
                        <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                            <Icon name="smile" class="h-8 w-8 text-white" />
                        </div>
                        <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">简单易用</h3>
                        <p class="text-gray-600 dark:text-gray-300">直观的界面设计，无需专业技能即可上手，拖拽式操作让动画制作变得简单。</p>
                    </div>
                    <div
                        class="feature-card animate-fade-in-up-delay-4 transform rounded-xl bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl dark:bg-gray-900"
                    >
                        <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                            <Icon name="zap" class="h-8 w-8 text-white" />
                        </div>
                        <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">实时预览</h3>
                        <p class="text-gray-600 dark:text-gray-300">所见即所得，实时查看动画效果，随时调整参数，立即看到变化。</p>
                    </div>
                    <div
                        class="feature-card animate-fade-in-up-delay-5 transform rounded-xl bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl dark:bg-gray-900"
                    >
                        <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                            <Icon name="share2" class="h-8 w-8 text-white" />
                        </div>
                        <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">多格式导出</h3>
                        <p class="text-gray-600 dark:text-gray-300">支持GIF、MP4、WebM等多种格式导出，满足不同平台的需求。</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pricing Section -->
        <section id="pricing" class="py-20">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="mb-16 text-center">
                    <h2 class="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">价格方案</h2>
                    <p class="text-xl text-gray-600 dark:text-gray-300">选择适合您的方案</p>
                </div>
                <div class="grid gap-8 md:grid-cols-3">
                    <div class="rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                        <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">免费版</h3>
                        <div class="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
                            ¥0<span class="text-lg text-gray-600 dark:text-gray-300">/月</span>
                        </div>
                        <ul class="mb-8 space-y-3">
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                基础动画功能
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                最多5个项目
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                720p导出
                            </li>
                        </ul>
                        <Link
                            :href="route('register')"
                            class="block w-full rounded-lg bg-gray-200 py-3 text-center font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                            开始使用
                        </Link>
                    </div>
                    <div class="relative rounded-xl border-2 border-blue-500 bg-white p-8 shadow-xl dark:bg-gray-900">
                        <div class="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                            <span class="rounded-full bg-blue-500 px-4 py-1 text-sm font-medium text-white">推荐</span>
                        </div>
                        <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">专业版</h3>
                        <div class="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
                            ¥99<span class="text-lg text-gray-600 dark:text-gray-300">/月</span>
                        </div>
                        <ul class="mb-8 space-y-3">
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                所有动画功能
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                无限项目
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                4K导出
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                优先支持
                            </li>
                        </ul>
                        <button class="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700">
                            立即升级
                        </button>
                    </div>
                    <div class="rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                        <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">企业版</h3>
                        <div class="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
                            ¥299<span class="text-lg text-gray-600 dark:text-gray-300">/月</span>
                        </div>
                        <ul class="mb-8 space-y-3">
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                团队协作
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                API接入
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                专属客服
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="mr-3 h-5 w-5 text-green-500" />
                                定制开发
                            </li>
                        </ul>
                        <button
                            class="w-full rounded-lg bg-gray-200 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                            联系销售
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- About Section -->
        <section id="about" class="bg-gray-50 py-20 dark:bg-gray-800">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h2 class="mb-8 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">关于我们</h2>
                    <p class="mx-auto mb-12 max-w-3xl text-xl text-gray-600 dark:text-gray-300">
                        我们致力于为创作者提供最好的在线动画制作工具，让每个人都能轻松创造出精彩的动画作品。
                    </p>
                    <div class="grid gap-8 text-center md:grid-cols-3">
                        <div>
                            <div class="mb-2 text-4xl font-bold text-blue-600">10万+</div>
                            <div class="text-gray-600 dark:text-gray-300">活跃用户</div>
                        </div>
                        <div>
                            <div class="mb-2 text-4xl font-bold text-blue-600">50万+</div>
                            <div class="text-gray-600 dark:text-gray-300">创作作品</div>
                        </div>
                        <div>
                            <div class="mb-2 text-4xl font-bold text-blue-600">99.9%</div>
                            <div class="text-gray-600 dark:text-gray-300">服务可用性</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 py-12 text-white">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="grid gap-8 md:grid-cols-4">
                    <div>
                        <h3 class="mb-4 text-xl font-bold">动画工坊</h3>
                        <p class="text-gray-400">专业的在线动画制作平台</p>
                    </div>
                    <div>
                        <h4 class="mb-4 font-semibold">产品</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#" class="transition-colors hover:text-white">功能特色</a></li>
                            <li><a href="#" class="transition-colors hover:text-white">价格方案</a></li>
                            <li><a href="#" class="transition-colors hover:text-white">API文档</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="mb-4 font-semibold">支持</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#" class="transition-colors hover:text-white">帮助中心</a></li>
                            <li><a href="#" class="transition-colors hover:text-white">联系我们</a></li>
                            <li><a href="#" class="transition-colors hover:text-white">社区论坛</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="mb-4 font-semibold">公司</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#" class="transition-colors hover:text-white">关于我们</a></li>
                            <li><a href="#" class="transition-colors hover:text-white">隐私政策</a></li>
                            <li><a href="#" class="transition-colors hover:text-white">服务条款</a></li>
                        </ul>
                    </div>
                </div>
                <div class="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
                    <p>&copy; 2024 动画工坊. 保留所有权利.</p>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* 淡入上升动画 */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 1s ease-out forwards;
}

.animate-fade-in-up-delay-1 {
    animation: fadeInUp 1s ease-out 0.2s forwards;
    opacity: 0;
}

.animate-fade-in-up-delay-2 {
    animation: fadeInUp 0.8s ease-out 0.8s forwards;
    opacity: 0;
}

.animate-fade-in-up-delay-3 {
    animation: fadeInUp 0.8s ease-out 0.4s forwards;
    opacity: 0;
}

.animate-fade-in-up-delay-4 {
    animation: fadeInUp 0.8s ease-out 0.5s forwards;
    opacity: 0;
}

.animate-fade-in-up-delay-5 {
    animation: fadeInUp 0.8s ease-out 0.6s forwards;
    opacity: 0;
}
</style>
