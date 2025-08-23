<?php

namespace App\Services;

use App\Models\AiSkeletonAnimation;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Exception;

/**
 * 骨骼动画服务
 * 负责将自然语言描述转换为骨骼动画数据
 * 使用 DeepSeek API 进行自然语言理解，完全由AI自主生成
 */
class SkeletonAnimationService
{
    protected $deepseek_api_key = "sk-80f8ccea7f2b482eb0c8d60bcb4e06dc";
    protected $deepseek_api_url = "https://api.deepseek.com/chat/completions";

    // 标准 Mixamo 骨骼名称
    protected $standardBones = [
        'mixamorigHips',
        'mixamorigSpine',
        'mixamorigSpine1',
        'mixamorigSpine2',
        'mixamorigNeck',
        'mixamorigHead',
        'mixamorigLeftShoulder',
        'mixamorigLeftArm',
        'mixamorigLeftForeArm',
        'mixamorigLeftHand',
        'mixamorigLeftHandThumb1',
        'mixamorigLeftHandThumb2',
        'mixamorigLeftHandIndex1',
        'mixamorigLeftHandIndex2',
        'mixamorigLeftHandIndex3',
        'mixamorigLeftHandMiddle1',
        'mixamorigLeftHandMiddle2',
        'mixamorigLeftHandMiddle3',
        'mixamorigLeftHandRing1',
        'mixamorigLeftHandRing2',
        'mixamorigLeftHandRing3',
        'mixamorigLeftHandPinky1',
        'mixamorigLeftHandPinky2',
        'mixamorigRightShoulder',
        'mixamorigRightArm',
        'mixamorigRightForeArm',
        'mixamorigRightHand',
        'mixamorigRightHandThumb1',
        'mixamorigRightHandThumb2',
        'mixamorigRightHandThumb3',
        'mixamorigRightHandIndex1',
        'mixamorigRightHandIndex2',
        'mixamorigRightHandIndex3',
        'mixamorigRightHandMiddle1',
        'mixamorigRightHandMiddle2',
        'mixamorigRightHandMiddle3',
        'mixamorigRightHandRing1',
        'mixamorigRightHandRing2',
        'mixamorigRightHandRing3',
        'mixamorigRightHandPinky1',
        'mixamorigRightHandPinky2',
        'mixamorigLeftUpLeg',
        'mixamorigLeftLeg',
        'mixamorigLeftFoot',
        'mixamorigLeftToeBase',
        'mixamorigRightUpLeg',
        'mixamorigRightLeg',
        'mixamorigRightFoot',
        'mixamorigRightToeBase'
    ];

    /**
     * 从自然语言描述生成骨骼动画
     *
     * @param string $text 自然语言描述
     * @param array $options 动画选项
     * @return array 骨骼动画数据
     * @throws Exception
     */
    public function generateAnimation(string $text, array $options = []): array
    {
        // 创建数据库记录
        $animationRecord = AiSkeletonAnimation::create([
            'name' => $text,
            'description' => $text,
            'prompt' => $text,
            'animation_data' => [],
            'skeleton_data' => [],
            'duration' => $options['duration'] ?? 3.0,
            'confidence' => 0.0,
        ]);

        try {
            Log::info('开始生成骨骼动画', ['text' => $text, 'options' => $options, 'record_id' => $animationRecord->id]);

            // 1. 使用 DeepSeek API 解析自然语言并生成动画数据
            $aiResult = $this->analyzeTextWithAI($text);

            Log::info('AI分析结果', [
                'ai_result' => $aiResult,
                'ai_result_keys' => array_keys($aiResult)
            ]);

            // 2. 提取动画参数
            $animationParams = $this->extractAnimationParams($aiResult, $options);

            // 3. 生成骨骼动画数据
            $animationData = $this->generateSkeletonData($aiResult, $animationParams);

            // 4. 优化动画参数
            $optimizedData = $this->optimizeAnimation($animationData, $options);

            // 5. 转换为Three.js标准格式
            $threeJSData = $this->convertToThreeJSFormat($optimizedData);

            // 6. 更新数据库记录
            $animationRecord->update([
                'name' => $aiResult['action_type'] ?? $text,
                'description' => $aiResult['description'] ?? $text,
                'animation_data' => $threeJSData, // 存储Three.js格式
                'skeleton_data' => $this->extractSkeletonData($threeJSData),
                'duration' => $aiResult['duration'] ?? $animationRecord->duration,
                'confidence' => $aiResult['confidence'] ?? 0.0,
            ]);

            Log::info('骨骼动画生成成功', [
                'action_type' => $aiResult['action_type'],
                'record_id' => $animationRecord->id
            ]);

            return [
                'animation_data' => $threeJSData,
                'original_data' => $optimizedData, // 保留原始数据
                'metadata' => [
                    'action_type' => $aiResult['action_type'],
                    'confidence' => $aiResult['confidence'],
                    'format' => 'threejs',
                    'processing_time' => microtime(true) - LARAVEL_START,
                    'record_id' => $animationRecord->id
                ]
            ];

        } catch (Exception $e) {
            Log::error('骨骼动画生成失败', [
                'text' => $text,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'record_id' => $animationRecord->id
            ]);

            // 更新数据库记录为失败状态
            $animationRecord->update([
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * 提取骨骼数据
     *
     * @param array $animationData
     * @return array
     */
    private function extractSkeletonData(array $animationData): array
    {
        $skeletonData = [];

        if (isset($animationData['tracks']) && is_array($animationData['tracks'])) {
            foreach ($animationData['tracks'] as $track) {
                if (isset($track['name'])) {
                    $skeletonData[] = [
                        'bone_name' => $track['name'],
                        'has_rotation' => !empty($track['rotations']),
                        'has_position' => !empty($track['positions']),
                        'keyframe_count' => count($track['times'] ?? []),
                    ];
                }
            }
        }

        return $skeletonData;
    }

    /**
     * 使用 DeepSeek API 分析自然语言文本并生成动画数据
     *
     * @param string $text
     * @return array
     * @throws Exception
     */
    private function analyzeTextWithAI(string $text): array
    {
        try {
            $prompt = $this->buildAnalysisPrompt($text);

            $systemPrompt = '你是一个专业的3D动画师和骨骼动画专家，专门分析自然语言描述并生成完整的骨骼动画数据。请严格按照JSON格式返回结果，包含所有必要的动画帧和骨骼变换信息。';

            $response = Http::timeout(300)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->deepseek_api_key,
                    'Content-Type' => 'application/json',
                ])->post($this->deepseek_api_url, [
                    'model' => 'deepseek-chat',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => $systemPrompt
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.1,
                    'max_tokens' => 4000
                ]);

            if (!$response->successful()) {
                throw new Exception('DeepSeek API 请求失败: ' . $response->status() . ' - ' . $response->body());
            }

            $responseData = $response->json();
            $content = $responseData['choices'][0]['message']['content'] ?? '';

            // 如果没有content，尝试获取reasoning_content
            if (empty($content) && isset($responseData['choices'][0]['message']['reasoning_content'])) {
                $content = $responseData['choices'][0]['message']['reasoning_content'];
            }

            if (empty($content)) {
                throw new Exception('API响应内容为空');
            }

            Log::info('DeepSeek API 分析成功', [
                'text' => $text,
                'content_length' => strlen($content),
                'content_preview' => substr($content, 0, 100) . '...'
            ]);

            // 尝试解析JSON响应
            $aiResult = $this->parseAIResponse($content);

            return $aiResult;
        } catch (Exception $e) {
            Log::error('DeepSeek API 分析失败', [
                'text' => $text,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * 构建AI分析提示词
     *
     * @param string $text
     * @return string
     */
    private function buildAnalysisPrompt(string $text): string
    {
        $bonesList = implode(', ', $this->standardBones);

        return "分析动作：{$text}

直接返回JSON，不要任何解释：
{
    \"duration\": 2.0,
    \"tracks\": [
        {
            \"name\": \"mixamorigRightArm\",
            \"times\": [0, 0.5, 1.0, 1.5, 2.0],
            \"rotations\": [[0,0,0,1], [0,0,0.7,0.7], [0,0,1,0], [0,0,0.7,0.7], [0,0,0,1]],
            \"positions\": [[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]]
        }
    ]
}

规则：
- 只返回JSON，无其他文字
- 使用骨骼：{$bonesList}
- 时间轴：0到duration，5-10个关键帧
- 四元数：[x,y,z,w]，位置：[x,y,z]
- duration：1-5秒";
    }

    /**
     * 解析AI响应
     *
     * @param string $content
     * @return array
     */
    private function parseAIResponse(string $content): array
    {
        // 清理内容，移除可能的解释文字
        $cleanedContent = $this->cleanAIResponse($content);

        Log::info('开始解析AI响应', [
            'original_length' => strlen($content),
            'cleaned_length' => strlen($cleanedContent),
            'cleaned_preview' => substr($cleanedContent, 0, 300)
        ]);

        // 尝试提取JSON内容
        if (preg_match('/\{.*\}/s', $cleanedContent, $matches)) {
            $jsonContent = $matches[0];
            $decoded = json_decode($jsonContent, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                Log::info('正则匹配JSON解析成功', [
                    'json_length' => strlen($jsonContent),
                    'json_keys' => array_keys($decoded)
                ]);
                return $this->validateAndNormalizeAIResult($decoded);
            } else {
                Log::warning('正则匹配JSON解析失败', [
                    'json_error' => json_last_error_msg(),
                    'json_content' => substr($jsonContent, 0, 200)
                ]);
            }
        }

        // 如果正则匹配失败，尝试直接解析整个内容
        $decoded = json_decode($cleanedContent, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            Log::info('直接JSON解析成功', [
                'json_length' => strlen($cleanedContent),
                'json_keys' => array_keys($decoded)
            ]);
            return $this->validateAndNormalizeAIResult($decoded);
        }

        // 如果都失败了，尝试查找可能的JSON片段
        Log::error('所有JSON解析方法都失败了', [
            'json_error' => json_last_error_msg(),
            'content_length' => strlen($content),
            'cleaned_length' => strlen($cleanedContent),
            'content_sample' => substr($content, 0, 500),
            'cleaned_sample' => substr($cleanedContent, 0, 500)
        ]);

        throw new Exception('无法解析AI响应中的JSON内容。内容长度: ' . strlen($content) . ', 清理后长度: ' . strlen($cleanedContent) . ', JSON错误: ' . json_last_error_msg());
    }

    /**
     * 清理AI响应内容
     *
     * @param string $content
     * @return string
     */
    private function cleanAIResponse(string $content): string
    {
        // 移除可能的解释文字
        $lines = explode("\n", $content);
        $cleanedLines = [];
        $inJson = false;
        $braceCount = 0;

        foreach ($lines as $line) {
            $line = trim($line);

            // 如果遇到JSON开始标记，开始收集
            if (str_contains($line, '{')) {
                $inJson = true;
            }

            if ($inJson) {
                $cleanedLines[] = $line;

                // 计算大括号的平衡
                $braceCount += substr_count($line, '{');
                $braceCount -= substr_count($line, '}');

                // 只有当大括号平衡时才结束收集
                if ($braceCount <= 0) {
                    break;
                }
            }
        }

        $cleanedContent = implode("\n", $cleanedLines);

        // 如果清理后内容太短，返回原始内容
        if (strlen($cleanedContent) < 50) {
            return $content;
        }

        // 验证JSON完整性
        $decoded = json_decode($cleanedContent, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            Log::info('JSON验证成功', [
                'cleaned_length' => strlen($cleanedContent),
                'json_keys' => array_keys($decoded)
            ]);
            return $cleanedContent;
        }

        // 如果JSON不完整，尝试修复
        Log::warning('JSON不完整，尝试修复', [
            'json_error' => json_last_error_msg(),
            'cleaned_content' => substr($cleanedContent, 0, 500)
        ]);

        // 尝试找到最后一个完整的JSON结构
        $lastBracePos = strrpos($cleanedContent, '}');
        if ($lastBracePos !== false) {
            $potentialJson = substr($cleanedContent, 0, $lastBracePos + 1);
            $decoded = json_decode($potentialJson, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                Log::info('JSON修复成功', [
                    'fixed_length' => strlen($potentialJson),
                    'json_keys' => array_keys($decoded)
                ]);
                return $potentialJson;
            }
        }

        // 如果都失败了，返回原始内容
        Log::warning('JSON修复失败，返回原始内容');
        return $content;
    }

    /**
     * 验证和标准化AI结果
     *
     * @param array $aiResult
     * @return array
     */
    private function validateAndNormalizeAIResult(array $aiResult): array
    {
        $defaults = [
            'action_type' => '自定义动作',
            'confidence' => 0.7,
            'duration' => 2.0,
            'tracks' => []
        ];

        $result = array_merge($defaults, $aiResult);

        // 验证数值范围
        $result['duration'] = max(0.1, min(60.0, (float) $result['duration']));
        $result['confidence'] = max(0.0, min(1.0, (float) $result['confidence']));

        // 验证轨道数据
        if (empty($result['tracks'])) {
            $result['tracks'] = $this->generateDefaultTracks($result['duration']);
        } else {
            $result['tracks'] = $this->validateAndNormalizeTracks($result['tracks']);
        }

        return $result;
    }

    /**
     * 验证和标准化轨道数据
     *
     * @param array $tracks
     * @return array
     */
    private function validateAndNormalizeTracks(array $tracks): array
    {
        $validatedTracks = [];

        foreach ($tracks as $track) {
            if (!isset($track['name']) || !isset($track['times'])) {
                continue;
            }

            $validatedTrack = [
                'name' => $track['name'],
                'times' => array_map('floatval', $track['times']),
                'rotations' => [],
                'positions' => []
            ];

            // 验证旋转数据
            if (isset($track['rotations']) && is_array($track['rotations'])) {
                foreach ($track['rotations'] as $rotation) {
                    if (is_array($rotation) && count($rotation) === 4) {
                        $validatedTrack['rotations'][] = array_map('floatval', $rotation);
                    }
                }
            }

            // 验证位置数据
            if (isset($track['positions']) && is_array($track['positions'])) {
                foreach ($track['positions'] as $position) {
                    if (is_array($position) && count($position) === 3) {
                        $validatedTrack['positions'][] = array_map('floatval', $position);
                    }
                }
            }

            // 确保轨道数据完整
            if (count($validatedTrack['rotations']) > 0 || count($validatedTrack['positions']) > 0) {
                $validatedTracks[] = $validatedTrack;
            }
        }

        return $validatedTracks;
    }

    /**
     * 生成默认轨道数据（当AI没有提供轨道数据时）
     *
     * @param float $duration
     * @return array
     */
    private function generateDefaultTracks(float $duration): array
    {
        $times = [0, $duration * 0.5, $duration];

        return [
            [
                'name' => 'mixamorigHips',
                'times' => $times,
                'rotations' => [
                    [0, 0, 0, 1],
                    [0, 0, 0, 1],
                    [0, 0, 0, 1]
                ],
                'positions' => [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ]
            ],
            [
                'name' => 'mixamorigSpine',
                'times' => $times,
                'rotations' => [
                    [0, 0, 0, 1],
                    [0, 0, 0.1, 0.99],
                    [0, 0, 0, 1]
                ],
                'positions' => [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ]
            ]
        ];
    }

    /**
     * 提取动画参数
     *
     * @param array $aiResult
     * @param array $options
     * @return array
     */
    private function extractAnimationParams(array $aiResult, array $options): array
    {
        $params = [
            'duration' => $options['duration'] ?? $aiResult['duration'] ?? 2.0,
            'loop' => $options['loop'] ?? true,
            'speed' => $options['speed'] ?? $aiResult['speed'] ?? 1.0,
            'intensity' => $options['intensity'] ?? $aiResult['intensity'] ?? 1.0,
            'direction' => $options['direction'] ?? $aiResult['direction'] ?? 'forward',
            'style' => $options['style'] ?? $aiResult['style'] ?? 'normal'
        ];

        return $params;
    }

    /**
     * 生成骨骼动画数据
     *
     * @param array $aiResult
     * @param array $params
     * @return array
     */
    private function generateSkeletonData(array $aiResult, array $params): array
    {
        // 如果AI已经提供了完整的帧数据，直接使用
        if (!empty($aiResult['tracks']) && count($aiResult['tracks']) > 0) {
            return [
                'tracks' => $aiResult['tracks'],
                'duration' => $params['duration'],
                'loop' => $params['loop'],
                'fps' => 30,
                'total_frames' => count($aiResult['tracks']),
                'ai_analysis' => $aiResult
            ];
        }

        // 否则生成默认轨道数据
        $tracks = $this->generateDefaultTracks($params['duration']);

        return [
            'tracks' => $tracks,
            'duration' => $params['duration'],
            'loop' => $params['loop'],
            'fps' => 30,
            'total_frames' => count($tracks),
            'ai_analysis' => $aiResult
        ];
    }

    /**
     * 转换为Three.js标准格式
     *
     * @param array $animationData
     * @return array
     */
    private function convertToThreeJSFormat(array $animationData): array
    {
        $threeJSData = [
            'metadata' => [
                'version' => 4.5,
                'type' => 'keyframe',
                'generator' => 'SkeletonAnimationService'
            ],
            'animations' => [
                [
                    'name' => 'skeleton_animation',
                    'duration' => $animationData['duration'],
                    'tracks' => []
                ]
            ]
        ];

        foreach ($animationData['tracks'] as $track) {
            $threeJSTracks = $this->convertTrackToThreeJS($track);
            if ($threeJSTracks) {
                if (is_array($threeJSTracks)) {
                    $threeJSData['animations'][0]['tracks'] = array_merge(
                        $threeJSData['animations'][0]['tracks'], 
                        $threeJSTracks
                    );
                } else {
                    $threeJSData['animations'][0]['tracks'][] = $threeJSTracks;
                }
            }
        }

        return $threeJSData;
    }

    /**
     * 转换单个轨道为Three.js格式
     *
     * @param array $track
     * @return array|null
     */
    private function convertTrackToThreeJS(array $track): ?array
    {
        if (empty($track['name']) || empty($track['times'])) {
            return null;
        }

        $tracks = [];

        // 转换旋转轨道
        if (!empty($track['rotations'])) {
            $rotationTrack = [
                'name' => $track['name'] . '.quaternion',
                'type' => 'quaternion',
                'times' => $track['times'],
                'values' => []
            ];

            foreach ($track['rotations'] as $rotation) {
                if (is_array($rotation) && count($rotation) === 4) {
                    $rotationTrack['values'] = array_merge($rotationTrack['values'], $rotation);
                }
            }

            if (!empty($rotationTrack['values'])) {
                $tracks[] = $rotationTrack;
            }
        }

        // 转换位置轨道
        if (!empty($track['positions'])) {
            $positionTrack = [
                'name' => $track['name'] . '.position',
                'type' => 'vector3',
                'times' => $track['times'],
                'values' => []
            ];

            foreach ($track['positions'] as $position) {
                if (is_array($position) && count($position) === 3) {
                    $positionTrack['values'] = array_merge($positionTrack['values'], $position);
                }
            }

            if (!empty($positionTrack['values'])) {
                $tracks[] = $positionTrack;
            }
        }

        if (empty($tracks)) {
            return null;
        }
        
        // 如果只有一个轨道，返回单个轨道；否则返回轨道数组
        return count($tracks) === 1 ? $tracks[0] : $tracks;
    }

    /**
     * 优化动画参数
     *
     * @param array $animationData
     * @param array $options
     * @return array
     */
    private function optimizeAnimation(array $animationData, array $options): array
    {
        // 应用全局缩放
        if (isset($options['scale'])) {
            $scale = $options['scale'];
            foreach ($animationData['tracks'] as &$track) {
                foreach ($track['rotations'] as &$rotation) {
                    if (is_array($rotation)) {
                        $rotation = array_map(function ($val) use ($scale) {
                            return $val * $scale;
                        }, $rotation);
                    } else {
                        $rotation *= $scale;
                    }
                }
                foreach ($track['positions'] as &$position) {
                    if (is_array($position)) {
                        $position = array_map(function ($val) use ($scale) {
                            return $val * $scale;
                        }, $position);
                    } else {
                        $position *= $scale;
                    }
                }
            }
        }

        // 应用缓动函数
        if (isset($options['easing'])) {
            $animationData['easing'] = $options['easing'];
        }

        return $animationData;
    }

    /**
     * 测试AI响应解析功能
     *
     * @param string $testText
     * @return array
     */
    public function testAIResponse(string $testText): array
    {
        try {
            $aiResult = $this->analyzeTextWithAI($testText);
            $threeJSData = $this->convertToThreeJSFormat([
                'tracks' => $aiResult['tracks'] ?? [],
                'duration' => $aiResult['duration'] ?? 2.0
            ]);
            
            return [
                'success' => true,
                'ai_result' => $aiResult,
                'threejs_data' => $threeJSData,
                'message' => 'AI响应解析成功'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'AI响应解析失败'
            ];
        }
    }
}
