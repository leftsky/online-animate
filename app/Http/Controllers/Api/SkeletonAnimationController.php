<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\GenerateSkeletonAnimationRequest;
use App\Services\SkeletonAnimationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Exception;

/**
 * 骨骼动画控制器
 * 提供自然语言生成骨骼动作的API接口
 */
class SkeletonAnimationController extends WebApiController
{
    /**
     * 骨骼动画服务实例
     *
     * @var SkeletonAnimationService
     */
    protected SkeletonAnimationService $skeletonAnimationService;

    /**
     * 构造函数
     *
     * @param SkeletonAnimationService $skeletonAnimationService
     */
    public function __construct(SkeletonAnimationService $skeletonAnimationService)
    {
        $this->skeletonAnimationService = $skeletonAnimationService;
    }

    /**
     * 从自然语言描述生成骨骼动画
     *
     * @param GenerateSkeletonAnimationRequest $request
     * @return JsonResponse
     */
    public function generateFromText(GenerateSkeletonAnimationRequest $request): JsonResponse
    {
        try {
            Log::info('收到骨骼动画生成请求', [
                'user_id' => Auth::id() ?? 'guest',
                'text' => $request->text,
                'options' => $request->except(['text'])
            ]);

            // 获取验证后的数据
            $validatedData = $request->validated();
            $text = $validatedData['text'];
            
            // 提取动画选项
            $options = array_diff_key($validatedData, ['text' => '']);
            
            // 调用服务生成动画
            $result = $this->skeletonAnimationService->generateAnimation($text, $options);

            Log::info('骨骼动画生成成功', [
                'user_id' => Auth::id() ?? 'guest',
                'action_type' => $result['metadata']['action_type'],
                'processing_time' => $result['metadata']['processing_time']
            ]);

            return $this->success($result, '骨骼动画生成成功');

        } catch (Exception $e) {
            Log::error('骨骼动画生成失败', [
                'user_id' => Auth::id() ?? 'guest',
                'text' => $request->text,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->serverError('骨骼动画生成失败：' . $e->getMessage());
        }
    }
}
