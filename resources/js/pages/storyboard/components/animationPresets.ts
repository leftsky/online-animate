import type { AnimationSequence } from '@/lib/AnimationParser';

export const animationPresets: Record<string, AnimationSequence> = {
  fadeIn: {
    id: 'fadeIn',
    name: '淡入',
    description: '从透明到不透明',
    duration: 1000,
    easing: 'ease-in-out',
    keyframes: [
      { startTime: 0, duration: 1000, opacity: 0 },
      { startTime: 1000, duration: 1000, opacity: 1 }
    ]
  },
  fadeOut: {
    id: 'fadeOut',
    name: '淡出',
    description: '从不透明到透明',
    duration: 1000,
    easing: 'ease-in-out',
    keyframes: [
      { startTime: 0, duration: 1000, opacity: 1 },
      { startTime: 1000, duration: 1000, opacity: 0 }
    ]
  },
  slideInLeft: {
    id: 'slideInLeft',
    name: '左侧滑入',
    description: '从左侧滑入',
    duration: 500,
    easing: 'ease-out',
    keyframes: [
      { startTime: 0, duration: 500, x: -100 },
      { startTime: 500, duration: 500, x: 0 }
    ]
  },
  slideInRight: {
    id: 'slideInRight',
    name: '右侧滑入',
    description: '从右侧滑入',
    duration: 500,
    easing: 'ease-out',
    keyframes: [
      { startTime: 0, duration: 500, x: 100 },
      { startTime: 500, duration: 500, x: 0 }
    ]
  },
  slideInUp: {
    id: 'slideInUp',
    name: '上方滑入',
    description: '从上方滑入',
    duration: 500,
    easing: 'ease-out',
    keyframes: [
      { startTime: 0, duration: 500, y: -100 },
      { startTime: 500, duration: 500, y: 0 }
    ]
  },
  slideInDown: {
    id: 'slideInDown',
    name: '下方滑入',
    description: '从下方滑入',
    duration: 500,
    easing: 'ease-out',
    keyframes: [
      { startTime: 0, duration: 500, y: 100 },
      { startTime: 500, duration: 500, y: 0 }
    ]
  },
  scaleIn: {
    id: 'scaleIn',
    name: '缩放进入',
    description: '从小到大缩放',
    duration: 300,
    easing: 'ease-out',
    keyframes: [
      { startTime: 0, duration: 300, scale: 0 },
      { startTime: 300, duration: 300, scale: 1 }
    ]
  },
  scaleOut: {
    id: 'scaleOut',
    name: '缩放退出',
    description: '从大到小缩放',
    duration: 300,
    easing: 'ease-in',
    keyframes: [
      { startTime: 0, duration: 300, scale: 1 },
      { startTime: 300, duration: 300, scale: 0 }
    ]
  },
  rotateIn: {
    id: 'rotateIn',
    name: '旋转进入',
    description: '旋转180度进入',
    duration: 500,
    easing: 'ease-out',
    keyframes: [
      { startTime: 0, duration: 500, rotation: -180 },
      { startTime: 500, duration: 500, rotation: 0 }
    ]
  },
  bounceIn: {
    id: 'bounceIn',
    name: '弹跳进入',
    description: '弹性进入效果',
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    keyframes: [
      { startTime: 0, duration: 150, scale: 0 },
      { startTime: 150, duration: 150, scale: 1.1 },
      { startTime: 300, duration: 150, scale: 0.9 },
      { startTime: 450, duration: 150, scale: 1 }
    ]
  },
  shake: {
    id: 'shake',
    name: '摇摆',
    description: '左右摇摆效果',
    duration: 500,
    keyframes: [
      { startTime: 0, duration: 100, x: 0 },
      { startTime: 100, duration: 100, x: -10 },
      { startTime: 200, duration: 100, x: 10 },
      { startTime: 300, duration: 100, x: -10 },
      { startTime: 400, duration: 100, x: 0 }
    ]
  },
  pulse: {
    id: 'pulse',
    name: '脉冲',
    description: '缩放脉冲效果',
    duration: 1000,
    keyframes: [
      { startTime: 0, duration: 333, scale: 1 },
      { startTime: 333, duration: 334, scale: 1.05 },
      { startTime: 667, duration: 333, scale: 1 }
    ]
  }
};
