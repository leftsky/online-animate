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
}
