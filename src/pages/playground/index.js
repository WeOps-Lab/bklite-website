import React, { useState, useEffect } from 'react';

import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import Layout from '@theme/Layout';
import Translate, {translate} from '@docusaurus/Translate';

import MLOpsTab from '@site/src/components/Playground/MLOpsTab';
import OpsPilotTab from '@site/src/components/Playground/OpsPilotTab';

import { verifyLoginCallback, hasToken, redirectToLogin } from '@site/src/lib/playgroundAuth';

import styles from './index.module.css';

export default function DemoPage() {
  const { siteConfig } = useDocusaurusContext();
  const loginBaseUrl = siteConfig.customFields.loginBaseUrl;
  const [activeTab, setActiveTab] = useState('mlops');
  const [callbackErrorMessage, setCallbackErrorMessage] = useState('');

  // 处理登录回调：验证 third_login_code 并自动切换到 MLOps tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('third_login_code')) {
      const isValid = verifyLoginCallback();
      
      if (isValid && hasToken()) {
        setActiveTab('mlops');
        setCallbackErrorMessage('');
        return;
      }

      setCallbackErrorMessage(
        isValid
          ? translate({id: 'playground.error.loginIncomplete', message: '登录未完成，请重新登录后重试。'})
          : translate({id: 'playground.error.loginFailed', message: '登录验证失败，请重新登录后重试。'})
      );
    }
  }, []);

  return (
    <Layout title={translate({id: 'playground.page.title', message: 'AI体验'})}>
      <div className={styles.demoPage}>
        {callbackErrorMessage && (
          <div className={styles.callbackErrorBanner} role="alert">
            <div className={styles.callbackErrorContent}>
              <strong><Translate id="playground.error.title">登录未完成</Translate></strong>
              <span>{callbackErrorMessage}</span>
            </div>
            <button
              type="button"
              className={styles.callbackErrorAction}
              onClick={() => redirectToLogin(loginBaseUrl)}
            >
              <Translate id="playground.button.relogin">重新登录</Translate>
            </button>
          </div>
        )}
        {/* Tab Bar */}
        <div className={styles.tabBar}>
          <div className={styles.tabBarInner}>
            <button
              type="button"
              className={clsx(styles.tabItem, activeTab === 'mlops' && styles.tabItemActive)}
              onClick={() => setActiveTab('mlops')}
            >
              MLOps
            </button>
            <button
              type="button"
              className={clsx(styles.tabItem, activeTab === 'opspilot' && styles.tabItemActive)}
              onClick={() => setActiveTab('opspilot')}
            >
              OpsPilot
            </button>
          </div>
        </div>
        {/* Tab Content */}
        {activeTab === 'mlops' && <MLOpsTab />}
        {activeTab === 'opspilot' && <OpsPilotTab />}
      </div>
    </Layout>
  );
}
