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
        Schema::create('users', function (Blueprint $table) {
            $table->id()->comment('用户ID，主键');
            $table->string('name')->unique()->comment('用户名，唯一索引');
            $table->string('avatar')->nullable()->comment('用户头像');
            $table->string('nickname')->nullable()->comment('用户昵称');
            $table->string('phone')->nullable()->comment('用户手机号');
            $table->string('email')->unique()->comment('邮箱地址，唯一索引');
            $table->timestamp('email_verified_at')->nullable()->comment('邮箱验证时间');
            $table->string('password')->comment('密码（加密存储）');
            $table->rememberToken()->comment('记住我令牌');
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary()->comment('邮箱地址，主键');
            $table->string('token')->comment('重置密码令牌');
            $table->timestamp('created_at');
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary()->comment('会话ID，主键');
            $table->foreignId('user_id')->nullable()->index()->comment('用户ID，外键');
            $table->string('ip_address', 45)->nullable()->comment('IP地址');
            $table->text('user_agent')->nullable()->comment('用户代理信息');
            $table->longText('payload')->comment('会话数据');
            $table->integer('last_activity')->index()->comment('最后活动时间');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
