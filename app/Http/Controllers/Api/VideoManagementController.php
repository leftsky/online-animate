<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Video;
use App\Models\Scene;
use App\Models\Chapter;

class VideoManagementController extends WebApiController
{
    /**
     * 获取指定章节的视频列表
     *
     * @param Request $request
     * @param Chapter $chapter
     * @return JsonResponse
     */
    public function getVideosByChapter(Request $request, Chapter $chapter): JsonResponse
    {
        try {
            $videos = Video::where('chapter_id', $chapter->id)
                ->orderBy('created_at', 'desc') // 按创建时间倒序
                ->get();

            return $this->success([
                'videos' => $videos,
                'total' => $videos->count()
            ], '获取视频列表成功');
        } catch (\Exception $e) {
            return $this->serverError('获取视频列表失败：' . $e->getMessage());
        }
    }

    /**
     * 获取指定视频的分镜列表
     *
     * @param Request $request
     * @param Video $video
     * @return JsonResponse
     */
    public function getScenesByVideo(Request $request, Video $video): JsonResponse
    {
        try {
            $scenes = Scene::where('video_id', $video->id)
                ->orderBy('created_at', 'asc') // 按创建时间正序
                ->get();

            return $this->success([
                'scenes' => $scenes,
                'total' => $scenes->count()
            ], '获取分镜列表成功');
        } catch (\Exception $e) {
            return $this->serverError('获取分镜列表失败：' . $e->getMessage());
        }
    }
}
