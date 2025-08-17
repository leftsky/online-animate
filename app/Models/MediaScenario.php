<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaScenario extends Model
{
    use HasFactory;

    /**
     * 与模型关联的表名
     */
    protected $table = 'media_scenarios';

    /**
     * 可以批量赋值的属性
     */
    protected $fillable = [
        'user_id',
        'name',
        'image_path',
        'description',
        'generation_prompt',
        'category',
        'tags',
        'status',
    ];

    /**
     * 应该被转换为原生类型的属性
     */
    protected $casts = [
        'tags' => 'array',
        'status' => 'integer',
    ];

    /**
     * 获取用户
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttribute(): string
    {
        return $this->status === 1 ? '启用' : '禁用';
    }

    /**
     * 获取标签文本
     */
    public function getTagsTextAttribute(): string
    {
        if (empty($this->tags)) {
            return '';
        }
        return implode(', ', $this->tags);
    }

    /**
     * 范围：启用的场景
     */
    public function scopeEnabled($query)
    {
        return $query->where('status', 1);
    }

    /**
     * 范围：按分类筛选
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * 范围：按用户筛选
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * 范围：搜索名称或描述
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhere('generation_prompt', 'like', "%{$search}%");
        });
    }
}
