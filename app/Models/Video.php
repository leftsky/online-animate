<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    use HasFactory;

    protected $fillable = [
        'chapter_id',
        'title',
        'description',
        'duration',
        'resolution',
        'fps',
        'order',
        'status',
    ];

    protected $casts = [
        'duration' => 'integer',
        'fps' => 'integer',
        'order' => 'integer',
        'status' => 'integer',
    ];

    /**
     * 获取视频所属的章节
     */
    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * 获取视频的所有分镜
     */
    public function scenes()
    {
        return $this->hasMany(Scene::class)->orderBy('order');
    }

    /**
     * 获取视频的所有分镜内容
     */
    public function sceneContents()
    {
        return $this->hasManyThrough(SceneContent::class, Scene::class);
    }

    /**
     * 状态常量
     */
    const STATUS_DRAFT = 0;        // 草稿
    const STATUS_PRODUCING = 1;    // 制作中
    const STATUS_COMPLETED = 2;    // 完成

    /**
     * 获取状态文本
     */
    public function getStatusTextAttribute()
    {
        return match($this->status) {
            self::STATUS_DRAFT => '草稿',
            self::STATUS_PRODUCING => '制作中',
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
     * 检查是否正在制作中
     */
    public function isProducing()
    {
        return $this->status === self::STATUS_PRODUCING;
    }

    /**
     * 检查是否已完成
     */
    public function isCompleted()
    {
        return $this->status === self::STATUS_COMPLETED;
    }
}
