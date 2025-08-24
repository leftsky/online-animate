<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaAnimation extends Model
{
    use HasFactory;

    /**
     * 与模型关联的表名
     */
    protected $table = 'media_animations';

    /**
     * 可以批量赋值的属性
     */
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'status',
        'duration',
        'frame_count',
        'loop_type',
        'animation_tracks',
        'source_file_url',
    ];

    /**
     * 应该被转换为原生类型的属性
     */
    protected $casts = [
        'user_id' => 'integer',
        'status' => 'integer',
        'duration' => 'decimal:3',
        'frame_count' => 'integer',
        'animation_tracks' => 'array',
    ];

    /**
     * 状态常量
     */
    const STATUS_DISABLED = 0;
    const STATUS_ENABLED = 1;

    /**
     * 循环类型常量
     */
    const LOOP_TYPE_NONE = 'none';
    const LOOP_TYPE_LOOP = 'loop';
    const LOOP_TYPE_PINGPONG = 'pingpong';

    /**
     * 获取用户
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttribute(): string
    {
        return $this->status === self::STATUS_ENABLED ? '启用' : '禁用';
    }

    /**
     * 获取循环类型文本
     */
    public function getLoopTypeTextAttribute(): string
    {
        return match($this->loop_type) {
            self::LOOP_TYPE_LOOP => '循环',
            self::LOOP_TYPE_PINGPONG => '往返',
            default => '不循环',
        };
    }

    /**
     * 范围：启用的动画
     */
    public function scopeEnabled($query)
    {
        return $query->where('status', self::STATUS_ENABLED);
    }

    /**
     * 范围：按用户筛选
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * 范围：系统动画（无用户ID）
     */
    public function scopeSystem($query)
    {
        return $query->whereNull('user_id');
    }

    /**
     * 范围：搜索名称或描述
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }
}
