<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Symfony\Component\Yaml\Yaml;
use Symfony\Component\Yaml\Exception\ParseException;

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
     * 访问器：获取包含 zindex 的 YAML 脚本
     */
    // public function getAnimationScriptAttribute($value)
    // {
    //     try {
    //         // 解析现有的 YAML 脚本
    //         $parsed = Yaml::parse($value);

    //         // 添加 zindex 字段（使用 layer_order 的值）
    //         $parsed['zindex'] = $this->layer_order;

    //         // 重新转换为 YAML 字符串
    //         return Yaml::dump($parsed, 2, 2, Yaml::DUMP_MULTI_LINE_LITERAL_BLOCK);
    //     } catch (ParseException $e) {
    //         // 如果解析失败，返回原始脚本
    //         return $value;
    //     }
    // }

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

        try {
            // 使用 Symfony YAML 解析器验证格式
            Yaml::parse($script);
            return ['valid' => true, 'message' => '脚本格式正确'];
        } catch (ParseException $e) {
            return [
                'valid' => false,
                'message' => 'YAML 格式错误: ' . $e->getMessage()
            ];
        }
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

        try {
            // 使用 Symfony YAML 解析器直接解析为数组
            return Yaml::parse($script);
        } catch (ParseException $e) {
            // 解析失败时返回空数组
            return [];
        }
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
