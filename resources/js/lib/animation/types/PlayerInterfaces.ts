import { AnimationData } from '../../AnimationParser';

/**
 * 播放器基础接口
 */
export interface IPlayer {
  /**
   * 播放动画
   */
  play(animationData: AnimationData): void;
  
  /**
   * 暂停动画
   */
  pause(): void;
  
  /**
   * 停止动画
   */
  stop(): void;
  
  /**
   * 获取播放状态
   */
  getPlaybackState(): PlaybackState;
  
  /**
   * 清理播放器资源
   */
  clear(): void;
}

/**
 * 播放状态接口
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  progress: number;
}

/**
 * 播放器类型枚举
 */
export enum PlayerType {
  YAML_ANIMATION = 'yaml_animation',
  OTHER = 'other'
}
