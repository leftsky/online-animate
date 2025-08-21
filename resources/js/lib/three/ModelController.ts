import { type MediaCharacter } from '@/services/mediaApi';
import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { v4 as uuid } from 'uuid';
import { markRaw, ref, toRaw } from 'vue';
import { useThreeJSManager } from './ThreeJSBaseManager';

// 模型状态枚举
enum ModelStatus {
    CREATED = 'created', // 已创建
    INITED = 'inited', // 已初始化
    LOADING = 'loading', // 加载中
    LOADED = 'loaded', // 已加载
    PLAYING = 'playing', // 播放中
    PAUSED = 'paused', // 已暂停
    DESTROYED = 'destroyed', // 已销毁
}

export function useModelController(threeManager: ReturnType<typeof useThreeJSManager>) {
    const { threeScene: scene, threeControls: controls, addMixer } = threeManager;
    // const scene = ref<THREE.Scene>();
    const loading = ref(false);
    const url = ref<string | null>(null);
    const model = ref<THREE.Group | null>(null);
    const mixer = ref<THREE.AnimationMixer | null>(null);
    const animations = ref<Array<{ name: string; duration: number; clip: any }>>([]);
    // const controls = ref<OrbitControls>();
    const inited = ref(false);
    const modelId = ref<string>('');

    // 模型状态
    const status = ref<ModelStatus>(ModelStatus.CREATED);

    // 显示控制相关状态
    const boundingBox = ref<THREE.BoxHelper | null>(null);
    const skeleton = ref<THREE.SkeletonHelper | null>(null);

    const init = () => {
        // scene.value = sceneParam;
        // controls.value = controlsParam;
        modelId.value = uuid();
        status.value = ModelStatus.INITED;
        inited.value = true;
        // addMixer('default', mixer.value as THREE.AnimationMixer);
    };

    // 加载人物模型
    const load = async (character: MediaCharacter) => {
        if (!inited.value) {
            // init();
            // throw new Error('模型未初始化');
        }

        if (!character.additional_resources || !scene.value) return;

        try {
            const resourcesData = Array.isArray(character.additional_resources) ? character.additional_resources[0] : character.additional_resources;

            let modelFileUrl: string | null = null;
            if (typeof resourcesData === 'string') {
                const parsed = JSON.parse(resourcesData);
                // 处理简单URL字符串格式
                modelFileUrl = typeof parsed.modelFile === 'string' ? parsed.modelFile : parsed.modelFile?.url;
            } else if (typeof resourcesData === 'object' && resourcesData !== null) {
                // modelFile现在可能是简单的URL字符串或对象
                const modelFile = (resourcesData as any).modelFile;
                modelFileUrl = typeof modelFile === 'string' ? modelFile : modelFile?.url;
            }

            if (modelFileUrl && typeof modelFileUrl === 'string' && modelFileUrl.trim().length > 0) {
                loading.value = true;
                status.value = ModelStatus.LOADING;
                url.value = modelFileUrl;

                // 移除之前的模型
                if (model.value) {
                    scene.value.remove(toRaw(model.value));
                    model.value = null;
                }

                // 加载新模型
                const loader = new GLTFLoader();

                try {
                    const gltf = await new Promise<any>((resolve, reject) => {
                        loader.load(modelFileUrl, resolve, undefined, reject);
                    });

                    const _model = gltf.scene;

                    // 设置模型属性
                    _model.traverse((child: any) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // 计算模型的边界框和中心点
                    const box = new THREE.Box3().setFromObject(_model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    console.log('原始模型边界框:', {
                        min: box.min,
                        max: box.max,
                        center: center,
                        size: size,
                    });

                    // 缩放模型以适应视图
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2 / maxDim;
                    _model.scale.setScalar(scale);

                    // 重新计算缩放后的边界框
                    const scaledBox = new THREE.Box3().setFromObject(_model);
                    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
                    const scaledSize = scaledBox.getSize(new THREE.Vector3());

                    console.log('缩放后模型边界框:', {
                        min: scaledBox.min,
                        max: scaledBox.max,
                        center: scaledCenter,
                        size: scaledSize,
                        scale: scale,
                    });

                    // 将模型中心移动到原点，然后确保底部贴在地面上
                    _model.position.set(
                        -scaledCenter.x, // X轴居中
                        -scaledBox.min.y, // Y轴底部贴地面（Y=0）
                        -scaledCenter.z, // Z轴居中
                    );

                    console.log('最终模型位置:', _model.position);

                    // 设置模型朝向（面向摄像机）
                    // 大多数人物模型默认面向-Z方向，我们让它面向摄像机（+Z方向）
                    _model.rotation.y = Math.PI; // 旋转180度面向摄像机

                    // 添加到场景
                    scene.value.add(_model);
                    model.value = markRaw(_model);

                    // 动态调整摄像机目标点，使其对准模型的中心高度
                    const modelHeight = scaledSize.y;
                    const targetY = modelHeight * 0.4; // 目标点设置在模型高度的40%处，通常是胸部位置
                    if (controls.value) {
                        controls.value.target.set(0, targetY, 0);
                        controls.value.update();
                        console.log('摄像机目标点已调整至:', { x: 0, y: targetY, z: 0 });
                    }

                    // 解析动画
                    parseAnimations(gltf);

                    console.log('模型加载成功:', modelFileUrl);
                    status.value = ModelStatus.LOADED;
                } catch (loadError) {
                    console.error('模型加载失败:', loadError);
                }
            }
        } catch (error) {
            console.error('解析模型文件失败:', error);
        } finally {
            loading.value = false;
            if (status.value === ModelStatus.LOADING) {
                status.value = ModelStatus.INITED; // 加载失败时回到初始化状态
            }
        }
    };

    // 解析模型动画
    const parseAnimations = (gltf: any) => {
        const animationList: Array<{ name: string; duration: number; clip: any }> = [];

        if (gltf.animations && gltf.animations.length > 0) {
            // 创建动画混合器
            if (model.value) {
                mixer.value = markRaw(new THREE.AnimationMixer(toRaw(model.value)));
                addMixer(modelId.value, mixer.value as THREE.AnimationMixer);
            }

            // 解析所有动画
            gltf.animations.forEach((clip: any, index: number) => {
                animationList.push({
                    name: clip.name || `动画 ${index + 1}`,
                    duration: Math.round(clip.duration * 1000), // 转换为毫秒
                    clip: markRaw(clip),
                });
            });
        }

        console.log('解析到动画:', animationList.length, '个', mixer.value, model.value);
        animations.value = animationList;
    };

    // 播放动画
    const play = () => {
        if (mixer.value && status.value === ModelStatus.LOADED) {
            status.value = ModelStatus.PLAYING;
        }
    };

    // 暂停动画
    const pause = () => {
        if (status.value === ModelStatus.PLAYING) {
            status.value = ModelStatus.PAUSED;
        }
    };

    // 停止动画
    const stop = () => {
        if (mixer.value && (status.value === ModelStatus.PLAYING || status.value === ModelStatus.PAUSED)) {
            status.value = ModelStatus.LOADED;
        }
    };

    // 销毁模型
    const destroy = () => {
        clear();
        status.value = ModelStatus.DESTROYED;
    };

    // 清空模型显示
    const clear = () => {
        console.log('清空模型显示');
        url.value = null;
        loading.value = false;
        status.value = ModelStatus.INITED;

        if (model.value && scene.value) {
            scene.value.remove(toRaw(model.value));
            model.value = null;
        }

        if (boundingBox.value && scene.value) {
            scene.value.remove(toRaw(boundingBox.value));
            boundingBox.value = null;
        }
        if (skeleton.value && scene.value) {
            scene.value.remove(toRaw(skeleton.value));
            skeleton.value = null;
        }

        if (mixer.value) {
            mixer.value = null;
        }
        animations.value = [];
    };

    // 处理边界框显示切换
    const toggleBoundingBox = (show: boolean) => {
        if (!model.value || !scene.value) return;

        try {
            if (show) {
                if (!boundingBox.value) {
                    boundingBox.value = markRaw(new THREE.BoxHelper(toRaw(model.value), 0x00ff00));
                    scene.value.add(toRaw(boundingBox.value));
                }
            } else {
                if (boundingBox.value) {
                    scene.value.remove(toRaw(boundingBox.value));
                    boundingBox.value = null;
                }
            }
        } catch (error) {
            console.error('切换边界框显示失败:', error);
        }
    };

    // 处理骨骼显示切换
    const toggleSkeleton = (show: boolean) => {
        if (!model.value || !scene.value) return;

        try {
            if (show) {
                let skeletonData: THREE.Skeleton | null = null;
                model.value.traverse((child: any) => {
                    if (child.isSkinnedMesh && child.skeleton) {
                        skeletonData = child.skeleton;
                    }
                });

                if (skeletonData && !skeleton.value) {
                    skeleton.value = markRaw(new THREE.SkeletonHelper(toRaw(model.value)));
                    scene.value.add(toRaw(skeleton.value));
                } else if (!skeletonData) {
                    console.warn('模型中未找到骨骼数据');
                }
            } else {
                if (skeleton.value) {
                    scene.value.remove(toRaw(skeleton.value));
                    skeleton.value = null;
                }
            }
        } catch (error) {
            console.error('切换骨骼显示失败:', error);
        }
    };

    return {
        animations,
        loading,
        url,
        model,
        mixer,
        status,
        init,
        load,
        clear,
        play,
        pause,
        stop,
        destroy,
        toggleBoundingBox,
        toggleSkeleton,
    };
}
