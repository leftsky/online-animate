<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaCharacter extends Model
{
    use HasFactory;

    /**
     * 与模型关联的表名
     */
    protected $table = 'media_characters';

    /**
     * 可以批量赋值的属性
     */
    protected $fillable = [
        'user_id',
        'name',
        'gender',
        'age',
        'image_path',
        'additional_resources',
        'description',
        'personality',
        'occupation',
        'tags',
        'status',
    ];

    /**
     * 应该被转换为原生类型的属性
     */
    protected $casts = [
        'additional_resources' => 'array',
        'tags' => 'array',
        'gender' => 'integer',
        'age' => 'integer',
        'status' => 'integer',
    ];

    /**
     * 性别常量
     */
    const GENDER_UNKNOWN = 0;
    const GENDER_MALE = 1;
    const GENDER_FEMALE = 2;
    const GENDER_OTHER = 3;

    /**
     * 获取用户
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 获取性别文本
     */
    public function getGenderTextAttribute(): string
    {
        return match($this->gender) {
            self::GENDER_MALE => '男性',
            self::GENDER_FEMALE => '女性',
            self::GENDER_OTHER => '其他',
            default => '未知',
        };
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
     * 范围：启用的角色
     */
    public function scopeEnabled($query)
    {
        return $query->where('status', 1);
    }

    /**
     * 范围：按性别筛选
     */
    public function scopeByGender($query, $gender)
    {
        return $query->where('gender', $gender);
    }

    /**
     * 范围：按年龄范围筛选
     */
    public function scopeByAgeRange($query, $minAge, $maxAge)
    {
        return $query->whereBetween('age', [$minAge, $maxAge]);
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
              ->orWhere('personality', 'like', "%{$search}%")
              ->orWhere('occupation', 'like', "%{$search}%");
        });
    }
}
