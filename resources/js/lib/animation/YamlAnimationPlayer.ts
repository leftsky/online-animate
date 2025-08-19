import { FabricObject, Rect, FabricImage } from 'fabric';
import { AnimationData } from '../AnimationParser';
import { BasePlayer } from './BasePlayer';
import { CanvasManager } from './CanvasManager';

// 本地类型定义，用于内部动画处理
interface InitialPosition {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    opacity: number;
    rotation: number;
}

interface AnimationProperties {
    x?: number;
    y?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    opacity?: number;
    rotation?: number;
    angle?: number;
    skewX?: number;
    skewY?: number;
}

interface AnimationKeyframe {
    time: number;
    properties: AnimationProperties;
}

interface AnimationEffect {
    id?: string;
    type?: string;
    duration: number;
    easing?: string;
    properties?: AnimationProperties;
    keyframes?: AnimationKeyframe[];
}

interface ParsedAnimationData {
    target: string;
    scaleX: number;
    scaleY: number;
    width: number;
    height: number;
    media?: string;
    zindex?: number;
    initial: InitialPosition;
    animations: AnimationEffect[];
    singleAnimation?: {
        keyframes?: AnimationKeyframe[];
    };
}

/**
 * YAML 动画播放器类
 * 继承 BasePlayer，负责播放 YAML 动画脚本
 */
export class YamlAnimationPlayer extends BasePlayer {
    private animationObjects: Map<string, FabricObject> = new Map();
    private parsedAnimationData: ParsedAnimationData | null = null;
    private animationData: AnimationData | null = null;
    private playbackSpeed: number = 1.0;

    constructor(canvasManager: CanvasManager) {
        super(canvasManager);
        // 构造函数不再需要异步初始化
    }

    /**
     * 设置动画数据
     */
    public async setAnimationData(animationData: AnimationData): Promise<void> {
        this.animationData = animationData;

        // 等待初始化完成
        await this.initializeAnimation();
    }

    /**
     * 初始化动画数据
     */
    private async initializeAnimation(): Promise<void> {
        try {
            if (!this.animationData) {
                throw new Error('动画数据未设置');
            }

            // 准备动画对象
            await this.prepareAnimation(this.animationData);
        } catch (error) {
            console.error('动画初始化失败:', error);
            throw error; // 直接抛出错误，不创建默认动画
        }
    }


    /**
     * 准备动画
     */
    private async prepareAnimation(animationData: AnimationData): Promise<void> {
        try {
            // 清空当前画布
            this.clear();

            // 转换数据格式
            this.parsedAnimationData = this.convertAnimationData(animationData);
            console.log('🔍 转换后的动画数据:', this.parsedAnimationData);

            // 创建目标对象
            const targetObject = await this.createTargetObject();

            if (targetObject) {
                this.animationObjects.set(this.parsedAnimationData.target, targetObject);
                const canvas = this.getCanvas();
                canvas.add(targetObject);

                // 计算总动画时长
                this.calculateTotalDuration();

                // 渲染画布
                this.render();
            } else {
                throw new Error('创建目标对象失败');
            }
        } catch (error) {
            console.error('准备动画失败:', error);
            throw error;
        }
    }

    /**
     * 播放动画
     */
    public play(): void {
        // 检查是否设置了动画数据
        if (!this.animationData) {
            throw new Error('未设置动画数据，请先调用setAnimationData()');
        }

        // 检查是否已初始化
        if (!this.isReady()) {
            throw new Error('动画数据初始化失败，请检查动画数据格式');
        }

        if (this.isCurrentlyPlaying()) {
            return;
        }

        try {
            this.setPlayingState(true);

            // 开始动画循环
            this.startAnimationLoop(() => this.animateFrame());
        } catch (error) {
            console.error('播放动画失败:', error);
            this.setPlayingState(false);
        }
    }

    /**
     * 暂停动画
     */
    public pause(): void {
        if (this.isCurrentlyPlaying()) {
            this.setPlayingState(false);
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }

        }
    }

    /**
     * 停止动画
     */
    public stop(): void {
        this.pause();
        this.currentTime = 0;
        this.startTime = 0;

        // 重置对象到初始状态
        if (this.parsedAnimationData) {
            this.resetToInitialState();
        }


    }

    /**
     * 重播动画
     */
    public replay(): void {
        this.stop();
        setTimeout(() => {
            this.play();
        }, 100);
    }

    /**
     * 跳转到指定时间
     */
    public seek(time: number): void {
        if (!this.parsedAnimationData) return;

        const totalDuration = this.getPlaybackState().totalDuration;
        const clampedTime = Math.max(0, Math.min(time, totalDuration));

        this.currentTime = clampedTime;
        this.startTime = Date.now() - clampedTime;

        // 更新对象状态到指定时间
        this.updateToTime(clampedTime);
        this.render();
    }

    /**
     * 设置播放速度
     */
    public setSpeed(speed: number): void {
        this.playbackSpeed = Math.max(0.1, Math.min(5.0, speed));
    }

    /**
     * 获取播放进度
     */
    public getProgress(): number {
        if (!this.parsedAnimationData) return 0;
        const totalDuration = this.getPlaybackState().totalDuration;
        return totalDuration > 0 ? this.currentTime / totalDuration : 0;
    }

    /**
     * 获取总时长
     */
    public getDuration(): number {
        return this.getPlaybackState().totalDuration;
    }

    /**
     * 获取当前时间
     */
    public getCurrentTime(): number {
        return this.currentTime;
    }

    /**
 * 检查是否正在播放
 */
    public getPlayingStatus(): boolean {
        return this.isCurrentlyPlaying();
    }

    /**
     * 检查动画是否已准备就绪
     */
    public isReady(): boolean {
        return this.parsedAnimationData !== null && this.animationObjects.size > 0;
    }

    /**
     * 清理播放器资源
     */
    public clear(): void {
        super.clear();

        // 从画布中移除动画对象
        const canvas = this.getCanvas();
        this.animationObjects.forEach(obj => {
            canvas.remove(obj);
        });

        this.animationObjects.clear();
        this.parsedAnimationData = null;
        this.setTotalDuration(0);

        // 渲染画布
        this.render();
    }

    /**
     * 重置对象到初始状态
     */
    private resetToInitialState(): void {
        if (!this.parsedAnimationData) return;

        const targetObject = this.animationObjects.get(this.parsedAnimationData.target);
        if (targetObject) {
            const initial = this.parsedAnimationData.initial;
            targetObject.set({
                left: initial.x,
                top: initial.y,
                opacity: initial.opacity,
                scaleX: initial.scaleX,
                scaleY: initial.scaleY,
                angle: initial.rotation
            });
        }
    }

    /**
     * 更新对象到指定时间
     */
    private updateToTime(time: number): void {
        if (!this.parsedAnimationData) return;

        const targetObject = this.animationObjects.get(this.parsedAnimationData.target);
        if (!targetObject) return;

        let accumulatedTime = 0;

        for (const animation of this.parsedAnimationData.animations) {
            const duration = typeof animation.duration === 'string'
                ? this.parseDuration(animation.duration)
                : animation.duration;

            const animationStartTime = accumulatedTime;
            const animationEndTime = accumulatedTime + duration;

            if (time >= animationStartTime && time <= animationEndTime) {
                const animationProgress = (time - animationStartTime) / duration;

                if (animation.keyframes && animation.keyframes.length > 0) {
                    const adjustedKeyframes = animation.keyframes.map(kf => ({
                        ...kf,
                        time: kf.time + animationStartTime
                    }));
                    this.updateKeyframeAnimation(targetObject, adjustedKeyframes, time);
                } else {
                    this.updateAnimationEffect(targetObject, animation, animationProgress);
                }
                break;
            }

            accumulatedTime += duration;
        }
    }

    /**
     * 转换AnimationData为内部使用的ParsedAnimationData
     */
    private convertAnimationData(animationData: AnimationData): ParsedAnimationData {
        console.log('🔄 开始转换动画数据:', animationData);

        if (!animationData || typeof animationData !== 'object') {
            throw new Error('Invalid animation data: data must be a valid object');
        }

        const initial: InitialPosition = {
            x: this.parsePosition(animationData.initialPosition?.x, 0, 'initialPosition.x'),
            y: this.parsePosition(animationData.initialPosition?.y, 0, 'initialPosition.y'),
            scaleX: this.validateNumber(animationData.initialPosition?.scaleX, 1, 'initialPosition.scaleX'),
            scaleY: this.validateNumber(animationData.initialPosition?.scaleY, 1, 'initialPosition.scaleY'),
            opacity: this.validateNumber(animationData.initialPosition?.opacity, 1, 'initialPosition.opacity'),
            rotation: this.validateNumber(animationData.initialPosition?.rotation, 0, 'initialPosition.rotation')
        };

        const animations: AnimationEffect[] = (animationData.animationSequences || []).map((anim, index) => {
            if (!anim || typeof anim !== 'object') {
                console.warn(`Invalid animation at index ${index}, skipping`);
                return null;
            }
            return {
                id: anim.id || this.generateId(),
                duration: this.validateNumber(anim.duration, 1000, `animations[${index}].duration`),
                easing: anim.easing || 'ease',
                keyframes: anim.keyframes?.map((kf, kfIndex) => {
                    const x = this.parsePosition(kf.x, 0, 'keyframes.x');
                    const y = this.parsePosition(kf.y, 0, 'keyframes.y');
                    if (!kf || typeof kf !== 'object' || typeof kf.startTime !== 'number') {
                        console.warn(`Invalid keyframe at animations[${index}].keyframes[${kfIndex}], skipping`);
                        return null;
                    }
                    return {
                        time: kf.startTime,
                        properties: {
                            x: x + initial.x,
                            y: y + initial.y,
                            scaleX: kf.scaleX,
                            scaleY: kf.scaleY,
                            opacity: kf.opacity,
                            rotation: kf.rotation
                        }
                    };
                }).filter(kf => kf !== null) as AnimationKeyframe[]
            };
        }).filter(anim => anim !== null) as AnimationEffect[];

        const width = parseInt(this.parseDimension(animationData.width, 100, 'width').toString());
        const height = parseInt(this.parseDimension(animationData.height, 100, 'height').toString());
        const media = animationData.media ? `${animationData.media}?imageView2/2/w/${width}/h/${height}` : '';

        return {
            target: 'default',
            scaleX: 1,
            scaleY: 1,
            width: width,
            height: height,
            media: media,
            zindex: animationData.zindex || 0,
            initial,
            animations
        };
    }

    /**
     * 验证数值参数
     */
    private validateNumber(value: any, defaultValue: number, fieldName: string): number {
        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
            return value;
        }
        if (value !== undefined && value !== null) {
            console.warn(`⚠️ ${fieldName} 验证失败: ${value}, 使用默认值 ${defaultValue}`);
        }
        return defaultValue;
    }

    /**
     * 解析尺寸值（支持百分比）
     */
    private parseDimension(value: any, defaultValue: number, fieldName: string): number {
        // 如果是数字，直接返回
        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
            return value;
        }

        // 如果是字符串，检查是否为百分比
        if (typeof value === 'string') {
            const trimmedValue = value.trim();

            // 检查是否为百分比格式 (例如: "50%", "100%")
            if (trimmedValue.endsWith('%')) {
                const percentage = parseFloat(trimmedValue.slice(0, -1));
                if (!isNaN(percentage) && isFinite(percentage)) {
                    // 获取画布尺寸
                    const canvasDimensions = this.getCanvasManager().getDimensions();
                    const isWidth = fieldName.toLowerCase().includes('width');
                    const canvasSize = isWidth ? canvasDimensions.width : canvasDimensions.height;
                    const calculatedValue = (percentage / 100) * canvasSize;

                    return calculatedValue;
                }
            }

            // 尝试解析为数字
            const numericValue = parseFloat(trimmedValue);
            if (!isNaN(numericValue) && isFinite(numericValue)) {
                return numericValue;
            }
        }

        // 如果解析失败，使用默认值
        if (value !== undefined && value !== null) {
            console.warn(`⚠️ ${fieldName} 解析失败: ${value}, 使用默认值 ${defaultValue}`);
        }
        return defaultValue;
    }

    /**
     * 解析位置值（支持百分比）
     */
    private parsePosition(value: any, defaultValue: number, fieldName: string): number {

        // 如果是数字，直接返回
        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
            return value;
        }

        // 如果是字符串，检查是否为百分比
        if (typeof value === 'string') {
            const trimmedValue = value.trim();

            // 检查是否为百分比格式 (例如: "50%", "100%")
            if (trimmedValue.endsWith('%')) {
                const percentage = parseFloat(trimmedValue.slice(0, -1));
                if (!isNaN(percentage) && isFinite(percentage)) {
                    // 获取画布尺寸
                    const canvasDimensions = this.getCanvasManager().getDimensions();
                    const isX = fieldName.toLowerCase().includes('x');
                    const canvasSize = isX ? canvasDimensions.width : canvasDimensions.height;
                    const calculatedValue = (percentage / 100) * canvasSize;

                    return calculatedValue;
                }
            }

            // 尝试解析为数字
            const numericValue = parseFloat(trimmedValue);
            if (!isNaN(numericValue) && isFinite(numericValue)) {
                return numericValue;
            }
        }

        // 如果解析失败，使用默认值
        if (value !== undefined && value !== null) {
            console.warn(`⚠️ ${fieldName} 解析失败: ${value}, 使用默认值 ${defaultValue}`);
        }
        return defaultValue;
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return 'obj_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 创建目标对象
     */
    private async createTargetObject(): Promise<FabricObject | null> {
        try {
            if (!this.parsedAnimationData) {
                throw new Error('动画数据未初始化');
            }

            let obj: FabricObject;

            // 如果有media字段，优先使用图片
            if (this.parsedAnimationData.media) {
                try {
                    obj = await FabricImage.fromURL(this.parsedAnimationData.media, {
                        crossOrigin: 'anonymous'
                    });
                } catch (error) {
                    console.warn('加载图片失败，使用默认方块:', error);
                    obj = new Rect({
                        width: this.parsedAnimationData.width,
                        height: this.parsedAnimationData.height,
                        fill: '#FF9800'
                    });
                }
            } else {
                obj = new Rect({
                    width: this.parsedAnimationData.width,
                    height: this.parsedAnimationData.height,
                    fill: '#FF9800'
                });
            }

            // 设置初始属性

            obj.set({
                left: this.parsedAnimationData.initial.x,
                top: this.parsedAnimationData.initial.y,
                opacity: this.parsedAnimationData.initial.opacity,
                scaleX: this.parsedAnimationData.initial.scaleX,
                scaleY: this.parsedAnimationData.initial.scaleY,
                angle: this.parsedAnimationData.initial.rotation,
                selectable: false,
                evented: false
            });

            // 设置Z轴层级
            if (this.parsedAnimationData.zindex !== undefined) {
                obj.set('zIndex', this.parsedAnimationData.zindex);
            }

            return obj;
        } catch (error) {
            console.error('创建目标对象失败:', error);
            return null;
        }
    }

    /**
     * 计算总动画时长
     */
    private calculateTotalDuration(): void {
        if (!this.parsedAnimationData) return;

        let totalDuration = 0;
        for (const animation of this.parsedAnimationData.animations) {
            const duration = typeof animation.duration === 'string'
                ? this.parseDuration(animation.duration)
                : animation.duration;
            totalDuration += duration;
        }
        this.setTotalDuration(totalDuration);
    }

    /**
 * 动画帧循环
 */
    private animateFrame(): void {
        if (!this.isCurrentlyPlaying() || !this.parsedAnimationData) return;

        this.updateCurrentTime();
        const progress = this.getCurrentProgress();



        // 更新所有动画对象
        this.updateAnimations(progress);

        // 渲染画布
        this.render();

        // 检查是否完成
        if (progress >= 1) {
            this.setPlayingState(false);
            return;
        }

        // 继续下一帧
        this.animationId = requestAnimationFrame(() => this.animateFrame());
    }

    /**
     * 更新动画
     */
    private updateAnimations(progress: number): void {
        if (!this.parsedAnimationData) return;

        const targetObject = this.animationObjects.get(this.parsedAnimationData.target);
        if (!targetObject) {
            console.warn('⚠️ 目标对象未找到:', this.parsedAnimationData.target);
            return;
        }

        // 计算当前时间点
        const currentTime = progress * this.getPlaybackState().totalDuration;
        let accumulatedTime = 0;

        // 顺序处理每个动画
        for (let i = 0; i < this.parsedAnimationData.animations.length; i++) {
            const animation = this.parsedAnimationData.animations[i];
            const duration = typeof animation.duration === 'string'
                ? this.parseDuration(animation.duration)
                : animation.duration;

            const animationStartTime = accumulatedTime;
            const animationEndTime = accumulatedTime + duration;

            // 检查当前时间是否在这个动画的时间范围内
            if (currentTime >= animationStartTime && currentTime <= animationEndTime) {
                // 计算这个动画的相对进度 (0-1)
                const animationProgress = (currentTime - animationStartTime) / duration;



                // 处理关键帧动画
                if (animation.keyframes && animation.keyframes.length > 0) {
                    // 将关键帧时间调整为相对于动画开始时间的偏移
                    const adjustedKeyframes = animation.keyframes.map(kf => ({
                        ...kf,
                        time: kf.time + animationStartTime
                    }));
                    this.updateKeyframeAnimation(targetObject, adjustedKeyframes, currentTime);
                } else {
                    // 处理普通动画效果
                    this.updateAnimationEffect(targetObject, animation, animationProgress);
                }

                break; // 只处理当前时间点的动画
            }

            accumulatedTime += duration;
        }
    }

    /**
     * 更新关键帧动画
     */
    private updateKeyframeAnimation(obj: FabricObject, keyframes: AnimationKeyframe[], currentTime: number): void {
        if (keyframes.length === 0 || !this.parsedAnimationData) return;

        // 找到当前时间对应的关键帧
        let currentFrame: AnimationKeyframe | null = null;
        let nextFrame: AnimationKeyframe | null = null;

        for (let i = 0; i < keyframes.length; i++) {
            const frame = keyframes[i];
            if (frame.time <= currentTime) {
                currentFrame = frame;
                nextFrame = keyframes[i + 1] || null;
            } else {
                break;
            }
        }

        if (!currentFrame) {
            currentFrame = keyframes[0];
            nextFrame = keyframes[1] || null;
        }

        // 如果有下一帧，进行插值计算
        if (nextFrame && currentTime < nextFrame.time) {
            const frameProgress = (currentTime - currentFrame.time) / (nextFrame.time - currentFrame.time);
            const interpolatedProps = this.interpolateProperties(currentFrame.properties, nextFrame.properties, frameProgress);
            this.applyProperties(obj, interpolatedProps);
        } else {
            // 直接应用当前帧属性
            this.applyProperties(obj, currentFrame.properties);
        }
    }

    /**
     * 更新动画效果
     */
    private updateAnimationEffect(obj: FabricObject, animation: AnimationEffect, progress: number): void {
        const duration = typeof animation.duration === 'string'
            ? this.parseDuration(animation.duration)
            : animation.duration;
        const animationProgress = Math.min(progress * this.getPlaybackState().totalDuration / duration, 1);

        // 应用缓动函数
        const easedProgress = this.applyEasing(animationProgress, animation.easing || 'linear');

        // 通用属性动画
        this.applyGenericAnimation(obj, animation.properties, easedProgress);
    }

    /**
     * 插值计算属性
     */
    private interpolateProperties(from: any, to: any, progress: number): any {
        const result: any = {};
        for (const key in from) {
            if (typeof from[key] === 'number' && typeof to[key] === 'number') {
                result[key] = from[key] + (to[key] - from[key]) * progress;
            } else {
                result[key] = progress < 0.5 ? from[key] : to[key];
            }
        }
        return result;
    }

    /**
     * 应用属性到对象
     */
    private applyProperties(obj: FabricObject, properties: any): void {
        if (!this.parsedAnimationData) return;

        const updates: any = {};
        if (properties.x !== undefined) updates.left = properties.x;
        if (properties.y !== undefined) updates.top = properties.y;
        if (properties.rotation !== undefined) updates.angle = properties.rotation;

        // 处理缩放属性，乘以基础缩放比例
        if (properties.scale !== undefined) {
            updates.scaleX = properties.scale * this.parsedAnimationData.scaleX;
            updates.scaleY = properties.scale * this.parsedAnimationData.scaleY;
        }
        if (properties.scaleX !== undefined) updates.scaleX = properties.scaleX * this.parsedAnimationData.scaleX;
        if (properties.scaleY !== undefined) updates.scaleY = properties.scaleY * this.parsedAnimationData.scaleY;

        if (properties.opacity !== undefined) updates.opacity = properties.opacity;
        if (properties.skewX !== undefined) updates.skewX = properties.skewX;
        if (properties.skewY !== undefined) updates.skewY = properties.skewY;

        obj.set(updates);
    }

    /**
     * 应用通用动画
     */
    private applyGenericAnimation(obj: FabricObject, properties: any, progress: number): void {
        // 通用属性动画处理
        if (properties.to) {
            const updates: any = {};
            for (const key in properties.to) {
                const currentValue = (obj as any)[key] || 0;
                const targetValue = properties.to[key];
                if (typeof currentValue === 'number' && typeof targetValue === 'number') {
                    updates[key] = currentValue + (targetValue - currentValue) * progress;
                }
            }
            obj.set(updates);
        }
    }

    /**
     * 应用缓动函数
     */
    private applyEasing(progress: number, easing: string): number {
        switch (easing) {
            case 'ease-in':
                return progress * progress;
            case 'ease-out':
                return 1 - Math.pow(1 - progress, 2);
            case 'ease-in-out':
                return progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            default:
                return progress;
        }
    }

    /**
     * 解析时长字符串
     */
    private parseDuration(duration: string): number {
        if (typeof duration === 'number') return duration;
        const match = duration.match(/([\d.]+)(ms|s)?/);
        if (!match) return 1000;
        const value = parseFloat(match[1]);
        const unit = match[2] || 's';
        return unit === 'ms' ? value : value * 1000;
    }
}
