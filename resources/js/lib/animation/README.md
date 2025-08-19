# 动画系统使用说明

## 架构概述

本动画系统采用模块化设计，包含以下核心组件：

- **CanvasManager**: Canvas 管理器，负责初始化和管理 Fabric.js Canvas 实例
- **BasePlayer**: 播放器基类，提供通用的播放器功能
- **YamlAnimationPlayer**: YAML 动画播放器，继承自 BasePlayer
- **PlayerInterfaces**: 播放器接口定义

## 使用方法

### 1. 基本使用

```typescript
import { CanvasManager, YamlAnimationPlayer } from './animation';

// 创建 Canvas 管理器
const canvasManager = new CanvasManager(canvasElement);

// 创建 YAML 动画播放器
const yamlPlayer = new YamlAnimationPlayer(canvasManager);

// 加载并播放动画
await yamlPlayer.loadAnimation(animationData);
yamlPlayer.play(animationData);
```

### 2. 多播放器协同工作

```typescript
import { CanvasManager, YamlAnimationPlayer } from './animation';

// 创建共享的 Canvas 管理器
const canvasManager = new CanvasManager(canvasElement);

// 创建多个播放器，共享同一个 Canvas
const yamlPlayer = new YamlAnimationPlayer(canvasManager);
const otherPlayer = new OtherPlayer(canvasManager);
const thirdPlayer = new ThirdPlayer(canvasManager);

// 可以独立播放
yamlPlayer.play(yamlData);
otherPlayer.play(otherData);

// 也可以协同工作，在同一个 Canvas 上绘制
yamlPlayer.play(yamlData);
otherPlayer.play(otherData);
```

### 3. 播放器控制

```typescript
// 播放控制
yamlPlayer.play(animationData);
yamlPlayer.pause();
yamlPlayer.stop();

// 获取播放状态
const state = yamlPlayer.getPlaybackState();
console.log('播放状态:', state);

// 清理资源
yamlPlayer.clear();
```

### 4. Canvas 管理

```typescript
// 获取 Canvas 实例
const canvas = canvasManager.getCanvas();

// 画布操作
canvasManager.clear();
canvasManager.render();
canvasManager.setDimensions(800, 600);

// 销毁
canvasManager.dispose();
```

## 扩展新的播放器

要创建新的播放器类型，继承 `BasePlayer` 类：

```typescript
import { BasePlayer } from './BasePlayer';

export class CustomPlayer extends BasePlayer {
  constructor(canvasManager: CanvasManager) {
    super(canvasManager);
  }

  public play(animationData: any): void {
    // 实现自定义播放逻辑
    this.setPlayingState(true);
    this.startAnimationLoop(() => this.customAnimationFrame());
  }

  private customAnimationFrame(): void {
    if (!this.isCurrentlyPlaying()) return;
    
    // 自定义动画逻辑
    this.updateCurrentTime();
    const progress = this.getCurrentProgress();
    
    // 更新动画
    this.render();
    
    // 继续下一帧
    this.animationId = requestAnimationFrame(() => this.customAnimationFrame());
  }
}
```

## 优势

- **解耦**: Canvas 管理和动画播放逻辑分离
- **可扩展**: 可以轻松添加新的播放器类型
- **共享资源**: 多个播放器共享同一个 Canvas 实例
- **独立控制**: 每个播放器可以独立控制自己的动画状态
- **协同工作**: 多个播放器可以在同一个 Canvas 上协同绘制
