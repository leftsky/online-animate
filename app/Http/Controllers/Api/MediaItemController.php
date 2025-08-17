<?php

namespace App\Http\Controllers\Api;

use App\Models\MediaItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MediaItemController extends WebApiController
{
    /**
     * 获取物品列表
     */
    public function index(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 20);
        $offset = $request->get('offset', 0);
        $search = $request->get('search', '');
        $category = $request->get('category', '');
        $type = $request->get('type', '');
        $status = $request->get('status', '');

        $query = MediaItem::query()
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
            ->when($type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($status !== '', function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc');

        $total = $query->count();
        $items = $query->offset($offset)->limit($limit)->get();

        return $this->success($items, '获取物品列表成功');
    }

    /**
     * 创建新物品
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1024',
            'generation_prompt' => 'nullable|string|max:5120',
            'category' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'properties' => 'nullable|array',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:255',
            'image_path' => 'nullable|string|max:500',
            'status' => 'integer|in:0,1'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $item = MediaItem::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'description' => $request->description,
            'generation_prompt' => $request->generation_prompt,
            'category' => $request->category,
            'type' => $request->type,
            'properties' => $request->properties ?: [],
            'tags' => $request->tags ?: [],
            'image_path' => $request->image_path,
            'status' => $request->status ?: 1
        ]);

        return $this->success($item, '物品创建成功', 201);
    }

    /**
     * 获取物品详情
     */
    public function show(MediaItem $item): JsonResponse
    {
        if ($item->user_id !== Auth::id()) {
            return $this->unauthorized('无权访问此资源');
        }

        return $this->success($item, '获取物品详情成功');
    }

    /**
     * 更新物品
     */
    public function update(Request $request, MediaItem $item): JsonResponse
    {
        if ($item->user_id !== Auth::id()) {
            return $this->unauthorized('无权访问此资源');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1024',
            'generation_prompt' => 'nullable|string|max:5120',
            'category' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'properties' => 'nullable|array',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:255',
            'image_path' => 'nullable|string|max:500',
            'status' => 'integer|in:0,1'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $item->update($request->only([
            'name', 'description', 'generation_prompt', 'category', 'type', 
            'properties', 'tags', 'image_path', 'status'
        ]));

        return $this->success($item, '物品更新成功');
    }

    /**
     * 删除物品
     */
    public function destroy(MediaItem $item): JsonResponse
    {
        if ($item->user_id !== Auth::id()) {
            return $this->unauthorized('无权访问此资源');
        }

        $item->delete();

        return $this->success(null, '物品删除成功');
    }
}
