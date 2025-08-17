<?php

namespace App\Http\Controllers\Api;

use App\Models\MediaScenario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MediaScenarioController extends WebApiController
{
    /**
     * 获取场景列表
     */
    public function index(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 20);
        $offset = $request->get('offset', 0);
        $search = $request->get('search', '');
        $category = $request->get('category', '');
        $status = $request->get('status', '');

        $query = MediaScenario::query()
            ->where('user_id', Auth::id())
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->when($status !== '', function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc');

        $total = $query->count();
        $scenarios = $query->offset($offset)->limit($limit)->get();

        return $this->success($scenarios, '获取场景列表成功');
    }

    /**
     * 创建新场景
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1024',
            'generation_prompt' => 'nullable|string|max:5120',
            'category' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:255',
            'image_path' => 'nullable|string|max:500',
            'status' => 'integer|in:0,1'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $scenario = MediaScenario::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'description' => $request->description,
            'generation_prompt' => $request->generation_prompt,
            'category' => $request->category,
            'tags' => $request->tags ?: [],
            'image_path' => $request->image_path,
            'status' => $request->status ?: 1
        ]);

        return $this->success($scenario, '场景创建成功', 201);
    }

    /**
     * 获取场景详情
     */
    public function show(MediaScenario $scenario): JsonResponse
    {
        if ($scenario->user_id !== Auth::id()) {
            return $this->unauthorized('无权访问此资源');
        }

        return $this->success($scenario, '获取场景详情成功');
    }

    /**
     * 更新场景
     */
    public function update(Request $request, MediaScenario $scenario): JsonResponse
    {
        if ($scenario->user_id !== Auth::id()) {
            return $this->unauthorized('无权访问此资源');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1024',
            'generation_prompt' => 'nullable|string|max:5120',
            'category' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:255',
            'image_path' => 'nullable|string|max:500',
            'status' => 'integer|in:0,1'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $scenario->update($request->only([
            'name', 'description', 'generation_prompt', 'category', 'tags', 'image_path', 'status'
        ]));

        return $this->success($scenario, '场景更新成功');
    }

    /**
     * 删除场景
     */
    public function destroy(MediaScenario $scenario): JsonResponse
    {
        if ($scenario->user_id !== Auth::id()) {
            return $this->unauthorized('无权访问此资源');
        }

        $scenario->delete();

        return $this->success(null, '场景删除成功');
    }
}
