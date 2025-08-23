<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * AI骨骼动画模型
 * 
 * @property int $id
 * @property string $name 动画名称
 * @property string|null $description 动画描述
 * @property string $prompt AI生成提示词
 * @property string $animation_data 动画数据(JSON格式)
 * @property string $skeleton_data 骨骼数据(JSON格式)
 * @property float $duration 动画时长(秒)
 * @property float $confidence AI置信度(0-1)
 * @property string|null $error_message 错误信息
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class AiSkeletonAnimation extends Model
{
    use HasFactory;

    /**
     * 与模型关联的表名
     */
    protected $table = 'ai_skeleton_animations';

    /**
     * 可以批量赋值的属性
     */
    protected $fillable = [
        'name',
        'description',
        'prompt',
        'animation_data',
        'skeleton_data',
        'duration',
        'confidence',
        'error_message',
    ];

    /**
     * 应该被转换为日期的属性
     */
    protected $dates = [
        'created_at',
        'updated_at',
    ];

    /**
     * 应该被转换为数组的属性
     */
    protected $casts = [
        'duration' => 'decimal:3',
        'confidence' => 'decimal:4',
        'animation_data' => 'array',
        'skeleton_data' => 'array',
    ];

    /**
     * 获取置信度百分比
     */
    public function getConfidencePercentageAttribute(): string
    {
        return round($this->confidence * 100, 1) . '%';
    }

    /**
     * 获取时长格式化
     */
    public function getDurationFormattedAttribute(): string
    {
        return round($this->duration, 3) . 's';
    }

    /**
     * 检查是否成功
     */
    public function isSuccessful(): bool
    {
        return empty($this->error_message);
    }

    /**
     * 检查是否失败
     */
    public function isFailed(): bool
    {
        return !empty($this->error_message);
    }

    /**
     * 作用域：成功的动画
     */
    public function scopeSuccessful($query)
    {
        return $query->whereNull('error_message');
    }

    /**
     * 作用域：失败的动画
     */
    public function scopeFailed($query)
    {
        return $query->whereNotNull('error_message');
    }

    /**
     * 作用域：按置信度排序
     */
    public function scopeOrderByConfidence($query, $direction = 'desc')
    {
        return $query->orderBy('confidence', $direction);
    }

    /**
     * 作用域：按时长排序
     */
    public function scopeOrderByDuration($query, $direction = 'desc')
    {
        return $query->orderBy('duration', $direction);
    }
}
