import { computed, ref } from 'vue';
import { sceneContentApi, uploadApi } from '../utils/api';
import { selectFiles } from '../utils/upload';

export interface SceneContent {
    id: number;
    scene_id: number | null;
    element_name: string;
    element_type: string;
    element_source: string;
    animation_script: string;
    layer_order: number;
    status: number;
    created_at: string;
    updated_at: string;
    parsed_animation?: any;
}

export function useSceneContent() {
    const contents = ref<SceneContent[]>([]);
    const loading = ref(false);
    const selectedContentId = ref<number | null>(null);

    // 计算属性
    const selectedContent = computed(() => {
        return contents.value.find((c) => c.id === selectedContentId.value) || null;
    });

    const contentCount = computed(() => contents.value.length);

    /**
     * 加载分镜内容列表
     */
    const loadContents = async (sceneId: number | null = null) => {
        loading.value = true;
        try {
            const response = await sceneContentApi.getList({ scene_id: sceneId });

            if (response.success && response.data) {
                contents.value = response.data.data || response.data;
            } else {
                console.error('获取分镜内容失败:', response.message);
                contents.value = [];
            }
        } catch (error) {
            console.error('加载分镜内容出错:', error);
            contents.value = [];
        } finally {
            loading.value = false;
        }
    };

    /**
     * 生成元素名称
     */
    const generateElementName = (): string => {
        const imageContents = contents.value.filter((c) => c.element_type === 'image');
        const nextNumber = imageContents.length + 1;
        return `image_${String(nextNumber).padStart(3, '0')}`;
    };

    /**
     * 获取下一个图层顺序
     */
    const getNextLayerOrder = (): number => {
        if (contents.value.length === 0) return 1;
        const maxOrder = Math.max(...contents.value.map((c) => c.layer_order));
        return maxOrder + 1;
    };

    /**
     * 获取默认动画脚本
     */
    const getDefaultAnimationScript = (): string => {
        return `duration: 3s
easing: ease-in-out
keyframes:
  - time: 0s, x: 0, y: 0, opacity: 1, scale: 1
  - time: 3s, x: 0, y: 0, opacity: 1, scale: 1`;
    };

    /**
     * 从动画脚本解析时长
     */
    const parseDuration = (animationScript: string): number => {
        if (!animationScript) return 3;

        const durationMatch = animationScript.match(/duration:\s*(\d+(?:\.\d+)?)s/);
        return durationMatch ? parseFloat(durationMatch[1]) : 3;
    };

    /**
     * 添加图片内容
     */
    const addImageContent = async (sceneId: number | null = null): Promise<boolean> => {
        try {
            // 1. 选择图片文件
            const files = await selectFiles({
                accept: 'image/*',
                multiple: false,
            });

            if (!files || files.length === 0) {
                return false;
            }

            loading.value = true;

            // 2. 上传图片
            const uploadResult = await uploadApi.uploadFile(files[0], {
                type: 'image',
                folder: 'scene-images',
            });

            if (!uploadResult.success || !uploadResult.data) {
                console.error('图片上传失败:', uploadResult.message);
                return false;
            }

            // 3. 创建分镜内容
            const contentData = {
                scene_id: sceneId,
                element_name: generateElementName(),
                element_type: 'image',
                element_source: uploadResult.data.url,
                animation_script: getDefaultAnimationScript(),
                layer_order: getNextLayerOrder(),
                status: 1,
            };

            const createResult = await sceneContentApi.create(contentData);

            if (createResult.success && createResult.data) {
                // 4. 添加到本地列表
                contents.value.push(createResult.data);
                // 5. 自动选中新添加的内容
                selectedContentId.value = createResult.data.id;
                return true;
            } else {
                console.error('创建分镜内容失败:', createResult.message);
                return false;
            }
        } catch (error) {
            console.error('添加图片内容出错:', error);
            return false;
        } finally {
            loading.value = false;
        }
    };

    /**
     * 更新分镜内容
     */
    const updateContent = async (id: number, data: Partial<SceneContent>): Promise<boolean> => {
        try {
            loading.value = true;
            const response = await sceneContentApi.update(id, data);

            if (response.success && response.data) {
                // 更新本地数据
                const index = contents.value.findIndex((c) => c.id === id);
                if (index !== -1) {
                    contents.value[index] = { ...contents.value[index], ...response.data };
                }
                return true;
            } else {
                console.error('更新分镜内容失败:', response.message);
                return false;
            }
        } catch (error) {
            console.error('更新分镜内容出错:', error);
            return false;
        } finally {
            loading.value = false;
        }
    };

    /**
     * 删除分镜内容
     */
    const deleteContent = async (id: number): Promise<boolean> => {
        try {
            loading.value = true;
            const response = await sceneContentApi.delete(id);

            if (response.success) {
                // 从本地列表移除
                contents.value = contents.value.filter((c) => c.id !== id);
                // 如果删除的是选中的内容，清除选中状态
                if (selectedContentId.value === id) {
                    selectedContentId.value = null;
                }
                return true;
            } else {
                console.error('删除分镜内容失败:', response.message);
                return false;
            }
        } catch (error) {
            console.error('删除分镜内容出错:', error);
            return false;
        } finally {
            loading.value = false;
        }
    };

    /**
     * 选择内容
     */
    const selectContent = (id: number | null) => {
        selectedContentId.value = id;
    };

    return {
        // 状态
        contents,
        loading,
        selectedContentId,

        // 计算属性
        selectedContent,
        contentCount,

        // 方法
        loadContents,
        addImageContent,
        updateContent,
        deleteContent,
        selectContent,
        parseDuration,
    };
}
