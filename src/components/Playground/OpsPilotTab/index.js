import React from 'react';
import Translate from '@docusaurus/Translate';

import styles from './styles.module.css';

export default function OpsPilotTab() {
  return (
    <div className={styles.opsPilotTab}>
      <div className={styles.placeholderWrap}>
        <div className={styles.placeholderCard}>
          <div className={styles.placeholderBadge}>OpsPilot</div>
          <h2 className={styles.placeholderTitle}><Translate id="playground.opspilot.title">敬请期待</Translate></h2>
          <p className={styles.placeholderDescription}>
            <Translate id="playground.opspilot.description">OpsPilot AI 场景体验正在完善中，后续将开放更完整的智能运维能力展示。</Translate>
          </p>
        </div>
      </div>
    </div>
  );
}
