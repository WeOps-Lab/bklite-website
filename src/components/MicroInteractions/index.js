import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import styles from './styles.module.css';

export function MagneticButton({
  children,
  className,
  strength = 0.3,
  radius = 150,
  ...props
}) {
  const buttonRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    if (distance < radius) {
      const factor = 1 - distance / radius;
      x.set(distX * strength * factor);
      y.set(distY * strength * factor);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      className={`${styles.magneticButton} ${className || ''}`}
      style={{ x: xSpring, y: ySpring }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function RippleButton({
  children,
  className,
  rippleColor = 'rgba(255, 255, 255, 0.4)',
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <button
      className={`${styles.rippleButton} ${className || ''}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      <span className={styles.rippleContainer}>
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={styles.ripple}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              background: rippleColor,
            }}
          />
        ))}
      </span>
    </button>
  );
}

export function HoverGlow({
  children,
  className,
  glowColor = 'rgba(99, 102, 241, 0.5)',
  glowSize = 100,
  ...props
}) {
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.hoverGlow} ${className || ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
      <div
        className={styles.glowOverlay}
        style={{
          background: `radial-gradient(circle ${glowSize}px at ${position.x}% ${position.y}%, ${glowColor}, transparent)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
    </div>
  );
}

export function PulseIcon({
  children,
  className,
  pulseColor = 'rgba(99, 102, 241, 0.4)',
  ...props
}) {
  return (
    <div className={`${styles.pulseIcon} ${className || ''}`} {...props}>
      {children}
      <span
        className={styles.pulse}
        style={{ '--pulse-color': pulseColor }}
      />
      <span
        className={styles.pulse}
        style={{ '--pulse-color': pulseColor, animationDelay: '0.5s' }}
      />
    </div>
  );
}

export function BouncyHover({
  children,
  className,
  scale = 1.05,
  ...props
}) {
  return (
    <motion.div
      className={className}
      whileHover={{
        scale,
        transition: { type: 'spring', stiffness: 400, damping: 10 },
      }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ShineEffect({
  children,
  className,
  ...props
}) {
  return (
    <div className={`${styles.shineEffect} ${className || ''}`} {...props}>
      {children}
      <div className={styles.shine} />
    </div>
  );
}

export function TextReveal({
  text,
  className,
  delay = 0,
  staggerDelay = 0.03,
  ...props
}) {
  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <motion.span
      className={`${styles.textReveal} ${className || ''}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      {...props}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={wordVariants} className={styles.word}>
          {word}&nbsp;
        </motion.span>
      ))}
    </motion.span>
  );
}

export default {
  MagneticButton,
  RippleButton,
  HoverGlow,
  PulseIcon,
  BouncyHover,
  ShineEffect,
  TextReveal,
};
