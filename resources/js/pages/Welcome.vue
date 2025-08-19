<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { onMounted } from 'vue';
import { initializeTheme } from '@/composables/useAppearance';
import WelcomeUserMenu from '@/components/WelcomeUserMenu.vue';
import Icon from '@/components/Icon.vue';

onMounted(() => {
    initializeTheme();
});
</script>

<template>
    <Head title="在线动画制作平台">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    </Head>
    <div class="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <!-- Navigation -->
        <nav class="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">动画工坊</h1>
                        </div>
                    </div>
                    
                    <!-- Navigation Links -->
                    <div class="hidden md:block">
                        <div class="ml-10 flex items-baseline space-x-4">
                            <a href="#features" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">功能特色</a>
                            <a href="#pricing" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">价格方案</a>
                            <a href="#about" class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">关于我们</a>
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
        <section class="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-7xl mx-auto">
                <div class="text-center">
                    <h1 class="hero-title animate-fade-in-up text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        创造精彩
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">动画</span>
                    </h1>
                    <p class="hero-subtitle animate-fade-in-up-delay-1 text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                        专业的在线动画制作平台，让您的创意变为现实。无需复杂软件，在浏览器中即可制作精美动画。
                    </p>
                    <div class="cta-buttons animate-fade-in-up-delay-2 flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Link
                            v-if="!$page.props.auth.user"
                            :href="route('register')"
                            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            免费开始创作
                        </Link>
                        <Link
                            v-else
                            :href="route('dashboard')"
                            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            进入工作台
                        </Link>
                        <button class="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 px-8 py-4 rounded-lg text-lg font-medium transition-all">
                            观看演示
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="py-20 bg-gray-50 dark:bg-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">功能特色</h2>
                    <p class="text-xl text-gray-600 dark:text-gray-300">强大的功能，简单的操作</p>
                </div>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="feature-card animate-fade-in-up-delay-3 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
                        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
                            <Icon name="smile" class="w-8 h-8 text-white" />
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">简单易用</h3>
                        <p class="text-gray-600 dark:text-gray-300">直观的界面设计，无需专业技能即可上手，拖拽式操作让动画制作变得简单。</p>
                    </div>
                    <div class="feature-card animate-fade-in-up-delay-4 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
                        <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-6">
                            <Icon name="zap" class="w-8 h-8 text-white" />
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">实时预览</h3>
                        <p class="text-gray-600 dark:text-gray-300">所见即所得，实时查看动画效果，随时调整参数，立即看到变化。</p>
                    </div>
                    <div class="feature-card animate-fade-in-up-delay-5 bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
                        <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                            <Icon name="share2" class="w-8 h-8 text-white" />
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">多格式导出</h3>
                        <p class="text-gray-600 dark:text-gray-300">支持GIF、MP4、WebM等多种格式导出，满足不同平台的需求。</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pricing Section -->
        <section id="pricing" class="py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">价格方案</h2>
                    <p class="text-xl text-gray-600 dark:text-gray-300">选择适合您的方案</p>
                </div>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">免费版</h3>
                        <div class="text-3xl font-bold text-gray-900 dark:text-white mb-6">¥0<span class="text-lg text-gray-600 dark:text-gray-300">/月</span></div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                基础动画功能
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                最多5个项目
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                720p导出
                            </li>
                        </ul>
                        <Link :href="route('register')" class="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center block">
                            开始使用
                        </Link>
                    </div>
                    <div class="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-xl border-2 border-blue-500 relative">
                        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <span class="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">推荐</span>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">专业版</h3>
                        <div class="text-3xl font-bold text-gray-900 dark:text-white mb-6">¥99<span class="text-lg text-gray-600 dark:text-gray-300">/月</span></div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                所有动画功能
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                无限项目
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                4K导出
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                优先支持
                            </li>
                        </ul>
                        <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                            立即升级
                        </button>
                    </div>
                    <div class="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">企业版</h3>
                        <div class="text-3xl font-bold text-gray-900 dark:text-white mb-6">¥299<span class="text-lg text-gray-600 dark:text-gray-300">/月</span></div>
                        <ul class="space-y-3 mb-8">
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                团队协作
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                API接入
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                专属客服
                            </li>
                            <li class="flex items-center text-gray-600 dark:text-gray-300">
                                <Icon name="check" class="w-5 h-5 text-green-500 mr-3" />
                                定制开发
                            </li>
                        </ul>
                        <button class="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            联系销售
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- About Section -->
        <section id="about" class="py-20 bg-gray-50 dark:bg-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">关于我们</h2>
                    <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
                        我们致力于为创作者提供最好的在线动画制作工具，让每个人都能轻松创造出精彩的动画作品。
                    </p>
                    <div class="grid md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div class="text-4xl font-bold text-blue-600 mb-2">10万+</div>
                            <div class="text-gray-600 dark:text-gray-300">活跃用户</div>
                        </div>
                        <div>
                            <div class="text-4xl font-bold text-blue-600 mb-2">50万+</div>
                            <div class="text-gray-600 dark:text-gray-300">创作作品</div>
                        </div>
                        <div>
                            <div class="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
                            <div class="text-gray-600 dark:text-gray-300">服务可用性</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-4 gap-8">
                    <div>
                        <h3 class="text-xl font-bold mb-4">动画工坊</h3>
                        <p class="text-gray-400">专业的在线动画制作平台</p>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">产品</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#" class="hover:text-white transition-colors">功能特色</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">价格方案</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">API文档</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">支持</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#" class="hover:text-white transition-colors">帮助中心</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">联系我们</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">社区论坛</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-4">公司</h4>
                        <ul class="space-y-2 text-gray-400">
                            <li><a href="#" class="hover:text-white transition-colors">关于我们</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">隐私政策</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">服务条款</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
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
