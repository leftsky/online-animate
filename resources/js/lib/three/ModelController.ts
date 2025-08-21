import { type MediaCharacter } from '@/services/mediaApi';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { markRaw, ref, toRaw } from 'vue';

export function useModelController() {
    const threeScene = ref<THREE.Scene>();
    const isLoadingModel = ref(false);
    const currentModelUrl = ref<string | null>(null);
    const currentModel = ref<THREE.Group | null>(null);
    const animationMixer = ref<THREE.AnimationMixer | null>(null);
    const availableAnimations = ref<Array<{ name: string; duration: number; clip: any }>>([]);
    const threeControls = ref<OrbitControls>();

    const init = (scene: THREE.Scene, controls: OrbitControls) => {
        threeScene.value = scene;
        // animationMixer.value = mixer;
        threeControls.value = controls;
    };

    // 加载人物模型
    const loadCharacterModel = async (character: MediaCharacter) => {
        if (!character.additional_resources || !threeScene.value) return;

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
                isLoadingModel.value = true;
                currentModelUrl.value = modelFileUrl;

                // 移除之前的模型
                if (currentModel.value) {
                    threeScene.value.remove(toRaw(currentModel.value));
                    currentModel.value = null;
                }

                // 加载新模型
                const loader = new GLTFLoader();

                try {
                    const gltf = await new Promise<any>((resolve, reject) => {
                        loader.load(modelFileUrl, resolve, undefined, reject);
                    });

                    const model = gltf.scene;

                    // 设置模型属性
                    model.traverse((child: any) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // 计算模型的边界框和中心点
                    const box = new THREE.Box3().setFromObject(model);
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
                    model.scale.setScalar(scale);

                    // 重新计算缩放后的边界框
                    const scaledBox = new THREE.Box3().setFromObject(model);
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
                    model.position.set(
                        -scaledCenter.x, // X轴居中
                        -scaledBox.min.y, // Y轴底部贴地面（Y=0）
                        -scaledCenter.z, // Z轴居中
                    );

                    console.log('最终模型位置:', model.position);

                    // 设置模型朝向（面向摄像机）
                    // 大多数人物模型默认面向-Z方向，我们让它面向摄像机（+Z方向）
                    model.rotation.y = Math.PI; // 旋转180度面向摄像机

                    // 添加到场景
                    threeScene.value.add(model);
                    currentModel.value = markRaw(model);

                    // 动态调整摄像机目标点，使其对准模型的中心高度
                    const modelHeight = scaledSize.y;
                    const targetY = modelHeight * 0.4; // 目标点设置在模型高度的40%处，通常是胸部位置
                    if (threeControls.value) {
                        threeControls.value.target.set(0, targetY, 0);
                        threeControls.value.update();
                        console.log('摄像机目标点已调整至:', { x: 0, y: targetY, z: 0 });
                    }

                    // 解析动画
                    parseModelAnimations(gltf);

                    console.log('模型加载成功:', modelFileUrl);
                } catch (loadError) {
                    console.error('模型加载失败:', loadError);
                }
            }
        } catch (error) {
            console.error('解析模型文件失败:', error);
        } finally {
            isLoadingModel.value = false;
        }
    };

    // 解析模型动画
    const parseModelAnimations = (gltf: any) => {
        const animations: Array<{ name: string; duration: number; clip: any }> = [];

        if (gltf.animations && gltf.animations.length > 0) {
            // 创建动画混合器
            if (currentModel.value) {
                animationMixer.value = markRaw(new THREE.AnimationMixer(toRaw(currentModel.value)));
            }

            // 解析所有动画
            gltf.animations.forEach((clip: any, index: number) => {
                animations.push({
                    name: clip.name || `动画 ${index + 1}`,
                    duration: Math.round(clip.duration * 1000), // 转换为毫秒
                    clip: markRaw(clip),
                });
            });
        }

        console.log('解析到动画:', animations.length, '个');
        availableAnimations.value = animations;
    };

    return {
        availableAnimations,
        isLoadingModel,
        currentModelUrl,
        currentModel,
        modelMixer: animationMixer,
        init,
        loadCharacterModel,
    };
}
