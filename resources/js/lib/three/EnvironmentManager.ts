import * as THREE from 'three';

/**
 * 环境管理器
 * 负责场景、光源、地面等环境设置
 */
export class EnvironmentManager {
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private ground: THREE.Mesh | null = null;
  private skybox: THREE.Mesh | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    // 与旧版保持一致：设置默认背景色
    // this.scene.background = new THREE.Color(0xf5f5f5);
    this.initEnvironment();
  }

  /**
   * 初始化环境
   */
  private initEnvironment(): void {
    this.setupLighting();
    this.setupGround();
    this.setupSkybox();
  }

  /**
   * 设置光照系统
   */
  private setupLighting(): void {
    // 环境光 - 提供基础照明
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // 方向光 - 主光源，模拟太阳光
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 10, 5);
    this.directionalLight.castShadow = true;
    
    // 配置阴影
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -10;
    this.directionalLight.shadow.camera.right = 10;
    this.directionalLight.shadow.camera.top = 10;
    this.directionalLight.shadow.camera.bottom = -10;
    
    this.scene.add(this.directionalLight);
  }

  /**
   * 设置地面
   */
  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xcccccc,
      transparent: true,
      opacity: 0.4
    });
    
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    
    this.scene.add(this.ground);
  }

  /**
   * 设置天空盒
   */
  private setupSkybox(): void {
    // 创建简单的渐变天空背景
    const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87ceeb) },
        bottomColor: { value: new THREE.Color(0xf0f8ff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skybox);
  }

  /**
   * 更新环境光强度
   */
  setAmbientLightIntensity(intensity: number): void {
    if (this.ambientLight) {
      this.ambientLight.intensity = intensity;
    }
  }

  /**
   * 更新方向光强度
   */
  setDirectionalLightIntensity(intensity: number): void {
    if (this.directionalLight) {
      this.directionalLight.intensity = intensity;
    }
  }

  /**
   * 设置方向光位置
   */
  setDirectionalLightPosition(x: number, y: number, z: number): void {
    if (this.directionalLight) {
      this.directionalLight.position.set(x, y, z);
    }
  }

  /**
   * 显示/隐藏地面
   */
  setGroundVisible(visible: boolean): void {
    if (this.ground) {
      this.ground.visible = visible;
    }
  }

  /**
   * 设置地面颜色
   */
  setGroundColor(color: number): void {
    if (this.ground && this.ground.material instanceof THREE.MeshLambertMaterial) {
      this.ground.material.color.setHex(color);
    }
  }

  /**
   * 设置地面透明度
   */
  setGroundOpacity(opacity: number): void {
    if (this.ground && this.ground.material instanceof THREE.MeshLambertMaterial) {
      this.ground.material.opacity = opacity;
    }
  }

  /**
   * 显示/隐藏天空盒
   */
  setSkyboxVisible(visible: boolean): void {
    if (this.skybox) {
      this.skybox.visible = visible;
    }
  }

  /**
   * 设置天空盒颜色
   */
  setSkyboxColors(topColor: number, bottomColor: number): void {
    if (this.skybox && this.skybox.material instanceof THREE.ShaderMaterial) {
      this.skybox.material.uniforms.topColor.value.setHex(topColor);
      this.skybox.material.uniforms.bottomColor.value.setHex(bottomColor);
    }
  }

  /**
   * 设置场景背景色
   */
  setBackgroundColor(color: number): void {
    this.scene.background = new THREE.Color(color);
  }

  /**
   * 清除场景背景
   */
  clearBackground(): void {
    this.scene.background = null;
  }

  /**
   * 添加对象到场景
   */
  addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * 从场景移除对象
   */
  removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * 清空场景中的所有模型（保留环境元素）
   */
  clearModels(): void {
    const objectsToRemove: THREE.Object3D[] = [];
    
    this.scene.traverse((child) => {
      // 不移除光源、地面、天空盒等环境元素
      if (child !== this.ambientLight && 
          child !== this.directionalLight && 
          child !== this.ground && 
          child !== this.skybox &&
          child !== this.scene) {
        objectsToRemove.push(child);
      }
    });
    
    objectsToRemove.forEach(obj => {
      this.scene.remove(obj);
      // 清理几何体和材质
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
  }

  /**
   * 获取场景
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * 获取环境光
   */
  getAmbientLight(): THREE.AmbientLight | null {
    return this.ambientLight;
  }

  /**
   * 获取方向光
   */
  getDirectionalLight(): THREE.DirectionalLight | null {
    return this.directionalLight;
  }

  /**
   * 获取地面
   */
  getGround(): THREE.Mesh | null {
    return this.ground;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // 清理场景中的所有对象
    this.scene.traverse((child) => {
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
    
    // 清空场景
    this.scene.clear();
    
    // 重置引用
    this.ambientLight = null;
    this.directionalLight = null;
    this.ground = null;
    this.skybox = null;
  }
}