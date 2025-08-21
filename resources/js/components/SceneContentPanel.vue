<template>
    <div class="scene-content-panel">
        <!-- 面板头部 -->
        <div class="panel-header">
            <h3>分镜内容</h3>
            <span class="content-count">{{ contentCount }}项</span>
            <button class="add-image-btn" @click="handleAddImage" :disabled="loading">
                <span v-if="loading">上传中...</span>
                <span v-else>+ 添加图片</span>
            </button>
        </div>

        <!-- 内容列表 -->
        <div class="content-list" v-if="contents.length > 0">
            <div
                class="content-item"
                v-for="content in contents"
                :key="content.id"
                :class="{ selected: selectedContentId === content.id }"
                @click="selectContent(content.id)"
            >
                <!-- 图片缩略图 -->
                <div class="image-thumbnail">
                    <img :src="content.element_source" :alt="content.element_name" @error="handleImageError" />
                </div>

                <!-- 内容信息 -->
                <div class="content-info">
                    <div class="element-name">{{ content.element_name }}</div>
                    <div class="duration">{{ parseDuration(content.animation_script) }}s</div>
                    <div class="layer-order">图层 {{ content.layer_order }}</div>
                </div>

                <!-- 操作按钮 -->
                <div class="content-actions">
                    <button class="edit-btn" @click.stop="editContent(content)" title="编辑动画">编辑</button>
                    <button class="delete-btn" @click.stop="handleDeleteContent(content.id)" title="删除内容">删除</button>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-state" v-else-if="!loading">
            <div class="empty-icon">🖼️</div>
            <div class="empty-text">暂无分镜内容</div>
            <div class="empty-hint">点击"添加图片"开始创建</div>
        </div>

        <!-- 加载状态 -->
        <div class="loading-state" v-if="loading && contents.length === 0">
            <div class="loading-spinner"></div>
            <div class="loading-text">加载中...</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSceneContent, type SceneContent } from '../composables/useSceneContent';

// 使用分镜内容组合式函数
const { contents, loading, selectedContentId, contentCount, loadContents, addImageContent, deleteContent, selectContent, parseDuration } =
    useSceneContent();

// 组件挂载时加载内容
onMounted(() => {
    loadContents(null); // 暂时传null
});

/**
 * 处理添加图片
 */
const handleAddImage = async () => {
    const success = await addImageContent(null); // 暂时传null
    if (success) {
        console.log('图片添加成功');
    } else {
        console.error('图片添加失败');
    }
};

/**
 * 处理删除内容
 */
const handleDeleteContent = async (id: number) => {
    if (confirm('确定要删除这个内容吗？')) {
        const success = await deleteContent(id);
        if (success) {
            console.log('内容删除成功');
        } else {
            console.error('内容删除失败');
        }
    }
};

/**
 * 编辑内容
 */
const editContent = (content: SceneContent) => {
    // TODO: 打开编辑器
    console.log('编辑内容:', content);
};

/**
 * 处理图片加载错误
 */
const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.src = '/images/placeholder.png'; // 使用占位图
};
</script>

<style scoped>
.scene-content-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #1a1a1a;
    color: #ffffff;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #333;
    background: #2a2a2a;
}

.panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.content-count {
    color: #888;
    font-size: 12px;
}

.add-image-btn {
    background: #007acc;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s;
}

.add-image-btn:hover:not(:disabled) {
    background: #005a9e;
}

.add-image-btn:disabled {
    background: #555;
    cursor: not-allowed;
}

.content-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.content-item {
    display: flex;
    align-items: center;
    padding: 12px;
    margin-bottom: 8px;
    background: #2a2a2a;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
}

.content-item:hover {
    background: #333;
}

.content-item.selected {
    background: #333;
    border-color: #007acc;
}

.image-thumbnail {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    overflow: hidden;
    background: #444;
    flex-shrink: 0;
}

.image-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.content-info {
    flex: 1;
    margin-left: 12px;
    min-width: 0;
}

.element-name {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.duration {
    font-size: 12px;
    color: #888;
    margin-bottom: 2px;
}

.layer-order {
    font-size: 12px;
    color: #666;
}

.content-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

.edit-btn,
.delete-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    transition: background-color 0.2s;
}

.edit-btn {
    background: #444;
    color: white;
}

.edit-btn:hover {
    background: #555;
}

.delete-btn {
    background: #dc3545;
    color: white;
}

.delete-btn:hover {
    background: #c82333;
}

.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #666;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 16px;
    margin-bottom: 8px;
}

.empty-hint {
    font-size: 12px;
    color: #888;
}

.loading-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #333;
    border-top: 3px solid #007acc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
}

.loading-text {
    color: #888;
    font-size: 14px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
