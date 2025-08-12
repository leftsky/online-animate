<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SceneContent extends Model
{
    /**
     * 表名
     */
    protected $table = 'scene_contents';

    /**
     * 可填充字段
     */
    protected $fillable = [
        'scene_id',
        'element_name',
        'element_type',
        'element_source',
        'animation_script',
        'layer_order',
        'status'
    ];

    /**
     * 字段类型转换
     */
    protected $casts = [
        'scene_id' => 'integer',
        'layer_order' => 'integer',
        'status' => 'integer'
    ];

    /**
     * 按分镜ID筛选
     */
    public function scopeByScene($query, $sceneId)
    {
        return $query->where('scene_id', $sceneId);
    }

    /**
     * 按元素类型筛选
     */
    public function scopeByType($query, $type)
    {
        return $query->where('element_type', $type);
    }

    /**
     * 按图层顺序排序
     */
    public function scopeOrderByLayer($query)
    {
        return $query->orderBy('layer_order', 'asc');
    }

    /**
     * 验证动画脚本格式
     */
    public function validateAnimationScript($script = null)
    {
        $script = $script ?: $this->animation_script;
        
        if (empty($script)) {
            return ['valid' => true, 'message' => '脚本为空'];
        }

        // 基本格式验证
        $lines = explode("\n", trim($script));
        $hasValidStructure = false;
        
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            // 检查是否包含基本的动画属性
            if (strpos($line, 'duration:') !== false || 
                strpos($line, 'keyframes:') !== false ||
                strpos($line, 'easing:') !== false) {
                $hasValidStructure = true;
                break;
            }
        }

        if (!$hasValidStructure) {
            return [
                'valid' => false, 
                'message' => '动画脚本格式不正确，缺少必要的动画属性'
            ];
        }

        return ['valid' => true, 'message' => '脚本格式正确'];
    }

    /**
     * 解析动画脚本为数组
     */
    public function parseAnimationScript($script = null)
    {
        $script = $script ?: $this->animation_script;
        
        if (empty($script)) {
            return [];
        }

        $parsed = [];
        $lines = explode("\n", trim($script));
        $currentSection = null;
        
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            // 解析键值对
            if (strpos($line, ':') !== false && !preg_match('/^\s*-/', $line)) {
                [$key, $value] = explode(':', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                if ($key === 'keyframes') {
                    $currentSection = 'keyframes';
                    $parsed[$key] = [];
                } else {
                    $parsed[$key] = $value;
                }
            }
            // 解析关键帧
            elseif ($currentSection === 'keyframes' && preg_match('/^\s*-\s*(.+)/', $line, $matches)) {
                $keyframeData = trim($matches[1]);
                $keyframe = [];
                
                // 解析关键帧属性
                $attributes = explode(',', $keyframeData);
                foreach ($attributes as $attr) {
                    if (strpos($attr, ':') !== false) {
                        [$attrKey, $attrValue] = explode(':', $attr, 2);
                        $keyframe[trim($attrKey)] = trim($attrValue);
                    }
                }
                
                if (!empty($keyframe)) {
                    $parsed['keyframes'][] = $keyframe;
                }
            }
        }
        
        return $parsed;
    }

    /**
     * 获取下一个可用的图层顺序
     */
    public static function getNextLayerOrder($sceneId)
    {
        $maxOrder = static::where('scene_id', $sceneId)->max('layer_order');
        return ($maxOrder ?: 0) + 1;
    }
}