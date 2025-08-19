import { Canvas, CanvasOptions } from 'fabric';

/**
 * Canvas 管理器类
 * 负责初始化和管理 Fabric.js Canvas 实例
 */
export class CanvasManager {
  private canvas: Canvas;
  private isDisposed: boolean = false;

  constructor(canvasElement: HTMLCanvasElement | string | Canvas, options?: CanvasOptions) {
    if (canvasElement instanceof Canvas) {
      // 如果传入的是 Fabric.js Canvas 实例，直接使用
      this.canvas = canvasElement;
    } else {
      // 获取容器尺寸
      let width = 800;
      let height = 600;
      
      if (canvasElement instanceof HTMLCanvasElement) {
        // 如果传入的是 HTMLCanvasElement，尝试获取其尺寸
        const rect = canvasElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          width = rect.width;
          height = rect.height;
        }
      }
      
      // 如果传入的是字符串选择器，尝试获取元素尺寸
      if (typeof canvasElement === 'string') {
        const element = document.querySelector(canvasElement) as HTMLCanvasElement;
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            width = rect.width;
            height = rect.height;
          }
        }
      }
      
      // 如果传入的 options 中有尺寸，优先使用
      if (options?.width) width = options.width;
      if (options?.height) height = options.height;
      
      // 如果传入的是 HTMLCanvasElement，使用其实际尺寸
      if (canvasElement instanceof HTMLCanvasElement) {
        width = canvasElement.width || width;
        height = canvasElement.height || height;
      }
      
      console.log('🎨 Canvas尺寸设置:', { width, height });
      
      // 如果传入的是 HTMLCanvasElement 或字符串，创建新的 Canvas 实例
      this.canvas = new Canvas(canvasElement, {
        width: width,
        height: height,
        backgroundColor: '#ffffff',
        selection: false, // 禁用选择，专注于播放
        ...options
      });
    }
  }

  /**
   * 获取 Canvas 实例
   */
  public getCanvas(): Canvas {
    if (this.isDisposed) {
      throw new Error('Canvas has been disposed');
    }
    return this.canvas;
  }

  /**
   * 清空画布
   */
  public clear(): void {
    if (this.isDisposed) return;
    this.canvas.clear();
  }

  /**
   * 渲染画布
   */
  public render(): void {
    if (this.isDisposed) return;
    this.canvas.renderAll();
  }

  /**
   * 设置画布尺寸
   */
  public setDimensions(width: number, height: number): void {
    if (this.isDisposed) return;
    this.canvas.setDimensions({ width, height });
  }

  /**
   * 获取画布尺寸
   */
  public getDimensions(): { width: number; height: number } {
    if (this.isDisposed) {
      return { width: 0, height: 0 };
    }
    return {
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight()
    };
  }

  /**
   * 检查是否已销毁
   */
  public getDisposedStatus(): boolean {
    return this.isDisposed;
  }

  /**
   * 销毁 Canvas
   */
  public dispose(): void {
    if (this.isDisposed) return;
    
    this.canvas.dispose();
    this.isDisposed = true;
  }
}
