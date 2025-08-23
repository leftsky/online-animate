# 骨骼动画服务 (SkeletonAnimationService)

## 概述

这是一个基于 Laravel 的骨骼动画生成服务，使用 DeepSeek API 进行自然语言理解，将用户的自然语言描述转换为结构化的骨骼动画数据。

## 功能特性

- 🤖 **AI 驱动**: 使用 DeepSeek API 进行自然语言理解
- 🎬 **智能解析**: 自动识别动作类型、速度、强度等参数
- 🔄 **回退机制**: 当 AI 分析失败时，自动回退到模式匹配
- 📊 **详细分析**: 提供置信度、建议和改进方案
- 🎯 **多种动作**: 支持走路、跑步、跳跃、挥手等多种动作类型
- ⚡ **高性能**: 生成 30fps 的流畅动画帧

## 安装和配置

### 1. 服务提供者

确保在 `config/app.php` 中注册了服务提供者：

```php
'providers' => [
    // ... 其他提供者
    App\Providers\SkeletonAnimationServiceProvider::class,
],
```

### 2. API 密钥配置

在 `SkeletonAnimationService` 类中配置你的 DeepSeek API 密钥：

```php
protected $deepseek_api_key = "your-api-key-here";
```

## 使用方法

### 1. 基本使用

```php
use App\Services\SkeletonAnimationService;

$service = new SkeletonAnimationService();

// 生成动画
$result = $service->generateAnimation("快速走路3秒");
```

### 2. 带选项的使用

```php
$options = [
    'duration' => 3.0,
    'speed' => 1.5,
    'intensity' => 1.2,
    'style' => 'exaggerated'
];

$result = $service->generateAnimation("优雅地跳舞", $options);
```

### 3. 通过依赖注入使用

```php
public function __construct(SkeletonAnimationService $skeletonService)
{
    $this->skeletonService = $skeletonService;
}

public function createAnimation(Request $request)
{
    $result = $this->skeletonService->generateAnimation($request->text);
    return response()->json($result);
}
```

## API 接口

### 生成动画

```
POST /web/api/skeleton-animation/generate
```

**请求参数:**
```json
{
    "text": "快速走路3秒",
    "duration": 3.0,
    "speed": 1.5,
    "intensity": 1.2,
    "style": "exaggerated"
}
```

**响应示例:**
```json
{
    "success": true,
    "data": {
        "animation_data": {
            "frames": [...],
            "duration": 3.0,
            "loop": true,
            "fps": 30,
            "total_frames": 90
        },
        "metadata": {
            "action_type": "walking",
            "confidence": 0.95,
            "suggestions": ["可以添加更多细节"],
            "ai_analysis": {...}
        }
    },
    "message": "骨骼动画生成成功"
}
```

### 获取支持的动作类型

```
GET /web/api/skeleton-animation/actions
```

### 获取动画参数说明

```
GET /web/api/skeleton-animation/parameters
```

## 支持的动作类型

| 动作类型 | 中文名称 | 关键词示例 |
|---------|---------|-----------|
| walking | 走路 | 走、行走、走路、步行 |
| running | 跑步 | 跑、跑步、奔跑 |
| jumping | 跳跃 | 跳、跳跃、蹦 |
| sitting | 坐下 | 坐、坐下 |
| standing | 站立 | 站、站立 |
| waving | 挥手 | 挥手、招手 |
| pointing | 指向 | 指、指向 |
| nodding | 点头 | 点头 |
| shaking | 摇头 | 摇头 |
| bowing | 鞠躬 | 鞠躬、弯腰 |
| dancing | 跳舞 | 跳舞、舞蹈 |
| fighting | 战斗 | 战斗、打架 |
| idle | 待机 | 待机、空闲 |
| custom | 自定义 | 其他复杂动作 |

## 测试命令

使用 Artisan 命令测试服务：

```bash
# 测试基本功能
php artisan test:skeleton-animation "快速走路"

# 测试复杂描述
php artisan test:skeleton-animation "优雅地跳舞，然后快速旋转"

# 测试中文描述
php artisan test:skeleton-animation "慢慢地、优雅地走路，像猫一样轻盈"
```

## 错误处理

服务包含完善的错误处理机制：

1. **API 失败回退**: 当 DeepSeek API 失败时，自动回退到模式匹配
2. **参数验证**: 自动验证和标准化 AI 返回的参数
3. **日志记录**: 详细记录所有操作和错误信息
4. **异常抛出**: 清晰的错误信息和堆栈跟踪

## 性能优化

- **缓存机制**: 可以添加 Redis 缓存来存储常用的动画数据
- **异步处理**: 支持队列处理长时间运行的动画生成任务
- **批量生成**: 支持批量生成多个动画序列

## 扩展性

服务设计具有良好的扩展性：

1. **新动作类型**: 轻松添加新的动作类型和动画生成逻辑
2. **AI 模型**: 可以轻松切换到其他 AI 服务（如 OpenAI、Claude 等）
3. **输出格式**: 支持多种输出格式（JSON、YAML、二进制等）
4. **插件系统**: 支持第三方动画插件的集成

## 注意事项

1. **API 限制**: 注意 DeepSeek API 的调用频率和配额限制
2. **网络延迟**: 网络请求可能增加响应时间
3. **成本控制**: 监控 API 调用成本，合理使用
4. **错误处理**: 在生产环境中确保有适当的错误处理机制

## 故障排除

### 常见问题

1. **API 密钥错误**: 检查 DeepSeek API 密钥是否正确
2. **网络超时**: 检查网络连接和防火墙设置
3. **JSON 解析失败**: 检查 AI 响应格式是否正确
4. **内存不足**: 对于长动画，可能需要增加 PHP 内存限制

### 调试技巧

1. 启用详细日志记录
2. 使用测试命令验证功能
3. 检查 API 响应内容
4. 监控系统资源使用情况

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个服务！

## 许可证

本项目采用 MIT 许可证。
