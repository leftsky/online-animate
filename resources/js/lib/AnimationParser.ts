import * as yaml from 'js-yaml';

export interface AnimationKeyframe {
  time: number;
  properties: {
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    opacity?: number;
    skewX?: number;
    skewY?: number;
  };
}

export interface AnimationConfig {
  id: string;
  target: string;
  duration: number;
  easing: string;
  loop: boolean;
  autoplay: boolean;
  keyframes: AnimationKeyframe[];
}

// 新增接口：初始位置
export interface InitialPosition {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotation: number;
}

// 新增接口：动画效果
export interface AnimationEffect {
  id: string;
  name: string;
  type: string;
  duration: string;
  easing?: string;
  properties: Record<string, any>;
}

// 新增接口：完整的动画数据
export interface ParsedAnimationData {
  target: string;
  initial: InitialPosition;
  animations: AnimationEffect[];
  singleAnimation?: {
    duration: string;
    easing?: string;
    keyframes: AnimationKeyframe[];
  };
}

export class AnimationParser {
  private static readonly EASING_MAP: Record<string, string> = {
    'linear': 'linear',
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  };

  /**
   * 解析自定义简洁语法
   * 支持两种格式：
   * 1. 原有格式：
   * image1:
   *   duration: 3s
   *   easing: ease-in-out
   *   loop: true
   *   keyframes:
   *     - time: 0s, rotate: 0deg, scale: 1, position: [100, 100], opacity: 1
   *     - time: 1.5s, rotate: 180deg, scale: 1.5, position: [200, 150], opacity: 0.8
   *     - time: 3s, rotate: 360deg, scale: 1, position: [300, 100], opacity: 1
   * 
   * 2. 新格式（支持初始位置和多动画）：
   * element_name:
   *   initial:
   *     x: 0
   *     y: 0
   *     opacity: 1
   *     scale: 1
   *     rotation: 0deg
   *   duration: 1s
   *   easing: ease-in-out
   *   keyframes:
   *     - time: 0s, x: 0, y: 0, opacity: 1, scale: 1
   *     - time: 1s, x: 100, y: 50, opacity: 0.8, scale: 1.2
   *   animations:
   *     - name: 淡入
   *       duration: 1s
   *       easing: ease-in-out
   *       keyframes: [...]
   */
  static parse(animationText: string): AnimationConfig[] {
    const animations: AnimationConfig[] = [];
    const lines = animationText.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentAnimation: Partial<AnimationConfig> | null = null;
    let inKeyframes = false;
    
    for (const line of lines) {
      // 检测动画目标（以冒号结尾）
      if (line.endsWith(':') && !line.startsWith('-')) {
        if (currentAnimation) {
          animations.push(this.validateAnimation(currentAnimation));
        }
        
        currentAnimation = {
          id: this.generateId(),
          target: line.slice(0, -1),
          duration: 1000,
          easing: 'ease',
          loop: false,
          autoplay: true,
          keyframes: []
        };
        inKeyframes = false;
      }
      // 检测关键帧开始
      else if (line === 'keyframes:') {
        inKeyframes = true;
      }
      // 解析属性
      else if (line.includes(':') && !inKeyframes && currentAnimation) {
        this.parseProperty(line, currentAnimation);
      }
      // 解析关键帧
      else if (line.startsWith('-') && inKeyframes && currentAnimation) {
        const keyframe = this.parseKeyframe(line.slice(1).trim());
        currentAnimation.keyframes!.push(keyframe);
      }
    }
    
    if (currentAnimation) {
      animations.push(this.validateAnimation(currentAnimation));
    }
    
    return animations;
  }

  /**
   * 解析单行属性
   */
  private static parseProperty(line: string, animation: Partial<AnimationConfig>): void {
    const [key, value] = line.split(':').map(s => s.trim());
    
    switch (key) {
      case 'duration':
        animation.duration = this.parseDuration(value);
        break;
      case 'easing':
        animation.easing = this.EASING_MAP[value] || value;
        break;
      case 'loop':
        animation.loop = value === 'true';
        break;
      case 'autoplay':
        animation.autoplay = value === 'true';
        break;
    }
  }

  /**
   * 解析关键帧数组
   */
  private static parseKeyframes(keyframes: any[]): AnimationKeyframe[] {
    if (!Array.isArray(keyframes)) {
      return [];
    }

    return keyframes.map(kf => {
      if (typeof kf === 'string') {
        // 处理字符串格式的关键帧
        return this.parseKeyframe(kf);
      } else if (typeof kf === 'object' && kf !== null) {
        // 处理对象格式的关键帧
        return {
          time: kf.time || 0,
          properties: {
            x: kf.x,
            y: kf.y,
            rotation: kf.rotation || kf.rotate,
            scaleX: kf.scaleX || kf.scale,
            scaleY: kf.scaleY || kf.scale,
            opacity: kf.opacity,
            skewX: kf.skewX,
            skewY: kf.skewY
          }
        };
      }
      return { time: 0, properties: {} };
    });
  }

  /**
   * 解析关键帧
   */
  private static parseKeyframe(line: string): AnimationKeyframe {
    const keyframe: AnimationKeyframe = {
      time: 0,
      properties: {}
    };
    
    const parts = line.split(',').map(s => s.trim());
    
    for (const part of parts) {
      const [key, value] = part.split(':').map(s => s.trim());
      
      switch (key) {
        case 'time':
          keyframe.time = this.parseDuration(value) / 1000; // 转换为秒
          break;
        case 'rotate':
          keyframe.properties.rotation = this.parseAngle(value);
          break;
        case 'scale':
          const scale = parseFloat(value);
          keyframe.properties.scaleX = scale;
          keyframe.properties.scaleY = scale;
          break;
        case 'scaleX':
          keyframe.properties.scaleX = parseFloat(value);
          break;
        case 'scaleY':
          keyframe.properties.scaleY = parseFloat(value);
          break;
        case 'position':
          const position = this.parsePosition(value);
          keyframe.properties.x = position[0];
          keyframe.properties.y = position[1];
          break;
        case 'x':
          keyframe.properties.x = parseFloat(value);
          break;
        case 'y':
          keyframe.properties.y = parseFloat(value);
          break;
        case 'opacity':
          keyframe.properties.opacity = parseFloat(value);
          break;
        case 'skewX':
          keyframe.properties.skewX = this.parseAngle(value);
          break;
        case 'skewY':
          keyframe.properties.skewY = this.parseAngle(value);
          break;
      }
    }
    
    return keyframe;
  }

  /**
   * 解析时间（支持 s, ms）
   */
  private static parseDuration(value: string): number {
    if (value.endsWith('s') && !value.endsWith('ms')) {
      return parseFloat(value.slice(0, -1)) * 1000;
    } else if (value.endsWith('ms')) {
      return parseFloat(value.slice(0, -2));
    }
    return parseFloat(value);
  }

  /**
   * 解析角度（支持 deg, rad）
   */
  private static parseAngle(value: string): number {
    if (value.endsWith('deg')) {
      return parseFloat(value.slice(0, -3));
    } else if (value.endsWith('rad')) {
      return parseFloat(value.slice(0, -3)) * (180 / Math.PI);
    }
    return parseFloat(value);
  }

  /**
   * 解析位置 [x, y]
   */
  private static parsePosition(value: string): [number, number] {
    const cleaned = value.replace(/[\[\]]/g, '');
    const parts = cleaned.split(',').map(s => parseFloat(s.trim()));
    return [parts[0] || 0, parts[1] || 0];
  }

  /**
   * 验证动画配置
   */
  private static validateAnimation(animation: Partial<AnimationConfig>): AnimationConfig {
    return {
      id: animation.id || this.generateId(),
      target: animation.target || 'unknown',
      duration: animation.duration || 1000,
      easing: animation.easing || 'ease',
      loop: animation.loop || false,
      autoplay: animation.autoplay !== false,
      keyframes: animation.keyframes || []
    };
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return 'anim_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * 解析新格式的YAML（支持initial和animations块）
   * 使用js-yaml库进行解析
   */
  static parseNewFormat(animationText: string): ParsedAnimationData | null {
    if (!animationText || !animationText.trim()) {
      return null;
    }

    try {
      // 预处理内联格式的关键帧，转换为标准YAML格式
      const preprocessedText = this.preprocessKeyframes(animationText);
      
      // 使用js-yaml解析YAML
      const parsed = yaml.load(preprocessedText) as any;
      
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      // 获取第一个元素作为目标
      const targetKey = Object.keys(parsed)[0];
      const targetData = parsed[targetKey];
      
      if (!targetData || typeof targetData !== 'object') {
        return null;
      }

      // 解析初始位置
      const initial: InitialPosition = {
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        rotation: 0
      };

      if (targetData.initial) {
        initial.x = targetData.initial.x || 0;
        initial.y = targetData.initial.y || 0;
        initial.opacity = targetData.initial.opacity || 1;
        initial.scale = targetData.initial.scale || 1;
        initial.rotation = typeof targetData.initial.rotation === 'string' 
          ? parseFloat(targetData.initial.rotation.replace('deg', '')) || 0
          : targetData.initial.rotation || 0;
      }

      // 解析动画列表
      const animations: AnimationEffect[] = [];
      if (targetData.animations && Array.isArray(targetData.animations)) {
        for (const anim of targetData.animations) {
          if (anim.name) {
            // 解析关键帧数据
            let keyframes: AnimationKeyframe[] = [];
            if (anim.keyframes && Array.isArray(anim.keyframes)) {
              keyframes = this.parseKeyframes(anim.keyframes);
            }
            
            animations.push({
              id: this.generateId(),
              name: anim.name,
              type: this.detectAnimationType(anim.name),
              duration: anim.duration || '1s',
              easing: anim.easing || 'ease',
              properties: {
                ...anim.properties || {},
                keyframes: keyframes
              }
            });
          }
        }
      }

      // 解析单个动画（兼容旧格式）
      let singleAnimation: ParsedAnimationData['singleAnimation'];
      if (targetData.duration || targetData.keyframes) {
        singleAnimation = {
          duration: targetData.duration || '3s',
          easing: targetData.easing || 'ease-in-out',
          keyframes: this.parseKeyframes(targetData.keyframes || [])
        };
      }

      return {
        target: targetKey,
        initial,
        animations,
        singleAnimation
      };
    } catch (error) {
      console.error('YAML解析失败:', error);
      return null;
    }
  }

  /**
   * 根据名称检测动画类型
   */
  private static detectAnimationType(name: string): string {
    const nameMap: Record<string, string> = {
      '淡入': 'fadeIn',
      '淡出': 'fadeOut',
      '左侧滑入': 'slideInLeft',
      '右侧滑入': 'slideInRight',
      '上方滑入': 'slideInUp',
      '下方滑入': 'slideInDown',
      '缩放进入': 'scaleIn',
      '缩放退出': 'scaleOut',
      '旋转进入': 'rotateIn',
      '弹跳进入': 'bounceIn',
      '摇摆': 'shake',
      '脉冲': 'pulse'
    };
    
    return nameMap[name] || 'custom';
  }

  /**
   * 解析完整的 YAML 动画脚本
   * 使用js-yaml库进行标准YAML解析
   */
  static parseYAMLScript(yamlScript: string): ParsedAnimationData | null {
    if (!yamlScript || !yamlScript.trim()) {
      return null;
    }

    try {
      // 移除 YAML 文档分隔符
      const cleanScript = yamlScript.replace(/^---\s*\n/, '').replace(/\n\.\.\.$/, '');
      
      // 直接使用parseNewFormat方法，它已经使用js-yaml
      return this.parseNewFormat(cleanScript);
    } catch (error) {
      console.error('YAML 解析失败:', error);
      return this.createDefaultAnimation();
    }
  }



  /**
   * 预处理关键帧数据，将内联格式转换为标准YAML格式
   */
  private static preprocessKeyframes(text: string): string {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检测内联格式的关键帧（包含逗号分隔的属性）
      if (line.trim().startsWith('- ') && line.includes(',') && line.includes(':')) {
        const indent = line.match(/^\s*/)?.[0] || '';
        const content = line.trim().substring(2); // 移除 "- "
        
        // 解析内联属性
        const properties = content.split(',').map(prop => prop.trim());
        
        // 转换为标准YAML格式
        processedLines.push(indent + '-');
        for (const prop of properties) {
          const [key, value] = prop.split(':').map(s => s.trim());
          if (key && value) {
            processedLines.push(indent + '  ' + key + ': ' + value);
          }
        }
      } else {
        processedLines.push(line);
      }
    }
    
    return processedLines.join('\n');
  }

  /**
   * 创建默认动画
   */
  private static createDefaultAnimation(): ParsedAnimationData {
    return {
      target: 'all',
      initial: { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
      animations: [
        {
          id: this.generateId(),
          name: '淡入',
          type: 'fadeIn',
          duration: '1s',
          easing: 'ease',
          properties: {}
        }
      ]
    };
  }

  /**
   * 将解析后的动画数据转换为 GSAP 可执行的格式
   */
  static toGSAPTimeline(data: ParsedAnimationData): any[] {
    const timeline: any[] = [];

    for (const animation of data.animations) {
      const gsapConfig = this.animationTypeToGSAP(animation);
      timeline.push({
        ...gsapConfig,
        duration: this.parseDuration(animation.duration),
        ease: this.EASING_MAP[animation.easing || 'ease'] || animation.easing || 'ease',
        delay: animation.properties.delay || 0
      });
    }

    return timeline;
  }

  /**
   * 根据动画类型生成 GSAP 配置
   */
  private static animationTypeToGSAP(animation: AnimationEffect): any {
    const config: any = {};

    switch (animation.type) {
      case 'fadeIn':
        config.opacity = 1;
        config.from = { opacity: 0 };
        break;
      case 'fadeOut':
        config.opacity = 0;
        config.from = { opacity: 1 };
        break;
      case 'slideInLeft':
        config.x = 0;
        config.from = { x: -200 };
        break;
      case 'slideInRight':
        config.x = 0;
        config.from = { x: 200 };
        break;
      case 'slideInUp':
        config.y = 0;
        config.from = { y: 200 };
        break;
      case 'slideInDown':
        config.y = 0;
        config.from = { y: -200 };
        break;
      case 'scaleIn':
        config.scaleX = 1;
        config.scaleY = 1;
        config.from = { scaleX: 0, scaleY: 0 };
        break;
      case 'scaleOut':
        config.scaleX = 0;
        config.scaleY = 0;
        config.from = { scaleX: 1, scaleY: 1 };
        break;
      case 'rotateIn':
        config.rotation = 0;
        config.from = { rotation: -360 };
        break;
      case 'bounceIn':
        config.scaleX = 1;
        config.scaleY = 1;
        config.opacity = 1;
        config.from = { scaleX: 0.3, scaleY: 0.3, opacity: 0 };
        config.ease = 'back.out(1.7)';
        break;
      case 'shake':
        config.x = '+=10';
        config.yoyo = true;
        config.repeat = 5;
        break;
      case 'pulse':
        config.scaleX = 1.1;
        config.scaleY = 1.1;
        config.yoyo = true;
        config.repeat = 3;
        break;
      default:
        // 自定义动画，使用属性中的配置
        Object.assign(config, animation.properties);
    }

    return config;
  }

  /**
   * 将动画配置转换为 GSAP 时间轴
   */
  static toGSAP(config: AnimationConfig): any {
    const timeline = {
      target: config.target,
      duration: config.duration / 1000,
      ease: config.easing,
      repeat: config.loop ? -1 : 0,
      keyframes: config.keyframes.map(kf => ({
        ...kf.properties,
        duration: kf.time
      }))
    };
    
    return timeline;
  }

  /**
   * 将动画配置转换为 CSS 动画
   */
  static toCSS(config: AnimationConfig): string {
    const keyframesCSS = config.keyframes.map((kf) => {
      const percentage = (kf.time / (config.duration / 1000)) * 100;
      const transforms = [];
      
      if (kf.properties.x !== undefined || kf.properties.y !== undefined) {
        transforms.push(`translate(${kf.properties.x || 0}px, ${kf.properties.y || 0}px)`);
      }
      if (kf.properties.rotation !== undefined) {
        transforms.push(`rotate(${kf.properties.rotation}deg)`);
      }
      if (kf.properties.scaleX !== undefined || kf.properties.scaleY !== undefined) {
        transforms.push(`scale(${kf.properties.scaleX || 1}, ${kf.properties.scaleY || 1})`);
      }
      if (kf.properties.skewX !== undefined || kf.properties.skewY !== undefined) {
        transforms.push(`skew(${kf.properties.skewX || 0}deg, ${kf.properties.skewY || 0}deg)`);
      }
      
      const properties = [];
      if (transforms.length > 0) {
        properties.push(`transform: ${transforms.join(' ')}`);
      }
      if (kf.properties.opacity !== undefined) {
        properties.push(`opacity: ${kf.properties.opacity}`);
      }
      
      return `  ${percentage.toFixed(1)}% { ${properties.join('; ')} }`;
    }).join('\n');
    
    return `@keyframes ${config.id} {\n${keyframesCSS}\n}`;
  }
}