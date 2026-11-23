'use client';

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

export type AnimatedContentWipe = 'none' | 'up' | 'down' | 'left' | 'right' | 'center';
export type AnimatedContentStaggerFrom = 'start' | 'end' | 'center' | 'edges' | 'random';

export interface AnimatedContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onAnimationStart'> {
  children?: ReactNode;
  container?: Element | string | null;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  blur?: number;
  rotate?: number;
  tilt?: number;
  wipe?: AnimatedContentWipe;
  threshold?: number;
  delay?: number;
  stagger?: number;
  staggerFrom?: AnimatedContentStaggerFrom;
  trigger?: 'scroll' | 'mount';
  once?: boolean;
  scrub?: boolean | number;
  disappearAfter?: number;
  disappearDuration?: number;
  disappearEase?: string;
  onStart?: () => void;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

const resolveEase = (_easeStr?: string): [number, number, number, number] => {
  // Curva de aceleración canónica Cobalt Aerodynamic (A.2.2)
  return [0.16, 1, 0.3, 1];
};

export const AnimatedContent = ({
  children,
  container: _container,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  blur = 0,
  rotate = 0,
  tilt: _tilt = 0,
  wipe: _wipe = 'none',
  threshold = 0.1,
  delay = 0,
  stagger: _stagger = 0,
  staggerFrom: _staggerFrom = 'start',
  trigger = 'scroll',
  once = true,
  scrub: _scrub = false,
  disappearAfter: _disappearAfter = 0,
  disappearDuration: _disappearDuration = 0.5,
  disappearEase: _disappearEase = 'power3.in',
  onStart,
  onComplete,
  onDisappearanceComplete: _onDisappearanceComplete,
  className = '',
  style,
  ...props
}: AnimatedContentProps) => {
  const horizontal = direction === 'horizontal';
  const sign = reverse ? -1 : 1;
  const initialX = horizontal ? distance * sign : 0;
  const initialY = !horizontal ? distance * sign : 0;

  const initialVariant = {
    x: initialX,
    y: initialY,
    scale,
    opacity: animateOpacity ? initialOpacity : 1,
    rotate: rotate ? rotate * sign : 0,
    filter: blur > 0 ? `blur(${blur}px)` : 'blur(0px)'
  };

  const targetVariant = {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    rotate: 0,
    filter: 'blur(0px)'
  };

  const transitionConfig = {
    duration,
    delay: Math.max(delay, 0),
    ease: resolveEase(ease)
  };

  if (trigger === 'scroll') {
    return (
      <motion.div
        initial={initialVariant}
        whileInView={targetVariant}
        viewport={{ once, amount: threshold }}
        transition={transitionConfig}
        onAnimationStart={onStart}
        onAnimationComplete={onComplete}
        className={className}
        style={style}
        {...(props as HTMLMotionProps<'div'>)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={initialVariant}
      animate={targetVariant}
      transition={transitionConfig}
      onAnimationStart={onStart}
      onAnimationComplete={onComplete}
      className={className}
      style={style}
      {...(props as HTMLMotionProps<'div'>)}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContent;
