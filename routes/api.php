<?php

use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\SceneContentController;
use App\Http\Controllers\Api\SkeletonAnimationController;
use App\Http\Controllers\Api\AiSkeletonAnimationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Web API 路由 - 用于前端 AJAX 调用
Route::middleware(['auth', 'verified'])->prefix('web/api')->name('web.api.')->group(function () {
    // 应用配置接口
    Route::get('/config', function () {
        return response()->json([
            'success' => true,
            'data' => [
                'app_name' => config('app.name'),
                'upload_max_size' => ini_get('upload_max_filesize'),
                'supported_image_types' => ['jpeg', 'jpg', 'png', 'gif', 'webp'],
                'supported_video_types' => ['mp4', 'avi', 'mov', 'wmv', 'flv'],
                'supported_audio_types' => ['mp3', 'wav', 'ogg', 'm4a'],
                'supported_document_types' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
            ]
        ]);
    })->name('config');

    // 文件上传接口
    Route::post('/upload', [UploadController::class, 'upload'])->name('upload');

    // 分镜内容管理接口
    Route::apiResource('scene_contents', SceneContentController::class);
    
    // 分镜内容重排序接口
    Route::post('scene_contents/reorder', [SceneContentController::class, 'reorder'])->name('scene_contents.reorder');
});

Route::middleware(['auth', 'verified'])->prefix('web/api')->name('web.api.')->group(function () {
    // 场景资源
    Route::apiResource('media_scenarios', \App\Http\Controllers\Api\MediaScenarioController::class);

    // 人物资源
    Route::apiResource('media_characters', \App\Http\Controllers\Api\MediaCharacterController::class);

    // 动画资源
    Route::apiResource('media_animations', \App\Http\Controllers\Api\MediaAnimationController::class);
    
    // 动画特殊接口
    Route::get('/media_animations/system', [\App\Http\Controllers\Api\MediaAnimationController::class, 'system'])->name('media_animations.system');
    Route::post('/media_animations/batch-import', [\App\Http\Controllers\Api\MediaAnimationController::class, 'batchImport'])->name('media_animations.batch-import');

    // 物品资源
    Route::apiResource('media_items', \App\Http\Controllers\Api\MediaItemController::class);

    // 骨骼动画接口
    Route::post('/skeleton-animation/generate', [SkeletonAnimationController::class, 'generateFromText'])->name('skeleton-animation.generate');
    
    // AI骨骼动画接口
    Route::get('/ai-skeleton-animations', [AiSkeletonAnimationController::class, 'index'])->name('ai-skeleton-animations.index');
});
