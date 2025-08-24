<?php

namespace App\Http\Controllers\Api;

use App\Models\MediaAnimation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MediaAnimationController extends WebApiController
{
    /**
     * 获取动画列表
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = MediaAnimation::query();

            // 用户筛选
            if ($request->has('user_id')) {
                $query->byUser($request->user_id);
            } else {
                // 默认显示当前用户的动画和系统动画
                $query->where(function ($q) {
                    $q->where('user_id', Auth::id())
                      ->orWhereNull('user_id');
                });
            }

            // 状态筛选
            if ($request->has('status')) {
                $query->where('status', $request->status);
            } else {
                $query->enabled();
            }

            // 搜索
            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // 分页
            $limit = $request->get('limit', 20);
            $offset = $request->get('offset', 0);
            $animations = $query->offset($offset)->limit($limit)->get();

            return $this->success([
                'items' => $animations,
                'total' => $query->count(),
                'limit' => $limit,
                'offset' => $offset
            ], '获取动画列表成功');

        } catch (\Exception $e) {
            return $this->error('获取动画列表失败: ' . $e->getMessage());
        }
    }

    /**
     * 创建动画
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1024',
            'duration' => 'required|numeric|min:0',
            'frame_count' => 'required|integer|min:1',
            'loop_type' => 'required|in:none,loop,pingpong',
            'animation_tracks' => 'required|array',
            'source_file_url' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        try {
            $animation = MediaAnimation::create([
                'user_id' => Auth::id(),
                'name' => $request->name,
                'description' => $request->description,
                'duration' => $request->duration,
                'frame_count' => $request->frame_count,
                'loop_type' => $request->loop_type,
                'animation_tracks' => $request->animation_tracks,
                'source_file_url' => $request->source_file_url,
                'status' => 1
            ]);

            return $this->success($animation, '动画创建成功', 201);

        } catch (\Exception $e) {
            return $this->error('动画创建失败: ' . $e->getMessage());
        }
    }

    /**
     * 获取动画详情
     */
    public function show($id): JsonResponse
    {
        try {
            $animation = MediaAnimation::find($id);

            if (!$animation) {
                return $this->error('动画不存在');
            }

            // 检查权限：只能查看自己的动画或系统动画
            if ($animation->user_id && $animation->user_id !== Auth::id()) {
                return $this->unauthorized('无权访问此资源');
            }

            return $this->success($animation, '获取动画详情成功');

        } catch (\Exception $e) {
            return $this->error('获取动画详情失败: ' . $e->getMessage());
        }
    }

    /**
     * 更新动画
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $animation = MediaAnimation::find($id);

            if (!$animation) {
                return $this->error('动画不存在');
            }

            // 检查权限：只能更新自己的动画
            if ($animation->user_id !== Auth::id()) {
                return $this->unauthorized('无权更新此资源');
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string|max:1024',
                'duration' => 'sometimes|required|numeric|min:0',
                'frame_count' => 'sometimes|required|integer|min:1',
                'loop_type' => 'sometimes|required|in:none,loop,pingpong',
                'animation_tracks' => 'sometimes|required|array',
                'source_file_url' => 'nullable|url|max:500',
                'status' => 'sometimes|required|in:0,1',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors());
            }

            $animation->update($request->only([
                'name', 'description', 'duration', 'frame_count',
                'loop_type', 'animation_tracks', 'source_file_url', 'status'
            ]));

            return $this->success($animation, '动画更新成功');

        } catch (\Exception $e) {
            return $this->error('动画更新失败: ' . $e->getMessage());
        }
    }

    /**
     * 删除动画
     */
    public function destroy($id): JsonResponse
    {
        try {
            $animation = MediaAnimation::find($id);

            if (!$animation) {
                return $this->error('动画不存在');
            }

            // 检查权限：只能删除自己的动画
            if ($animation->user_id !== Auth::id()) {
                return $this->unauthorized('无权删除此资源');
            }

            $animation->delete();

            return $this->success(null, '动画删除成功');

        } catch (\Exception $e) {
            return $this->error('动画删除失败: ' . $e->getMessage());
        }
    }

    /**
     * 获取系统预设动画
     */
    public function system(): JsonResponse
    {
        try {
            $animations = MediaAnimation::system()->enabled()->get();
            return $this->success($animations, '获取系统动画成功');

        } catch (\Exception $e) {
            return $this->error('获取系统动画失败: ' . $e->getMessage());
        }
    }

    /**
     * 批量导入动画
     */
    public function batchImport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'animations' => 'required|array|min:1',
            'animations.*.name' => 'required|string|max:255',
            'animations.*.duration' => 'required|numeric|min:0',
            'animations.*.frame_count' => 'required|integer|min:1',
            'animations.*.animation_tracks' => 'required|array',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        try {
            $imported = [];
            $errors = [];

            foreach ($request->animations as $index => $animationData) {
                try {
                    $animation = MediaAnimation::create([
                        'user_id' => Auth::id(),
                        'name' => $animationData['name'],
                        'description' => $animationData['description'] ?? null,
                        'duration' => $animationData['duration'],
                        'frame_count' => $animationData['frame_count'],
                        'loop_type' => $animationData['loop_type'] ?? 'none',
                        'animation_tracks' => $animationData['animation_tracks'],
                        'source_file_url' => $animationData['source_file_url'] ?? null,
                        'status' => 1
                    ]);

                    $imported[] = $animation;

                } catch (\Exception $e) {
                    $errors[] = "第{$index}个动画导入失败: " . $e->getMessage();
                }
            }

            $result = [
                'imported_count' => count($imported),
                'error_count' => count($errors),
                'imported' => $imported,
                'errors' => $errors
            ];

            if (count($imported) > 0) {
                return $this->success($result, "成功导入 {$result['imported_count']} 个动画");
            } else {
                return $this->error('批量导入失败', $result);
            }

        } catch (\Exception $e) {
            return $this->error('批量导入失败: ' . $e->getMessage());
        }
    }
}
