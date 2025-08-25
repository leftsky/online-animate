<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chapter extends Model
{
    use HasFactory;

    protected $fillable = [
        'novel_id',
        'title',
        'content',
        'word_count',
        'chapter_number',
        'status',
    ];

    protected $casts = [
        'word_count' => 'integer',
        'chapter_number' => 'integer',
        'status' => 'integer',
    ];

    /**
     * 获取章节所属的小说
     */
    public function novel()
    {
        return $this->belongsTo(Novel::class);
    }
}
