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
   */
  static parseNewFormat(animationText: string): ParsedAnimationData | null {
    console.log('🔍 AnimationParser.parseNewFormat 开始解析:', animationText);
    
    if (!animationText || !animationText.trim()) {
      console.log('❌ 动画文本为空');
      return null;
    }

    const lines = animationText.split('\n').map(line => line.trim()).filter(line => line);
    console.log('📝 解析行数:', lines.length, '行内容:', lines);
    
    let target = '';
    const initial: InitialPosition = { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 };
    const animations: AnimationEffect[] = [];
    let singleAnimation: ParsedAnimationData['singleAnimation'];
    
    let currentSection = '';
    let currentAnimationIndex = -1;
    
    for (const line of lines) {
      console.log(`🔍 处理行: "${line}" | 当前块: "${currentSection}" | 动画索引: ${currentAnimationIndex}`);
      
      // 检测块级标识（优先检测，避免被当作目标元素）
      if (line === 'initial:') {
        currentSection = 'initial';
        console.log('🏷️ 进入 initial 块');
        continue;
      } else if (line === 'animations:') {
        currentSection = 'animations';
        currentAnimationIndex = -1; // 重置动画索引
        console.log('🏷️ 进入 animations 块');
        continue;
      } else if (line === 'keyframes:' && currentAnimationIndex < 0) {
        // 只有在不是动画属性的情况下才当作顶级块
        currentSection = 'keyframes';
        console.log('🏷️ 进入 keyframes 块');
        continue;
      }
      
      // 检测目标元素（只在根级别）
      if (line.endsWith(':') && !line.startsWith('-') && !line.includes(' ') && currentSection === '') {
        target = line.slice(0, -1);
        console.log(`🎯 设置目标元素: ${target}`);
        continue;
      }
      
      // 解析initial块
      if (currentSection === 'initial' && line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim());
        switch (key) {
          case 'x':
            initial.x = parseFloat(value) || 0;
            break;
          case 'y':
            initial.y = parseFloat(value) || 0;
            break;
          case 'opacity':
            initial.opacity = parseFloat(value) || 1;
            break;
          case 'scale':
            initial.scale = parseFloat(value) || 1;
            break;
          case 'rotation':
            initial.rotation = parseFloat(value.replace('deg', '')) || 0;
            break;
        }
        continue;
      }
      
      // 解析animations块 - 检测新动画项
      if (currentSection === 'animations' && line.startsWith('- name:')) {
        const name = line.replace('- name:', '').trim();
        currentAnimationIndex = animations.length;
        const newAnimation = {
          id: this.generateId(),
          name,
          type: this.detectAnimationType(name),
          duration: '1s',
          easing: 'ease',
          properties: {}
        };
        animations.push(newAnimation);
        console.log(`➕ 添加动画 #${currentAnimationIndex}: "${name}"`);
        continue;
      }
      
      // 处理非animations块中的 - name: 行（可能是新动画的开始）
      if (line.startsWith('- name:') && currentSection !== 'animations') {
        // 如果不在animations块中遇到 - name:，说明这是一个新的动画项
        // 切换到animations模式
        currentSection = 'animations';
        currentAnimationIndex = -1;
        console.log('🔄 检测到动画项，自动切换到animations模式');
        
        // 处理这个动画项
        const name = line.replace('- name:', '').trim();
        currentAnimationIndex = animations.length;
        const newAnimation = {
          id: this.generateId(),
          name,
          type: this.detectAnimationType(name),
          duration: '1s',
          easing: 'ease',
          properties: {}
        };
        animations.push(newAnimation);
        console.log(`➕ 添加动画 #${currentAnimationIndex}: "${name}"`);
        continue;
      }
      
      // 解析动画属性
      if (currentAnimationIndex >= 0 && line.includes(':') && !line.startsWith('-') && currentSection === 'animations') {
        const [key, value] = line.split(':').map(s => s.trim());
        const currentAnim = animations[currentAnimationIndex];
        
        if (key === 'duration') {
          currentAnim.duration = value;
          console.log(`⏱️ 设置动画 #${currentAnimationIndex} 持续时间: ${value}`);
        } else if (key === 'easing') {
          currentAnim.easing = value;
          console.log(`🎨 设置动画 #${currentAnimationIndex} 缓动: ${value}`);
        } else if (key === 'keyframes') {
          console.log(`🔑 动画 #${currentAnimationIndex} 遇到keyframes，跳过`);
          // keyframes 行本身不需要处理，keyframes内容在后续的 - time: 行中处理
        }
        continue;
      }
      
      // 解析单个动画（非animations块）
      if (currentSection === '' && line.includes(':') && !line.startsWith('-')) {
        const [key, value] = line.split(':').map(s => s.trim());
        
        if (key === 'duration' || key === 'easing') {
          if (!singleAnimation) {
            singleAnimation = {
              duration: '3s',
              easing: 'ease-in-out',
              keyframes: []
            };
          }
          
          if (key === 'duration') {
            singleAnimation.duration = value;
          } else if (key === 'easing') {
            singleAnimation.easing = value;
          }
        }
        continue;
      }
    }
    
    const result = {
      target: target || 'unknown',
      initial,
      animations,
      singleAnimation
    };
    
    console.log('✅ 解析完成结果:', result);
    console.log(`📊 统计: target="${result.target}", initial=${JSON.stringify(result.initial)}, animations=${result.animations.length}个, singleAnimation=${!!result.singleAnimation}`);
    
    return result;
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