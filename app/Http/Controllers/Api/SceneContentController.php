<?php

namespace App\Http\Controllers\Api;

use App\Models\SceneContent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SceneContentController extends WebApiController
{
    /**
     * 获取分镜内容列表
     */
    public function index(Request $request): JsonResponse
    {
        $query = SceneContent::query();

        // 按分镜ID筛选，支持null值
        if ($request->has('scene_id')) {
            if ($request->scene_id === 'null' || $request->scene_id === null) {
                $query->whereNull('scene_id');
            } else {
                $query->byScene($request->scene_id);
            }
        }

        // 按元素类型筛选
        if ($request->has('element_type')) {
            $query->byType($request->element_type);
        }

        // 按状态筛选
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // 按图层顺序排序
        $query->orderByLayer();

        // 分页参数
        $limit = $request->get('limit', 20);
        $offset = $request->get('offset', 0);
        
        // 应用分页
        $contents = $query->offset($offset)->limit($limit)->get();

        return $this->success($contents, '获取分镜内容列表成功');
    }

    /**
     * 创建分镜内容
     */
    public function store(Request $request): JsonResponse
    {
        // 验证请求数据
        $validated = $request->validate([
            'scene_id' => 'required|integer',
            'element_name' => 'required|string|max:255',
            'element_type' => 'required|string|max:50',
            'element_source' => 'nullable|string|max:500',
            'animation_script' => 'nullable|string',
            'layer_order' => 'nullable|integer',
            'status' => 'nullable|integer|in:0,1'
        ]);

        // 设置默认scene_id
        if (!isset($validated['scene_id']) || $validated['scene_id'] === null) {
            $validated['scene_id'] = 1;
        }

        // 如果没有指定图层顺序，自动分配
        if (!isset($validated['layer_order'])) {
            $validated['layer_order'] = SceneContent::getNextLayerOrder($validated['scene_id']);
        }

        // 设置默认状态
        if (!isset($validated['status'])) {
            $validated['status'] = 0;
        }

        // 验证动画脚本
        if (!empty($validated['animation_script'])) {
            $tempContent = new SceneContent();
            $scriptValidation = $tempContent->validateAnimationScript($validated['animation_script']);
            
            if (!$scriptValidation['valid']) {
                return $this->validationError('动画脚本格式错误：' . $scriptValidation['message']);
            }
        }

        try {
            $content = SceneContent::create($validated);
            return $this->success($content, '分镜内容创建成功');
        } catch (\Exception $e) {
            return $this->serverError('创建分镜内容失败：' . $e->getMessage());
        }
    }

    /**
     * 获取分镜内容详情
     */
    public function show(SceneContent $sceneContent): JsonResponse
    {
        // 添加解析后的动画脚本信息
        $contentData = $sceneContent->toArray();
        $contentData['parsed_animation'] = $sceneContent->parseAnimationScript();
        
        return $this->success($contentData, '获取分镜内容详情成功');
    }

    /**
     * 更新分镜内容
     */
    public function update(Request $request, SceneContent $sceneContent): JsonResponse
    {
        // 验证请求数据
        $validated = $request->validate([
            'element_name' => 'sometimes|string|max:255',
            'element_type' => 'sometimes|string|max:50',
            'element_source' => 'nullable|string|max:500',
            'animation_script' => 'nullable|string',
            'layer_order' => 'sometimes|integer',
            'status' => 'sometimes|integer|in:0,1'
        ]);

        // 验证动画脚本（如果提供）
        if (array_key_exists('animation_script', $validated) && !empty($validated['animation_script'])) {
            $scriptValidation = $sceneContent->validateAnimationScript($validated['animation_script']);
            
            if (!$scriptValidation['valid']) {
                return $this->validationError('动画脚本格式错误：' . $scriptValidation['message']);
            }
        }

        try {
            $sceneContent->update($validated);
            
            // 返回更新后的数据，包含解析后的动画脚本
            $contentData = $sceneContent->fresh()->toArray();
            $contentData['parsed_animation'] = $sceneContent->parseAnimationScript();
            
            return $this->success($contentData, '分镜内容更新成功');
        } catch (\Exception $e) {
            return $this->serverError('更新分镜内容失败：' . $e->getMessage());
        }
    }

    /**
     * 删除分镜内容
     */
    public function destroy(SceneContent $sceneContent): JsonResponse
    {
        try {
            $sceneContent->delete();
            return $this->success(null, '分镜内容删除成功');
        } catch (\Exception $e) {
            return $this->serverError('删除分镜内容失败：' . $e->getMessage());
        }
    }

    /**
     * 重新排序分镜内容
     */
    public function reorder(Request $request): JsonResponse
    {
        // 验证请求数据
        $validated = $request->validate([
            'scene_id' => 'required|integer|exists:scenes,id',
            'dragged_id' => 'required|integer|exists:scene_contents,id',
            'target_id' => 'nullable|integer|exists:scene_contents,id'
        ]);

        $sceneId = $validated['scene_id'];
        $draggedId = $validated['dragged_id'];
        $targetId = $validated['target_id'];

        try {
            // 验证被拖动的项目是否属于指定分镜
            $draggedContent = SceneContent::where('id', $draggedId)
                ->where('scene_id', $sceneId)
                ->first();

            if (!$draggedContent) {
                return $this->validationError('被拖动的项目不属于指定分镜');
            }

            // 验证目标项目是否属于指定分镜（如果提供）
            if ($targetId) {
                $targetContent = SceneContent::where('id', $targetId)
                    ->where('scene_id', $sceneId)
                    ->first();

                if (!$targetContent) {
                    return $this->validationError('目标项目不属于指定分镜');
                }
            }

            // 获取当前分镜下的所有内容，按layer_order排序
            $contents = SceneContent::where('scene_id', $sceneId)
                ->orderBy('layer_order')
                ->get();

            if ($contents->isEmpty()) {
                return $this->validationError('分镜下没有内容');
            }

            // 构建新的顺序
            $newOrder = [];
            $draggedItem = null;

            // 先找到被拖动的项目
            foreach ($contents as $content) {
                if ($content->id == $draggedId) {
                    $draggedItem = $content;
                    break;
                }
            }

            if (!$draggedItem) {
                return $this->validationError('未找到被拖动的项目');
            }

            // 重新构建顺序
            $newLayerOrder = 1;
            
            foreach ($contents as $content) {
                // 跳过被拖动的项目，稍后插入
                if ($content->id == $draggedId) {
                    continue;
                }

                // 如果遇到目标位置，先插入被拖动的项目
                if ($targetId && $content->id == $targetId) {
                    $newOrder[$draggedId] = $newLayerOrder++;
                }

                // 添加当前项目
                $newOrder[$content->id] = $newLayerOrder++;
            }

            // 如果没有目标位置或目标位置在最后，将被拖动的项目放在最后
            if (!isset($newOrder[$draggedId])) {
                $newOrder[$draggedId] = $newLayerOrder;
            }

            // 构建批量更新的SQL
            $caseStatements = [];
            $ids = [];
            
            foreach ($newOrder as $id => $layerOrder) {
                $caseStatements[] = "WHEN {$id} THEN {$layerOrder}";
                $ids[] = $id;
            }

            $caseSql = implode(' ', $caseStatements);
            $idsList = implode(',', $ids);

            // 执行批量更新
            $updateSql = "UPDATE scene_contents 
                         SET layer_order = CASE id {$caseSql} END 
                         WHERE scene_id = ? AND id IN ({$idsList})";

            DB::update($updateSql, [$sceneId]);

            // 返回更新后的列表
            $updatedContents = SceneContent::where('scene_id', $sceneId)
                ->orderBy('layer_order')
                ->get();

            return $this->success($updatedContents, '分镜内容排序更新成功');

        } catch (\Exception $e) {
            return $this->serverError('更新分镜内容排序失败：' . $e->getMessage());
        }
    }
}