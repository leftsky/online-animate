import { AnimationParser } from './AnimationParser';

// 示例动画语法（原有格式）
const animationScript = `
image1:
  duration: 3s
  easing: ease-in-out
  loop: true
  keyframes:
    - time: 0s, rotate: 0deg, scale: 1, position: [100, 100], opacity: 1
    - time: 1.5s, rotate: 180deg, scale: 1.5, position: [200, 150], opacity: 0.8
    - time: 3s, rotate: 360deg, scale: 1, position: [300, 100], opacity: 1

image2:
  duration: 2s
  easing: bounce
  keyframes:
    - time: 0s, x: 0, y: 0, scaleX: 1, scaleY: 1
    - time: 1s, x: 100, y: 50, scaleX: 1.2, scaleY: 0.8
    - time: 2s, x: 200, y: 0, scaleX: 1, scaleY: 1
`;

// 新格式动画语法（支持初始位置和多动画）
const newFormatScript = `
element_123:
  initial:
    x: 100
    y: 50
    opacity: 0.8
    scale: 1.2
    rotation: 45deg
  duration: 2s
  easing: ease-in-out
  keyframes:
    - time: 0s, x: 100, y: 50, opacity: 0.8, scale: 1.2
    - time: 2s, x: 200, y: 100, opacity: 1, scale: 1.5
`;

// 多动画格式
const multiAnimationScript = `
character_001:
  initial:
    x: 0
    y: 0
    opacity: 1
    scale: 1
    rotation: 0deg
  animations:
    - name: 淡入
      duration: 1s
      easing: ease-in-out
      keyframes:
        - time: 0s, x: 0, y: 0, opacity: 0, scale: 1
        - time: 1s, x: 0, y: 0, opacity: 1, scale: 1
    - name: 缩放
      duration: 0.5s
      easing: ease-out
      keyframes:
        - time: 0s, x: 0, y: 0, opacity: 1, scale: 1
        - time: 0.5s, x: 0, y: 0, opacity: 1, scale: 1.2
`;

// 解析原有格式动画
const animations = AnimationParser.parse(animationScript);
console.log('原有格式解析结果:', animations);

// 解析新格式动画
const newFormatData = AnimationParser.parseNewFormat(newFormatScript);
console.log('新格式解析结果:', newFormatData);

// 解析多动画格式
const multiAnimationData = AnimationParser.parseNewFormat(multiAnimationScript);
console.log('多动画格式解析结果:', multiAnimationData);

// 转换为 GSAP 格式（原有功能）
const gsapConfig = AnimationParser.toGSAP(animations[0]);
console.log('GSAP 配置:', gsapConfig);

// 转换为 CSS 动画（原有功能）
const cssAnimation = AnimationParser.toCSS(animations[0]);
console.log('CSS 动画:', cssAnimation);