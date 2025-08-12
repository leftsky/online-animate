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
   * 语法示例：
   * image1:
   *   duration: 3s
   *   easing: ease-in-out
   *   loop: true
   *   keyframes:
   *     - time: 0s, rotate: 0deg, scale: 1, position: [100, 100], opacity: 1
   *     - time: 1.5s, rotate: 180deg, scale: 1.5, position: [200, 150], opacity: 0.8
   *     - time: 3s, rotate: 360deg, scale: 1, position: [300, 100], opacity: 1
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
    const keyframesCSS = config.keyframes.map((kf, index) => {
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