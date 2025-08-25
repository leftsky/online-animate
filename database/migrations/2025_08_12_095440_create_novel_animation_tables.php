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
        // 1. 创建小说表
        Schema::create('novels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->comment('用户ID');
            $table->string('title')->comment('小说标题');
            $table->text('description')->nullable()->comment('小说描述');
            $table->string('author')->comment('作者');
            $table->string('cover_image')->nullable()->comment('封面图片路径');
            $table->string('source_file_url')->nullable()->comment('源文件地址');
            $table->tinyInteger('status')->default(0)->comment('状态: 0=草稿, 1=发布, 2=归档');
            $table->timestamps();
        });

        // 2. 创建章节表
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('novel_id')->comment('小说ID');
            $table->string('title')->comment('章节标题');
            $table->longText('content')->nullable()->comment('章节文本内容');
            $table->integer('word_count')->default(0)->comment('章节字数');
            $table->integer('chapter_number')->default(0)->comment('章节序号');
            $table->integer('order')->default(0)->comment('章节顺序');
            $table->tinyInteger('status')->default(0)->comment('状态: 0=草稿, 1=发布');
            $table->timestamps();
        });

        // 3. 创建视频表
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('chapter_id')->comment('章节ID');
            $table->string('title')->comment('视频标题');
            $table->text('description')->nullable()->comment('视频描述');
            $table->integer('duration')->default(0)->comment('预计时长(秒)');
            $table->string('resolution')->default('1080p')->comment('分辨率');
            $table->integer('fps')->default(30)->comment('帧率');
            $table->integer('order')->default(0)->comment('在章节中的顺序');
            $table->tinyInteger('status')->default(0)->comment('状态: 0=草稿, 1=制作中, 2=完成');
            $table->timestamps();
        });

        // 4. 创建分镜表
        Schema::create('scenes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('video_id')->comment('视频ID');
            $table->string('title')->comment('分镜标题');
            $table->text('description')->nullable()->comment('分镜描述');
            $table->text('lens_description')->nullable()->comment('镜头师描述');
            $table->decimal('duration', 8, 2)->default(0)->comment('分镜时长(秒)');
            // $table->string('background_image')->nullable()->comment('背景图片路径');
            // $table->string('background_color')->nullable()->comment('背景颜色(hex)');
            $table->integer('order')->default(0)->comment('分镜顺序');
            $table->tinyInteger('status')->default(0)->comment('状态: 0=草稿, 1=完成');
            $table->timestamps();
        });

        // 5. 创建分镜内容表
        Schema::create('scene_contents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('scene_id')->comment('分镜ID');
            $table->string('element_name')->comment('元素名称(如 image1, image2)');
            $table->string('element_type')->comment('元素类型(image/text/shape等)');
            $table->string('element_source')->nullable()->comment('元素资源路径');
            $table->longText('animation_script')->nullable()->comment('动画脚本(原始脚本格式)');
            $table->integer('layer_order')->default(0)->comment('图层顺序(z-index)');
            $table->tinyInteger('status')->default(0)->comment('状态: 0=草稿, 1=完成');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 按相反顺序删除表
        Schema::dropIfExists('scene_contents');
        Schema::dropIfExists('scenes');
        Schema::dropIfExists('videos');
        Schema::dropIfExists('chapters');
        Schema::dropIfExists('novels');
    }
};