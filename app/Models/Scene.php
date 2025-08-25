<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Scene extends Model
{
    use HasFactory;

    protected $fillable = [
        'video_id',
        'title',
        'description',
        'lens_description',
        'duration',
        'order',
        'status',
    ];

    protected $casts = [
        'duration' => 'decimal:2',
        'order' => 'integer',
        'status' => 'integer',
    ];

    /**
     * 获取分镜所属的视频
     */
    public function video()
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * 获取分镜的所有内容元素
     */
    public function sceneContents()
    {
        return $this->hasMany(SceneContent::class)->orderBy('layer_order');
    }

    /**
     * 获取分镜所属的章节（通过视频）
     */
    public function chapter()
    {
        return $this->hasOneThrough(Chapter::class, Video::class, 'id', 'id', 'video_id', 'chapter_id');
    }

    /**
     * 状态常量
     */
    const STATUS_DRAFT = 0;        // 草稿
    const STATUS_COMPLETED = 1;    // 完成

    /**
     * 获取状态文本
     */
    public function getStatusTextAttribute()
    {
        return match($this->status) {
            self::STATUS_DRAFT => '草稿',
            self::STATUS_COMPLETED => '完成',
            default => '未知',
        };
    }

    /**
     * 检查是否为草稿状态
     */
    public function isDraft()
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * 检查是否已完成
     */
    public function isCompleted()
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * 获取分镜总时长（秒）
     */
    public function getDurationInSecondsAttribute()
    {
        return (float) $this->duration;
    }

    /**
     * 获取分镜总时长（格式化）
     */
    public function getFormattedDurationAttribute()
    {
        $seconds = $this->getDurationInSecondsAttribute();
        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;
        
        if ($minutes > 0) {
            return sprintf('%d分%d秒', $minutes, $remainingSeconds);
        }
        
        return sprintf('%.1f秒', $remainingSeconds);
    }
}
