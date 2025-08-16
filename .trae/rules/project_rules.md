# 在线动画项目开发规则

## 项目概述

**在线动画**是一个基于Laravel + Vue3 + TypeScript的全栈Web应用，专注于小说到动画视频的转换和分镜画板制作。

### 核心功能
- 小说章节管理
- 分镜画板设计
- 动画脚本编写与解析
- 视频内容制作
- 用户认证与权限管理

## 技术栈

### 后端技术栈
- **框架**: Laravel 12+
- **数据库**: MySQL
- **认证**: Laravel Breeze + Inertia.js
- **管理后台**: Filament Admin Panel
- **队列**: Database Queue Driver
- **文件存储**: Local Storage

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI库**: Shadcn/ui + Tailwind CSS
- **路由**: Inertia.js
- **动画库**: GSAP + Anime.js
- **3D渲染**: Three.js
- **画布操作**: Fabric.js
- **YAML解析**: js-yaml

## 项目结构规范

### 后端目录结构
```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Api/           # API控制器
│   │   ├── Auth/          # 认证控制器
│   │   └── Settings/      # 设置控制器
│   ├── Middleware/        # 中间件
│   └── Requests/          # 表单验证请求
├── Models/                # Eloquent模型
└── Providers/             # 服务提供者
```

### 前端目录结构
```
resources/js/
├── components/            # Vue组件
│   ├── ui/               # 基础UI组件
│   └── storyboard/       # 分镜画板专用组件
├── composables/          # Vue组合式函数
├── layouts/              # 页面布局
├── lib/                  # 工具库
├── pages/                # 页面组件
├── types/                # TypeScript类型定义
└── utils/                # 工具函数
```

## 开发规范

### 1. 代码风格

#### 后端 (PHP/Laravel)
- 遵循PSR-12编码标准
- 使用Laravel命名约定
- 控制器方法使用驼峰命名法
- 模型使用单数形式，数据表使用复数形式
- 使用Eloquent ORM进行数据库操作

#### 前端 (Vue3/TypeScript)
- 使用Prettier + ESLint进行代码格式化
- 组件使用PascalCase命名
- 文件名使用kebab-case
- 使用Composition API
- 严格的TypeScript类型检查

### 2. 数据库设计规范

#### 表命名规范
- 使用复数形式 (users, novels, chapters)
- 使用下划线分隔 (scene_contents)
- 外键字段使用 `{table}_id` 格式

#### 字段规范
- 主键统一使用 `id` (bigint, auto_increment)
- 时间戳字段使用 `created_at`, `updated_at`
- 状态字段使用 `status` (tinyint)
- 排序字段使用 `order` (integer)

#### 核心数据表
1. **novels** - 小说表
2. **chapters** - 章节表
3. **videos** - 视频表
4. **scenes** - 分镜表
5. **scene_contents** - 分镜内容表

### 3. API设计规范

#### RESTful API规范
- 使用标准HTTP方法 (GET, POST, PUT, DELETE)
- 统一的响应格式
- 使用资源化路由

#### 分页规范
**重要**: 项目统一使用 `offset` 和 `limit` 进行分页，**禁止使用** Laravel的 `paginate()` 方法。

```php
// ✅ 正确的分页实现
$limit = $request->get('limit', 20);
$offset = $request->get('offset', 0);
$data = $query->offset($offset)->limit($limit)->get();

return response()->json([
    'success' => true,
    'data' => $data
]);

// ❌ 禁止使用
$data = $query->paginate($perPage);
```

#### 响应格式规范
```json
{
    "success": true,
    "data": [],
    "message": "操作成功"
}
```

### 4. 动画脚本规范

#### YAML格式动画脚本
项目使用YAML格式编写动画脚本，通过 `js-yaml` 库解析。

```yaml
# 新格式动画脚本示例
initial_position:
  x: 100
  y: 200
  scale: 1
  opacity: 1

animations:
  - duration: 2000
    easing: "easeInOutQuad"
    keyframes:
      - { time: 0, x: 100, y: 200 }
      - { time: 0.5, x: 300, y: 200, scale: 1.2 }
      - { time: 1, x: 500, y: 400, scale: 1, opacity: 0.8 }
```

#### AnimationParser类规范
- 使用 `js-yaml` 库替代手动字符串解析
- 支持多种动画格式 (旧格式兼容)
- 提供完整的类型定义
- 错误处理和验证

### 5. 组件开发规范

#### Vue组件规范
- 使用 `<script setup lang="ts">` 语法
- 明确的Props和Emits类型定义
- 使用Composition API
- 组件文件使用PascalCase命名

#### UI组件规范
- 基于Shadcn/ui组件库
- 使用Tailwind CSS进行样式设计
- 支持暗色模式
- 响应式设计

#### UI主题使用规范
**重要**: 所有UI组件必须使用框架提供的主题变量，**禁止使用**自定义颜色值。

```css
/* ✅ 正确的主题变量使用 */
.component {
  @apply bg-background text-foreground;
  @apply border-border hover:bg-accent;
  @apply text-primary hover:text-primary/80;
}

/* ❌ 禁止使用自定义颜色 */
.component {
  @apply bg-white text-gray-900;        /* 禁止 */
  @apply border-gray-300 hover:bg-blue-50;  /* 禁止 */
  @apply text-blue-700 hover:text-blue-600; /* 禁止 */
}
```

**主题变量说明**:
- `background` / `foreground` - 主背景和前景色
- `muted` / `muted-foreground` - 次要背景和文字
- `accent` / `accent-foreground` - 强调色
- `primary` / `primary-foreground` - 主色调
- `destructive` / `destructive-foreground` - 危险操作色
- `border` - 边框色
- `card` / `card-foreground` - 卡片背景和文字

**特殊情况处理**:
- 对于特定功能需要的颜色（如成功/警告状态），可以使用语义化的Tailwind颜色类
- 但必须同时提供暗色模式适配，如：`text-green-600 dark:text-green-400`

### 6. 状态管理规范

#### 数据状态定义
```typescript
// 通用状态枚举
enum Status {
    DRAFT = 0,     // 草稿
    PUBLISHED = 1, // 发布/完成
    ARCHIVED = 2   // 归档
}

// 视频制作状态
enum VideoStatus {
    DRAFT = 0,        // 草稿
    IN_PROGRESS = 1,  // 制作中
    COMPLETED = 2     // 完成
}
```

### 7. 文件上传规范

#### 支持的文件类型
- **图片**: jpeg, jpg, png, gif, webp
- **视频**: mp4, avi, mov, wmv, flv
- **音频**: mp3, wav, ogg, m4a
- **文档**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt

#### 存储路径规范
```
storage/app/public/
├── uploads/
│   ├── images/
│   ├── videos/
│   ├── audio/
│   └── documents/
```

### 8. 测试规范

#### 后端测试
- 使用PHPUnit进行单元测试
- Feature测试覆盖API端点
- 数据库测试使用内存MySQL

#### 前端测试
- 组件测试使用Vue Test Utils
- E2E测试使用Playwright
- TypeScript类型检查

### 9. 部署规范

#### 开发环境
- 使用 `npm run dev` 启动前端开发服务器
- 使用 `php artisan serve` 启动后端服务器
- 使用 `php artisan queue:listen` 处理队列任务

#### 生产环境
- 使用 `npm run build` 构建前端资源
- 配置Web服务器 (Nginx/Apache)
- 使用Supervisor管理队列进程
- 配置SSL证书

### 10. 版本控制规范

#### Git提交规范
- 使用语义化提交信息
- 功能开发使用feature分支
- 代码审查后合并到main分支

#### 提交信息格式
```
feat: 添加动画脚本YAML解析功能
fix: 修复分页逻辑使用offset/limit
refactor: 重构AnimationParser类使用js-yaml
docs: 更新项目开发规则文档
```

## 最佳实践

### 1. 性能优化
- 前端使用懒加载和代码分割
- 后端使用Eloquent关系预加载
- 数据库查询优化和索引设计
- 静态资源CDN加速

### 2. 安全规范
- 输入验证和XSS防护
- CSRF令牌验证
- 文件上传安全检查
- 用户权限控制

### 3. 错误处理
- 统一的异常处理机制
- 友好的错误提示信息
- 日志记录和监控
- 优雅的降级处理

### 4. 代码质量
- 代码审查流程
- 自动化测试覆盖
- 静态代码分析
- 文档完整性

## 开发工具配置

### IDE配置
- 推荐使用VS Code或PhpStorm
- 安装相关插件 (Vue, TypeScript, PHP)
- 配置代码格式化和Linting

### 环境要求
- PHP >= 8.2
- Node.js >= 18.0
- Composer >= 2.0
- MySQL >= 8.0

---

**注意**: 本规则文档会随着项目发展持续更新，所有开发人员应遵循最新版本的规范要求。