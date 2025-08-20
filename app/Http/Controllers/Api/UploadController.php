<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;

class UploadController extends WebApiController
{
    /**
     * 上传文件
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function upload(Request $request): JsonResponse
    {
        // 验证请求
        $request->validate([
            'file' => 'required|file|max:51200', // 最大50MB
            'folder' => 'nullable|string|max:100',
            'type' => 'nullable|string|in:image,document,video,audio,model'
        ]);

        if (!$request->hasFile('file') || !$request->file('file')->isValid()) {
            return $this->validationError('未提供文件或文件上传失败');
        }

        // 获取文件
        $file = $request->file('file');
        $type = $request->input('type', 'image');

        // 根据文件类型进行额外验证
        $this->validateFileType($file, $type);

        // 生成唯一文件名
        $extension = $file->getClientOriginalExtension();
        $fileName = Str::random(10) . '_' . time() . '.' . $extension;

        // 确定存储路径
        $folder = $request->input('folder', $this->getDefaultFolder($type));
        $folder = trim($folder, '/');
        $datePath = date('Y/m'); // 按年月分目录
        $filePath = $folder . '/' . $datePath . '/' . $fileName;

        try {
            // 使用七牛云存储
            $content = file_get_contents($file->getRealPath());
            Storage::put($filePath, $content);
            $url = Storage::url($filePath);

            // 获取文件信息
            $fileInfo = [
                'url' => $url,
                'path' => $filePath,
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'type' => $file->getMimeType(),
                'extension' => $extension
            ];

            return $this->success($fileInfo, '文件上传成功');
        } catch (\Exception $e) {
            return $this->serverError('文件上传失败：' . $e->getMessage());
        }
    }

    /**
     * 根据文件类型验证文件
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $type
     * @throws \Illuminate\Validation\ValidationException
     */
    private function validateFileType($file, string $type): void
    {
        $rules = [
            'image' => 'mimes:jpeg,jpg,png,gif,webp|max:51200', // 50MB
            'document' => 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt|max:10240', // 10MB
            'video' => 'mimes:mp4,avi,mov,wmv,flv|max:51200', // 50MB
            'audio' => 'mimes:mp3,wav,ogg,m4a|max:10240', // 10MB
            'model' => 'max:51200' // 50MB，3D模型文件不限制扩展名
        ];

        if (isset($rules[$type])) {
            request()->validate(['file' => $rules[$type]]);
        }
    }

    /**
     * 获取默认文件夹
     *
     * @param string $type
     * @return string
     */
    private function getDefaultFolder(string $type): string
    {
        $folders = [
            'image' => 'images',
            'document' => 'documents',
            'video' => 'videos',
            'audio' => 'audios',
            'model' => 'models'
        ];

        return $folders[$type] ?? 'uploads';
    }
}
