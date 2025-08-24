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
        Schema::create('media_animations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->comment('用户ID（可为空）');
            $table->string('name')->comment('动画名称');
            $table->string('description', 1024)->nullable()->comment('动画描述');
            $table->tinyInteger('status')->default(1)->comment('状态: 0=禁用, 1=启用');
            
            // 动画核心数据
            $table->decimal('duration', 8, 3)->comment('动画时长(秒)');
            $table->integer('frame_count')->comment('总帧数');
            $table->string('loop_type')->default('none')->comment('循环类型: none, loop, pingpong');
            
            // 动画轨道数据
            $table->json('animation_tracks')->comment('动画轨道数据(JSON)');
            
            // 源文件信息
            $table->string('source_file_url')->nullable()->comment('源文件URL');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_animations');
    }
};
