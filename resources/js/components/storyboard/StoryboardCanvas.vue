<script setup lang="ts">
import { Canvas, Image, Object as FabricObject, Line } from 'fabric';
import { onMounted, onUnmounted, ref, nextTick } from 'vue';

interface Props {
    width?: number;
    height?: number;
}

const props = withDefaults(defineProps<Props>(), {
    width: 0,
    height: 0,
});

const canvasContainer = ref<HTMLDivElement>();
const canvasElement = ref<HTMLCanvasElement>();
const fabricCanvas = ref<Canvas | null>(null);

const emit = defineEmits<{
    objectSelected: [object: FabricObject | null];
    objectModified: [object: FabricObject];
}>();

// 获取容器尺寸
const getContainerSize = () => {
    if (!canvasContainer.value) return { width: 800, height: 600 };
    
    const rect = canvasContainer.value.getBoundingClientRect();
    return {
        width: rect.width - 32, // 减去padding
        height: rect.height - 32
    };
};

// 调整画布尺寸
const resizeCanvas = () => {
    if (!fabricCanvas.value || !canvasContainer.value) return;
    
    const { width, height } = getContainerSize();
    
    fabricCanvas.value.setDimensions({ width, height });
    addGridLines(width, height);
    fabricCanvas.value.renderAll();
};

onMounted(async () => {
    await nextTick();
    
    if (canvasElement.value && canvasContainer.value) {
        const { width, height } = getContainerSize();
        
        fabricCanvas.value = new Canvas(canvasElement.value, {
            width: width,
            height: height,
            backgroundColor: '#f8f9fa', // 使用更亮的背景色
        });

        // 添加网格辅助线
        addGridLines(width, height);

        // 监听对象选择事件
        fabricCanvas.value.on('selection:created', (e: any) => {
            emit('objectSelected', e.selected?.[0] || null);
        });

        fabricCanvas.value.on('selection:updated', (e: any) => {
            emit('objectSelected', e.selected?.[0] || null);
        });

        fabricCanvas.value.on('selection:cleared', () => {
            emit('objectSelected', null);
        });

        // 监听对象修改事件
        fabricCanvas.value.on('object:modified', (e: any) => {
            if (e.target) {
                emit('objectModified', e.target);
            }
        });
        
        // 监听窗口大小变化
        window.addEventListener('resize', resizeCanvas);
    }
});

onUnmounted(() => {
    if (fabricCanvas.value) {
        fabricCanvas.value.dispose();
        fabricCanvas.value = null;
    }
    window.removeEventListener('resize', resizeCanvas);
});

// 添加图片到画布
const addImage = (imageUrl: string) => {
    if (!fabricCanvas.value) return;

    Image.fromURL(imageUrl).then((img: any) => {
        // 设置图片大小和位置
        img.set({
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5,
        });

        fabricCanvas.value!.add(img);
        fabricCanvas.value!.setActiveObject(img);
        fabricCanvas.value!.renderAll();
    });
};

// 删除选中对象
const deleteSelected = () => {
    if (!fabricCanvas.value) return;

    const activeObject = fabricCanvas.value.getActiveObject();
    if (activeObject) {
        fabricCanvas.value.remove(activeObject);
        fabricCanvas.value.renderAll();
    }
};

// 添加网格辅助线
const addGridLines = (width: number, height: number) => {
    if (!fabricCanvas.value) return;
    
    const canvas = fabricCanvas.value;
    const gridSize = 40; // 调整网格尺寸
    
    // 清除之前的网格线
    const objects = canvas.getObjects();
    objects.forEach(obj => {
        if ((obj as any).isGridLine) {
            canvas.remove(obj);
        }
    });
    
    // 创建垂直线
    for (let i = 0; i <= width; i += gridSize) {
        const line = new Line([i, 0, i, height], {
            stroke: '#e2e8f0', // 使用更明显的灰色
            strokeWidth: 1,
            selectable: false,
            evented: false,
            opacity: 0.8, // 提高透明度
        });
        (line as any).isGridLine = true;
        canvas.add(line);
        canvas.sendObjectToBack(line); // 修复API调用
    }
    
    // 创建水平线
    for (let i = 0; i <= height; i += gridSize) {
        const line = new Line([0, i, width, i], {
            stroke: '#e2e8f0', // 使用更明显的灰色
            strokeWidth: 1,
            selectable: false,
            evented: false,
            opacity: 0.8, // 提高透明度
        });
        (line as any).isGridLine = true;
        canvas.add(line);
        canvas.sendObjectToBack(line); // 修复API调用
    }
    
    // 添加中心十字线
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 中心垂直线
    const centerVerticalLine = new Line([centerX, 0, centerX, height], {
        stroke: '#3b82f6', // 使用蓝色作为中心线
        strokeWidth: 2,
        selectable: false,
        evented: false,
        opacity: 0.9, // 提高透明度
        strokeDashArray: [8, 4],
    });
    (centerVerticalLine as any).isGridLine = true;
    canvas.add(centerVerticalLine);
    canvas.sendObjectToBack(centerVerticalLine); // 修复API调用
    
    // 中心水平线
    const centerHorizontalLine = new Line([0, centerY, width, centerY], {
        stroke: '#3b82f6', // 使用蓝色作为中心线
        strokeWidth: 2,
        selectable: false,
        evented: false,
        opacity: 0.9, // 提高透明度
        strokeDashArray: [8, 4],
    });
    (centerHorizontalLine as any).isGridLine = true;
    canvas.add(centerHorizontalLine);
    canvas.sendObjectToBack(centerHorizontalLine); // 修复API调用
    
    // 添加三分法辅助线
    const thirdWidth = width / 3;
    const thirdHeight = height / 3;
    
    // 垂直三分线
    for (let i = 1; i < 3; i++) {
        const line = new Line([thirdWidth * i, 0, thirdWidth * i, height], {
            stroke: '#10b981', // 使用绿色作为三分线
            strokeWidth: 1,
            selectable: false,
            evented: false,
            opacity: 0.7,
            strokeDashArray: [3, 6],
        });
        (line as any).isGridLine = true;
        canvas.add(line);
        canvas.sendObjectToBack(line); // 修复API调用
    }
    
    // 水平三分线
    for (let i = 1; i < 3; i++) {
        const line = new Line([0, thirdHeight * i, width, thirdHeight * i], {
            stroke: '#10b981', // 使用绿色作为三分线
            strokeWidth: 1,
            selectable: false,
            evented: false,
            opacity: 0.7,
            strokeDashArray: [3, 6],
        });
        (line as any).isGridLine = true;
        canvas.add(line);
        canvas.sendObjectToBack(line); // 修复API调用
    }
    
    canvas.renderAll();
};

// 清空画布
const clearCanvas = () => {
    if (!fabricCanvas.value || !canvasContainer.value) return;
    const { width, height } = getContainerSize();
    fabricCanvas.value.clear();
    fabricCanvas.value.backgroundColor = '#f8f9fa'; // 使用更亮的背景色
    addGridLines(width, height);
    fabricCanvas.value.renderAll();
};

// 获取选中对象
const getSelectedObject = () => {
    if (!fabricCanvas.value) return null;
    return fabricCanvas.value.getActiveObject();
};

// 更新对象属性
const updateObjectProperties = (properties: Partial<FabricObject>) => {
    if (!fabricCanvas.value) return;

    const activeObject = fabricCanvas.value.getActiveObject();
    if (activeObject) {
        activeObject.set(properties);
        fabricCanvas.value.renderAll();
    }
};

// 导出方法供父组件使用
defineExpose({
    addImage,
    deleteSelected,
    clearCanvas,
    getSelectedObject,
    updateObjectProperties,
    canvas: fabricCanvas,
    resizeCanvas,
});
</script>

<template>
    <div 
        ref="canvasContainer"
        class="relative h-full w-full overflow-hidden rounded-lg border bg-card shadow-sm p-4"
    >
        <canvas
            ref="canvasElement"
            class="block"
        />
    </div>
</template>

<style scoped>
.canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
}
</style>