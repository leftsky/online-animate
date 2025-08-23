<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 创建AI骨骼动画表
        Schema::create('ai_skeleton_animations', function (Blueprint $table) {
            $table->id();
            // $table->unsignedBigInteger('user_id')->comment('用户ID');
            $table->string('name')->comment('动画名称');
            $table->text('description')->nullable()->comment('动画描述');
            $table->text('prompt')->comment('AI生成提示词');
            $table->text('animation_data')->comment('动画数据(JSON格式)');
            $table->text('skeleton_data')->comment('骨骼数据(JSON格式)');
            $table->decimal('duration', 8, 3)->comment('动画时长(秒)');
            $table->decimal('confidence', 5, 4)->comment('AI置信度(0-1)');
            $table->text('error_message')->nullable()->comment('错误信息');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_skeleton_animations');
    }
};
