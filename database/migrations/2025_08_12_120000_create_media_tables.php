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
        // 1. 创建场景表
        Schema::create('media_scenarios', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->comment('用户ID');
            $table->string('name')->comment('场景名称');
            $table->string('image_path')->nullable()->comment('场景图片路径');
            $table->string('description', 1024)->nullable()->comment('场景描述');
            $table->string('generation_prompt', 5120)->nullable()->comment('场景生成词/提示词');
            $table->string('category')->nullable()->comment('场景分类');
            $table->json('tags')->nullable()->comment('场景标签');
            $table->tinyInteger('status')->default(1)->comment('状态: 0=禁用, 1=启用');
            $table->timestamps();
        });

        // 2. 创建人物表
        Schema::create('media_characters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->comment('用户ID');
            $table->string('name')->comment('人物名称');
            $table->tinyInteger('gender')->default(0)->comment('人物性别: 0=未知, 1=男性, 2=女性, 3=其他');
            $table->integer('age')->nullable()->comment('人物年龄');
            $table->string('image_path')->nullable()->comment('人物图片路径');
            $table->json('additional_resources')->nullable()->comment('人物额外资源(JSON格式)');
            $table->string('description', 1024)->nullable()->comment('人物描述');
            $table->string('personality')->nullable()->comment('性格特征');
            $table->string('occupation')->nullable()->comment('职业');
            $table->json('tags')->nullable()->comment('人物标签');
            $table->tinyInteger('status')->default(1)->comment('状态: 0=禁用, 1=启用');
            $table->timestamps();
        });

        // 3. 创建物品表
        Schema::create('media_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->comment('用户ID');
            $table->string('name')->comment('物品名称');
            $table->string('image_path')->nullable()->comment('物品图片路径');
            $table->string('description', 1024)->nullable()->comment('物品描述');
            $table->string('generation_prompt', 5120)->nullable()->comment('物品生成词/提示词');
            $table->string('category')->nullable()->comment('物品分类');
            $table->string('type')->nullable()->comment('物品类型');
            $table->json('properties')->nullable()->comment('物品属性(JSON格式)');
            $table->json('tags')->nullable()->comment('物品标签');
            $table->tinyInteger('status')->default(1)->comment('状态: 0=禁用, 1=启用');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 按相反顺序删除表
        Schema::dropIfExists('media_items');
        Schema::dropIfExists('media_characters');
        Schema::dropIfExists('media_scenarios');
    }
};
