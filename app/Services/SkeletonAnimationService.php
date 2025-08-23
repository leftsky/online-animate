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
    protected $deepseek_api_url = "https://api.deepseek.com/v1/chat/completions";

    // 标准 Mixamo 骨骼名称
    protected $standardBones = [
        'mixamorigHips', 'mixamorigSpine', 'mixamorigSpine1', 'mixamorigSpine2', 
        'mixamorigNeck', 'mixamorigHead', 'mixamorigLeftShoulder', 'mixamorigLeftArm', 
        'mixamorigLeftForeArm', 'mixamorigLeftHand', 'mixamorigLeftHandThumb1', 
        'mixamorigLeftHandThumb2', 'mixamorigLeftHandIndex1', 'mixamorigLeftHandIndex2', 
        'mixamorigLeftHandIndex3', 'mixamorigLeftHandMiddle1', 'mixamorigLeftHandMiddle2', 
        'mixamorigLeftHandMiddle3', 'mixamorigLeftHandRing1', 'mixamorigLeftHandRing2', 
        'mixamorigLeftHandRing3', 'mixamorigLeftHandPinky1', 'mixamorigLeftHandPinky2', 
        'mixamorigRightShoulder', 'mixamorigRightArm', 'mixamorigRightForeArm', 
        'mixamorigRightHand', 'mixamorigRightHandThumb1', 'mixamorigRightHandThumb2', 
        'mixamorigRightHandThumb3', 'mixamorigRightHandIndex1', 'mixamorigRightHandIndex2', 
        'mixamorigRightHandIndex3', 'mixamorigRightHandMiddle1', 'mixamorigRightHandMiddle2', 
        'mixamorigRightHandMiddle3', 'mixamorigRightHandRing1', 'mixamorigRightHandRing2', 
        'mixamorigRightHandRing3', 'mixamorigRightHandPinky1', 'mixamorigRightHandPinky2', 
        'mixamorigLeftUpLeg', 'mixamorigLeftLeg', 'mixamorigLeftFoot', 'mixamorigLeftToeBase', 
        'mixamorigRightUpLeg', 'mixamorigRightLeg', 'mixamorigRightFoot', 'mixamorigRightToeBase'
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
        $animationRecord = $this->createAnimationRecord($text, $options);
        
        try {
            Log::info('开始生成骨骼动画', ['text' => $text, 'options' => $options, 'record_id' => $animationRecord->id]);

            // 1. 使用 DeepSeek API 解析自然语言并生成动画数据
            $aiResult = $this->analyzeTextWithAI($text);
            
            // 2. 提取动画参数
            $animationParams = $this->extractAnimationParams($aiResult, $options);
            
            // 3. 生成骨骼动画数据
            $animationData = $this->generateSkeletonData($aiResult, $animationParams);
            
            // 4. 优化动画参数
            $optimizedData = $this->optimizeAnimation($animationData, $options);
            
            // 5. 更新数据库记录
            $this->updateAnimationRecord($animationRecord, $aiResult, $optimizedData);
            
            Log::info('骨骼动画生成成功', [
                'action_type' => $aiResult['action_type'],
                'record_id' => $animationRecord->id
            ]);
            
            return [
                'animation_data' => $optimizedData,
                'metadata' => [
                    'action_type' => $aiResult['action_type'],
                    'confidence' => $aiResult['confidence'],
                    'suggestions' => $aiResult['suggestions'],
                    'ai_analysis' => $aiResult,
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
            $this->updateAnimationRecordOnError($animationRecord, $e);
            
            throw $e;
        }
    }

    /**
     * 创建动画记录
     *
     * @param string $text
     * @param array $options
     * @return AiSkeletonAnimation
     */
    private function createAnimationRecord(string $text, array $options): AiSkeletonAnimation
    {
        return AiSkeletonAnimation::create([
            'name' => $this->generateAnimationName($text),
            'description' => $text,
            'prompt' => $text,
            'animation_data' => [],
            'skeleton_data' => [],
            'duration' => $options['duration'] ?? 3.0,
            'confidence' => 0.0,
        ]);
    }

    /**
     * 更新动画记录
     *
     * @param AiSkeletonAnimation $record
     * @param array $aiResult
     * @param array $animationData
     * @return void
     */
    private function updateAnimationRecord(AiSkeletonAnimation $record, array $aiResult, array $animationData): void
    {
        $record->update([
            'name' => $this->generateAnimationName($aiResult['action_type'] ?? $record->description),
            'description' => $aiResult['description'] ?? $record->description,
            'animation_data' => $animationData,
            'skeleton_data' => $this->extractSkeletonData($animationData),
            'duration' => $aiResult['duration'] ?? $record->duration,
            'confidence' => $aiResult['confidence'] ?? 0.0,
        ]);
    }

    /**
     * 更新动画记录为错误状态
     *
     * @param AiSkeletonAnimation $record
     * @param Exception $e
     * @return void
     */
    private function updateAnimationRecordOnError(AiSkeletonAnimation $record, Exception $e): void
    {
        $record->update([
            'error_message' => $e->getMessage(),
        ]);
    }

    /**
     * 生成动画名称
     *
     * @param string $text
     * @return string
     */
    private function generateAnimationName(string $text): string
    {
        $timestamp = now()->format('Y-m-d H:i:s');
        return "AI_动画_{$timestamp}";
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
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->deepseek_api_key,
                'Content-Type' => 'application/json',
            ])->post($this->deepseek_api_url, [
                'model' => 'deepseek-chat',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => '你是一个专业的3D动画师和骨骼动画专家，专门分析自然语言描述并生成完整的骨骼动画数据。请严格按照JSON格式返回结果，包含所有必要的动画帧和骨骼变换信息。'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.1,
                'max_tokens' => 2000
            ]);

            if (!$response->successful()) {
                throw new Exception('DeepSeek API 请求失败: ' . $response->status() . ' - ' . $response->body());
            }

            $responseData = $response->json();
            $content = $responseData['choices'][0]['message']['content'] ?? '';
            
            // 尝试解析JSON响应
            $aiResult = $this->parseAIResponse($content);
            
            Log::info('DeepSeek API 分析成功', [
                'text' => $text,
                'ai_response' => $aiResult
            ]);

            return $aiResult;

        } catch (Exception $e) {
            Log::error('DeepSeek API 分析失败', [
                'text' => $text,
                'error' => $e->getMessage()
            ]);
            
            // 如果AI分析失败，回退到基础模式匹配
            return $this->fallbackAnalysis($text);
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
        
        return "请分析以下动作描述，并生成完整的骨骼动画数据：

动作描述：{$text}

请返回以下JSON格式，包含完整的动画轨道数据：
{
    \"action_type\": \"动作类型描述\",
    \"confidence\": 0.95,
    \"duration\": 2.0,
    \"speed\": 1.0,
    \"intensity\": 1.0,
    \"direction\": \"动作方向\",
    \"style\": \"动画风格\",
    \"description\": \"动作的详细描述\",
    \"suggestions\": [\"改进建议1\", \"改进建议2\"],
    \"bones_affected\": [\"受影响的骨骼列表\"],
    \"special_effects\": \"特殊效果描述\",
    \"tracks\": [
        {
            \"name\": \"mixamorigRightArm\",
            \"times\": [0, 0.5, 1.0, 1.5, 2.0],
            \"rotations\": [
                [0, 0, 0, 1],
                [0, 0, 0.7, 0.7],
                [0, 0, 1, 0],
                [0, 0, 0.7, 0.7],
                [0, 0, 0, 1]
            ],
            \"positions\": [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ]
        }
    ]
}

重要说明：
1. 动作类型可以是任何描述性的文字，不需要限制在预定义类型中
2. 使用标准的Mixamo骨骼名称：{$bonesList}
3. 每个轨道包含：
   - name: 骨骼名称（如 mixamorigRightArm）
   - times: 时间轴数组，单位为秒
   - rotations: 四元数旋转数组 [x, y, z, w]，每个时间点的旋转值
   - positions: 位置数组 [x, y, z]，每个时间点的位置值
4. 时间轴应该从0开始，到duration结束，建议包含5-10个关键帧
5. 四元数格式：[x, y, z, w]，其中w是实部
6. 确保动画的连续性和自然性
7. 可以只包含受影响的骨骼，不需要包含所有骨骼
8. 建议duration在1-5秒之间，关键帧间隔0.1-0.5秒

请确保返回的是有效的JSON格式，并且动画数据是完整和连贯的。";
    }

    /**
     * 解析AI响应
     *
     * @param string $content
     * @return array
     */
    private function parseAIResponse(string $content): array
    {
        // 尝试提取JSON内容
        if (preg_match('/\{.*\}/s', $content, $matches)) {
            $jsonContent = $matches[0];
            $decoded = json_decode($jsonContent, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $this->validateAndNormalizeAIResult($decoded);
            }
        }
        
        throw new Exception('无法解析AI响应中的JSON内容');
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
            'speed' => 1.0,
            'intensity' => 1.0,
            'direction' => 'forward',
            'style' => 'normal',
            'description' => '',
            'suggestions' => [],
            'bones_affected' => [],
            'special_effects' => '',
            'tracks' => []
        ];

        $result = array_merge($defaults, $aiResult);
        
        // 验证数值范围
        $result['duration'] = max(0.1, min(60.0, (float) $result['duration']));
        $result['speed'] = max(0.1, min(5.0, (float) $result['speed']));
        $result['intensity'] = max(0.1, min(3.0, (float) $result['intensity']));
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
     * 回退分析（当AI分析失败时使用）
     *
     * @param string $text
     * @return array
     */
    private function fallbackAnalysis(string $text): array
    {
        Log::warning('使用回退分析模式', ['text' => $text]);
        
        return [
            'action_type' => '回退模式',
            'confidence' => 0.5,
            'duration' => 2.0,
            'speed' => 1.0,
            'intensity' => 1.0,
            'direction' => 'forward',
            'style' => 'normal',
            'description' => '使用回退分析模式',
            'suggestions' => ['建议使用更清晰的描述', '可以尝试重新描述动作'],
            'bones_affected' => ['mixamorigHips', 'mixamorigSpine'],
            'special_effects' => '',
            'tracks' => $this->generateDefaultTracks(2.0)
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
                        $rotation = array_map(function($val) use ($scale) {
                            return $val * $scale;
                        }, $rotation);
                    } else {
                        $rotation *= $scale;
                    }
                }
                foreach ($track['positions'] as &$position) {
                    if (is_array($position)) {
                        $position = array_map(function($val) use ($scale) {
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
}
