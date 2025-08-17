import { Canvas, FabricObject, Rect, FabricText, Circle, FabricImage, CanvasOptions } from 'fabric';
import { AnimationData } from './AnimationParser';
// 本地类型定义，用于内部动画处理
// 初始位置配置接口
interface InitialPosition {
  /** X轴坐标位置 */
  x: number;
  /** Y轴坐标位置 */
  y: number;
  /** X轴缩放比例，1为原始大小 */
  scaleX: number;
  /** Y轴缩放比例，1为原始大小 */
  scaleY: number;
  /** 透明度，0-1之间，1为完全不透明 */
  opacity: number;
  /** 旋转角度，单位为度 */
  rotation: number;
}

// 动画属性接口
interface AnimationProperties {
  /** X轴坐标位置 */
  x?: number;
  /** Y轴坐标位置 */
  y?: number;
  /** 统一缩放比例 */
  scale?: number;
  /** X轴缩放比例 */
  scaleX?: number;
  /** Y轴缩放比例 */
  scaleY?: number;
  /** 透明度，0-1之间 */
  opacity?: number;
  /** 旋转角度，单位为度 */
  rotation?: number;
  /** 角度别名，与rotation相同 */
  angle?: number;
  /** X轴倾斜角度 */
  skewX?: number;
  /** Y轴倾斜角度 */
  skewY?: number;
}

// 动画关键帧接口
interface AnimationKeyframe {
  /** 关键帧时间点，0-1之间的归一化时间 */
  time: number;
  /** 关键帧属性配置 */
  properties: AnimationProperties;
}

// 动画效果接口
interface AnimationEffect {
  /** 动画唯一标识符 */
  id?: string;
  /** 动画类型 */
  type?: string;
  /** 动画持续时间，单位为毫秒 */
  duration: number;
  /** 缓动函数类型，如 'ease', 'linear', 'ease-in-out' 等 */
  easing?: string;
  /** 动画属性配置 */
  properties?: AnimationProperties;
  /** 关键帧序列，定义动画过程中的关键状态 */
  keyframes?: AnimationKeyframe[];
}

// 扩展的动画数据接口，用于内部处理
interface ParsedAnimationData {
  /** 目标对象标识符 */
  target: string;
  /** 基础X轴缩放比例，用于计算相对缩放 */
  scaleX: number;
  /** 基础Y轴缩放比例，用于计算相对缩放 */
  scaleY: number;
  /** 初始位置配置 */
  initial: InitialPosition;
  /** 动画效果列表 */
  animations: AnimationEffect[];
  /** 单个动画配置（可选） */
  singleAnimation?: {
    /** 单个动画的关键帧序列 */
    keyframes?: AnimationKeyframe[];
  };
}
/**
 * Canvas核心类 - 基于Fabric.js + Canvas原生API
 * 用于播放解析后的动画脚本和分镜内容
 */
export class CanvasCore {
  private canvas: Canvas;
  private animationObjects: Map<string, FabricObject> = new Map();
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private animationId: number | null = null;
  private startTime: number = 0;
  private totalDuration: number = 0;
  constructor(canvasElement: HTMLCanvasElement | string | Canvas, options?: CanvasOptions) {
    if (canvasElement instanceof Canvas) {
      // 如果传入的是Fabric.js Canvas实例，直接使用
      this.canvas = canvasElement;
    } else {
      // 如果传入的是HTMLCanvasElement或字符串，创建新的Canvas实例
      this.canvas = new Canvas(canvasElement, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        selection: false, // 禁用选择，专注于播放
        ...options
      });
    }
  }
  /**
   * 转换AnimationData为内部使用的ParsedAnimationData
   */
  private convertAnimationData(animationData: AnimationData): ParsedAnimationData {
    if (!animationData || typeof animationData !== 'object') {
      throw new Error('Invalid animation data: data must be a valid object');
    }
    const initial: InitialPosition = {
      x: this.validateNumber(animationData.initialPosition?.x, 100, 'initialPosition.x'),
      y: this.validateNumber(animationData.initialPosition?.y, 100, 'initialPosition.y'),
      scaleX: this.validateNumber(animationData.initialPosition?.scaleX, 1, 'initialPosition.scaleX'),
      scaleY: this.validateNumber(animationData.initialPosition?.scaleY, 1, 'initialPosition.scaleY'),
      opacity: this.validateNumber(animationData.initialPosition?.opacity, 1, 'initialPosition.opacity'),
      rotation: this.validateNumber(animationData.initialPosition?.rotation, 0, 'initialPosition.rotation')
    };

    // 根据宽高计算缩放比例
    let scaleX = 1;
    let scaleY = 1;

    const animations: AnimationEffect[] = (animationData.animationSequences || []).map((anim, index) => {
      if (!anim || typeof anim !== 'object') {
        console.warn(`Invalid animation at index ${index}, skipping`);
        return null;
      }
      return {
        id: anim.id || this.generateId(),
        duration: this.validateNumber(anim.duration, 1000, `animations[${index}].duration`),
        easing: anim.easing || 'ease',
        keyframes: anim.keyframes?.map((kf, kfIndex) => {
          if (!kf || typeof kf !== 'object' || typeof kf.startTime !== 'number') {
            console.warn(`Invalid keyframe at animations[${index}].keyframes[${kfIndex}], skipping`);
            return null;
          }
          // 将startTime转换为0-1范围的time值
          const animDuration = typeof anim.duration === 'number' ? anim.duration : 1000;
          const normalizedTime = Math.max(0, Math.min(1, kf.startTime / animDuration));
          return {
            time: normalizedTime,
            properties: {
              x: kf.x,
              y: kf.y,
              scaleX: kf.scaleX !== undefined ? kf.scaleX * scaleX : scaleX,
              scaleY: kf.scaleY !== undefined ? kf.scaleY * scaleY : scaleY,
              opacity: kf.opacity,
              rotation: kf.rotation
            }
          };
        }).filter(kf => kf !== null) as AnimationKeyframe[]
      };
    }).filter(anim => anim !== null) as AnimationEffect[];

    return {
      target: 'default',
      scaleX,
      scaleY,
      initial,
      animations
    };
  }
  /**
   * 验证数值参数
   */
  private validateNumber(value: any, defaultValue: number, fieldName: string): number {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return value;
    }
    if (value !== undefined && value !== null) {
      console.warn(`Invalid ${fieldName}: ${value}, using default value ${defaultValue}`);
    }
    return defaultValue;
  }
  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return 'obj_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  /**
   * 加载并播放动画数据
   * @param animationData 解析后的动画数据
   * @param target 目标对象标识
   */
  public async loadAnimation(animationData: AnimationData): Promise<void> {
    try {
      if (!animationData) {
        throw new Error('Animation data is required');
      }
      // 清空当前画布
      this.clear();
      if (animationData.width && animationData.height) {
        // 七牛云
        animationData.media = animationData.media ? (animationData.media + `?imageView2/2/w/${animationData.width}/h/${animationData.height}`) : 'default';
      }
      // 转换数据格式
      const parsedData = this.convertAnimationData(animationData);
      if (!parsedData.animations || parsedData.animations.length === 0) {
        console.warn('No valid animations found in data');
      }

      // 创建目标对象
      const targetObject = await this.createTargetObject(parsedData.target, parsedData.initial, animationData.media, animationData.width, animationData.height);
      if (targetObject) {
        this.animationObjects.set(parsedData.target, targetObject);
        this.canvas.add(targetObject);
      } else {
        throw new Error('Failed to create target object');
      }
      // 计算总动画时长
      this.calculateTotalDuration(parsedData.animations);
      if (this.totalDuration <= 0) {
        console.warn('Total animation duration is 0 or negative');
      }
      // 渲染画布
      this.canvas.renderAll();

    } catch (error) {
      console.error('加载动画数据失败:', error);
      throw error;
    }
  }
  /**
   * 播放动画
   * @param animationData 动画数据
   */
  public play(animationData: AnimationData): void {
    try {
      if (!animationData) {
        throw new Error('Animation data is required for playback');
      }
      if (this.isPlaying) {
        this.stop();
      }
      // 转换数据格式
      const parsedData = this.convertAnimationData(animationData);
      if (!this.animationObjects.has(parsedData.target)) {
        console.warn(`Target object '${parsedData.target}' not found, animation may not display correctly`);
      }
      this.isPlaying = true;
      this.startTime = performance.now();
      this.currentTime = 0;
      // 开始动画循环
      this.animateFrame(parsedData);
    } catch (error) {
      console.error('播放动画失败:', error);
      this.isPlaying = false;
    }
  }
  /**
   * 暂停动画
   */
  public pause(): void {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  /**
   * 停止动画
   */
  public stop(): void {
    this.pause();
    this.currentTime = 0;
    this.startTime = 0;
  }
  /**
   * 清空画布
   */
  public clear(): void {
    this.stop();
    this.canvas.clear();
    this.animationObjects.clear();
  }
  /**
   * 获取Canvas实例
   */
  public getCanvas(): Canvas {
    return this.canvas;
  }
  /**
   * 销毁Canvas
   */
  public dispose(): void {
    this.clear();
    this.canvas.dispose();
  }
  /**
   * 创建目标对象
   * @param target 目标标识
   * @param initial 初始位置和属性
   * @param media 媒体资源URL
   * @param width 媒体宽度
   * @param height 媒体高度
   */
  private async createTargetObject(target: string, initial: InitialPosition, media?: string, width?: number, height?: number): Promise<FabricObject | null> {
    try {
      // 根据目标类型创建不同的Fabric对象
      let obj: FabricObject;

      // 如果有media字段，优先使用图片
      if (media) {
        try {
          obj = await FabricImage.fromURL(media, {
            crossOrigin: 'anonymous'
          });

        } catch (error) {
          console.warn('加载图片失败，使用默认方块:', error);
          // 图片加载失败时使用默认的黄色方块
          obj = new Rect({
            width: width || 100,
            height: height || 100,
            fill: '#FF9800'
          });

        }
      } else if (target.includes('image') || target.includes('img')) {
        // 创建图像对象占位符
        obj = new Rect({
          width: width || 100,
          height: height || 100,
          fill: '#cccccc',
          stroke: '#999999',
          strokeWidth: 2
        });
      } else if (target.includes('text')) {
        // 创建文本对象
        obj = new FabricText('示例文本', {
          fontSize: 24,
          fill: '#333333',
          fontFamily: 'Arial'
        });
      } else if (target.includes('rect') || target.includes('rectangle')) {
        // 创建矩形对象
        obj = new Rect({
          width: width || 100,
          height: height || 60,
          fill: '#4CAF50',
          rx: 5,
          ry: 5
        });
      } else if (target.includes('circle')) {
        // 创建圆形对象
        const radius = width ? width / 2 : (height ? height / 2 : 50);
        obj = new Circle({
          radius: radius,
          fill: '#2196F3'
        });
      } else {
        // 默认创建矩形对象
        obj = new Rect({
          width: width || 80,
          height: height || 80,
          fill: '#FF9800'
        });
      }
      // 设置初始属性
      obj.set({
        left: initial.x,
        top: initial.y,
        opacity: initial.opacity,
        scaleX: initial.scaleX,
        scaleY: initial.scaleY,
        angle: initial.rotation,
        selectable: false, // 禁用选择
        evented: false     // 禁用事件
      });
      return obj;
    } catch (error) {
      console.error('创建目标对象失败:', error);
      return null;
    }
  }
  /**
   * 计算总动画时长
   * @param animations 动画效果列表
   */
  private calculateTotalDuration(animations: AnimationEffect[]): void {
    let maxDuration = 0;
    for (const animation of animations) {
      const duration = typeof animation.duration === 'string'
        ? this.parseDuration(animation.duration)
        : animation.duration;
      maxDuration = Math.max(maxDuration, duration);
    }
    this.totalDuration = maxDuration;
  }
  /**
   * 动画帧循环
   * @param animationData 动画数据
   */
  private animateFrame(animationData: ParsedAnimationData): void {
    if (!this.isPlaying) return;
    const now = performance.now();
    this.currentTime = now - this.startTime;
    const progress = Math.min(this.currentTime / this.totalDuration, 1);
    // 更新所有动画对象
    this.updateAnimations(animationData, progress);
    // 渲染画布
    this.canvas.renderAll();
    // 检查是否完成
    if (progress >= 1) {
      this.isPlaying = false;

      return;
    }
    // 继续下一帧
    this.animationId = requestAnimationFrame(() => this.animateFrame(animationData));
  }
  /**
   * 更新动画
   * @param animationData 动画数据
   * @param progress 播放进度 (0-1)
   */
  private updateAnimations(animationData: ParsedAnimationData, progress: number): void {
    const targetObject = this.animationObjects.get(animationData.target);
    if (!targetObject) return;
    // 处理动画效果列表
    for (const animation of animationData.animations) {
      if (animation.keyframes && animation.keyframes.length > 0) {
        // 处理关键帧动画
        this.updateKeyframeAnimation(targetObject, animation.keyframes, progress, animationData.scaleX, animationData.scaleY);
      } else {
        // 处理普通动画效果
        this.updateAnimationEffect(targetObject, animation, progress);
      }
    }
  }
  /**
   * 更新关键帧动画
   * @param obj 目标对象
   * @param keyframes 关键帧列表
   * @param progress 播放进度
   * @param baseScaleX 基础X轴缩放
   * @param baseScaleY 基础Y轴缩放
   */
  private updateKeyframeAnimation(obj: FabricObject, keyframes: AnimationKeyframe[], progress: number, baseScaleX: number = 1, baseScaleY: number = 1): void {
    if (keyframes.length === 0) return;
    // 找到当前进度对应的关键帧
    let currentFrame: AnimationKeyframe | null = null;
    let nextFrame: AnimationKeyframe | null = null;
    for (let i = 0; i < keyframes.length; i++) {
      const frame = keyframes[i];
      if (frame.time <= progress) {
        currentFrame = frame;
        nextFrame = keyframes[i + 1] || null;
      } else {
        break;
      }
    }
    if (!currentFrame) return;
    // 如果有下一帧，进行插值计算
    if (nextFrame && progress < nextFrame.time) {
      const frameProgress = (progress - currentFrame.time) / (nextFrame.time - currentFrame.time);
      const interpolatedProps = this.interpolateProperties(currentFrame.properties, nextFrame.properties, frameProgress);
      this.applyProperties(obj, interpolatedProps, baseScaleX, baseScaleY);
    } else {
      // 直接应用当前帧属性
      this.applyProperties(obj, currentFrame.properties, baseScaleX, baseScaleY);
    }
  }
  /**
   * 更新动画效果
   * @param obj 目标对象
   * @param animation 动画效果
   * @param progress 播放进度
   */
  private updateAnimationEffect(obj: FabricObject, animation: AnimationEffect, progress: number): void {
    const duration = typeof animation.duration === 'string'
      ? this.parseDuration(animation.duration)
      : animation.duration;
    const animationProgress = Math.min(progress * this.totalDuration / duration, 1);
    // 应用缓动函数
    const easedProgress = this.applyEasing(animationProgress, animation.easing || 'linear');
    // 通用属性动画
    this.applyGenericAnimation(obj, animation.properties, easedProgress);
  }
  /**
   * 插值计算属性
   */
  private interpolateProperties(from: any, to: any, progress: number): any {
    const result: any = {};
    for (const key in from) {
      if (typeof from[key] === 'number' && typeof to[key] === 'number') {
        result[key] = from[key] + (to[key] - from[key]) * progress;
      } else {
        result[key] = progress < 0.5 ? from[key] : to[key];
      }
    }
    return result;
  }
  /**
   * 应用属性到对象
   */
  private applyProperties(obj: FabricObject, properties: any, baseScaleX: number = 1, baseScaleY: number = 1): void {
    const updates: any = {};
    if (properties.x !== undefined) updates.left = properties.x;
    if (properties.y !== undefined) updates.top = properties.y;
    if (properties.rotation !== undefined) updates.angle = properties.rotation;

    // 处理缩放属性，乘以基础缩放比例
    if (properties.scale !== undefined) {
      updates.scaleX = properties.scale * baseScaleX;
      updates.scaleY = properties.scale * baseScaleY;
    }
    if (properties.scaleX !== undefined) updates.scaleX = properties.scaleX * baseScaleX;
    if (properties.scaleY !== undefined) updates.scaleY = properties.scaleY * baseScaleY;

    if (properties.opacity !== undefined) updates.opacity = properties.opacity;
    if (properties.skewX !== undefined) updates.skewX = properties.skewX;
    if (properties.skewY !== undefined) updates.skewY = properties.skewY;
    obj.set(updates);
  }
  /**
   * 应用通用动画
   */
  private applyGenericAnimation(obj: FabricObject, properties: any, progress: number): void {
    // 通用属性动画处理
    if (properties.to) {
      const updates: any = {};
      for (const key in properties.to) {
        const currentValue = (obj as any)[key] || 0;
        const targetValue = properties.to[key];
        if (typeof currentValue === 'number' && typeof targetValue === 'number') {
          updates[key] = currentValue + (targetValue - currentValue) * progress;
        }
      }
      obj.set(updates);
    }
  }
  /**
   * 应用缓动函数
   */
  private applyEasing(progress: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress;
    }
  }
  /**
   * 解析时长字符串
   */
  private parseDuration(duration: string): number {
    if (typeof duration === 'number') return duration;
    const match = duration.match(/([\d.]+)(ms|s)?/);
    if (!match) return 1000;
    const value = parseFloat(match[1]);
    const unit = match[2] || 's';
    return unit === 'ms' ? value : value * 1000;
  }
  /**
   * 获取当前播放状态
   */
  public getPlaybackState(): {
    isPlaying: boolean;
    currentTime: number;
    totalDuration: number;
    progress: number;
  } {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      totalDuration: this.totalDuration,
      progress: this.totalDuration > 0 ? this.currentTime / this.totalDuration : 0
    };
  }
}
// 导出类型定义
export type CanvasPlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  progress: number;
};