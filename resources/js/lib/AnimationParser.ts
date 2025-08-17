import * as yaml from 'js-yaml';

// 初始位置配置
export interface InitialPosition {
  /** X轴坐标位置 */
  x?: number;
  /** Y轴坐标位置 */
  y?: number;
  /** 缩放比例，1为原始大小 */
  scale?: number;
  /** 透明度，0-1之间，1为完全不透明 */
  opacity?: number;
  /** 旋转角度，单位为度 */
  rotation?: number;
}

// 关键帧配置
export interface Keyframe {
  /** 开始时间，单位为毫秒，默认0 */
  startTime?: number;
  /** 持续时间，单位为毫秒 */
  duration: number;
  /** 关键帧X轴坐标位置 */
  x?: number;
  /** 关键帧Y轴坐标位置 */
  y?: number;
  /** 关键帧缩放比例 */
  scale?: number;
  /** 关键帧透明度 */
  opacity?: number;
  /** 关键帧旋转角度 */
  rotation?: number;
}

// 动画序列配置
export interface AnimationSequence {
  // 动画名称
  name?: string;
  // 动画描述
  description?: string;
  /** 动画唯一标识符 */
  id?: string;
  /** 动画持续时间，单位为毫秒 */
  duration?: number;
  /** 缓动函数类型，如 'ease', 'linear', 'ease-in-out' 等 */
  easing?: string;
  /** 关键帧序列，定义动画过程中的关键状态 */
  keyframes?: Array<Keyframe>;
}

// 分镜结构体
export interface AnimationData {
  // 动画媒体【图片、gif】
  media?: string;
  // 分镜名称
  name?: string;
  // 分镜描述
  description?: string;
  // 分镜初始位置
  initialPosition?: InitialPosition;
  // 分镜动画序列
  animationSequences?: Array<AnimationSequence>;
}

export class AnimationParser {
  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return 'anim_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
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
   * 解析YAML动画脚本为JSON对象
   * 核心方法：YAML -> JSON
   */
  static parseYamlToJson(yamlScript: string): AnimationData {
    console.log('AnimationParser.parseYamlToJson - 输入YAML:', yamlScript);

    if (!yamlScript || !yamlScript.trim()) {
      console.log('AnimationParser.parseYamlToJson - 输入为空，返回null');
      return {};
    }

    try {
      // 预处理内联格式的关键帧，转换为标准YAML格式
      const preprocessedText = this.preprocessKeyframes(yamlScript);

      // 使用js-yaml解析YAML
      const parsed = yaml.load(preprocessedText) as any;
      console.log('AnimationParser.parseYamlToJson - YAML解析结果:', parsed);

      if (!parsed || typeof parsed !== 'object') {
        console.log('AnimationParser.parseYamlToJson - 解析结果无效，返回null');
        return {};
      }

      // 确保使用固定的animations结构
      if (parsed.animations && Array.isArray(parsed.animations)) {
        // 为每个动画添加ID
        parsed.animations = parsed.animations.map((anim: any) => ({
          ...anim,
          id: anim.id || this.generateId()
        }));
      }

      console.log('AnimationParser.parseYamlToJson - 最终输出结果:', parsed);
      return parsed;
    } catch (error) {
      console.error('YAML解析失败:', error);
      console.log('AnimationParser.parseYamlToJson - 解析失败，返回null');
      return {};
    }
  }

  /**
   * 将JSON对象转换为YAML动画脚本
   * 核心方法：JSON -> YAML
   */
  static parseJsonToYaml(jsonData: any): string {
    if (!jsonData || typeof jsonData !== 'object') {
      return '';
    }

    try {
      // 使用js-yaml将JSON转换为YAML
      return yaml.dump(jsonData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      });
    } catch (error) {
      console.error('JSON转YAML失败:', error);
      return '';
    }
  }
}