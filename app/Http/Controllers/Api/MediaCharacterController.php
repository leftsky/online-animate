<?php

namespace App\Http\Controllers\Api;

use App\Models\MediaCharacter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MediaCharacterController extends WebApiController
{
    /**
     * 获取人物列表
     */
    public function index(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 20);
        $offset = $request->get('offset', 0);
        $search = $request->get('search', '');
        $category = $request->get('category', '');
        $gender = $request->get('gender', '');
        $status = $request->get('status', '');

        $query = MediaCharacter::query()
            ->where('user_id', Auth::id())
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('personality', 'like', "%{$search}%");
                });
            })
            // ->when($gender !== '', function ($query, $gender) {
            //     $query->where('gender', $gender);
            // })
            ->when($status !== '', function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc');

        $total = $query->count();
        $characters = $query->offset($offset)->limit($limit)->get();

        return $this->success($characters);
    }

    /**
     * 创建新人物
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'gender' => 'integer|in:0,1,2,3',
            'age' => 'nullable|integer|min:0|max:150',
            'description' => 'nullable|string|max:1024',
            'personality' => 'nullable|string|max:500',
            'occupation' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:255',
            'image_path' => 'nullable|string|max:500',
            'additional_resources' => 'nullable|array',
            'status' => 'integer|in:0,1'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $character = MediaCharacter::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'gender' => $request->gender ?: 0,
            'age' => $request->age,
            'description' => $request->description,
            'personality' => $request->personality,
            'occupation' => $request->occupation,
            'category' => $request->category,
            'tags' => $request->tags ?: [],
            'image_path' => $request->image_path,
            'additional_resources' => $request->additional_resources ?: [],
            'status' => $request->status ?: 1
        ]);

        return $this->success($character, '人物创建成功', 201);
    }

    /**
     * 获取人物详情
     */
    public function show(MediaCharacter $character): JsonResponse
    {
        if ($character->user_id !== Auth::id()) {
            return $this->unauthorized('无权访问此资源');
        }

        return $this->success($character, '获取人物详情成功');
    }

    /**
     * 更新人物
     */
    public function update(Request $request, MediaCharacter $mediaCharacter): JsonResponse
    {
        // 验证用户权限
        if ($mediaCharacter->user_id !== Auth::id()) {
            return $this->unauthorized('无权访问此资源');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'gender' => 'integer|in:0,1,2,3',
            'age' => 'nullable|integer|min:0|max:150',
            'description' => 'nullable|string|max:1024',
            'personality' => 'nullable|string|max:500',
            'occupation' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:255',
            'image_path' => 'nullable|string|max:500',
            'additional_resources' => 'nullable|array',
            'status' => 'integer|in:0,1'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $mediaCharacter->update($request->only([
            'name',
            'gender',
            'age',
            'description',
            'personality',
            'occupation',
            'category',
            'tags',
            'image_path',
            'additional_resources',
            'status'
        ]));

        return $this->success($mediaCharacter, '人物更新成功');
    }

    /**
     * 删除人物
     */
    public function destroy(MediaCharacter $character): JsonResponse
    {
        if ($character->user_id !== Auth::id()) {
            return $this->unauthorized('无权访问此资源');
        }

        $character->delete();

        return $this->success(null, '人物删除成功');
    }
}
