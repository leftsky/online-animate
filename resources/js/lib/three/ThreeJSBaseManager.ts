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
    const animationMixer = ref<THREE.AnimationMixer | null>(null);

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
        if (animationMixer.value) {
            animationMixer.value.update(0.016); // 假设60fps
        }
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

    return {
        // threeCanvas,
        threeScene,
        threeRenderer,
        // threeCamera,
        threeControls,
        animationMixer,
        initThreeJS,
        handleResize
    }
}
