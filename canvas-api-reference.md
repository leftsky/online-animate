# Canvas API 参考文档

在线动画项目中Canvas相关库的功能对比和使用指南。

## Canvas API 支持对比表

| 功能分类 | Canvas原生API | GSAP | Fabric.js |
|---------|---------------|------|----------|
| **基础绘制** |
| 矩形绘制 | `fillRect()`, `strokeRect()` | ❌ | ✅ |
| 圆形绘制 | `arc()`, `fill()` | ❌ | ✅ |
| 路径绘制 | `beginPath()`, `moveTo()`, `lineTo()` | ❌ | ✅ |
| 文本绘制 | `fillText()`, `strokeText()` | ❌ | ✅ |
| 图像绘制 | `drawImage()` | ❌ | ✅ |
| **变换操作** |
| 平移 | `translate()` | ✅ | ✅ |
| 旋转 | `rotate()` | ✅ | ✅ |
| 缩放 | `scale()` | ✅ | ✅ |
| 矩阵变换 | `transform()`, `setTransform()` | ✅ | ✅ |
| **样式设置** |
| 填充样式 | `fillStyle` | ❌ | ✅ |
| 描边样式 | `strokeStyle` | ❌ | ✅ |
| 线条宽度 | `lineWidth` | ❌ | ✅ |
| 透明度 | `globalAlpha` | ✅ | ✅ |
| 阴影效果 | `shadowColor`, `shadowBlur` | ❌ | ✅ |
| **动画相关** |
| 帧动画 | `requestAnimationFrame()` | ✅ | ❌ |
| 缓动函数 | 手动实现 | ✅ | ❌ |
| 时间轴控制 | 手动实现 | ✅ | ❌ |
| **事件处理** |
| 鼠标事件 | Canvas元素事件 | ❌ | ✅ |
| 触摸事件 | Canvas元素事件 | ❌ | ✅ |
| 键盘事件 | 全局事件监听 | ❌ | ✅ |
| **高级功能** |
| 图层管理 | 手动实现 | ❌ | ✅ |
| 碰撞检测 | 手动实现 | ❌ | ✅ |
| 对象选择 | 手动实现 | ❌ | ✅ |
| 拖拽功能 | 手动实现 | ❌ | ✅ |

## 库的特点说明

### Canvas 原生 API
- **优势**: 性能最佳，完全控制，无依赖
- **劣势**: 开发复杂度高，需要手动实现高级功能
- **适用场景**: 简单绘制，性能要求极高的场景

### GSAP (GreenSock Animation Platform)
- **优势**: 强大的动画引擎，优秀的性能，丰富的缓动函数
- **劣势**: 不直接操作Canvas绘制，需要配合其他库
- **适用场景**: 复杂动画效果，DOM和Canvas元素动画



### Fabric.js
- **优势**: 完整的Canvas对象模型，丰富的交互功能
- **劣势**: 相对较重，学习成本中等
- **适用场景**: 交互式Canvas应用，图形编辑器

## 项目中的使用建议

1. **分镜画板制作**: 使用 Fabric.js 提供交互式绘制功能
2. **动画效果**: 使用 GSAP 实现复杂的Canvas元素动画
3. **性能优化**: 在需要极致性能的场景下直接使用Canvas原生API
4. **交互功能**: 使用 Fabric.js 处理用户交互和对象操作

## Canvas相关技术栈

- **Canvas原生API**: 基础绘制和操作
- **GSAP**: 动画引擎和变换控制
- **Fabric.js**: 交互式Canvas对象管理
- **Vue 3 + TypeScript**: 组件化开发
- **Vite**: 构建工具

## 使用示例

### Canvas原生API示例
```javascript
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 绘制矩形
ctx.fillStyle = '#ff0000';
ctx.fillRect(10, 10, 100, 100);

// 绘制圆形
ctx.beginPath();
ctx.arc(150, 60, 40, 0, 2 * Math.PI);
ctx.fill();
```

### GSAP动画示例
```javascript
import { gsap } from 'gsap';

// 动画Canvas元素
gsap.to('#canvas', {
  duration: 2,
  rotation: 360,
  scale: 1.2,
  ease: 'power2.inOut'
});
```

### Fabric.js示例
```javascript
import { fabric } from 'fabric';

// 创建Fabric画布
const canvas = new fabric.Canvas('canvas');

// 添加矩形对象
const rect = new fabric.Rect({
  left: 100,
  top: 100,
  width: 50,
  height: 50,
  fill: 'red'
});

canvas.add(rect);
```
