import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './styles.module.css';

export function FlowingGradient({ className, colors, speed = 8 }) {
  const defaultColors = [
    'rgba(59, 130, 246, 0.15)',
    'rgba(99, 102, 241, 0.12)',
    'rgba(139, 92, 246, 0.10)',
    'rgba(59, 130, 246, 0.15)',
  ];

  const gradientColors = colors || defaultColors;

  return (
    <div className={`${styles.flowingGradient} ${className || ''}`}>
      <motion.div
        className={styles.gradientLayer}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background: `linear-gradient(90deg, ${gradientColors.join(', ')})`,
          backgroundSize: '200% 200%',
        }}
      />
    </div>
  );
}

export function FloatingOrbs({ count = 6, className }) {
  const orbs = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 60 + Math.random() * 100,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * -20,
  }));

  return (
    <div className={`${styles.orbsContainer} ${className || ''}`}>
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className={styles.orb}
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
            opacity: [0.3, 0.5, 0.35, 0.45, 0.3],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}

export function GridPattern({ className, opacity = 0.03 }) {
  return (
    <div
      className={`${styles.gridPattern} ${className || ''}`}
      style={{ '--grid-opacity': opacity }}
    />
  );
}

export function ParticleField({ count = 30, className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const createParticles = () => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      }));
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(drawParticles);
    };

    resize();
    createParticles();
    drawParticles();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.particleCanvas} ${className || ''}`}
    />
  );
}

export function AuroraBackground({ className }) {
  return (
    <div className={`${styles.auroraContainer} ${className || ''}`}>
      <motion.div
        className={styles.aurora1}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className={styles.aurora2}
        animate={{
          x: [0, -80, 60, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className={styles.aurora3}
        animate={{
          x: [0, 50, -70, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

export default {
  FlowingGradient,
  FloatingOrbs,
  GridPattern,
  ParticleField,
  AuroraBackground,
};
