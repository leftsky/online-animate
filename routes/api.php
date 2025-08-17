<?php

use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\SceneContentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Web API 路由 - 用于前端 AJAX 调用
// 使用 web 中间件但排除 CSRF 验证，保持 session 认证
Route::middleware(['web', 'auth'])->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])->prefix('web/api')->name('web.api.')->group(function () {
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
    Route::apiResource('scene-contents', SceneContentController::class);
});

// 媒体资源API路由 - 使用原有的认证方式
Route::middleware(['web', 'auth'])->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])->prefix('web/api')->name('web.api.')->group(function () {
    // 场景资源
    Route::apiResource('media-scenarios', \App\Http\Controllers\Api\MediaScenarioController::class);
    
    // 人物资源
    Route::apiResource('media-characters', \App\Http\Controllers\Api\MediaCharacterController::class);
    
    // 物品资源
    Route::apiResource('media-items', \App\Http\Controllers\Api\MediaItemController::class);
});
