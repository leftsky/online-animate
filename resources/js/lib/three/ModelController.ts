import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// 动画信息接口
export interface AnimationInfo {
  name: string;
  duration: number;
  clip?: THREE.AnimationClip; // 添加 clip 字段以保持与旧版一致
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
        // 重要：等待模型完全加载后再进行缩放计算
        await this.waitForModelReady();
        
        // 应用模型定位和缩放逻辑（与旧版保持一致）
        this.positionAndScaleModel();
        
        // 注意：不调用 applyModelParams()，因为它会覆盖正确的缩放值
        
        // 添加到场景
        this.scene.add(this.currentModel);
        
        // 设置阴影
        this.setupShadows(this.currentModel);
        
        // 验证模型加载状态
        if (this.currentModel) {
          const finalBox = new THREE.Box3().setFromObject(this.currentModel);
          const finalSize = finalBox.getSize(new THREE.Vector3());
          console.log('最终模型状态验证:', {
            position: this.currentModel.position,
            rotation: this.currentModel.rotation,
            scale: this.currentModel.scale,
            finalSize: finalSize,
            modelParams: this.modelParams
          });
        }
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
          console.log('GLTF模型加载成功:', url);
          resolve();
        },
        (progress) => {
          console.log('加载进度:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('GLTF模型加载失败:', error);
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
          console.log('FBX模型加载成功:', url);
          resolve();
        },
        (progress) => {
          console.log('加载进度:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('FBX模型加载失败:', error);
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
      name: clip.name || `动画 ${clip.name ? clip.name : '未命名'}`,
      duration: Math.round(clip.duration * 1000), // 转换为毫秒，与旧版保持一致
      clip: clip // 保留 clip 引用，与旧版保持一致
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
    // 保护关键参数：不允许覆盖已设置的缩放和位置
    const protectedParams = { ...this.modelParams, ...params };
    
    // 如果模型已经加载并定位，保护这些关键值
    if (this.currentModel) {
      // 保护缩放值
      if (this.modelParams.scale !== 1) {
        protectedParams.scale = this.modelParams.scale;
      }
      
      // 保护位置值（如果已经设置过）
      if (this.modelParams.positionX !== 0 || this.modelParams.positionY !== 0 || this.modelParams.positionZ !== 0) {
        protectedParams.positionX = this.modelParams.positionX;
        protectedParams.positionY = this.modelParams.positionY;
        protectedParams.positionZ = this.modelParams.positionZ;
      }
      
      // 保护旋转值（如果已经设置过）
      if (this.modelParams.rotationY !== 0) {
        protectedParams.rotationY = this.modelParams.rotationY;
      }
    }
    
    this.modelParams = protectedParams;
    this.applyModelParams();
    
    // 更新辅助器
    this.updateHelpers();
    
    console.log('模型参数更新完成（受保护）:', this.modelParams);
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
        // 与旧版保持一致：使用绿色边界框
        this.boundingBoxHelper = new THREE.BoxHelper(this.currentModel, 0x00ff00);
        this.scene.add(this.boundingBoxHelper);
        console.log('显示模型边界框');
      } else {
        this.boundingBoxHelper.visible = true;
      }
    } else if (this.boundingBoxHelper) {
      this.boundingBoxHelper.visible = false;
      console.log('隐藏模型边界框');
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
          console.log('显示模型骨骼');
        } else {
          console.warn('模型中未找到骨骼数据');
        }
      } else {
        this.skeletonHelper.visible = true;
        console.log('显示模型骨骼');
      }
    } else if (this.skeletonHelper) {
      this.skeletonHelper.visible = false;
      console.log('隐藏模型骨骼');
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

  /**
   * 模型定位和缩放（与旧版实现保持一致）
   */
  private positionAndScaleModel(): void {
    if (!this.currentModel) return;
    
    // 验证模型状态
    let validGeometry = false;
    this.currentModel.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        validGeometry = true;
      }
    });
    
    if (!validGeometry) {
      console.warn('模型几何体未完全加载，跳过缩放计算');
      return;
    }
    
    // 计算模型的边界框和中心点
    const box = new THREE.Box3().setFromObject(this.currentModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // 验证边界框计算结果
    if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
      console.warn('边界框计算异常，使用默认缩放:', size);
      return;
    }
    
    console.log('原始模型边界框:', {
      min: box.min,
      max: box.max,
      center: center,
      size: size
    });
    
    // 缩放模型以适应视图（与旧版保持一致）
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    
    // 验证缩放值
    if (scale <= 0 || scale > 10) {
      console.warn('缩放值异常，使用默认值:', scale);
      return;
    }
    
    this.currentModel.scale.setScalar(scale);
    
    // 重新计算缩放后的边界框
    const scaledBox = new THREE.Box3().setFromObject(this.currentModel);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    const scaledSize = scaledBox.getSize(new THREE.Vector3());
    
    console.log('缩放后模型边界框:', {
      min: scaledBox.min,
      max: scaledBox.max,
      center: scaledCenter,
      size: scaledSize,
      scale: scale
    });
    
    // 将模型中心移动到原点，然后确保底部贴在地面上（与旧版保持一致）
    this.currentModel.position.set(
      -scaledCenter.x,  // X轴居中
      -scaledBox.min.y, // Y轴底部贴地面（Y=0）
      -scaledCenter.z   // Z轴居中
    );
    
    console.log('最终模型位置:', this.currentModel.position);
    
    // 设置模型朝向（面向摄像机，与旧版保持一致）
    // 大多数人物模型默认面向-Z方向，我们让它面向摄像机（+Z方向）
    this.currentModel.rotation.y = Math.PI; // 旋转180度面向摄像机
    
    // 更新模型参数以反映实际位置
    this.modelParams.positionX = this.currentModel.position.x;
    this.modelParams.positionY = this.currentModel.position.y;
    this.modelParams.positionZ = this.currentModel.position.z;
    this.modelParams.scale = scale;
    
    // 更新旋转参数以反映实际朝向
    this.modelParams.rotationX = this.currentModel.rotation.x;
    this.modelParams.rotationY = this.currentModel.rotation.y;
    this.modelParams.rotationZ = this.currentModel.rotation.z;
    
    console.log('模型参数已更新:', this.modelParams);
  }

  /**
   * 等待模型完全加载
   */
  private async waitForModelReady(): Promise<void> {
    if (!this.currentModel) return;
    
    // 等待几帧确保模型完全加载
    await new Promise(resolve => {
      const checkModel = () => {
        if (this.currentModel) {
          // 检查模型是否有有效的几何体
          let hasValidGeometry = false;
          this.currentModel.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              hasValidGeometry = true;
            }
          });
          
          if (hasValidGeometry) {
            resolve(undefined);
          } else {
            requestAnimationFrame(checkModel);
          }
        } else {
          resolve(undefined);
        }
      };
      requestAnimationFrame(checkModel);
    });
    
    console.log('模型加载完成，准备进行缩放计算');
  }
}