import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { v4 as uuid } from 'uuid';
import { markRaw, ref } from 'vue';
import { useThreeJSManager } from './ThreeJSBaseManager';

// 模型状态枚举
enum ModelStatus {
    CREATED = 'created', // 已创建
    INITED = 'inited', // 已初始化
    LOADING = 'loading', // 加载中
    LOADED = 'loaded', // 已加载
    DESTROYED = 'destroyed', // 已销毁
}

/**
 * 模型控制器
 * @param threeManager 三维场景管理器
 * @returns 模型控制器
 */
export function useModelController(threeManager: ReturnType<typeof useThreeJSManager>) {
    const { threeScene: scene, threeControls: controls, addAnimationCallback, removeAnimationCallback } = threeManager;
    let model: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    // 动画播放状态管理
    const modelId = uuid();
    let currentAnimationAction: THREE.AnimationAction | null = null;
    const animations = ref<Array<{ name: string; duration: number; clip: any }>>([]);
    // 显示控制相关状态
    let boundingBox: THREE.BoxHelper | null = null;
    let skeleton: THREE.SkeletonHelper | null = null;

    const isPlaying = ref(false);

    // 模型状态
    const status = ref<ModelStatus>(ModelStatus.CREATED);

    status.value = ModelStatus.INITED;

    /**
     * 加载人物模型
     * @param modelFileUrl 模型文件URL
     */
    const load = async (modelFileUrl: string) => {
        if (!modelFileUrl || !scene.value) return;
        console.log('加载模型', modelFileUrl);
        toggleSkeleton(false);
        try {
            if (modelFileUrl && typeof modelFileUrl === 'string' && modelFileUrl.trim().length > 0) {
                status.value = ModelStatus.LOADING;

                // 移除之前的模型
                if (model) {
                    scene.value.remove(model);
                    model = null;
                }

                // 检测文件类型
                const isFBX = modelFileUrl.toLowerCase().endsWith('.fbx');
                const isGLTF = modelFileUrl.toLowerCase().endsWith('.glb') || modelFileUrl.toLowerCase().endsWith('.gltf');

                let _model: THREE.Group;
                let modelAnimations: any[] = [];

                if (isFBX) {
                    // 使用FBXLoader加载FBX模型
                    console.log('检测到FBX格式，使用FBXLoader加载');

                    // 临时禁用某些控制台警告
                    const originalWarn = console.warn;
                    const originalError = console.error;

                    // 过滤FBX加载时的常见警告
                    console.warn = (...args) => {
                        const message = args.join(' ');
                        if (message.includes('ShininessExponent') || message.includes('skinning weights') || message.includes('FBXLoader:')) {
                            // 过滤掉这些常见的FBX警告
                            return;
                        }
                        originalWarn.apply(console, args);
                    };

                    const loader = new FBXLoader();

                    try {
                        const fbx = await new Promise<any>((resolve, reject) => {
                            loader.load(modelFileUrl, resolve, undefined, reject);
                        });

                        _model = fbx;
                        modelAnimations = fbx.animations || [];
                        console.log('FBX模型加载成功，找到动画数量:', modelAnimations.length);
                    } catch (loadError) {
                        console.error('FBX模型加载失败:', loadError);
                        throw loadError;
                    } finally {
                        // 恢复原始的控制台方法
                        console.warn = originalWarn;
                        console.error = originalError;
                    }
                } else if (isGLTF) {
                    // 使用GLTFLoader加载GLTF模型
                    console.log('检测到GLTF格式，使用GLTFLoader加载');
                    const loader = new GLTFLoader();

                    try {
                        const gltf = await new Promise<any>((resolve, reject) => {
                            loader.load(modelFileUrl, resolve, undefined, reject);
                        });

                        _model = gltf.scene;
                        modelAnimations = gltf.animations || [];
                        console.log('GLTF模型加载成功，找到动画数量:', modelAnimations.length);
                    } catch (loadError) {
                        console.error('GLTF模型加载失败:', loadError);
                        throw loadError;
                    }
                } else {
                    throw new Error('不支持的文件格式，请使用.fbx、.glb或.gltf文件');
                }

                // 设置模型属性（统一处理）
                _model.traverse((child: any) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // 计算模型的边界框和中心点（统一处理）
                const box = new THREE.Box3().setFromObject(_model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                console.log('原始模型边界框:', {
                    min: box.min,
                    max: box.max,
                    center: center,
                    size: size,
                });

                // 缩放模型以适应视图（统一处理）
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                _model.scale.setScalar(scale);

                // 重新计算缩放后的边界框（统一处理）
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

                // 将模型中心移动到原点，然后确保底部贴在地面上（统一处理）
                _model.position.set(
                    -scaledCenter.x, // X轴居中
                    -scaledBox.min.y, // Y轴底部贴地面（Y=0）
                    -scaledCenter.z, // Z轴居中
                );

                console.log('最终模型位置:', _model.position);

                // 设置模型朝向（面向摄像机）（统一处理）
                // _model.rotation.y = Math.PI; // 旋转180度面向摄像机

                // 添加到场景
                scene.value.add(_model);
                model = _model;

                // 动态调整摄像机目标点，使其对准模型的中心高度（统一处理）
                const modelHeight = scaledSize.y;
                const targetY = modelHeight * 0.4; // 目标点设置在模型高度的40%处，通常是胸部位置
                if (controls.value) {
                    controls.value.target.set(0, targetY, 0);
                    controls.value.update();
                    console.log('摄像机目标点已调整至:', { x: 0, y: targetY, z: 0 });
                }

                // 解析动画（统一处理）
                if (modelAnimations.length > 0) {
                    parseAnimations({ animations: modelAnimations });
                } else {
                    console.log('模型中未找到动画数据');
                    animations.value = [];
                }

                console.log('模型加载成功:', modelFileUrl);
                status.value = ModelStatus.LOADED;
            }
        } catch (error) {
            console.error('解析模型文件失败:', error);
        } finally {
            if (status.value === ModelStatus.LOADING) {
                status.value = ModelStatus.INITED; // 加载失败时回到初始化状态
            }
        }
        toggleSkeleton(true);
    };

    // 解析模型动画
    const parseAnimations = (gltf: any) => {
        const animationList: Array<{ name: string; duration: number; clip: any }> = [];

        if (gltf.animations && gltf.animations.length > 0) {
            // 创建动画混合器
            if (model) {
                mixer = new THREE.AnimationMixer(model);
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

        console.log('解析到动画:', animationList.length, '个', mixer, model);
        console.log('动画详情', animationList);

        animations.value = animationList;
        // 添加自定义动画
        addCustomAnimations(animationList);
    };

    // 添加自定义动画
    const addCustomAnimations = (animationList: Array<{ name: string; duration: number; clip: any }>) => {
        if (!mixer) return;

        try {
            // 挥手动画
            const waveHandAnimation = createWaveHandAnimation();
            if (waveHandAnimation) {
                animationList.push({
                    name: waveHandAnimation.name,
                    duration: Math.round(waveHandAnimation.duration * 1000),
                    clip: markRaw(waveHandAnimation),
                });
                console.log('自定义挥手动画添加成功');
            }

            // 点头动画
            const nodHeadAnimation = createNodHeadAnimation();
            if (nodHeadAnimation) {
                animationList.push({
                    name: nodHeadAnimation.name,
                    duration: Math.round(nodHeadAnimation.duration * 1000),
                    clip: markRaw(nodHeadAnimation),
                });
                console.log('自定义点头动画添加成功');
            }

            // 创建预设的融合动画
            createPresetBlendedAnimations();
        } catch (error) {
            console.error('添加自定义动画失败:', error);
        }
    };

    // 创建挥手动画
    const createWaveHandAnimation = (): THREE.AnimationClip | null => {
        try {
            // 创建右臂挥手的旋转关键帧轨道
            const rightArmTrack = new THREE.QuaternionKeyframeTrack(
                'mixamorigRightArm.quaternion',
                [0, 0.5, 1.0, 1.5, 2.0], // 时间轴
                [
                    // 初始状态 (0秒)
                    0, 0, 0, 1,
                    // 抬起手臂 (0.5秒)
                    0, 0, 0.7, 0.7,
                    // 最高点 (1.0秒)
                    0, 0, 1, 0,
                    // 放下手臂 (1.5秒)
                    0, 0, 0.7, 0.7,
                    // 回到初始状态 (2.0秒)
                    0, 0, 0, 1,
                ],
            );

            // 创建右前臂弯曲的旋转关键帧轨道
            const rightForeArmTrack = new THREE.QuaternionKeyframeTrack(
                'mixamorigRightForeArm.quaternion',
                [0, 0.5, 1.0, 1.5, 2.0], // 时间轴
                [
                    // 初始状态 (0秒)
                    0, 0, 0, 1,
                    // 弯曲前臂 (0.5秒)
                    0, 0, 0.5, 0.87,
                    // 最大弯曲 (1.0秒)
                    0, 0, 0.7, 0.7,
                    // 减少弯曲 (1.5秒)
                    0, 0, 0.5, 0.87,
                    // 回到初始状态 (2.0秒)
                    0, 0, 0, 1,
                ],
            );

            // 创建动画片段
            const clip = new THREE.AnimationClip('Wave Hand', 2.0, [rightArmTrack, rightForeArmTrack]);
            return clip;
        } catch (error) {
            console.error('创建挥手动画失败:', error);
            return null;
        }
    };

    // 创建点头动画
    const createNodHeadAnimation = (): THREE.AnimationClip | null => {
        try {
            // 创建头部点头的旋转关键帧轨道
            const headTrack = new THREE.QuaternionKeyframeTrack(
                'mixamorigHead.quaternion',
                [0, 0.5, 1.0, 1.5, 2.0], // 时间轴
                [
                    // 初始状态 (0秒)
                    0, 0, 0, 1,
                    // 向前点头 (0.5秒)
                    0.3, 0, 0, 0.95,
                    // 最大点头角度 (1.0秒)
                    0.5, 0, 0, 0.87,
                    // 抬起头部 (1.5秒)
                    0.3, 0, 0, 0.95,
                    // 回到初始状态 (2.0秒)
                    0, 0, 0, 1,
                ],
            );

            // 创建动画片段
            const clip = new THREE.AnimationClip('Nod Head', 2.0, [headTrack]);
            return clip;
        } catch (error) {
            console.error('创建点头动画失败:', error);
            return null;
        }
    };

    // 通用的自定义动画添加方法
    const addCustomAnimation = (animationData: {
        name: string;
        duration: number;
        tracks: Array<{
            name: string;
            times: number[];
            positions?: number[][];
            rotations?: number[][];
            scales?: number[][];
        }>;
    }) => {
        if (!mixer) return false;

        try {
            const tracks: THREE.KeyframeTrack[] = [];

            animationData.tracks.forEach((track) => {
                if (track.rotations) {
                    // 创建旋转关键帧轨道
                    const rotationTrack = new THREE.QuaternionKeyframeTrack(`${track.name}.quaternion`, track.times, track.rotations.flat());
                    tracks.push(rotationTrack);
                }

                if (track.positions) {
                    // 创建位置关键帧轨道
                    const positionTrack = new THREE.VectorKeyframeTrack(`${track.name}.position`, track.times, track.positions.flat());
                    tracks.push(positionTrack);
                }

                if (track.scales) {
                    // 创建缩放关键帧轨道
                    const scaleTrack = new THREE.VectorKeyframeTrack(`${track.name}.scale`, track.times, track.scales.flat());
                    tracks.push(scaleTrack);
                }
            });

            // 创建动画片段
            const clip = new THREE.AnimationClip(animationData.name, animationData.duration, tracks);

            // 添加到动画列表
            animations.value.push({
                name: clip.name,
                duration: Math.round(clip.duration * 1000),
                clip: markRaw(clip),
            });

            console.log('自定义动画添加成功:', clip.name);
            return true;
        } catch (error) {
            console.error('添加自定义动画失败:', error);
            return false;
        }
    };

    // 动画融合方法
    const blendAnimations = (
        baseAnimationName: string,
        overlayAnimationName: string,
        blendConfig: {
            overlayBones: string[]; // 要替换的骨骼名称
            blendWeight?: number; // 融合权重 (0-1)
            duration?: number; // 融合后的动画时长
            newName?: string; // 融合后的动画名称
        },
    ) => {
        if (!mixer) return false;

        try {
            // 查找基础动画和覆盖动画
            const baseAnimation = animations.value.find((anim) => anim.name === baseAnimationName);
            const overlayAnimation = animations.value.find((anim) => anim.name === overlayAnimationName);

            if (!baseAnimation || !overlayAnimation) {
                console.warn('未找到指定的动画:', { baseAnimationName, overlayAnimationName });
                return false;
            }

            // 获取原始动画片段
            const baseClip = baseAnimation.clip;
            const overlayClip = overlayAnimation.clip;

            // 创建融合后的轨道
            const blendedTracks: THREE.KeyframeTrack[] = [];

            // 处理基础动画的所有轨道
            baseClip.tracks.forEach((baseTrack: THREE.KeyframeTrack) => {
                const trackName = baseTrack.name;
                const boneName = trackName.split('.')[0]; // 提取骨骼名称

                // 检查这个骨骼是否在覆盖列表中
                if (blendConfig.overlayBones.includes(boneName)) {
                    // 如果骨骼在覆盖列表中，使用覆盖动画的轨道
                    const overlayTrack = overlayClip.tracks.find((track: THREE.KeyframeTrack) => track.name === trackName);
                    if (overlayTrack) {
                        blendedTracks.push(overlayTrack.clone());
                        console.log(`替换骨骼 ${boneName} 的动画轨道`);
                    } else {
                        // 如果覆盖动画中没有对应的轨道，保持基础动画
                        blendedTracks.push(baseTrack.clone());
                    }
                } else {
                    // 如果骨骼不在覆盖列表中，保持基础动画
                    blendedTracks.push(baseTrack.clone());
                }
            });

            // 添加覆盖动画中独有的轨道（如果基础动画中没有）
            overlayClip.tracks.forEach((overlayTrack: THREE.KeyframeTrack) => {
                const trackName = overlayTrack.name;
                const boneName = trackName.split('.')[0];

                if (blendConfig.overlayBones.includes(boneName)) {
                    const existingTrack = blendedTracks.find((track: THREE.KeyframeTrack) => track.name === trackName);
                    if (!existingTrack) {
                        blendedTracks.push(overlayTrack.clone());
                        console.log(`添加新的动画轨道: ${trackName}`);
                    }
                }
            });

            // 创建融合后的动画片段
            const finalDuration = blendConfig.duration || Math.max(baseClip.duration, overlayClip.duration);
            const finalName = blendConfig.newName || `${baseAnimationName}_${overlayAnimationName}_Blend`;

            const blendedClip = new THREE.AnimationClip(finalName, finalDuration, blendedTracks);

            // 添加到动画列表
            animations.value.push({
                name: blendedClip.name,
                duration: Math.round(blendedClip.duration * 1000),
                clip: markRaw(blendedClip),
            });

            console.log('动画融合成功:', {
                baseAnimation: baseAnimationName,
                overlayAnimation: overlayAnimationName,
                blendedName: finalName,
                duration: finalDuration,
                tracksCount: blendedTracks.length,
            });

            return true;
        } catch (error) {
            console.error('动画融合失败:', error);
            return false;
        }
    };

    // 创建预设的融合动画
    const createPresetBlendedAnimations = () => {
        if (!mixer) return;

        try {
            // 查找走路动画
            const walkAnimation = animations.value.find(
                (anim) => anim.name.toLowerCase().includes('walk') || anim.name.toLowerCase().includes('走路'),
            );

            if (walkAnimation) {
                // 走路 + 挥手融合
                blendAnimations(walkAnimation.name, 'Wave Hand', {
                    overlayBones: ['mixamorigRightArm', 'mixamorigRightForeArm'],
                    newName: 'Walk and Wave',
                    duration: walkAnimation.duration / 1000, // 转换为秒
                });

                // 走路 + 点头融合
                blendAnimations(walkAnimation.name, 'Nod Head', {
                    overlayBones: ['mixamorigHead'],
                    newName: 'Walk and Nod',
                    duration: walkAnimation.duration / 1000,
                });

                console.log('预设融合动画创建完成');
            } else {
                console.log('未找到走路动画，跳过预设融合动画创建', animations.value);
            }
        } catch (error) {
            console.error('创建预设融合动画失败:', error);
        }
    };

    // 播放动画
    const play = (animationIndex: number = 0) => {
        if (!mixer || status.value !== ModelStatus.LOADED || !animations.value[animationIndex]) {
            console.warn('无法播放动画：模型未加载或动画不存在');
            return false;
        }
        try {
            // 停止当前播放的动画
            if (currentAnimationAction) {
                currentAnimationAction.stop();
            }

            // 获取指定的动画
            const animation = animations.value[animationIndex];
            if (!animation.clip) {
                console.warn('动画片段不存在');
                return false;
            }

            // 创建并播放动画
            currentAnimationAction = mixer.clipAction(animation.clip);
            currentAnimationAction.reset();
            currentAnimationAction.setLoop(THREE.LoopRepeat, Infinity); // 循环播放
            currentAnimationAction.play();

            isPlaying.value = true;

            console.log(`开始播放动画: ${animation.name}`);
            return true;
        } catch (error) {
            console.error('播放动画失败:', error);
            return false;
        }
    };

    // 暂停动画
    const pause = () => {
        if (currentAnimationAction && isPlaying.value) {
            try {
                currentAnimationAction.paused = true;
                isPlaying.value = false;
                console.log('动画已暂停');
                return true;
            } catch (error) {
                console.error('暂停动画失败:', error);
                return false;
            }
        }
        return false;
    };

    // 停止动画
    const stop = () => {
        if (currentAnimationAction && (isPlaying.value || currentAnimationAction.paused)) {
            try {
                currentAnimationAction.stop();
                currentAnimationAction = null;
                isPlaying.value = false;
                console.log('动画已停止');
                return true;
            } catch (error) {
                console.error('停止动画失败:', error);
                return false;
            }
        }
        return false;
    };

    // 恢复播放动画
    const resume = () => {
        if (currentAnimationAction && currentAnimationAction.paused) {
            try {
                currentAnimationAction.paused = false;
                isPlaying.value = true;
                console.log('动画已恢复播放');
                return true;
            } catch (error) {
                console.error('恢复动画失败:', error);
                return false;
            }
        }
        return false;
    };

    // 更新动画（需要在渲染循环中调用）
    const updateAnimation = (deltaTime: number) => {
        if (mixer && (isPlaying.value || (currentAnimationAction && currentAnimationAction.paused))) {
            try {
                mixer.update(deltaTime);
            } catch (error) {
                console.error('更新动画失败:', error);
            }
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
        status.value = ModelStatus.INITED;

        if (model && scene.value) {
            scene.value.remove(model);
            model = null;
        }

        if (boundingBox && scene.value) {
            scene.value.remove(boundingBox);
            boundingBox = null;
        }
        if (skeleton && scene.value) {
            scene.value.remove(skeleton);
            skeleton = null;
        }

        if (mixer) {
            mixer = null;
        }
        if (currentAnimationAction) {
            currentAnimationAction.stop();
            currentAnimationAction = null;
        }
        isPlaying.value = false;
        animations.value = [];

        // 移除动画更新回调
        if (modelId) {
            removeAnimationCallback(modelId);
        }
    };

    // 处理边界框显示切换
    const toggleBoundingBox = (show: boolean) => {
        if (!model || !scene.value) return;

        try {
            if (show) {
                if (!boundingBox) {
                    boundingBox = new THREE.BoxHelper(model, 0x00ff00);
                    scene.value.add(boundingBox);
                }
            } else {
                if (boundingBox) {
                    scene.value.remove(boundingBox);
                    boundingBox = null;
                }
            }
        } catch (error) {
            console.error('切换边界框显示失败:', error);
        }
    };

    // 处理骨骼显示切换
    const toggleSkeleton = (show: boolean) => {
        if (!model || !scene.value) return;

        try {
            if (show) {
                let skeletonData: THREE.Skeleton | null = null;
                model.traverse((child: any) => {
                    if (child.isSkinnedMesh && child.skeleton) {
                        skeletonData = child.skeleton;
                    }
                });

                if (skeletonData && !skeleton) {
                    skeleton = new THREE.SkeletonHelper(model);
                    console.log('添加骨骼:', skeleton);
                    // 输出所有骨骼的名称
                    console.log(
                        '骨骼名称:',
                        skeleton.bones.map((bone: any) => bone.name),
                    );
                    scene.value.add(skeleton);
                } else if (!skeletonData) {
                    console.warn('模型中未找到骨骼数据');
                }
            } else {
                if (skeleton) {
                    scene.value.remove(skeleton);
                    skeleton = null;
                }
            }
        } catch (error) {
            console.error('切换骨骼显示失败:', error);
        }
    };

    // 处理模型参数更新
    const updateParams = (updateData: { type: string; value: any }) => {
        if (!model) return;

        try {
            switch (updateData.type) {
                case 'position':
                    model.position.set(updateData.value.x, updateData.value.y, updateData.value.z);
                    break;
                case 'rotation':
                    model.rotation.set(updateData.value.x, updateData.value.y, updateData.value.z);
                    break;
                case 'scale':
                    model.scale.setScalar(updateData.value);
                    break;
            }
        } catch (error) {
            console.error('更新模型参数失败:', error);
        }
    };

    const getModelParams = () => {
        if (!model) return null;
        return {
            position: model.position,
            rotation: model.rotation,
            scale: model.scale,
        };
    };

    // 导入FBX动画
    const importFBXAnimations = async (
        fbxFileUrl: string,
        options?: {
            prefix?: string; // 动画名称前缀，避免冲突
            replaceExisting?: boolean; // 是否替换同名动画
            onProgress?: (progress: number) => void; // 加载进度回调
        },
    ): Promise<{
        success: boolean;
        importedCount: number;
        animations: Array<{ name: string; duration: number; clip: any }>;
        errors?: string[];
    }> => {
        if (!fbxFileUrl || !scene.value) {
            return {
                success: false,
                importedCount: 0,
                animations: [],
                errors: ['场景未初始化或文件URL无效'],
            };
        }

        try {
            console.log('开始导入FBX动画:', fbxFileUrl);

            const loader = new FBXLoader();
            const prefix = options?.prefix || 'FBX_';
            const replaceExisting = options?.replaceExisting || false;

            // 加载FBX文件
            const fbx = await new Promise<any>((resolve, reject) => {
                loader.load(
                    fbxFileUrl,
                    resolve,
                    (progress) => {
                        if (options?.onProgress) {
                            const percent = progress.loaded / progress.total;
                            options.onProgress(percent);
                        }
                    },
                    reject,
                );
            });

            if (!fbx || !fbx.animations || fbx.animations.length === 0) {
                return {
                    success: false,
                    importedCount: 0,
                    animations: [],
                    errors: ['FBX文件中未找到动画数据'],
                };
            }

            console.log('FBX文件加载成功，找到动画数量:', fbx.animations.length);
            console.log('animation', fbx.animations);

            const importedAnimations: Array<{ name: string; duration: number; clip: any }> = [];
            const errors: string[] = [];

            // 确保动画混合器存在
            if (!mixer && model) {
                mixer = new THREE.AnimationMixer(model);
                console.log('创建新的动画混合器');
            }

            // 处理每个动画
            fbx.animations.forEach((animation: any, index: number) => {
                try {
                    // 标准化动画名称
                    const originalName = animation.name || `Animation_${index + 1}`;
                    const normalizedName = normalizeAnimationName(originalName, prefix);

                    // 检查是否已存在同名动画
                    const existingIndex = animations.value.findIndex((anim) => anim.name === normalizedName);

                    if (existingIndex !== -1 && !replaceExisting) {
                        // 如果存在同名动画且不允许替换，则跳过
                        console.warn(`跳过重复动画: ${normalizedName}`);
                        return;
                    }

                    // 验证动画片段
                    if (!validateAnimationClip(animation)) {
                        errors.push(`动画 ${originalName} 验证失败`);
                        return;
                    }

                    // 转换骨骼名称
                    const convertedAnimation = {
                        ...animation,
                        tracks: animation.tracks,
                    };

                    // 创建动画片段
                    const clip = markRaw(convertedAnimation);
                    const duration = Math.round(animation.duration * 1000); // 转换为毫秒

                    const animationData = {
                        name: normalizedName,
                        duration: duration,
                        clip: clip,
                    };

                    if (existingIndex !== -1 && replaceExisting) {
                        // 替换现有动画
                        animations.value[existingIndex] = animationData;
                        console.log(`替换动画: ${normalizedName}`);
                    } else {
                        // 添加新动画
                        animations.value.push(animationData);
                        console.log(`添加新动画: ${normalizedName}`);
                    }

                    importedAnimations.push(animationData);
                } catch (error) {
                    console.error(`处理动画 ${index} 失败:`, error);
                    errors.push(`动画 ${index} 处理失败: ${error}`);
                }
            });

            // 清理FBX数据，释放内存
            if (fbx.geometry) {
                fbx.geometry.dispose();
            }
            if (fbx.material) {
                if (Array.isArray(fbx.material)) {
                    fbx.material.forEach((mat: any) => mat.dispose());
                } else {
                    fbx.material.dispose();
                }
            }

            console.log(`FBX动画导入完成，成功导入 ${importedAnimations.length} 个动画`);

            return {
                success: importedAnimations.length > 0,
                importedCount: importedAnimations.length,
                animations: importedAnimations,
                errors: errors.length > 0 ? errors : undefined,
            };
        } catch (error) {
            console.error('导入FBX动画失败:', error);
            return {
                success: false,
                importedCount: 0,
                animations: [],
                errors: [`导入失败: ${error}`],
            };
        }
    };

    // 标准化动画名称
    const normalizeAnimationName = (name: string, prefix: string): string => {
        // 移除特殊字符，保留字母、数字、下划线和空格
        let normalized = name.replace(/[^\w\s]/g, '');
        // 将多个空格替换为单个空格
        normalized = normalized.replace(/\s+/g, ' ');
        // 添加前缀
        normalized = `${prefix}${normalized}`;
        // 确保名称唯一
        let finalName = normalized;
        let counter = 1;

        while (animations.value.some((anim) => anim.name === finalName)) {
            finalName = `${normalized}_${counter}`;
            counter++;
        }

        return finalName;
    };

    // 验证动画片段
    const validateAnimationClip = (clip: any): boolean => {
        if (!clip || !clip.tracks || clip.tracks.length === 0) {
            return false;
        }

        // 检查轨道数据是否有效
        for (const track of clip.tracks) {
            if (!track.name || !track.times || !track.values) {
                return false;
            }

            // 检查时间轴和数值数组长度是否匹配
            if (track.times.length === 0 || track.values.length === 0) {
                return false;
            }
        }

        return true;
    };

    addAnimationCallback(modelId, updateAnimation);

    return {
        animations,
        status,
        isPlaying,
        load,
        clear,
        play,
        pause,
        stop,
        resume,
        destroy,
        toggleBoundingBox,
        toggleSkeleton,
        updateParams,
        getModelParams,
        addCustomAnimation, // 添加自定义动画的通用方法
        // blendAnimations, // 动画融合方法
        importFBXAnimations, // 导入FBX动画
    };
}

/*
 * 新增功能说明：
 *
 * importFBXAnimations(fbxFileUrl, options?)
 *
 * 功能：导入FBX文件中的所有动画，并将其添加到现有的动画组中
 *
 * 参数：
 * - fbxFileUrl: string - FBX文件的URL地址
 * - options: object - 可选配置
 *   - prefix: string - 动画名称前缀，默认为 'FBX_'
 *   - replaceExisting: boolean - 是否替换同名动画，默认为 false
 *   - onProgress: function - 加载进度回调函数
 *
 * 返回值：
 * - success: boolean - 是否成功
 * - importedCount: number - 成功导入的动画数量
 * - animations: array - 导入的动画列表
 * - errors: array - 错误信息列表（如果有）
 *
 * 使用示例：
 * const result = await importFBXAnimations('path/to/animations.fbx', {
 *     prefix: 'FBX_',
 *     replaceExisting: false
 * });
 *
 * if (result.success) {
 *     console.log(`成功导入 ${result.importedCount} 个动画`);
 * }
 */
