<?php

use App\Http\Controllers\Api\UploadController;
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
});
