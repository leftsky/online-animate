<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Novel extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'author',
        'cover_image',
        'source_file_url',
        'status',
    ];

    protected $casts = [
        'status' => 'integer',
    ];

    /**
     * 获取小说的所有章节
     */
    public function chapters()
    {
        return $this->hasMany(Chapter::class);
    }

    /**
     * 获取小说的用户
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
