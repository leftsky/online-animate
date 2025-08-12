import { AnimationParser } from './AnimationParser';

// 示例动画语法
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

// 解析动画
const animations = AnimationParser.parse(animationScript);
console.log('解析结果:', animations);

// 转换为 GSAP 格式
const gsapConfig = AnimationParser.toGSAP(animations[0]);
console.log('GSAP 配置:', gsapConfig);

// 转换为 CSS 动画
const cssAnimation = AnimationParser.toCSS(animations[0]);
console.log('CSS 动画:', cssAnimation);