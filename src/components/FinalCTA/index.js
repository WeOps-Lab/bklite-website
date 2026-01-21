import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import { FadeInUp, ScaleIn, StaggerContainer, StaggerItem } from '@site/src/components/ScrollAnimations';
import styles from './styles.module.css';

export default function FinalCTA() {
  const [showQRCode, setShowQRCode] = useState(false);

  const handleJoinCommunity = (e) => {
    e.preventDefault();
    setShowQRCode(true);
  };

  const closeQRCode = () => {
    setShowQRCode(false);
  };

  return (
    <section className={styles.finalCTA}>
      <div className="container">
        <div className={styles.ctaContainer}>
          <div className={styles.ctaContent}>
            <FadeInUp>
              <Heading as="h2" className={styles.ctaTitle}>
                立即开始，轻量落地智能运维
              </Heading>
            </FadeInUp>
            <FadeInUp delay={0.1}>
              <p className={styles.ctaDescription}>
                完整的开源运维能力体系，灵活的模块化架构，AI 驱动的智能决策。快速部署，轻松上手，与社区共同打造下一代运维平台。
              </p>
            </FadeInUp>
            <ScaleIn delay={0.2}>
              <div className={styles.ctaButtons}>
                <Link
                  className={clsx(styles.ctaButton, styles.ctaPrimary)}
                  to="https://github.com/TencentBlueKing/bk-lite"
                >
                  ⭐ 支持我们
                </Link>
                <button
                  className={clsx(styles.ctaButton, styles.ctaSecondary)}
                  onClick={handleJoinCommunity}
                >
                  🌍 加入社区
                </button>
              </div>
            </ScaleIn>
            <StaggerContainer className={styles.ctaFeatures} staggerDelay={0.1} delayChildren={0.3}>
              <StaggerItem direction="up">
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>⚡</span>
                  <span>5分钟快速上手</span>
                </div>
              </StaggerItem>
              <StaggerItem direction="up">
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🛠️</span>
                  <span>模块化设计</span>
                </div>
              </StaggerItem>
              <StaggerItem direction="up">
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🤝</span>
                  <span>开源社区共建</span>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </div>

      {showQRCode && (
        <div className={styles.qrModal} onClick={closeQRCode}>
          <div className={styles.qrModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeQRCode}>
              ×
            </button>
            <h3 className={styles.qrTitle}>扫码加入社区</h3>
            <div className={styles.qrImageContainer}>
              <img
                src="/img/community-qrcode.png"
                alt="社区二维码"
                className={styles.qrImage}
              />
            </div>
            <p className={styles.qrDescription}>
              扫描二维码加入 BlueKing Lite 开源社区，与开发者们一起交流讨论
            </p>
          </div>
        </div>
      )}
    </section>
  );
}