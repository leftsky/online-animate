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
     * 流式生成骨骼动画（实时返回内容）
     *
     * @param string $text 自然语言描述
     * @param array $options 动画选项
     * @param callable $callback 流式回调函数
     * @return array 骨骼动画数据
     * @throws Exception
     */
    public function generateAnimationStream(string $text, array $options = [], callable $callback = null): array
    {
        // 创建数据库记录
        $animationRecord = $this->createAnimationRecord($text, $options);
        
        try {
            Log::info('开始流式生成骨骼动画', ['text' => $text, 'options' => $options, 'record_id' => $animationRecord->id]);

            // 1. 使用 DeepSeek API 流式解析自然语言并生成动画数据
            $aiResult = $this->analyzeTextWithAIStream($text, $callback);
            
            // 2. 提取动画参数
            $animationParams = $this->extractAnimationParams($aiResult, $options);
            
            // 3. 生成骨骼动画数据
            $animationData = $this->generateSkeletonData($aiResult, $animationParams);
            
            // 4. 优化动画参数
            $optimizedData = $this->optimizeAnimation($animationData, $options);
            
            // 5. 更新数据库记录
            $this->updateAnimationRecord($animationRecord, $aiResult, $optimizedData);
            
            Log::info('流式骨骼动画生成成功', [
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
            Log::error('流式骨骼动画生成失败', [
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
        return $text;
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
            
            $response = Http::timeout(15) // 减少超时时间到15秒
                // ->retry(2, 1000) // 重试2次，间隔1秒
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->deepseek_api_key,
                    'Content-Type' => 'application/json',
                ])->post($this->deepseek_api_url, [
                    'model' => 'deepseek-reasoner',
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
                    'max_tokens' => 2000,
                    'stream' => true // 启用流式响应
                ]);

            if (!$response->successful()) {
                throw new Exception('DeepSeek API 请求失败: ' . $response->status() . ' - ' . $response->body());
            }

            // 流式处理响应
            $content = $this->processStreamResponse($response);
            
            Log::info('DeepSeek API 分析', [
                'text' => $text,
                'ai_response' => $content
            ]);
            
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
            
            // 直接抛出异常，不进行回退分析
            throw $e;
        }
    }

    /**
     * 流式使用 DeepSeek API 分析自然语言文本
     *
     * @param string $text
     * @param callable|null $callback
     * @return array
     * @throws Exception
     */
    private function analyzeTextWithAIStream(string $text, callable $callback = null): array
    {
        try {
            $prompt = $this->buildAnalysisPrompt($text);
            
            // 首先尝试流式请求
            try {
                $content = $this->makeStreamRequest($prompt, $callback);
                Log::info('流式请求成功');
            } catch (Exception $e) {
                Log::warning('流式请求失败，尝试非流式请求', ['error' => $e->getMessage()]);
                
                // 如果流式失败，回退到非流式
                if ($callback) {
                    $callback("流式请求失败，切换到非流式模式...\n", "", 0);
                }
                
                $content = $this->makeNonStreamRequest($prompt, $callback);
            }
            
            // 尝试解析JSON响应
            $aiResult = $this->parseAIResponse($content);
            
            return $aiResult;

        } catch (Exception $e) {
            Log::error('DeepSeek API 流式分析失败', [
                'text' => $text,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * 使用非流式方式发送请求（备用方案）
     *
     * @param string $prompt
     * @param callable|null $callback
     * @return string
     * @throws Exception
     */
    private function makeNonStreamRequest(string $prompt, callable $callback = null): string
    {
        $data = [
            'model' => 'deepseek-reasoner',
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
            'max_tokens' => 2000,
            'stream' => false // 禁用流式
        ];
        
        $response = Http::timeout(60)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $this->deepseek_api_key,
                'Content-Type' => 'application/json',
            ])->post($this->deepseek_api_url, $data);

        if (!$response->successful()) {
            throw new Exception('非流式API请求失败: ' . $response->status() . ' - ' . $response->body());
        }

        $responseData = $response->json();
        $content = $responseData['choices'][0]['message']['content'] ?? '';
        
        // 如果没有content，尝试获取reasoning_content
        if (empty($content) && isset($responseData['choices'][0]['message']['reasoning_content'])) {
            $content = $responseData['choices'][0]['message']['reasoning_content'];
        }
        
        if (empty($content)) {
            throw new Exception('非流式响应内容为空');
        }
        
        // 模拟流式输出
        if ($callback && is_callable($callback)) {
            $words = explode(' ', $content);
            $chunkSize = max(1, intval(count($words) / 20)); // 分成20个块
            
            for ($i = 0; $i < count($words); $i += $chunkSize) {
                $chunk = implode(' ', array_slice($words, $i, $chunkSize));
                $callback($chunk . ' ', $content, strlen($content));
                usleep(100000); // 100ms延迟，模拟流式效果
            }
        }
        
        Log::info('非流式请求完成', [
            'content_length' => strlen($content),
            'content_preview' => substr($content, 0, 100) . '...'
        ]);
        
        return $content;
    }

    /**
     * 使用cURL发送流式请求
     *
     * @param string $prompt
     * @param callable|null $callback
     * @return string
     * @throws Exception
     */
    private function makeStreamRequest(string $prompt, callable $callback = null): string
    {
        $ch = curl_init();
        $content = ''; // 初始化内容变量
        
        $data = [
            'model' => 'deepseek-reasoner',
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
            'max_tokens' => 2000,
            'stream' => true
        ];
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->deepseek_api_url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->deepseek_api_key,
                'Content-Type: application/json',
                'Accept: text/event-stream',
            ],
            CURLOPT_TIMEOUT => 120, // 增加到2分钟
            CURLOPT_WRITEFUNCTION => function($ch, $data) use (&$content, $callback) {
                // 记录原始数据用于调试
                // Log::debug('收到原始流式数据', [
                //     'data_length' => strlen($data),
                //     'data_preview' => substr($data, 0, 200)
                // ]);
                
                $lines = explode("\n", $data);
                
                foreach ($lines as $line) {
                    $line = trim($line);
                    
                    if (empty($line) || $line === 'data: [DONE]') {
                        continue;
                    }
                    
                    if (str_starts_with($line, 'data: ')) {
                        $jsonData = substr($line, 6);
                        
                        try {
                            $responseData = json_decode($jsonData, true);
                            
                            if (json_last_error() === JSON_ERROR_NONE && 
                                isset($responseData['choices'][0]['delta']['content'])) {
                                
                                $fragment = $responseData['choices'][0]['delta']['content'];
                                $content .= $fragment;
                                
                                // 调用回调函数，确保实时输出
                                if ($callback && is_callable($callback)) {
                                    $callback($fragment, $content, strlen($content));
                                    
                                    // 强制刷新输出缓冲区
                                    if (function_exists('flush')) {
                                        flush();
                                    }
                                    if (function_exists('ob_flush')) {
                                        ob_flush();
                                    }
                                }
                                
                                // Log::debug('流式接收内容片段', [
                                //     'fragment' => $fragment,
                                //     'total_length' => strlen($content)
                                // ]);
                            } else if (json_last_error() === JSON_ERROR_NONE && 
                                       isset($responseData['choices'][0]['delta']['reasoning_content'])) {
                                // 处理 DeepSeek 的 reasoning_content 字段
                                $fragment = $responseData['choices'][0]['delta']['reasoning_content'];
                                if (!empty($fragment)) {
                                    $content .= $fragment;
                                    
                                    // 调用回调函数，确保实时输出
                                    if ($callback && is_callable($callback)) {
                                        $callback($fragment, $content, strlen($content));
                                        
                                        // 强制刷新输出缓冲区
                                        if (function_exists('flush')) {
                                            flush();
                                        }
                                        if (function_exists('ob_flush')) {
                                            ob_flush();
                                        }
                                    }
                                    
                                    // Log::debug('流式接收推理内容片段', [
                                    //     'fragment' => $fragment,
                                    //     'total_length' => strlen($content)
                                    // ]);
                                }
                            } else {
                                // 记录解析失败的情况
                                Log::debug('JSON解析结果', [
                                    'json_data' => $jsonData,
                                    'parsed_data' => $responseData,
                                    'json_error' => json_last_error_msg()
                                ]);
                            }
                        } catch (Exception $e) {
                            Log::warning('解析流式响应片段失败', [
                                'json_data' => $jsonData,
                                'error' => $e->getMessage()
                            ]);
                        }
                    } else {
                        // 记录非标准格式的行，帮助调试
                        Log::debug('非标准流式响应行', [
                            'line' => $line,
                            'line_length' => strlen($line)
                        ]);
                    }
                }
                
                return strlen($data);
            }
        ]);
        
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        $info = curl_getinfo($ch);
        
        curl_close($ch);
        
        // 记录详细的cURL信息
        Log::info('cURL请求完成', [
            'http_code' => $httpCode,
            'total_time' => $info['total_time'],
            'size_download' => $info['size_download'],
            'speed_download' => $info['speed_download'],
            'content_length' => strlen($content),
            'curl_error' => $error
        ]);
        
        if ($result === false) {
            throw new Exception('cURL请求失败: ' . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception('HTTP请求失败，状态码: ' . $httpCode . ', 响应: ' . $result);
        }
        
        // 尝试从原始响应中解析JSON
        if (preg_match('/\{.*\}/s', $result, $matches)) {
            $jsonContent = $matches[0];
            $decoded = json_decode($jsonContent, true);
            
            if (json_last_error() === JSON_ERROR_NONE && 
                isset($decoded['choices'][0]['message']['content'])) {
                $content = $decoded['choices'][0]['message']['content'];
                Log::info('从原始响应中提取到内容', [
                    'content_length' => strlen($content),
                    'content_preview' => substr($content, 0, 100)
                ]);
            } else if (json_last_error() === JSON_ERROR_NONE && 
                       isset($decoded['choices'][0]['message']['reasoning_content'])) {
                // 尝试获取 reasoning_content
                $content = $decoded['choices'][0]['message']['reasoning_content'];
                Log::info('从原始响应中提取到推理内容', [
                    'content_length' => strlen($content),
                    'content_preview' => substr($content, 0, 100)
                ]);
            }
        }
        
        if (empty($content)) {
            throw new Exception('流式响应为空，未接收到任何内容。原始响应长度: ' . strlen($result));
        }
        
        Log::info('流式请求完成', [
            'total_content_length' => strlen($content),
            'content_preview' => substr($content, 0, 100) . '...'
        ]);
        
        return $content;
    }

    /**
     * 处理流式响应
     *
     * @param \Illuminate\Http\Client\Response $response
     * @return string
     * @throws Exception
     */
    private function processStreamResponse($response): string
    {
        $content = '';
        $body = $response->body();
        
        // 按行分割流式响应
        $lines = explode("\n", $body);
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // 跳过空行和data: [DONE]
            if (empty($line) || $line === 'data: [DONE]') {
                continue;
            }
            
            // 处理data: 开头的行
            if (str_starts_with($line, 'data: ')) {
                $jsonData = substr($line, 6); // 移除 "data: " 前缀
                
                try {
                    $data = json_decode($jsonData, true);
                    
                    if (json_last_error() === JSON_ERROR_NONE && isset($data['choices'][0]['delta']['content'])) {
                        $content .= $data['choices'][0]['delta']['content'];
                        
                        // 记录流式接收的进度
                        Log::debug('流式接收内容片段', [
                            'fragment' => $data['choices'][0]['delta']['content'],
                            'total_length' => strlen($content)
                        ]);
                    }
                } catch (Exception $e) {
                    Log::warning('解析流式响应片段失败', [
                        'json_data' => $jsonData,
                        'error' => $e->getMessage()
                    ]);
                    continue;
                }
            }
        }
        
        if (empty($content)) {
            throw new Exception('流式响应解析失败，未获取到有效内容');
        }
        
        Log::info('流式响应处理完成', [
            'total_content_length' => strlen($content),
            'content_preview' => substr($content, 0, 100) . '...'
        ]);
        
        return $content;
    }

    /**
     * 带回调的流式响应处理
     *
     * @param \Illuminate\Http\Client\Response $response
     * @param callable|null $callback
     * @return string
     * @throws Exception
     */
    private function processStreamResponseWithCallback($response, callable $callback = null): string
    {
        $content = '';
        $body = $response->body();
        
        Log::info('开始处理流式响应', ['response_length' => strlen($body)]);
        
        // 按行分割流式响应
        $lines = explode("\n", $body);
        $lineCount = count($lines);
        
        Log::info('流式响应行数', ['total_lines' => $lineCount]);
        
        foreach ($lines as $index => $line) {
            $line = trim($line);
            
            // 跳过空行和data: [DONE]
            if (empty($line) || $line === 'data: [DONE]') {
                continue;
            }
            
            // 处理data: 开头的行
            if (str_starts_with($line, 'data: ')) {
                $jsonData = substr($line, 6);
                
                try {
                    $data = json_decode($jsonData, true);
                    
                    if (json_last_error() === JSON_ERROR_NONE && isset($data['choices'][0]['delta']['content'])) {
                        $fragment = $data['choices'][0]['delta']['content'];
                        $content .= $fragment;
                        
                        // 调用回调函数，实时返回内容片段
                        if ($callback && is_callable($callback)) {
                            $callback($fragment, $content, strlen($content));
                        }
                        
                        Log::debug('流式接收内容片段', [
                            'fragment' => $fragment,
                            'total_length' => strlen($content),
                            'line_number' => $index + 1
                        ]);
                    }
                } catch (Exception $e) {
                    Log::warning('解析流式响应片段失败', [
                        'json_data' => $jsonData,
                        'error' => $e->getMessage(),
                        'line_number' => $index + 1
                    ]);
                    continue;
                }
            } else {
                // 记录非标准格式的行，帮助调试
                Log::debug('非标准流式响应行', [
                    'line' => $line,
                    'line_number' => $index + 1
                ]);
            }
        }
        
        if (empty($content)) {
            Log::error('流式响应解析失败', [
                'total_lines' => $lineCount,
                'response_body' => substr($body, 0, 500) . '...',
                'lines_sample' => array_slice($lines, 0, 5)
            ]);
            throw new Exception('流式响应解析失败，未获取到有效内容。响应行数: ' . $lineCount);
        }
        
        Log::info('流式响应处理完成', [
            'total_content_length' => strlen($content),
            'content_preview' => substr($content, 0, 100) . '...',
            'total_lines_processed' => $lineCount
        ]);
        
        return $content;
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
