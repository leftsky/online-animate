export interface StoryboardItem {
    id: string;
    elementName: string; // 统一使用elementName
    duration: string; // 格式化后的持续时间字符串，如 "3.0s"
    visible: boolean;
    selected: boolean;
    layerOrder: number;
    animationScript: string; // 原始YAML动画脚本
    imagePath: string;
    thumbnail: string;
    // API相关字段
    elementType: string;
    status: number;
}

export interface AnimationEffect {
    id: string;
    name: string;
    type: string;
    duration: string;
    delay?: string;
    easing?: string;
    iterationCount?: string | number;
    properties: Record<string, any>;
}

// API响应数据结构
export interface ApiSceneContent {
    id: number;
    scene_id: number;
    element_name: string;
    element_type: string;
    element_source: string;
    animation_script: string;
    layer_order: number;
    status: number;
    created_at: string;
    updated_at: string;
}
