<?php

namespace App\Console\Commands;

use App\Services\SkeletonAnimationService;
use Illuminate\Console\Command;

/**
 * 测试骨骼动画服务的命令
 */
class TestSkeletonAnimationCommand extends Command
{
    /**
     * 命令名称
     *
     * @var string
     */
    protected $signature = 'test:skeleton-animation {text : 动作描述文本} {--stream : 启用流式输出}';

    /**
     * 命令描述
     *
     * @var string
     */
    protected $description = '测试骨骼动画服务，使用DeepSeek API生成动画';

    /**
     * 骨骼动画服务实例
     *
     * @var SkeletonAnimationService
     */
    protected SkeletonAnimationService $skeletonAnimationService;

    /**
     * 构造函数
     *
     * @param SkeletonAnimationService $skeletonAnimationService
     */
    public function __construct(SkeletonAnimationService $skeletonAnimationService)
    {
        parent::__construct();
        $this->skeletonAnimationService = $skeletonAnimationService;
    }

    /**
     * 执行命令
     *
     * @return int
     */
    public function handle(): int
    {
        $text = $this->argument('text');
        $isStream = $this->option('stream');
        
        // 设置输出缓冲区，支持实时输出
        if ($isStream) {
            // 禁用输出缓冲
            if (ob_get_level()) {
                ob_end_clean();
            }
            
            // 设置无缓冲输出
            if (function_exists('apache_setenv')) {
                @apache_setenv('no-gzip', 1);
            }
            
            // 设置HTTP头，禁用缓冲
            if (!headers_sent()) {
                header('Content-Type: text/plain; charset=utf-8');
                header('Cache-Control: no-cache');
                header('X-Accel-Buffering: no');
            }
        }
        
        $this->info("🚀 开始测试AI驱动的骨骼动画服务...");
        $this->info("📝 输入文本: {$text}");
        $this->info("🔄 流式输出: " . ($isStream ? '启用' : '禁用'));
        $this->newLine();

        try {
            $startTime = microtime(true);
            
            if ($isStream) {
                $this->info("🔄 开始流式生成动画...");
                $this->newLine();
                
                $result = $this->skeletonAnimationService->generateAnimationStream(
                    $text, 
                    [], 
                    function(string $fragment, string $content, int $length) {
                        // 实时输出每个内容片段
                        $this->output->write($fragment);
                        
                        // 强制刷新输出
                        if (function_exists('flush')) {
                            flush();
                        }
                        
                        // 每100个字符换行一次，避免输出过长
                        if ($length % 100 === 0) {
                            $this->newLine();
                        }
                    }
                );
                
                $this->newLine(2);
                $this->info("✅ 流式生成完成！");
            } else {
                $result = $this->skeletonAnimationService->generateAnimation($text);
            }
            
            $endTime = microtime(true);
            $processingTime = ($endTime - $startTime) * 1000; // 转换为毫秒

            $this->info("✅ AI动画生成成功！");
            $this->newLine();

            // 显示基本信息
            $this->table(
                ['属性', '值'],
                [
                    ['动作类型', $result['metadata']['action_type']],
                    ['置信度', number_format($result['metadata']['confidence'], 2)],
                    ['动画时长', $result['animation_data']['duration'] . ' 秒'],
                    ['总帧数', $result['animation_data']['total_frames']],
                    ['处理时间', number_format($processingTime, 2) . ' ms'],
                ]
            );

            // 显示AI分析结果
            if (isset($result['metadata']['ai_analysis'])) {
                $aiAnalysis = $result['metadata']['ai_analysis'];
                $this->newLine();
                $this->info("🤖 AI 分析结果:");
                $this->table(
                    ['分析项', '结果'],
                    [
                        ['动作类型', $aiAnalysis['action_type']],
                        ['置信度', number_format($aiAnalysis['confidence'], 2)],
                        ['时长', $aiAnalysis['duration'] . ' 秒'],
                        ['速度', number_format($aiAnalysis['speed'], 2)],
                        ['强度', number_format($aiAnalysis['intensity'], 2)],
                        ['方向', $aiAnalysis['direction']],
                        ['风格', $aiAnalysis['style']],
                    ]
                );

                if (!empty($aiAnalysis['description'])) {
                    $this->newLine();
                    $this->info("📝 动作描述:");
                    $this->line($aiAnalysis['description']);
                }

                if (!empty($aiAnalysis['bones_affected'])) {
                    $this->newLine();
                    $this->info("🦴 受影响的骨骼:");
                    foreach ($aiAnalysis['bones_affected'] as $bone) {
                        $this->line("• {$bone}");
                    }
                }

                if (!empty($aiAnalysis['special_effects'])) {
                    $this->newLine();
                    $this->info("✨ 特殊效果:");
                    $this->line($aiAnalysis['special_effects']);
                }

                if (!empty($aiAnalysis['suggestions'])) {
                    $this->newLine();
                    $this->info("💡 改进建议:");
                    foreach ($aiAnalysis['suggestions'] as $suggestion) {
                        $this->line("• {$suggestion}");
                    }
                }
            }

            // 显示动画帧信息
            $this->newLine();
            $this->info("🎬 动画轨道信息:");
            
            if (isset($result['animation_data']['tracks'])) {
                $tracks = $result['animation_data']['tracks'];
                $this->line("总轨道数: " . count($tracks));
                
                foreach ($tracks as $index => $track) {
                    $this->newLine();
                    $trackNumber = $index + 1;
                    $this->line("轨道 {$trackNumber}: {$track['name']}");
                    $this->line("  时间轴: [" . implode(', ', array_map('number_format', $track['times'], array_fill(0, count($track['times']), 2))) . "] 秒");
                    
                    if (isset($track['rotations']) && count($track['rotations']) > 0) {
                        $this->line("  旋转关键帧数: " . count($track['rotations']));
                        // 显示前3个旋转关键帧
                        $sampleRotations = array_slice($track['rotations'], 0, 3);
                        foreach ($sampleRotations as $i => $rotation) {
                            $this->line("    帧 {$i}: [" . implode(', ', array_map('number_format', $rotation, array_fill(0, count($rotation), 3))) . "]");
                        }
                        if (count($track['rotations']) > 3) {
                            $this->line("    ... 还有 " . (count($track['rotations']) - 3) . " 个旋转关键帧");
                        }
                    }
                    
                    if (isset($track['positions']) && count($track['positions']) > 0) {
                        $this->line("  位置关键帧数: " . count($track['positions']));
                        // 显示前3个位置关键帧
                        $samplePositions = array_slice($track['positions'], 0, 3);
                        foreach ($samplePositions as $i => $position) {
                            $this->line("    帧 {$i}: [" . implode(', ', array_map('number_format', $position, array_fill(0, count($position), 3))) . "]");
                        }
                        if (count($track['positions']) > 3) {
                            $this->line("    ... 还有 " . (count($track['positions']) - 3) . " 个位置关键帧");
                        }
                    }
                }
            } else {
                $this->line("❌ 未找到轨道数据");
            }

            // 显示Three.js兼容性信息
            $this->newLine();
            $this->info("🔧 Three.js 兼容性检查:");
            
            $isCompatible = true;
            $compatibilityIssues = [];
            
            if (isset($result['animation_data']['tracks'])) {
                $tracks = $result['animation_data']['tracks'];
                
                foreach ($tracks as $track) {
                    // 检查必要字段
                    if (!isset($track['name']) || !isset($track['times'])) {
                        $isCompatible = false;
                        $compatibilityIssues[] = "轨道缺少必要字段: name 或 times";
                        continue;
                    }
                    
                    // 检查时间轴
                    if (count($track['times']) < 2) {
                        $isCompatible = false;
                        $compatibilityIssues[] = "轨道 {$track['name']} 时间轴关键帧不足";
                    }
                    
                    // 检查旋转数据
                    if (isset($track['rotations'])) {
                        foreach ($track['rotations'] as $rotation) {
                            if (!is_array($rotation) || count($rotation) !== 4) {
                                $isCompatible = false;
                                $compatibilityIssues[] = "轨道 {$track['name']} 旋转数据格式错误，需要4个值 [x,y,z,w]";
                                break;
                            }
                        }
                    }
                    
                    // 检查位置数据
                    if (isset($track['positions'])) {
                        foreach ($track['positions'] as $position) {
                            if (!is_array($position) || count($position) !== 3) {
                                $isCompatible = false;
                                $compatibilityIssues[] = "轨道 {$track['name']} 位置数据格式错误，需要3个值 [x,y,z]";
                                break;
                            }
                        }
                    }
                }
            } else {
                $isCompatible = false;
                $compatibilityIssues[] = "缺少轨道数据";
            }
            
            if ($isCompatible) {
                $this->line("✅ 数据格式完全兼容 Three.js");
                $this->line("✅ 可以直接调用 addCustomAnimation() 方法");
            } else {
                $this->line("❌ 数据格式存在兼容性问题:");
                foreach ($compatibilityIssues as $issue) {
                    $this->line("   • {$issue}");
                }
            }

            // 显示标准骨骼信息
            $this->newLine();
            $this->info("🦴 标准 Mixamo 骨骼系统:");
            $this->line("本服务使用标准的 Mixamo 骨骼名称，包含 49 个骨骼节点");
            $this->line("主要骨骼组：");
            $this->line("• 躯干: Hips, Spine, Neck, Head");
            $this->line("• 左臂: LeftShoulder, LeftArm, LeftForeArm, LeftHand + 手指");
            $this->line("• 右臂: RightShoulder, RightArm, RightForeArm, RightHand + 手指");
            $this->line("• 左腿: LeftUpLeg, LeftLeg, LeftFoot, LeftToeBase");
            $this->line("• 右腿: RightUpLeg, RightLeg, RightFoot, RightToeBase");

            return 0;

        } catch (\Exception $e) {
            $this->error("❌ 动画生成失败: " . $e->getMessage());
            $this->newLine();
            $this->error("错误详情:");
            $this->line($e->getTraceAsString());
            
            return 1;
        }
    }
}
