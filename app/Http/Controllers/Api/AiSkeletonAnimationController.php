<?php

namespace App\Http\Controllers\Api;

use App\Models\AiSkeletonAnimation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AiSkeletonAnimationController extends WebApiController
{
    /**
     * 获取AI骨骼动画列表
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AiSkeletonAnimation::query();

            // 搜索功能
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('prompt', 'like', "%{$search}%");
                });
            }

            // 过滤成功的动画（没有错误信息的）
            if ($request->boolean('successful_only', true)) {
                $query->successful();
            }

            // 排序
            $sortBy = $request->get('sort_by', 'created_at');
            $sortDirection = $request->get('sort_direction', 'desc');
            
            if (in_array($sortBy, ['name', 'duration', 'confidence', 'created_at'])) {
                $query->orderBy($sortBy, $sortDirection);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // 分页
            $perPage = min($request->get('per_page', 20), 100); // 限制最大每页100条
            $animations = $query->paginate($perPage);

            $data = [
                'items' => $animations->items(),
                'pagination' => [
                    'current_page' => $animations->currentPage(),
                    'last_page' => $animations->lastPage(),
                    'per_page' => $animations->perPage(),
                    'total' => $animations->total(),
                ]
            ];

            return $this->success($data, '获取AI骨骼动画列表成功');

        } catch (\Exception $e) {
            return $this->serverError('获取AI骨骼动画列表失败: ' . $e->getMessage());
        }
    }
}
