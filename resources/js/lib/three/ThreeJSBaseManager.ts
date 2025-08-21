import { ref, markRaw, toRaw } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


export function useThreeJSManager(
) {
    const canvas = ref<HTMLCanvasElement>();
    // const threeCanvas = ref<HTMLCanvasElement>();
    const threeScene = ref<THREE.Scene | null>(null);
    const threeRenderer = ref<THREE.WebGLRenderer | null>(null);
    const threeCamera = ref<THREE.PerspectiveCamera | null>(null);
    const threeControls = ref<OrbitControls | null>(null);

    // 使用Map来管理mixer，key可以是模型ID或模型对象引用
    const internalMixers = new Map<string | THREE.Group, THREE.AnimationMixer>();

    // 初始化Three.js场景
    const initThreeJS = (
        threeCanvas: HTMLCanvasElement
    ) => {
        if (!threeCanvas) {
            console.error('threeCanvas is not defined');
            return;
        }

        canvas.value = threeCanvas;
        const rect = canvas.value.getBoundingClientRect();

        // 创建场景
        threeScene.value = markRaw(new THREE.Scene());
        threeScene.value.background = new THREE.Color(0xf5f5f5);

        // 创建相机
        threeCamera.value = markRaw(new THREE.PerspectiveCamera(
            75,
            rect.width / rect.height,
            0.1,
            1000
        ));
        threeCamera.value.position.set(0, 1, 3);

        // 创建渲染器
        threeRenderer.value = markRaw(new THREE.WebGLRenderer({
            canvas: canvas.value,
            antialias: true,
            alpha: true
        }));
        threeRenderer.value.setSize(rect.width, rect.height);
        threeRenderer.value.setPixelRatio(window.devicePixelRatio);
        threeRenderer.value.shadowMap.enabled = true;
        threeRenderer.value.shadowMap.type = THREE.PCFSoftShadowMap;

        // 创建控制器
        threeControls.value = markRaw(new OrbitControls(threeCamera.value, canvas.value));
        threeControls.value.enableDamping = true;
        threeControls.value.dampingFactor = 0.05;
        threeControls.value.target.set(0, 0.5, 0); // 初始目标点，将在模型加载后动态调整

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        threeScene.value.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        threeScene.value.add(directionalLight);

        // 添加地面
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0; // 明确设置地面在Y=0位置
        ground.receiveShadow = true;
        threeScene.value.add(ground);

        console.log('地面平面已设置在Y=0位置');

        // 开始渲染循环
        originalAnimate();
    };

    // 修改animate函数以包含动画更新
    const originalAnimate = () => {
        if (!threeRenderer.value || !threeScene.value || !threeCamera.value) return;

        requestAnimationFrame(originalAnimate);

        // 更新动画
        updateAnimations();

        // 更新控制器
        if (threeControls.value) {
            toRaw(threeControls.value).update();
        }

        // 渲染场景
        toRaw(threeRenderer.value).render(toRaw(threeScene.value), toRaw(threeCamera.value));
    };

    // 动画循环更新
    const updateAnimations = () => {
        // 更新所有内部mixer
        internalMixers.forEach(mixer => {
            if (mixer) {
                mixer.update(0.016); // 假设60fps
            }
        });
    };

    // 处理窗口大小变化
    const handleResize = () => {
        if (!canvas.value || !threeCamera.value || !threeRenderer.value) return;

        const rect = canvas.value.getBoundingClientRect();
        const camera = toRaw(threeCamera.value);
        const renderer = toRaw(threeRenderer.value);

        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height);
    };

    // 添加mixer到内部Map
    const addMixer = (key: string | THREE.Group, mixer: THREE.AnimationMixer) => {
        if (!mixer) {
            console.error('mixer is not defined');
            return;
        }
        if (internalMixers.has(key)) {
            removeMixer(key);
        }
        internalMixers.set(key, mixer);
        console.log('添加动画混合器，当前总数:', internalMixers.size);
    };

    // 从内部Map移除mixer
    const removeMixer = (key: string | THREE.Group) => {
        const mixer = internalMixers.get(key);
        if (mixer) {
            // 停止所有动画动作
            mixer.stopAllAction();
            // 从Map中移除
            internalMixers.delete(key);
            console.log('移除动画混合器，当前总数:', internalMixers.size);
        }
    };

    // 根据key获取mixer
    const getMixer = (key: string | THREE.Group) => {
        return internalMixers.get(key);
    };

    // 清理所有mixer
    const clearAllMixers = () => {
        internalMixers.forEach(mixer => {
            if (mixer) {
                mixer.stopAllAction();
            }
        });
        internalMixers.clear();
        console.log('清理所有动画混合器');
    };

    return {
        // threeCanvas,
        threeScene,
        threeRenderer,
        // threeCamera,
        threeControls,
        initThreeJS,
        handleResize,
        // 新增的mixer管理方法
        addMixer,
        removeMixer,
        getMixer,
        clearAllMixers,
        // 暴露内部mixer信息（只读）
        getMixersCount: () => internalMixers.size,
        hasMixer: (key: string | THREE.Group) => internalMixers.has(key)
    }
}
