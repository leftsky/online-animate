<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Novel;
use App\Models\Chapter;

class NovelManagementController extends WebApiController
{
    /**
     * 从URL导入小说
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function importFromUrl(Request $request): JsonResponse
    {
        $request->validate([
            'url' => 'required|url|ends_with:.txt',
        ]);

        try {
            $url = $request->input('url');
            
            // 下载文件
            $localPath = $this->downloadFile($url);
            if (!$localPath) {
                return $this->serverError('文件下载失败');
            }

            // 解析小说内容
            $parseResult = $this->parseNovelContent($localPath);
            
            if (!$parseResult['success']) {
                return $this->validationError('小说解析失败: ' . $parseResult['error']);
            }

            // 上传到七牛云
            $fileName = Str::random(10) . '_' . time() . '_' . basename($url);
            $folder = 'novels';
            $datePath = date('Y/m');
            $filePath = $folder . '/' . $datePath . '/' . $fileName;

            $content = File::get($localPath);
            Storage::put($filePath, $content);
            $storageUrl = Storage::url($filePath);

            // 保存到数据库
            $saveResult = $this->saveNovelToDatabase(
                $parseResult['title'],
                $parseResult['chapters'],
                $storageUrl
            );

            if (!$saveResult['success']) {
                return $this->serverError('保存到数据库失败: ' . $saveResult['error']);
            }

            // 清理临时文件
            File::delete($localPath);

            return $this->success([
                'novel_id' => $saveResult['novel_id'],
                'title' => $parseResult['title'],
                'chapter_count' => $saveResult['chapter_count'],
                'file_url' => $storageUrl
            ], '小说导入成功');

        } catch (\Exception $e) {
            return $this->serverError('小说导入失败：' . $e->getMessage());
        }
    }

    /**
     * 获取小说列表
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getNovels(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 20);
        $offset = $request->get('offset', 0);

        $novels = Novel::withCount('chapters')
            ->orderBy('created_at', 'desc')
            ->offset($offset)
            ->limit($limit)
            ->get();

        $total = Novel::count();
        
        return $this->success([
            'novels' => $novels,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

    /**
     * 获取小说章节列表（内容截取）
     *
     * @param Request $request
     * @param int $novelId
     * @return JsonResponse
     */
    public function getChapters(Request $request, int $novelId): JsonResponse
    {
        $limit = $request->get('limit', 20);
        $offset = $request->get('offset', 0);
        $query = $request->get('q', '');

        $chaptersQuery = Chapter::where('novel_id', $novelId);

        // 如果提供了搜索查询，添加搜索条件
        if (!empty($query)) {
            $chaptersQuery->where(function($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('chapter_number', 'like', "%{$query}%");
            });
        }

        $chapters = $chaptersQuery
            ->select('id', 'title', 'chapter_number', 'word_count', 'created_at')
            ->addSelect(DB::raw('LEFT(content, 200) as content_preview'))
            ->orderBy('chapter_number', 'asc')
            ->offset($offset)
            ->limit($limit)
            ->get();

        $total = $chaptersQuery->count();

        return $this->success([
            'chapters' => $chapters,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

    /**
     * 获取章节详情（完整内容）
     *
     * @param int $novelId
     * @param int $chapterId
     * @return JsonResponse
     */
    public function showChapter(int $novelId, int $chapterId): JsonResponse
    {
        $chapter = Chapter::where('novel_id', $novelId)
            ->where('id', $chapterId)
            ->select('id', 'title', 'chapter_number', 'word_count', 'content', 'created_at')
            ->first();

        if (!$chapter) {
            return $this->notFound('章节不存在');
        }

        return $this->success($chapter);
    }

    /**
     * 解析小说内容
     *
     * @param string $filePath
     * @return array
     */
    private function parseNovelContent(string $filePath): array
    {
        try {
            $content = File::get($filePath);
            $encoding = mb_detect_encoding($content, ['UTF-8', 'GBK', 'GB2312', 'BIG5']);
            
            if ($encoding !== 'UTF-8') {
                $content = mb_convert_encoding($content, 'UTF-8', $encoding);
            }

            $lines = explode("\n", $content);
            $lines = array_map('trim', $lines);
            $lines = array_filter($lines, function($line) {
                return !empty($line);
            });

            if (empty($lines)) {
                return ['success' => false, 'error' => '文件内容为空'];
            }

            $title = $this->extractNovelTitle($lines);
            $chapters = $this->extractChapters($lines);

            if (empty($chapters)) {
                return ['success' => false, 'error' => '未找到章节信息'];
            }

            return [
                'success' => true,
                'title' => $title,
                'chapters' => $chapters
            ];

        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 提取小说标题
     */
    private function extractNovelTitle(array $lines): string
    {
        $firstLine = trim($lines[0] ?? '');
        
        $titlePatterns = [
            '/^《(.+?)》/',
            '/^【(.+?)】/',
            '/^「(.+?)」/',
            '/^"(.+?)"/',
            '/^\'(.+?)\'/',
            '/^(.+?)(?:\s*作者[:：].*)?$/',
        ];

        foreach ($titlePatterns as $pattern) {
            if (preg_match($pattern, $firstLine, $matches)) {
                return trim($matches[1]);
            }
        }

        $title = preg_replace('/\s*作者[:：].*$/', '', $firstLine);
        return trim($title);
    }

    /**
     * 提取章节信息
     */
    private function extractChapters(array $lines): array
    {
        $chapters = [];
        $currentChapter = null;
        $currentContent = [];
        $currentChapterStartLine = 0;

        foreach ($lines as $lineIndex => $line) {
            $line = trim($line);
            
            if (empty($line)) {
                continue;
            }

            if ($this->isChapterTitle($line)) {
                if ($currentChapter !== null) {
                    $chapters[] = [
                        'title' => $currentChapter,
                        'content' => implode("\n", $currentContent),
                        'start_line' => $currentChapterStartLine
                    ];
                }

                $currentChapter = $this->cleanChapterTitle($line);
                $currentContent = [];
                $currentChapterStartLine = $lineIndex + 1;
            } else {
                if ($currentChapter !== null) {
                    $currentContent[] = $line;
                }
            }
        }

        if ($currentChapter !== null) {
            $chapters[] = [
                'title' => $currentChapter,
                'content' => implode("\n", $currentContent),
                'start_line' => $currentChapterStartLine
            ];
        }

        return $chapters;
    }

    /**
     * 判断是否是章节标题
     */
    private function isChapterTitle(string $line): bool
    {
        $chapterPatterns = [
            '/^第[0-9零一二三四五六七八九十百千万]+章\s*[^\s]*/',     // 第1章 标题
            '/^第[0-9零一二三四五六七八九十百千万]+节\s*[^\s]*/',     // 第1节 标题
            '/^第[0-9零一二三四五六七八九十百千万]+回\s*[^\s]*/',     // 第1回 标题
        ];

        foreach ($chapterPatterns as $pattern) {
            if (preg_match($pattern, $line)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 清理章节标题
     */
    private function cleanChapterTitle(string $title): string
    {
        $title = preg_replace('/^第[0-9零一二三四五六七八九十百千万]+[章节回][、.．]?/', '', $title);
        $title = preg_replace('/^[0-9零一二三四五六七八九十百千万]+[、.．]?/', '', $title);
        return trim($title);
    }

    /**
     * 从URL下载文件
     */
    private function downloadFile(string $url): string|false
    {
        try {
            $tempDir = storage_path('app/temp');
            if (!File::exists($tempDir)) {
                File::makeDirectory($tempDir, 0755, true);
            }

            $fileName = 'novel_' . time() . '_' . Str::random(10) . '.txt';
            $localPath = $tempDir . '/' . $fileName;

            $content = file_get_contents($url);
            if ($content === false) {
                return false;
            }

            File::put($localPath, $content);
            return $localPath;

        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * 保存小说到数据库
     */
    private function saveNovelToDatabase(string $title, array $chapters, string $sourceFileUrl): array
    {
        try {
            $novel = Novel::create([
                'user_id' => 0,
                'title' => $title,
                'description' => '从TXT文件导入: ' . $title,
                'author' => '未知作者',
                'cover_image' => null,
                'source_file_url' => $sourceFileUrl,
                'status' => 1,
            ]);

            foreach ($chapters as $index => $chapter) {
                $cleanTitle = $this->cleanText($chapter['title']);
                $cleanContent = $this->cleanText($chapter['content']);
                
                Chapter::create([
                    'novel_id' => $novel->id,
                    'title' => $cleanTitle,
                    'content' => $cleanContent,
                    'word_count' => mb_strlen($cleanContent, 'UTF-8'),
                    'chapter_number' => $index + 1,
                    'status' => 1,
                ]);
            }

            return [
                'success' => true,
                'novel_id' => $novel->id,
                'chapter_count' => count($chapters)
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * 清理文本内容
     */
    private function cleanText(string $text): string
    {
        if (!mb_check_encoding($text, 'UTF-8')) {
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        }
        
        return trim($text);
    }

    /**
     * 删除小说
     *
     * @param Novel $novel
     * @return JsonResponse
     */
    public function destroy(Novel $novel): JsonResponse
    {
        try {
            // 删除相关的章节
            $novel->chapters()->delete();
            
            // 删除小说
            $novel->delete();
            
            return $this->success(null, '小说删除成功');
        } catch (\Exception $e) {
            return $this->serverError('小说删除失败：' . $e->getMessage());
        }
    }
}
