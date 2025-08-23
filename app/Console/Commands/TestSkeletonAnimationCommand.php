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
    protected $signature = 'test:skeleton-animation {text : 动作描述文本}';

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
        
        $this->info("🚀 开始测试AI驱动的骨骼动画服务...");
        $this->info("📝 输入文本: {$text}");
        $this->newLine();

        try {
            $startTime = microtime(true);
            
            $result = $this->skeletonAnimationService->generateAnimation($text);
            
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
            $this->info("🎬 动画帧信息:");
            $frames = $result['animation_data']['frames'];
            $sampleFrames = array_slice($frames, 0, 3); // 只显示前3帧作为示例
            
            foreach ($sampleFrames as $frame) {
                $this->line("帧 {$frame['frame']} (时间: {$frame['time']}s):");
                foreach ($frame['bones'] as $boneName => $boneData) {
                    if (isset($boneData['rotation'])) {
                        $rotation = $boneData['rotation'];
                        if (is_array($rotation)) {
                            $this->line("  - {$boneName}: 旋转 [" . implode(', ', array_map('number_format', $rotation, array_fill(0, count($rotation), 2))) . "]°");
                        } else {
                            $this->line("  - {$boneName}: 旋转 " . number_format($rotation, 2) . "°");
                        }
                    }
                    if (isset($boneData['position'])) {
                        $position = $boneData['position'];
                        if (is_array($position)) {
                            $this->line("  - {$boneName}: 位置 [" . implode(', ', array_map('number_format', $position, array_fill(0, count($position), 2))) . "]");
                        } else {
                            $this->line("  - {$boneName}: 位置 " . number_format($position, 2));
                        }
                    }
                }
                $this->newLine();
            }

            if (count($frames) > 3) {
                $this->line("... 还有 " . (count($frames) - 3) . " 帧");
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
