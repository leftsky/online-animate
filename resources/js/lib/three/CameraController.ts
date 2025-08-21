import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * 摄像机控制器
 * 负责摄像机设置、控制器、视角管理等功能
 */
export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls | null = null;
  private canvas: HTMLCanvasElement | null = null;
  
  // 默认摄像机参数
  private readonly defaultPosition = { x: 5, y: 5, z: 5 };
  private readonly defaultTarget = { x: 0, y: 1, z: 0 };
  private readonly defaultFov = 75;
  private readonly defaultNear = 0.1;
  private readonly defaultFar = 1000;

  constructor() {
    // 创建透视摄像机
    this.camera = new THREE.PerspectiveCamera(
      this.defaultFov,
      window.innerWidth / window.innerHeight,
      this.defaultNear,
      this.defaultFar
    );
    
    this.resetCamera();
  }

  /**
   * 初始化控制器
   */
  initControls(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    
    // 创建轨道控制器
    this.controls = new OrbitControls(this.camera, canvas);
    
    // 配置控制器
    this.setupControlsSettings();
  }

  /**
   * 配置控制器设置
   */
  private setupControlsSettings(): void {
    if (!this.controls) return;
    
    // 基础设置
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    
    // 缩放限制
    this.controls.minDistance = 1;
    this.controls.maxDistance = 50;
    
    // 垂直旋转限制
    this.controls.maxPolarAngle = Math.PI / 2;
    
    // 设置目标点
    this.controls.target.set(
      this.defaultTarget.x,
      this.defaultTarget.y,
      this.defaultTarget.z
    );
    
    this.controls.update();
  }

  /**
   * 重置摄像机到默认位置
   */
  resetCamera(): void {
    this.camera.position.set(
      this.defaultPosition.x,
      this.defaultPosition.y,
      this.defaultPosition.z
    );
    
    this.camera.lookAt(
      this.defaultTarget.x,
      this.defaultTarget.y,
      this.defaultTarget.z
    );
    
    if (this.controls) {
      this.controls.target.set(
        this.defaultTarget.x,
        this.defaultTarget.y,
        this.defaultTarget.z
      );
      this.controls.update();
    }
  }

  /**
   * 设置摄像机位置
   */
  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    if (this.controls) {
      this.controls.update();
    }
  }

  /**
   * 设置摄像机目标点
   */
  setCameraTarget(x: number, y: number, z: number): void {
    if (this.controls) {
      this.controls.target.set(x, y, z);
      this.controls.update();
    } else {
      this.camera.lookAt(x, y, z);
    }
  }

  /**
   * 设置视野角度
   */
  setFieldOfView(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 更新摄像机宽高比
   */
  updateAspectRatio(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 聚焦到对象
   */
  focusOnObject(object: THREE.Object3D, distance: number = 5): void {
    // 计算对象的包围盒
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // 计算合适的距离
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * distance;
    
    // 设置摄像机位置
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, center)
      .normalize()
      .multiplyScalar(cameraDistance);
    
    this.camera.position.copy(center).add(direction);
    
    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    } else {
      this.camera.lookAt(center);
    }
  }

  /**
   * 设置预设视角
   */
  setPresetView(preset: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'isometric'): void {
    const distance = 5;
    const target = new THREE.Vector3(0, 1, 0);
    
    let position: THREE.Vector3;
    
    switch (preset) {
      case 'front':
        position = new THREE.Vector3(0, 1, distance);
        break;
      case 'back':
        position = new THREE.Vector3(0, 1, -distance);
        break;
      case 'left':
        position = new THREE.Vector3(-distance, 1, 0);
        break;
      case 'right':
        position = new THREE.Vector3(distance, 1, 0);
        break;
      case 'top':
        position = new THREE.Vector3(0, distance, 0);
        break;
      case 'bottom':
        position = new THREE.Vector3(0, -distance, 0);
        break;
      case 'isometric':
      default:
        position = new THREE.Vector3(distance, distance, distance);
        break;
    }
    
    this.camera.position.copy(position);
    
    if (this.controls) {
      this.controls.target.copy(target);
      this.controls.update();
    } else {
      this.camera.lookAt(target);
    }
  }

  /**
   * 平滑移动摄像机到指定位置
   */
  animateToPosition(
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    duration: number = 1000
  ): Promise<void> {
    return new Promise((resolve) => {
      const startPosition = this.camera.position.clone();
      const startLookAt = this.controls ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0);
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        const easeProgress = this.easeInOutCubic(progress);
        
        // 插值位置
        this.camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        
        if (this.controls) {
          this.controls.target.lerpVectors(startLookAt, targetLookAt, easeProgress);
          this.controls.update();
        } else {
          const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, easeProgress);
          this.camera.lookAt(currentLookAt);
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * 缓动函数
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * 启用/禁用控制器
   */
  setControlsEnabled(enabled: boolean): void {
    if (this.controls) {
      this.controls.enabled = enabled;
    }
  }

  /**
   * 启用/禁用自动旋转
   */
  setAutoRotate(enabled: boolean, speed: number = 2.0): void {
    if (this.controls) {
      this.controls.autoRotate = enabled;
      this.controls.autoRotateSpeed = speed;
    }
  }

  /**
   * 更新控制器（需要在渲染循环中调用）
   */
  update(): void {
    if (this.controls) {
      this.controls.update();
    }
  }

  /**
   * 获取摄像机
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * 获取控制器
   */
  getControls(): OrbitControls | null {
    return this.controls;
  }

  /**
   * 获取摄像机位置
   */
  getCameraPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  /**
   * 获取摄像机目标点
   */
  getCameraTarget(): THREE.Vector3 {
    return this.controls ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0);
  }

  /**
   * 获取摄像机参数
   */
  getCameraParams(): {
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
    aspect: number;
    near: number;
    far: number;
  } {
    return {
      position: this.getCameraPosition(),
      target: this.getCameraTarget(),
      fov: this.camera.fov,
      aspect: this.camera.aspect,
      near: this.camera.near,
      far: this.camera.far
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    
    this.canvas = null;
  }
}