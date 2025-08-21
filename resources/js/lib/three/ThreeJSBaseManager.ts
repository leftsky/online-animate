import * as THREE from 'three';

/**
 * Three.js基础管理器
 * 负责渲染器、画布、渲染循环等基础资源管理
 */
export class ThreeJSBaseManager {
  private renderer: THREE.WebGLRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private animationId: number | null = null;
  private isRendering = false;
  private renderCallbacks: (() => void)[] = [];

  /**
   * 初始化渲染器和画布
   */
  initRenderer(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    
    // 创建WebGL渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    
    // 设置渲染器属性
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    
    // 监听窗口大小变化
    this.setupResizeHandler();
  }

  /**
   * 设置窗口大小变化监听
   */
  private setupResizeHandler(): void {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.canvas) {
          this.handleResize();
        }
      }
    });
    
    if (this.canvas) {
      resizeObserver.observe(this.canvas);
    }
  }

  /**
   * 处理画布大小变化
   */
  handleResize(): void {
    if (!this.renderer || !this.canvas) return;
    
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    this.renderer.setSize(width, height);
    
    // 通知其他管理器更新
    this.notifyResize(width, height);
  }

  /**
   * 通知大小变化回调
   */
  private resizeCallbacks: ((width: number, height: number) => void)[] = [];
  
  onResize(callback: (width: number, height: number) => void): void {
    this.resizeCallbacks.push(callback);
  }
  
  private notifyResize(width: number, height: number): void {
    this.resizeCallbacks.forEach(callback => callback(width, height));
  }

  /**
   * 开始渲染循环
   */
  startRenderLoop(): void {
    if (this.isRendering) return;
    
    this.isRendering = true;
    this.renderLoop();
  }

  /**
   * 停止渲染循环
   */
  stopRenderLoop(): void {
    this.isRendering = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 渲染循环
   */
  private renderLoop(): void {
    if (!this.isRendering) return;
    
    // 执行所有渲染回调
    this.renderCallbacks.forEach(callback => callback());
    
    this.animationId = requestAnimationFrame(() => this.renderLoop());
  }

  /**
   * 添加渲染回调
   */
  addRenderCallback(callback: () => void): void {
    this.renderCallbacks.push(callback);
  }

  /**
   * 移除渲染回调
   */
  removeRenderCallback(callback: () => void): void {
    const index = this.renderCallbacks.indexOf(callback);
    if (index > -1) {
      this.renderCallbacks.splice(index, 1);
    }
  }

  /**
   * 渲染场景
   */
  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.renderer) return;
    this.renderer.render(scene, camera);
  }

  /**
   * 获取渲染器
   */
  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  /**
   * 获取画布
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * 获取画布尺寸
   */
  getCanvasSize(): { width: number; height: number } {
    if (!this.canvas) return { width: 0, height: 0 };
    return {
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopRenderLoop();
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    
    this.canvas = null;
    this.renderCallbacks = [];
    this.resizeCallbacks = [];
  }
}