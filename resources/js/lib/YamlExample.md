# 动画脚本 YAML 格式说明

## 概述

本文档描述了在线动画平台中动画脚本的 YAML 格式规范。动画脚本用于定义分镜的初始状态和动画序列。

### 新格式特性

- **位置坐标**：使用 `pos` 字段替代 `x` 和 `y`，支持多种格式
- **统一缩放**：使用 `scale` 字段替代 `scaleX` 和 `scaleY`
- **尺寸规格**：使用 `size` 字段替代 `width` 和 `height`，支持多种格式
- **向后兼容**：仍然支持旧的 `x`、`y`、`scaleX`、`scaleY`、`width`、`height` 格式

## 基本结构

```yaml
media: '图片或视频文件路径'
name: '分镜名称'
description: '分镜描述'
size: 1920 1080
pos: 100 200
scale: 1
opacity: 1
rotation: 0
animationSequences:
    - name: '动画名称'
      duration: 2000
      easing: '缓动函数'
      keyframes:
          - time: 1000 0
            pos: 100 200
            scale: 0.8
            opacity: 0
            rotation: 0
```

## 字段详细说明

### 基础信息字段

| 字段          | 类型   | 必填 | 说明                                                                                                                                                                                      | 示例                              |
| ------------- | ------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `media`       | string | 是   | 媒体文件路径（图片、视频等）                                                                                                                                                              | `"https://example.com/image.jpg"` |
| `name`        | string | 否   | 分镜名称                                                                                                                                                                                  | `"测试分镜"`                      |
| `description` | string | 否   | 分镜描述                                                                                                                                                                                  | `"这是一个测试分镜"`              |
| `size`        | string | 否   | 媒体文件尺寸，支持多种格式：<br/>- 单值：`1920` 表示 width: 1920, height: 1920<br/>- 双值：`1920 1080` 表示 width: 1920, height: 1080<br/>- 百分比：`100%` 表示 width: 100%, height: 100% | `1920 1080`                       |
| `width`       | number | 否   | 媒体文件宽度（像素，向后兼容）                                                                                                                                                            | `1920`                            |
| `height`      | number | 否   | 媒体文件高度（像素，向后兼容）                                                                                                                                                            | `1080`                            |

### 初始位置字段 (initialPosition)

| 字段       | 类型   | 必填 | 说明                                                                                                                                                                                    | 默认值 | 示例      |
| ---------- | ------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- |
| `pos`      | string | 否   | 位置坐标，支持多种格式：<br/>- 单值：`50` 表示 x: 50, y: 50<br/>- 双值：`100 200` 表示 x: 100, y: 200<br/>- 百分比：`50%` 表示 x: 50%, y: 50%<br/>- 混合：`100 50%` 表示 x: 100, y: 50% | `0 0`  | `100 200` |
| `scale`    | string | 否   | 统一缩放比例，支持多种格式：<br/>- 单值：`1.5` 表示 scaleX: 1.5, scaleY: 1.5<br/>- 双值：`1.2 0.8` 表示 scaleX: 1.2, scaleY: 0.8                                                        | `1`    | `1.5`     |
| `opacity`  | number | 否   | 透明度（0-1）                                                                                                                                                                           | `1`    | `0.8`     |
| `rotation` | number | 否   | 旋转角度（度）                                                                                                                                                                          | `0`    | `45`      |

### 动画序列字段 (animationSequences)

动画序列是一个数组，每个元素代表一个完整的动画。

| 字段       | 类型   | 必填 | 说明                   | 示例          |
| ---------- | ------ | ---- | ---------------------- | ------------- |
| `id`       | string | 否   | 动画序列唯一标识符     | `"anim_1"`    |
| `name`     | string | 否   | 动画名称               | `"淡入动画"`  |
| `duration` | number | 是   | 动画总持续时间（毫秒） | `2000`        |
| `easing`   | string | 否   | 缓动函数类型           | `"easeInOut"` |

### 关键帧字段 (keyframes)

关键帧数组定义了动画过程中的关键状态。

| 字段       | 类型   | 必填 | 说明                                                                                                                                                                                      | 示例                            |
| ---------- | ------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `time`     | string | 否   | 时间设置，格式：`"持续时间 开始时间"` 或 `"持续时间 continue"`<br/>- 持续时间：数字（毫秒），默认为 1000ms（1秒）<br/>- 开始时间：数字（毫秒）或 "continue"（继承上一个关键帧的结束时间） | `"1000 0"` 或 `"2000 continue"` |
| `pos`      | string | 否   | 位置坐标，支持多种格式（同 initialPosition.pos）                                                                                                                                          | `100 200`                       |
| `scale`    | string | 否   | 统一缩放比例，支持多种格式（同 initialPosition.scale）                                                                                                                                    | `0.8`                           |
| `rotation` | number | 否   | 旋转角度（度）                                                                                                                                                                            | `0`                             |
| `opacity`  | number | 否   | 透明度（0-1）                                                                                                                                                                             | `0`                             |

## 缓动函数类型

| 缓动函数          | 说明                     |
| ----------------- | ------------------------ |
| `"linear"`        | 线性变化                 |
| `"easeIn"`        | 缓入（慢开始）           |
| `"easeOut"`       | 缓出（慢结束）           |
| `"easeInOut"`     | 缓入缓出（慢开始慢结束） |
| `"easeInQuad"`    | 二次方缓入               |
| `"easeOutQuad"`   | 二次方缓出               |
| `"easeInOutQuad"` | 二次方缓入缓出           |

## 完整示例

### 示例 1：淡入动画

```yaml
media: 'https://example.com/image.jpg'
name: '淡入动画示例'
description: '从透明到不透明的淡入效果'
size: 1920 1080
initialPosition:
    pos: 100 200
    scale: 1
    opacity: 1
    rotation: 0
animationSequences:
    - id: 'fade_in'
      name: '淡入效果'
      duration: 2000
      easing: 'easeInOut'
      keyframes:
          - time: 1000 0
            opacity: 0
            scale: 0.8
          - time: 1000 1000
            opacity: 1
            scale: 1
```

### 示例 2：移动动画

```yaml
media: 'https://example.com/image.jpg'
name: '移动动画示例'
description: '从左到右的移动效果'
size: 1920 1080
initialPosition:
    pos: 0 100
    scale: 1
    opacity: 1
    rotation: 0
animationSequences:
    - id: 'move_right'
      name: '向右移动'
      duration: 3000
      easing: 'easeInOut'
      keyframes:
          - time: 1500 0
            pos: 0 100
          - time: 1500 1500
            pos: 800 100
```

### 示例 3：缩放旋转动画

```yaml
media: 'https://example.com/image.jpg'
name: '缩放旋转示例'
description: '同时进行缩放和旋转的动画'
size: 1920 1080
initialPosition:
    pos: 400 300
    scale: 1
    opacity: 1
    rotation: 0
animationSequences:
    - id: 'scale_rotate'
      name: '缩放旋转'
      duration: 4000
      easing: 'easeInOut'
      keyframes:
          - time: 2000 0
            scale: 1
            rotation: 0
          - time: 2000 2000
            scale: 1.5
            rotation: 360
```

### 示例 4：使用 "continue" 时间

```yaml
media: 'https://example.com/image.jpg'
name: '连续动画示例'
description: '演示 time: continue 的使用'
size: 1920 1080
initialPosition:
    pos: 100 100
    scale: 1
    opacity: 1
    rotation: 0
animationSequences:
    - id: 'continuous_anim'
      name: '连续动画'
      duration: 3000
      easing: 'easeInOut'
      keyframes:
          - time: 1000 0
            pos: 100 100
            scale: 1
          - time: 1000 continue
            pos: 300 100
            scale: 1.2
          - time: 1000 continue
            pos: 500 200
            scale: 0.8
```

## 注意事项

1. **时间单位**：所有时间字段都使用毫秒（ms）作为单位
2. **时间格式**：`time` 字段格式为 `"持续时间 开始时间"`，开始时间支持数字或 "continue"（继承上一个关键帧的结束时间），持续时间默认为 1000ms
3. **坐标系统**：坐标原点在画布左上角，X轴向右为正，Y轴向下为正
4. **尺寸格式**：`size` 字段支持单值（正方形）和双值（矩形）格式
5. **缩放比例**：1.0 表示原始大小，大于 1 表示放大，小于 1 表示缩小
6. **透明度**：0.0 表示完全透明，1.0 表示完全不透明
7. **旋转角度**：正值表示顺时针旋转，负值表示逆时针旋转
8. **缓动函数**：如果不指定，将使用线性变化

## 最佳实践

1. **命名规范**：使用有意义的名称和描述
2. **时间规划**：合理规划动画时间，避免过快或过慢
3. **性能考虑**：避免过于复杂的动画序列
4. **用户体验**：选择合适的缓动函数，让动画更自然
5. **测试验证**：在多个设备上测试动画效果

## 错误处理

- 缺少必填字段时，将使用默认值
- 无效的数值将被忽略
- 不支持的文件格式将导致解析失败
- 动画时间冲突时，后面的关键帧会覆盖前面的设置
