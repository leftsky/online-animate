import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// 动画信息接口
export interface AnimationInfo {
  name: string;
  duration: number;
}

// 模型参数接口
export interface ModelParams {
  scale: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  positionX: number;
  positionY: number;
  positionZ: number;
}

/**
 * 模型控制器
 * 负责模型加载、动画控制、辅助器管理等功能
 */
export class ModelController {
  private scene: THREE.Scene | null = null;
  private currentModel: THREE.Object3D | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private currentAction: THREE.AnimationAction | null = null;
  private animations: THREE.AnimationClip[] = [];
  private clock = new THREE.Clock();
  
  // 辅助器
  private boundingBoxHelper: THREE.BoxHelper | null = null;
  private skeletonHelper: THREE.SkeletonHelper | null = null;
  
  // 加载器
  private gltfLoader = new GLTFLoader();
  private fbxLoader = new FBXLoader();
  private objLoader = new OBJLoader();
  
  // 模型参数
  private modelParams: ModelParams = {
    scale: 1,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    positionX: 0,
    positionY: 0,
    positionZ: 0
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * 加载模型文件
   */
  async loadModel(url: string): Promise<void> {
    // 清理之前的模型
    this.clearModel();
    
    try {
      const extension = this.getFileExtension(url).toLowerCase();
      
      switch (extension) {
        case 'gltf':
        case 'glb':
          await this.loadGLTFModel(url);
          break;
        case 'fbx':
          await this.loadFBXModel(url);
          break;
        case 'obj':
          await this.loadOBJModel(url);
          break;
        default:
          throw new Error(`不支持的文件格式: ${extension}`);
      }
      
      if (this.currentModel && this.scene) {
        // 应用模型参数
        this.applyModelParams();
        
        // 添加到场景
        this.scene.add(this.currentModel);
        
        // 设置阴影
        this.setupShadows(this.currentModel);
      }
    } catch (error) {
      console.error('模型加载失败:', error);
      throw error;
    }
  }

  /**
   * 加载GLTF模型
   */
  private loadGLTFModel(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.currentModel = gltf.scene;
          this.animations = gltf.animations;
          this.setupAnimationMixer();
          resolve();
        },
        (progress) => {
          console.log('加载进度:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * 加载FBX模型
   */
  private loadFBXModel(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (fbx) => {
          this.currentModel = fbx;
          this.animations = fbx.animations;
          this.setupAnimationMixer();
          resolve();
        },
        (progress) => {
          console.log('加载进度:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * 加载OBJ模型
   */
  private loadOBJModel(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.objLoader.load(
        url,
        (obj) => {
          this.currentModel = obj;
          this.animations = []; // OBJ文件通常不包含动画
          resolve();
        },
        (progress) => {
          console.log('加载进度:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(url: string): string {
    return url.split('.').pop() || '';
  }

  /**
   * 设置动画混合器
   */
  private setupAnimationMixer(): void {
    if (!this.currentModel) return;
    
    if (this.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.currentModel);
    }
  }

  /**
   * 设置阴影
   */
  private setupShadows(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  /**
   * 播放动画
   */
  playAnimation(index: number): void {
    if (!this.mixer || !this.animations[index]) return;
    
    // 停止当前动画
    if (this.currentAction) {
      this.currentAction.stop();
    }
    
    // 播放新动画
    this.currentAction = this.mixer.clipAction(this.animations[index]);
    this.currentAction.play();
  }

  /**
   * 暂停动画
   */
  pauseAnimation(): void {
    if (this.currentAction) {
      this.currentAction.paused = true;
    }
  }

  /**
   * 恢复动画
   */
  resumeAnimation(): void {
    if (this.currentAction) {
      this.currentAction.paused = false;
    }
  }

  /**
   * 停止动画
   */
  stopAnimation(): void {
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
    }
  }

  /**
   * 设置动画时间
   */
  setAnimationTime(time: number): void {
    if (this.currentAction) {
      this.currentAction.time = time;
    }
  }

  /**
   * 获取动画信息列表
   */
  getAnimationInfos(): AnimationInfo[] {
    return this.animations.map(clip => ({
      name: clip.name,
      duration: clip.duration
    }));
  }

  /**
   * 更新动画（需要在渲染循环中调用）
   */
  update(): void {
    if (this.mixer) {
      this.mixer.update(this.clock.getDelta());
    }
  }

  /**
   * 应用模型参数
   */
  private applyModelParams(): void {
    if (!this.currentModel) return;
    
    // 应用缩放
    this.currentModel.scale.setScalar(this.modelParams.scale);
    
    // 应用旋转
    this.currentModel.rotation.set(
      this.modelParams.rotationX,
      this.modelParams.rotationY,
      this.modelParams.rotationZ
    );
    
    // 应用位置
    this.currentModel.position.set(
      this.modelParams.positionX,
      this.modelParams.positionY,
      this.modelParams.positionZ
    );
  }

  /**
   * 更新模型参数
   */
  updateModelParams(params: Partial<ModelParams>): void {
    this.modelParams = { ...this.modelParams, ...params };
    this.applyModelParams();
    
    // 更新辅助器
    this.updateHelpers();
  }

  /**
   * 获取模型参数
   */
  getModelParams(): ModelParams {
    return { ...this.modelParams };
  }

  /**
   * 显示/隐藏边界框辅助器
   */
  toggleBoundingBox(visible: boolean): void {
    if (!this.currentModel || !this.scene) return;
    
    if (visible) {
      if (!this.boundingBoxHelper) {
        this.boundingBoxHelper = new THREE.BoxHelper(this.currentModel, 0xffff00);
        this.scene.add(this.boundingBoxHelper);
      }
      this.boundingBoxHelper.visible = true;
    } else if (this.boundingBoxHelper) {
      this.boundingBoxHelper.visible = false;
    }
  }

  /**
   * 显示/隐藏骨骼辅助器
   */
  toggleSkeleton(visible: boolean): void {
    if (!this.currentModel || !this.scene) return;
    
    if (visible) {
      if (!this.skeletonHelper) {
        // 查找骨骼
        let skeleton: THREE.Skeleton | null = null;
        this.currentModel.traverse((child) => {
          if (child instanceof THREE.SkinnedMesh && child.skeleton) {
            skeleton = child.skeleton;
          }
        });
        
        if (skeleton) {
          this.skeletonHelper = new THREE.SkeletonHelper(this.currentModel);
          this.scene.add(this.skeletonHelper);
        }
      }
      if (this.skeletonHelper) {
        this.skeletonHelper.visible = true;
      }
    } else if (this.skeletonHelper) {
      this.skeletonHelper.visible = false;
    }
  }

  /**
   * 更新辅助器
   */
  private updateHelpers(): void {
    if (this.boundingBoxHelper && this.currentModel) {
      this.boundingBoxHelper.setFromObject(this.currentModel);
    }
  }

  /**
   * 获取当前模型
   */
  getCurrentModel(): THREE.Object3D | null {
    return this.currentModel;
  }

  /**
   * 获取模型边界框
   */
  getModelBoundingBox(): THREE.Box3 | null {
    if (!this.currentModel) return null;
    return new THREE.Box3().setFromObject(this.currentModel);
  }

  /**
   * 获取模型中心点
   */
  getModelCenter(): THREE.Vector3 | null {
    const box = this.getModelBoundingBox();
    return box ? box.getCenter(new THREE.Vector3()) : null;
  }

  /**
   * 获取模型尺寸
   */
  getModelSize(): THREE.Vector3 | null {
    const box = this.getModelBoundingBox();
    return box ? box.getSize(new THREE.Vector3()) : null;
  }

  /**
   * 清理当前模型
   */
  clearModel(): void {
    if (this.currentModel && this.scene) {
      this.scene.remove(this.currentModel);
      
      // 清理几何体和材质
      this.currentModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
    
    // 清理动画
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    
    this.currentAction = null;
    this.currentModel = null;
    this.animations = [];
    
    // 清理辅助器
    this.clearHelpers();
  }

  /**
   * 清理辅助器
   */
  private clearHelpers(): void {
    if (this.boundingBoxHelper && this.scene) {
      this.scene.remove(this.boundingBoxHelper);
      this.boundingBoxHelper.dispose();
      this.boundingBoxHelper = null;
    }
    
    if (this.skeletonHelper && this.scene) {
      this.scene.remove(this.skeletonHelper);
      this.skeletonHelper.dispose();
      this.skeletonHelper = null;
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.clearModel();
    this.scene = null;
  }
}