import React, { useRef, useState, useCallback, useEffect } from 'react';
import styles from './styles.module.css';

// Performance optimization: Using native CSS transforms instead of framer-motion springs
// to reduce overhead when many TiltCard instances are rendered simultaneously.
// Key techniques: RAF-throttled mouse events, CSS custom properties for glow effect.

export function TiltCard({
  children,
  className,
  tiltAmount = 10,
  glowColor = 'rgba(99, 102, 241, 0.3)',
  scale = 1.02,
  perspective = 1000,
  ...props
}) {
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const transformRef = useRef({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 });

  const applyTransform = useCallback(() => {
    if (!cardRef.current) return;
    
    const { rotateX, rotateY, glowX, glowY } = transformRef.current;
    const currentScale = isHovered ? scale : 1;
    
    cardRef.current.style.transform = 
      `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${currentScale})`;
    cardRef.current.style.setProperty('--glow-x', `${glowX}%`);
    cardRef.current.style.setProperty('--glow-y', `${glowY}%`);
  }, [perspective, scale, isHovered]);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -tiltAmount;
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * tiltAmount;
      const glowX = ((e.clientX - rect.left) / rect.width) * 100;
      const glowY = ((e.clientY - rect.top) / rect.height) * 100;

      transformRef.current = { rotateX, rotateY, glowX, glowY };
      applyTransform();
    });
  }, [tiltAmount, applyTransform]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    transformRef.current = { rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 };
    
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
      cardRef.current.style.setProperty('--glow-x', '50%');
      cardRef.current.style.setProperty('--glow-y', '50%');
    }
  }, [perspective]);

  useEffect(() => {
    applyTransform();
  }, [isHovered, applyTransform]);

  return (
    <div
      ref={cardRef}
      className={`${styles.tiltCard} ${className || ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ '--glow-color': glowColor }}
      {...props}
    >
      {children}
      <div 
        className={styles.glowEffect}
        style={{ opacity: isHovered ? 1 : 0 }}
      />
    </div>
  );
}

export function TiltCardSimple({
  children,
  className,
  tiltAmount = 8,
  scale = 1.03,
  ...props
}) {
  const cardRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -tiltAmount;
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * tiltAmount;

      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    });
  }, [tiltAmount, scale]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className={`${styles.tiltCardSimple} ${className || ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
}

export default TiltCard;
