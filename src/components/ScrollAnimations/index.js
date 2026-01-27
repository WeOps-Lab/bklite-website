import React from 'react';
import { motion } from 'framer-motion';

const defaultTransition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94],
};

const defaultViewport = {
  once: true,
  amount: 0.2,
  margin: '-50px',
};

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  className,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({
  children,
  delay = 0,
  duration = 0.6,
  distance = 40,
  className,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInDown({
  children,
  delay = 0,
  duration = 0.6,
  distance = 40,
  className,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInLeft({
  children,
  delay = 0,
  duration = 0.6,
  distance = 40,
  className,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -distance }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInRight({
  children,
  delay = 0,
  duration = 0.6,
  distance = 40,
  className,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: distance }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.6,
  scale = 0.9,
  className,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SlideInUp({
  children,
  delay = 0,
  duration = 0.6,
  distance = 60,
  className,
  ...props
}) {
  return (
    <motion.div
      initial={{ y: distance }}
      whileInView={{ y: 0 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, duration, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  delayChildren = 0,
  className,
  ...props
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  direction = 'up',
  distance = 30,
  ...props
}) {
  const directionVariants = {
    up: { hidden: { opacity: 0, y: distance }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -distance }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -distance }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: distance }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
  };

  return (
    <motion.div
      variants={directionVariants[direction]}
      transition={defaultTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ParallaxScroll({
  children,
  speed = 0.5,
  className,
  ...props
}) {
  return (
    <motion.div
      initial={{ y: 0 }}
      whileInView={{ y: 0 }}
      viewport={{ once: false, amount: 0 }}
      style={{ willChange: 'transform' }}
      transition={{ type: 'tween', ease: 'linear' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function RevealText({
  children,
  delay = 0,
  duration = 0.8,
  className,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={defaultViewport}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function GlowPulse({
  children,
  delay = 0,
  className,
  glowColor = 'rgba(99, 102, 241, 0.4)',
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={defaultViewport}
      transition={{ ...defaultTransition, delay }}
      whileHover={{
        boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
        transition: { duration: 0.3 },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FloatingElement({
  children,
  className,
  amplitude = 10,
  duration = 3,
  ...props
}) {
  return (
    <motion.div
      animate={{
        y: [-amplitude, amplitude, -amplitude],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default {
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  ScaleIn,
  SlideInUp,
  StaggerContainer,
  StaggerItem,
  ParallaxScroll,
  RevealText,
  GlowPulse,
  FloatingElement,
};
