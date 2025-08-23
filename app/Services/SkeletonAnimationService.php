<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Exception;

/**
 * 骨骼动画服务
 * 负责将自然语言描述转换为骨骼动画数据
 * 使用 DeepSeek API 进行自然语言理解
 */
class SkeletonAnimationService
{
    protected $deepseek_api_key = "sk-80f8ccea7f2b482eb0c8d60bcb4e06dc";
    protected $deepseek_api_url = "https://api.deepseek.com/v1/chat/completions";

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
        try {
            Log::info('开始生成骨骼动画', ['text' => $text, 'options' => $options]);

            // 1. 使用 DeepSeek API 解析自然语言
            $aiAnalysis = $this->analyzeTextWithAI($text);
            
            // 2. 提取动画参数
            $animationParams = $this->extractAnimationParams($aiAnalysis, $options);
            
            // 3. 生成骨骼动画数据
            $animationData = $this->generateSkeletonData($aiAnalysis, $animationParams);
            
            // 4. 优化动画参数
            $optimizedData = $this->optimizeAnimation($animationData, $options);
            
            Log::info('骨骼动画生成成功', ['action_type' => $aiAnalysis['action_type']]);
            
            return [
                'animation_data' => $optimizedData,
                'metadata' => [
                    'action_type' => $aiAnalysis['action_type'],
                    'confidence' => $aiAnalysis['confidence'],
                    'suggestions' => $aiAnalysis['suggestions'],
                    'ai_analysis' => $aiAnalysis,
                    'processing_time' => microtime(true) - LARAVEL_START
                ]
            ];
            
        } catch (Exception $e) {
            Log::error('骨骼动画生成失败', [
                'text' => $text,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * 使用 DeepSeek API 分析自然语言文本
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
                        'content' => '你是一个专业的动画分析助手，专门分析自然语言描述并转换为结构化的动画参数。请严格按照JSON格式返回结果。'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.1,
                'max_tokens' => 1000
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
        return "请分析以下动作描述，并返回JSON格式的分析结果：

动作描述：{$text}

请返回以下JSON格式：
{
    \"action_type\": \"动作类型\",
    \"confidence\": 0.95,
    \"duration\": 2.0,
    \"speed\": 1.0,
    \"intensity\": 1.0,
    \"direction\": \"forward\",
    \"style\": \"normal\",
    \"description\": \"动作的详细描述\",
    \"suggestions\": [\"改进建议1\", \"改进建议2\"],
    \"bones_affected\": [\"受影响的骨骼列表\"],
    \"special_effects\": \"特殊效果描述\"
}

动作类型必须是以下之一：
- walking (走路)
- running (跑步)
- jumping (跳跃)
- sitting (坐下)
- standing (站立)
- waving (挥手)
- pointing (指向)
- nodding (点头)
- shaking (摇头)
- bowing (鞠躬)
- dancing (跳舞)
- fighting (战斗)
- idle (待机)
- custom (自定义)

请确保返回的是有效的JSON格式。";
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
            'action_type' => 'idle',
            'confidence' => 0.7,
            'duration' => 2.0,
            'speed' => 1.0,
            'intensity' => 1.0,
            'direction' => 'forward',
            'style' => 'normal',
            'description' => '',
            'suggestions' => [],
            'bones_affected' => [],
            'special_effects' => ''
        ];

        $result = array_merge($defaults, $aiResult);
        
        // 验证动作类型
        $validActionTypes = [
            'walking', 'running', 'jumping', 'sitting', 'standing',
            'waving', 'pointing', 'nodding', 'shaking', 'bowing',
            'dancing', 'fighting', 'idle', 'custom'
        ];
        
        if (!in_array($result['action_type'], $validActionTypes)) {
            $result['action_type'] = 'idle';
            $result['confidence'] *= 0.8; // 降低置信度
        }

        // 验证数值范围
        $result['duration'] = max(0.1, min(60.0, (float) $result['duration']));
        $result['speed'] = max(0.1, min(5.0, (float) $result['speed']));
        $result['intensity'] = max(0.1, min(3.0, (float) $result['intensity']));
        $result['confidence'] = max(0.0, min(1.0, (float) $result['confidence']));

        return $result;
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
        
        // 使用原有的模式匹配逻辑作为回退
        $actionType = $this->parseActionTypeFallback($text);
        $params = $this->extractAnimationParamsFallback($text);
        
        return [
            'action_type' => $actionType,
            'confidence' => 0.6, // 回退模式置信度较低
            'duration' => $params['duration'],
            'speed' => $params['speed'],
            'intensity' => $params['intensity'],
            'direction' => $params['direction'],
            'style' => $params['style'],
            'description' => '使用回退分析模式',
            'suggestions' => ['建议使用更清晰的描述', '可以尝试重新描述动作'],
            'bones_affected' => [],
            'special_effects' => ''
        ];
    }

    /**
     * 回退模式的动作类型解析
     *
     * @param string $text
     * @return string
     */
    private function parseActionTypeFallback(string $text): string
    {
        $text = strtolower(trim($text));
        
        $actionPatterns = [
            'walking' => ['走', '行走', '走路', '步行', 'walk', 'walking'],
            'running' => ['跑', '跑步', '奔跑', 'run', 'running'],
            'jumping' => ['跳', '跳跃', '蹦', 'jump', 'jumping'],
            'sitting' => ['坐', '坐下', 'sit', 'sitting'],
            'standing' => ['站', '站立', 'stand', 'standing'],
            'waving' => ['挥手', '招手', 'wave', 'waving'],
            'pointing' => ['指', '指向', 'point', 'pointing'],
            'nodding' => ['点头', 'nod', 'nodding'],
            'shaking' => ['摇头', 'shake', 'shaking'],
            'bowing' => ['鞠躬', '弯腰', 'bow', 'bowing'],
            'dancing' => ['跳舞', '舞蹈', 'dance', 'dancing'],
            'fighting' => ['战斗', '打架', 'fight', 'fighting'],
            'idle' => ['待机', '空闲', 'idle', 'rest']
        ];

        foreach ($actionPatterns as $actionType => $patterns) {
            foreach ($patterns as $pattern) {
                if (str_contains($text, $pattern)) {
                    return $actionType;
                }
            }
        }

        return 'idle';
    }

    /**
     * 回退模式的参数提取
     *
     * @param string $text
     * @return array
     */
    private function extractAnimationParamsFallback(string $text): array
    {
        $params = [
            'duration' => 2.0,
            'loop' => true,
            'speed' => 1.0,
            'intensity' => 1.0,
            'direction' => 'forward',
            'style' => 'normal'
        ];

        $text = strtolower($text);
        
        // 提取时长
        if (preg_match('/(\d+(?:\.\d+)?)\s*(秒|秒种|second|s)/', $text, $matches)) {
            $params['duration'] = floatval($matches[1]);
        }
        
        // 提取速度
        if (str_contains($text, '快') || str_contains($text, 'fast')) {
            $params['speed'] = 1.5;
        } elseif (str_contains($text, '慢') || str_contains($text, 'slow')) {
            $params['speed'] = 0.5;
        }
        
        // 提取强度
        if (str_contains($text, '强烈') || str_contains($text, 'intense')) {
            $params['intensity'] = 1.5;
        } elseif (str_contains($text, '轻微') || str_contains($text, 'gentle')) {
            $params['intensity'] = 0.5;
        }

        return $params;
    }

    /**
     * 提取动画参数
     *
     * @param array $aiAnalysis
     * @param array $options
     * @return array
     */
    private function extractAnimationParams(array $aiAnalysis, array $options): array
    {
        $params = [
            'duration' => $options['duration'] ?? $aiAnalysis['duration'] ?? 2.0,
            'loop' => $options['loop'] ?? true,
            'speed' => $options['speed'] ?? $aiAnalysis['speed'] ?? 1.0,
            'intensity' => $options['intensity'] ?? $aiAnalysis['intensity'] ?? 1.0,
            'direction' => $options['direction'] ?? $aiAnalysis['direction'] ?? 'forward',
            'style' => $options['style'] ?? $aiAnalysis['style'] ?? 'normal'
        ];

        return $params;
    }

    /**
     * 生成骨骼动画数据
     *
     * @param array $aiAnalysis
     * @param array $params
     * @return array
     */
    private function generateSkeletonData(array $aiAnalysis, array $params): array
    {
        $frames = [];
        $frameCount = intval($params['duration'] * 30); // 30fps
        $actionType = $aiAnalysis['action_type'];
        
        // 根据动作类型生成关键帧
        switch ($actionType) {
            case 'walking':
                $frames = $this->generateWalkingFrames($frameCount, $params);
                break;
            case 'running':
                $frames = $this->generateRunningFrames($frameCount, $params);
                break;
            case 'jumping':
                $frames = $this->generateJumpingFrames($frameCount, $params);
                break;
            case 'waving':
                $frames = $this->generateWavingFrames($frameCount, $params);
                break;
            case 'custom':
                $frames = $this->generateCustomFrames($frameCount, $params, $aiAnalysis);
                break;
            case 'idle':
            default:
                $frames = $this->generateIdleFrames($frameCount, $params);
                break;
        }

        return [
            'frames' => $frames,
            'duration' => $params['duration'],
            'loop' => $params['loop'],
            'fps' => 30,
            'total_frames' => count($frames),
            'ai_analysis' => $aiAnalysis
        ];
    }

    /**
     * 生成自定义动画帧
     *
     * @param int $frameCount
     * @param array $params
     * @param array $aiAnalysis
     * @return array
     */
    private function generateCustomFrames(int $frameCount, array $params, array $aiAnalysis): array
    {
        $frames = [];
        $intensity = $params['intensity'];
        
        // 基于AI分析的描述生成自定义动画
        $description = strtolower($aiAnalysis['description'] ?? '');
        
        for ($i = 0; $i < $frameCount; $i++) {
            $progress = $i / $frameCount;
            $cycle = ($progress * 2 * M_PI) * $params['speed'];
            
            $frames[] = [
                'frame' => $i,
                'time' => $i / 30.0,
                'bones' => [
                    'spine' => [
                        'rotation' => sin($cycle) * 10 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'chest' => [
                        'rotation' => cos($cycle) * 8 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'head' => [
                        'rotation' => sin($cycle * 0.5) * 5 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ]
                ]
            ];
        }
        
        return $frames;
    }

    /**
     * 生成走路动画帧
     *
     * @param int $frameCount
     * @param array $params
     * @return array
     */
    private function generateWalkingFrames(int $frameCount, array $params): array
    {
        $frames = [];
        $speed = $params['speed'];
        $intensity = $params['intensity'];
        
        for ($i = 0; $i < $frameCount; $i++) {
            $progress = $i / $frameCount;
            $cycle = ($progress * 2 * M_PI) * $speed;
            
            $frames[] = [
                'frame' => $i,
                'time' => $i / 30.0,
                'bones' => [
                    'left_leg' => [
                        'rotation' => sin($cycle) * 30 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'right_leg' => [
                        'rotation' => -sin($cycle) * 30 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'left_arm' => [
                        'rotation' => -sin($cycle) * 20 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'right_arm' => [
                        'rotation' => sin($cycle) * 20 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'spine' => [
                        'rotation' => sin($cycle) * 5 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ]
                ]
            ];
        }
        
        return $frames;
    }

    /**
     * 生成跑步动画帧
     *
     * @param int $frameCount
     * @param array $params
     * @return array
     */
    private function generateRunningFrames(int $frameCount, array $params): array
    {
        $frames = [];
        $speed = $params['speed'] * 1.5; // 跑步比走路快
        $intensity = $params['intensity'] * 1.3; // 跑步动作更强烈
        
        for ($i = 0; $i < $frameCount; $i++) {
            $progress = $i / $frameCount;
            $cycle = ($progress * 2 * M_PI) * $speed;
            
            $frames[] = [
                'frame' => $i,
                'time' => $i / 30.0,
                'bones' => [
                    'left_leg' => [
                        'rotation' => sin($cycle) * 45 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'right_leg' => [
                        'rotation' => -sin($cycle) * 45 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'left_arm' => [
                        'rotation' => -sin($cycle) * 35 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'right_arm' => [
                        'rotation' => sin($cycle) * 35 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'spine' => [
                        'rotation' => sin($cycle) * 8 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ]
                ]
            ];
        }
        
        return $frames;
    }

    /**
     * 生成跳跃动画帧
     *
     * @param int $frameCount
     * @param array $params
     * @return array
     */
    private function generateJumpingFrames(int $frameCount, array $params): array
    {
        $frames = [];
        $intensity = $params['intensity'];
        
        for ($i = 0; $i < $frameCount; $i++) {
            $progress = $i / $frameCount;
            
            // 跳跃的抛物线运动
            $height = sin($progress * M_PI) * 100 * $intensity;
            
            $frames[] = [
                'frame' => $i,
                'time' => $i / 30.0,
                'bones' => [
                    'root' => [
                        'position' => ['x' => 0, 'y' => $height, 'z' => 0]
                    ],
                    'left_leg' => [
                        'rotation' => $progress < 0.5 ? -30 * $intensity : 30 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'right_leg' => [
                        'rotation' => $progress < 0.5 ? -30 * $intensity : 30 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'left_arm' => [
                        'rotation' => $progress < 0.5 ? 45 * $intensity : -45 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'right_arm' => [
                        'rotation' => $progress < 0.5 ? 45 * $intensity : -45 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ]
                ]
            ];
        }
        
        return $frames;
    }

    /**
     * 生成挥手动画帧
     *
     * @param int $frameCount
     * @param array $params
     * @return array
     */
    private function generateWavingFrames(int $frameCount, array $params): array
    {
        $frames = [];
        $intensity = $params['intensity'];
        
        for ($i = 0; $i < $frameCount; $i++) {
            $progress = $i / $frameCount;
            $cycle = ($progress * 2 * M_PI) * 2; // 挥手频率
            
            $frames[] = [
                'frame' => $i,
                'time' => $i / 30.0,
                'bones' => [
                    'right_arm' => [
                        'rotation' => sin($cycle) * 60 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'right_forearm' => [
                        'rotation' => sin($cycle) * 30 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ]
                ]
            ];
        }
        
        return $frames;
    }

    /**
     * 生成待机动画帧
     *
     * @param int $frameCount
     * @param array $params
     * @return array
     */
    private function generateIdleFrames(int $frameCount, array $params): array
    {
        $frames = [];
        $intensity = $params['intensity'] * 0.3; // 待机动作很轻微
        
        for ($i = 0; $i < $frameCount; $i++) {
            $progress = $i / $frameCount;
            $cycle = ($progress * 2 * M_PI) * 0.5; // 很慢的呼吸运动
            
            $frames[] = [
                'frame' => $i,
                'time' => $i / 30.0,
                'bones' => [
                    'spine' => [
                        'rotation' => sin($cycle) * 2 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ],
                    'chest' => [
                        'rotation' => sin($cycle) * 1 * $intensity,
                        'position' => ['x' => 0, 'y' => 0, 'z' => 0]
                    ]
                ]
            ];
        }
        
        return $frames;
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
            foreach ($animationData['frames'] as &$frame) {
                foreach ($frame['bones'] as &$bone) {
                    if (isset($bone['rotation'])) {
                        $bone['rotation'] *= $scale;
                    }
                    if (isset($bone['position'])) {
                        $bone['position']['x'] *= $scale;
                        $bone['position']['y'] *= $scale;
                        $bone['position']['z'] *= $scale;
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
