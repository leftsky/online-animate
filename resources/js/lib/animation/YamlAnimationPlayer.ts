import { FabricObject, Rect, FabricText, Circle, FabricImage } from 'fabric';
import { AnimationData, AnimationParser } from '../AnimationParser';
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
    private yamlScript: string = '';
    private playbackSpeed: number = 1.0;

    constructor(canvasManager: CanvasManager) {
        super(canvasManager);
        // 构造函数不再需要异步初始化
    }

    /**
     * 设置YAML脚本
     */
    public async setYamlScript(yamlScript: string): Promise<void> {
        this.yamlScript = yamlScript;
        console.log('🎬 设置YAML脚本', yamlScript);
        
        // 等待初始化完成
        await this.initializeAnimation();
        console.log('🎬 动画初始化完成');
    }

    /**
     * 初始化动画数据
     */
    private async initializeAnimation(): Promise<void> {
        console.log('🎬 初始化动画数据', this.yamlScript);
        try {
            // 解析YAML脚本
            const animationData = this.parseYamlScript(this.yamlScript);

            // 准备动画对象
            await this.prepareAnimation(animationData);

            console.log('🎬 动画初始化完成', animationData);
        } catch (error) {
            console.error('动画初始化失败:', error);
            throw error; // 直接抛出错误，不创建默认动画
        }
    }

    /**
 * 解析YAML脚本
 */
    private parseYamlScript(yamlScript: string): AnimationData {
        if (!yamlScript || !yamlScript.trim()) {
            throw new Error('YAML脚本为空');
        }

        try {
            // 调用AnimationParser.parseYamlToJson
            const parsedData = AnimationParser.parseYamlToJson(yamlScript);

            // 缩放media；获得根节点的width和height；用七牛云的参数拼接上去
            parsedData.media += `?imageView2/2/w/${parsedData.width}/h/${parsedData.height}`;

            if (!parsedData || Object.keys(parsedData).length === 0) {
                throw new Error('YAML解析结果为空');
            }

            console.log('🎯 YAML解析成功:', parsedData);
            return parsedData;
        } catch (error) {
            console.error('❌ YAML解析失败:', error);
            throw new Error(`YAML解析失败: ${error}`);
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

            // 创建目标对象
            const targetObject = await this.createTargetObject(
                this.parsedAnimationData.target,
                this.parsedAnimationData.initial,
                animationData.media,
                animationData.width,
                animationData.height
            );

            if (targetObject) {
                this.animationObjects.set(this.parsedAnimationData.target, targetObject);
                const canvas = this.getCanvas();
                canvas.add(targetObject);

                console.log('🎨 动画对象已添加到画布:', targetObject);

                // 计算总动画时长
                this.calculateTotalDuration(this.parsedAnimationData.animations);
                console.log('⏱️ 总动画时长:', this.getPlaybackState().totalDuration, 'ms');

                // 渲染画布
                this.render();
                console.log('🖼️ 画布已渲染');
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
        // 检查是否设置了脚本
        if (!this.yamlScript || !this.yamlScript.trim()) {
            throw new Error('未设置YAML脚本，请先调用setYamlScript()');
        }

        // 检查是否已初始化
        if (!this.isReady()) {
            throw new Error('动画数据初始化失败，请检查YAML脚本格式');
        }

        if (this.isCurrentlyPlaying()) {
            console.log('动画已在播放中');
            return;
        }

        try {
            this.setPlayingState(true);
            console.log('🎬 开始播放动画');

            // 开始动画循环
            this.startAnimationLoop(() => this.animateFrame(this.parsedAnimationData!));
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
            console.log('⏸️ 动画已暂停');
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

        console.log('⏹️ 动画已停止');
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
        console.log(`🎯 播放速度设置为: ${this.playbackSpeed}x`);
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
                    this.updateKeyframeAnimation(targetObject, adjustedKeyframes, time, this.parsedAnimationData.scaleX, this.parsedAnimationData.scaleY);
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
        if (!animationData || typeof animationData !== 'object') {
            throw new Error('Invalid animation data: data must be a valid object');
        }

        const initial: InitialPosition = {
            x: this.validateNumber(animationData.initialPosition?.x, 100, 'initialPosition.x'),
            y: this.validateNumber(animationData.initialPosition?.y, 100, 'initialPosition.y'),
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
                    if (!kf || typeof kf !== 'object' || typeof kf.startTime !== 'number') {
                        console.warn(`Invalid keyframe at animations[${index}].keyframes[${kfIndex}], skipping`);
                        return null;
                    }
                    return {
                        time: kf.startTime,
                        properties: {
                            x: kf.x,
                            y: kf.y,
                            scaleX: kf.scaleX,
                            scaleY: kf.scaleY,
                            opacity: kf.opacity,
                            rotation: kf.rotation
                        }
                    };
                }).filter(kf => kf !== null) as AnimationKeyframe[]
            };
        }).filter(anim => anim !== null) as AnimationEffect[];

        return {
            target: 'default',
            scaleX: 1,
            scaleY: 1,
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
            console.warn(`Invalid ${fieldName}: ${value}, using default value ${defaultValue}`);
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
    private async createTargetObject(target: string, initial: InitialPosition, media?: string, width?: number, height?: number): Promise<FabricObject | null> {
        try {
            let obj: FabricObject;

            // 如果有media字段，优先使用图片
            if (media) {
                try {
                    obj = await FabricImage.fromURL(media, {
                        crossOrigin: 'anonymous'
                    });
                } catch (error) {
                    console.warn('加载图片失败，使用默认方块:', error);
                    obj = new Rect({
                        width: width || 100,
                        height: height || 100,
                        fill: '#FF9800'
                    });
                }
            } else if (target.includes('image') || target.includes('img')) {
                obj = new Rect({
                    width: width || 100,
                    height: height || 100,
                    fill: '#cccccc',
                    stroke: '#999999',
                    strokeWidth: 2
                });
            } else if (target.includes('text')) {
                obj = new FabricText('示例文本', {
                    fontSize: 24,
                    fill: '#333333',
                    fontFamily: 'Arial'
                });
            } else if (target.includes('rect') || target.includes('rectangle')) {
                obj = new Rect({
                    width: width || 100,
                    height: height || 60,
                    fill: '#4CAF50',
                    rx: 5,
                    ry: 5
                });
            } else if (target.includes('circle')) {
                const radius = width ? width / 2 : (height ? height / 2 : 50);
                obj = new Circle({
                    radius: radius,
                    fill: '#2196F3'
                });
            } else {
                obj = new Rect({
                    width: width || 80,
                    height: height || 80,
                    fill: '#FF9800'
                });
            }

            // 设置初始属性
            obj.set({
                left: initial.x,
                top: initial.y,
                opacity: initial.opacity,
                scaleX: initial.scaleX,
                scaleY: initial.scaleY,
                angle: initial.rotation,
                selectable: false,
                evented: false
            });

            return obj;
        } catch (error) {
            console.error('创建目标对象失败:', error);
            return null;
        }
    }

    /**
     * 计算总动画时长
     */
    private calculateTotalDuration(animations: AnimationEffect[]): void {
        let totalDuration = 0;
        for (const animation of animations) {
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
    private animateFrame(animationData: ParsedAnimationData): void {
        if (!this.isCurrentlyPlaying()) return;

        this.updateCurrentTime();
        const progress = this.getCurrentProgress();

        // 只在关键节点输出日志
        if (progress % 0.1 < 0.01) { // 每10%输出一次
            console.log('🔄 动画进度:', Math.round(progress * 100) + '%');
        }

        // 更新所有动画对象
        this.updateAnimations(animationData, progress);

        // 渲染画布
        this.render();

        // 检查是否完成
        if (progress >= 1) {
            this.setPlayingState(false);
            console.log('🎬 所有动画播放完成');
            return;
        }

        // 继续下一帧
        this.animationId = requestAnimationFrame(() => this.animateFrame(animationData));
    }

    /**
     * 更新动画
     */
    private updateAnimations(animationData: ParsedAnimationData, progress: number): void {
        const targetObject = this.animationObjects.get(animationData.target);
        if (!targetObject) {
            console.warn('⚠️ 目标对象未找到:', animationData.target);
            return;
        }

        // 计算当前时间点
        const currentTime = progress * this.getPlaybackState().totalDuration;
        let accumulatedTime = 0;

        // 顺序处理每个动画
        for (let i = 0; i < animationData.animations.length; i++) {
            const animation = animationData.animations[i];
            const duration = typeof animation.duration === 'string'
                ? this.parseDuration(animation.duration)
                : animation.duration;

            const animationStartTime = accumulatedTime;
            const animationEndTime = accumulatedTime + duration;

            // 检查当前时间是否在这个动画的时间范围内
            if (currentTime >= animationStartTime && currentTime <= animationEndTime) {
                // 计算这个动画的相对进度 (0-1)
                const animationProgress = (currentTime - animationStartTime) / duration;

                // 只在动画切换时输出日志
                if (animationProgress < 0.1) {
                    console.log(`🎬 播放动画: ${animation.id || `动画${i + 1}`}`);
                }

                // 处理关键帧动画
                if (animation.keyframes && animation.keyframes.length > 0) {
                    // 将关键帧时间调整为相对于动画开始时间的偏移
                    const adjustedKeyframes = animation.keyframes.map(kf => ({
                        ...kf,
                        time: kf.time + animationStartTime
                    }));
                    this.updateKeyframeAnimation(targetObject, adjustedKeyframes, currentTime, animationData.scaleX, animationData.scaleY);
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
    private updateKeyframeAnimation(obj: FabricObject, keyframes: AnimationKeyframe[], currentTime: number, baseScaleX: number = 1, baseScaleY: number = 1): void {
        if (keyframes.length === 0) return;

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
            this.applyProperties(obj, interpolatedProps, baseScaleX, baseScaleY);
        } else {
            // 直接应用当前帧属性
            this.applyProperties(obj, currentFrame.properties, baseScaleX, baseScaleY);
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
    private applyProperties(obj: FabricObject, properties: any, baseScaleX: number = 1, baseScaleY: number = 1): void {
        const updates: any = {};
        if (properties.x !== undefined) updates.left = properties.x;
        if (properties.y !== undefined) updates.top = properties.y;
        if (properties.rotation !== undefined) updates.angle = properties.rotation;

        // 处理缩放属性，乘以基础缩放比例
        if (properties.scale !== undefined) {
            updates.scaleX = properties.scale * baseScaleX;
            updates.scaleY = properties.scale * baseScaleY;
        }
        if (properties.scaleX !== undefined) updates.scaleX = properties.scaleX * baseScaleX;
        if (properties.scaleY !== undefined) updates.scaleY = properties.scaleY * baseScaleY;

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
