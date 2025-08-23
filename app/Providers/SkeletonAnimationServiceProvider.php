<?php

namespace App\Providers;

use App\Services\SkeletonAnimationService;
use Illuminate\Support\ServiceProvider;

/**
 * 骨骼动画服务提供者
 */
class SkeletonAnimationServiceProvider extends ServiceProvider
{
    /**
     * 注册服务
     *
     * @return void
     */
    public function register(): void
    {
        $this->app->singleton(SkeletonAnimationService::class, function ($app) {
            return new SkeletonAnimationService();
        });

        $this->app->alias(SkeletonAnimationService::class, 'skeleton.animation');
    }

    /**
     * 引导服务
     *
     * @return void
     */
    public function boot(): void
    {
        // 可以在这里添加一些引导逻辑
        // 比如发布配置文件、注册命令等
    }
}
