import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
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
                <Translate id="cta.title">立即开始，轻量落地智能运维</Translate>
              </Heading>
            </FadeInUp>
            <FadeInUp delay={0.1}>
              <p className={styles.ctaDescription}>
                <Translate id="cta.description">完整的开源运维能力体系，灵活的模块化架构，AI 驱动的智能决策。快速部署，轻松上手，与社区共同打造下一代运维平台。</Translate>
              </p>
            </FadeInUp>
            <ScaleIn delay={0.2}>
              <div className={styles.ctaButtons}>
                <Link
                  className={clsx(styles.ctaButton, styles.ctaPrimary)}
                  to="https://github.com/TencentBlueKing/bk-lite"
                >
                  ⭐ <Translate id="cta.button.support">支持我们</Translate>
                </Link>
                <button
                  className={clsx(styles.ctaButton, styles.ctaSecondary)}
                  onClick={handleJoinCommunity}
                >
                  🌍 <Translate id="cta.button.community">加入社区</Translate>
                </button>
              </div>
            </ScaleIn>
            <StaggerContainer className={styles.ctaFeatures} staggerDelay={0.1} delayChildren={0.3}>
              <StaggerItem direction="up">
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>⚡</span>
                  <span><Translate id="cta.feature.quickstart">5分钟快速上手</Translate></span>
                </div>
              </StaggerItem>
              <StaggerItem direction="up">
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🛠️</span>
                  <span><Translate id="cta.feature.modular">模块化设计</Translate></span>
                </div>
              </StaggerItem>
              <StaggerItem direction="up">
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🤝</span>
                  <span><Translate id="cta.feature.opensource">开源社区共建</Translate></span>
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
            <h3 className={styles.qrTitle}><Translate id="cta.qr.title">扫码加入社区</Translate></h3>
            <div className={styles.qrImageContainer}>
              <img
                src="/img/community-qrcode.png"
                alt={translate({id: 'cta.qr.alt', message: '社区二维码'})}
                className={styles.qrImage}
              />
            </div>
            <p className={styles.qrDescription}>
              <Translate id="cta.qr.description">扫描二维码加入 BlueKing Lite 开源社区，与开发者们一起交流讨论</Translate>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}