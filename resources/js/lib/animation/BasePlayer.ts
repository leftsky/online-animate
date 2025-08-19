import { CanvasManager } from './CanvasManager';
import { IPlayer, PlaybackState } from './types/PlayerInterfaces';

/**
 * 播放器基类
 * 提供通用的播放器功能和状态管理
 */
export abstract class BasePlayer implements IPlayer {
  protected canvasManager: CanvasManager;
  protected isPlaying: boolean = false;
  protected currentTime: number = 0;
  protected animationId: number | null = null;
  protected startTime: number = 0;
  protected totalDuration: number = 0;

  constructor(canvasManager: CanvasManager) {
    this.canvasManager = canvasManager;
  }

  /**
   * 播放动画 - 子类必须实现
   */
  abstract play(animationData: any): void;

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
   * 获取播放状态
   */
  public getPlaybackState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      totalDuration: this.totalDuration,
      progress: this.totalDuration > 0 ? this.currentTime / this.totalDuration : 0
    };
  }

  /**
   * 清理播放器资源 - 子类可以重写
   */
  public clear(): void {
    this.stop();
  }

  /**
   * 获取 Canvas 管理器
   */
  protected getCanvasManager(): CanvasManager {
    return this.canvasManager;
  }

  /**
   * 获取 Canvas 实例
   */
  protected getCanvas() {
    return this.canvasManager.getCanvas();
  }

  /**
   * 渲染画布
   */
  protected render(): void {
    this.canvasManager.render();
  }

  /**
   * 检查是否正在播放
   */
  protected isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 设置播放状态
   */
  protected setPlayingState(playing: boolean): void {
    this.isPlaying = playing;
  }

  /**
   * 设置动画时长
   */
  protected setTotalDuration(duration: number): void {
    this.totalDuration = duration;
  }

  /**
   * 开始动画循环
   */
  protected startAnimationLoop(callback: () => void): void {
    this.startTime = performance.now();
    this.currentTime = 0;
    this.animationId = requestAnimationFrame(callback);
  }

  /**
   * 停止动画循环
   */
  protected stopAnimationLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 更新当前时间
   */
  protected updateCurrentTime(): void {
    const now = performance.now();
    this.currentTime = now - this.startTime;
  }

  /**
   * 获取当前进度
   */
  protected getCurrentProgress(): number {
    return Math.min(this.currentTime / this.totalDuration, 1);
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return 'obj_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * 解析数值（支持百分比和绝对值）
   * @param value 要解析的值
   * @param defaultValue 默认值
   * @param percentageReference 百分比参考值（100%对应的数值），为空时不支持百分比字符串
   * @returns 解析后的数值
   */
  protected parseNumericValue(value: any, defaultValue: number, percentageReference?: number): number {
    // 如果是数字，直接返回
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return value;
    }

    // 如果是字符串，检查是否为百分比
    if (typeof value === 'string') {
      const trimmedValue = value.trim();

      // 检查是否为百分比格式 (例如: "50%", "100%")
      if (trimmedValue.endsWith('%')) {
        // 如果没有提供百分比参考值，则不支持百分比字符串
        if (percentageReference === undefined) {
          return defaultValue;
        }

        const percentage = parseFloat(trimmedValue.slice(0, -1));
        if (!isNaN(percentage) && isFinite(percentage)) {
          return (percentage / 100) * percentageReference;
        }
      }

      // 如果没有提供百分比参考值，则不允许字符串
      if (percentageReference === undefined) {
        return defaultValue;
      }

      // 尝试解析为数字
      const numericValue = parseFloat(trimmedValue);
      if (!isNaN(numericValue) && isFinite(numericValue)) {
        return numericValue;
      }
    }

    // 如果解析失败，使用默认值
    return defaultValue;
  }


}
