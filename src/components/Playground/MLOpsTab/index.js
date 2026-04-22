import React, { useState, useEffect, useRef, useCallback } from 'react';

import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {translate} from '@docusaurus/Translate';
import {
  FiActivity,
  FiTrendingUp,
  FiFileText,
  FiType,
  FiImage,
  FiTarget,
  FiChevronDown,
  FiLock
} from 'react-icons/fi';

import {
  authFetch,
  getAndClearAuthHint,
  redirectToLogin,
} from '@site/src/lib/playgroundAuth';
import useAuthStateSync from '@site/src/lib/useAuthStateSync';
import AnomalyDetection from '@site/src/components/Playground/scenarios/AnomalyDetection';
import LogClustering from '@site/src/components/Playground/scenarios/LogClustering';
import ImageClassification from '@site/src/components/Playground/scenarios/ImageClassification';
import ObjectDetection from '@site/src/components/Playground/scenarios/ObjectDetection';
import TextClassification from '@site/src/components/Playground/scenarios/TextClassification';
import TimeSeriesPredict from '@site/src/components/Playground/scenarios/TimeSeriesPredict';

import styles from './styles.module.css';

// 场景配置：映射后端 serving 名称
function getScenarioConfig() {
  return {
    'anomaly-detection': {
      name: translate({id: 'playground.mlops.anomaly.name', message: '异常检测'}),
      description: translate({id: 'playground.mlops.anomaly.desc', message: '识别时间序列中的异常波动，帮助快速发现异常峰值、突增或突降。'}),
      guide: translate({id: 'playground.mlops.anomaly.guide', message: '适合监控指标与资源使用率数据，可直接使用示例数据或上传自己的时间序列进行验证。'}),
      icon: FiActivity,
      algorithmType: 'anomaly_detection',
      servingName: 'anomaly_detection_servings'
    },
    'time-series': {
      name: translate({id: 'playground.mlops.time-series.name', message: '时序预测'}),
      description: translate({id: 'playground.mlops.time-series.desc', message: '基于历史趋势预测未来一段时间的数据变化，适合容量与负载趋势预估。'}),
      guide: translate({id: 'playground.mlops.time-series.guide', message: '选择模型后可先用示例数据体验，再通过上传自己的指标数据验证预测效果。'}),
      icon: FiTrendingUp,
      algorithmType: 'timeseries_predict',
      servingName: 'timeseries_predict_servings'
    },
    'log-analysis': {
      name: translate({id: 'playground.mlops.log-analysis.name', message: '日志聚类'}),
      description: translate({id: 'playground.mlops.log-analysis.desc', message: '对日志内容进行聚类与归类，帮助识别相似问题和异常日志模式。'}),
      guide: translate({id: 'playground.mlops.log-analysis.guide', message: '适合批量日志理解与问题归类场景，可直接使用示例日志或上传文本日志进行体验。'}),
      icon: FiFileText,
      algorithmType: 'log_clustering',
      servingName: 'log_clustering_servings'
    },
    'text-classification': {
      name: translate({id: 'playground.mlops.text-classification.name', message: '文本分类'}),
      description: translate({id: 'playground.mlops.text-classification.desc', message: '对文本内容进行自动分类，适合工单、告警说明和文本标签场景。'}),
      guide: translate({id: 'playground.mlops.text-classification.guide', message: '适合标准化文本归类场景，可直接使用示例文本、粘贴批量内容或上传文本文件进行体验。'}),
      icon: FiType,
      algorithmType: 'classification',
      servingName: 'classification_servings'
    },
    'image-classification': {
      name: translate({id: 'playground.mlops.image-classification.name', message: '图片分类'}),
      description: translate({id: 'playground.mlops.image-classification.desc', message: '识别图片所属类别，适合标准化图像识别与自动归类任务。'}),
      guide: translate({id: 'playground.mlops.image-classification.guide', message: '适合单目标图像分类场景，后续将提供图片上传与推理体验。'}),
      icon: FiImage,
      algorithmType: 'image_classification',
      servingName: 'image_classification_servings'
    },
    'object-detection': {
      name: translate({id: 'playground.mlops.object-detection.name', message: '目标检测'}),
      description: translate({id: 'playground.mlops.object-detection.desc', message: '检测图像中的目标位置与类别，适合定位与识别并存的视觉任务。'}),
      guide: translate({id: 'playground.mlops.object-detection.guide', message: '适合图像中多目标定位场景，后续将开放示例图片与检测结果展示。'}),
      icon: FiTarget,
      algorithmType: 'object_detection',
      servingName: 'object_detection_servings'
    }
  };
}

// 场景 key → 组件映射
const scenarioComponents = {
  'anomaly-detection': AnomalyDetection,
  'time-series': TimeSeriesPredict,
  'log-analysis': LogClustering,
  'text-classification': TextClassification,
  'image-classification': ImageClassification,
  'object-detection': ObjectDetection,
};

export default function MLOpsTab() {
  const { siteConfig } = useDocusaurusContext();
  const apiBase = siteConfig.customFields.apiBaseUrl;
  const loginBaseUrl = siteConfig.customFields.loginBaseUrl;
  const scenarioConfig = getScenarioConfig();

  const [selectedScenario, setSelectedScenario] = useState('anomaly-detection');
  const [selectedModel, setSelectedModel] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  // 动态 serving 列表：{ [scenarioKey]: [{ id, name }] }
  const [servings, setServings] = useState({});
  const [servingsLoaded, setServingsLoaded] = useState(false);
  const [servingsLoading, setServingsLoading] = useState(false);
  const [servingsErrorMap, setServingsErrorMap] = useState({});
  const [authExpiredNotice, setAuthExpiredNotice] = useState('');
  const isLoggedIn = useAuthStateSync();

  const modelDropdownRef = useRef(null);

  const preloadAllServings = useCallback(async () => {
    const scenariosToLoad = Object.keys(scenarioConfig);

    setServingsLoading(true);
    setServingsLoaded(false);
    setServingsErrorMap({});
    setSelectedModel('');

    const results = await Promise.allSettled(
      scenariosToLoad.map(async (scenario) => {
        const config = scenarioConfig[scenario];
        const result = await authFetch(
          `${apiBase}/servings/${config.algorithmType}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } },
          { redirectOnMissingToken: false },
        );

        if (!result.ok) {
          return { scenario, authReason: result.reason };
        }

        const json = await result.response.json();
        const items = Array.isArray(json.data) ? json.data : [];
        const list = items
          .filter(item => item.container_info?.state === "running")
          .map(item => ({
            id: item.id,
            name: item.name || "Serving #" + item.id,
            trainJobAlgorithm: item.train_job_algorithm || "",
          }))
          .sort((a, b) => {
            const aId = Number(a.id);
            const bId = Number(b.id);

            if (!Number.isNaN(aId) && !Number.isNaN(bId)) {
              return aId - bId;
            }

            return String(a.id).localeCompare(String(b.id), undefined, {numeric: true, sensitivity: "base"});
          });

        return { scenario, list };
      })
    );

    // If any request hit missing-token or auth-expired, stop the preload
    // and let the existing isLoggedIn effect handle UI reset
    const authFailed = results.some(
      (r) => r.status === 'fulfilled' &&
        (r.value.authReason === 'missing-token' || r.value.authReason === 'auth-expired')
    );

    if (authFailed) {
      setServingsLoading(false);
      return;
    }

    const nextServings = {};
    const nextErrors = {};

    results.forEach((result, index) => {
      const scenario = scenariosToLoad[index];
      if (result.status === 'fulfilled' && result.value.list) {
        nextServings[result.value.scenario] = result.value.list;
      } else {
        const reason = result.status === 'fulfilled'
          ? result.value.authReason
          : result.reason;
        console.error(`获取 ${scenario} serving 列表失败:`, reason);
        nextServings[scenario] = [];
        nextErrors[scenario] = true;
      }
    });

    setServings(nextServings);
    setServingsErrorMap(nextErrors);
    setServingsLoaded(true);
    setServingsLoading(false);
  }, [apiBase]);

  useEffect(() => {
    if (isLoggedIn) {
      setAuthExpiredNotice('');
      preloadAllServings();
      return;
    }

    const authHint = getAndClearAuthHint();
    setAuthExpiredNotice(authHint?.reason === 'auth-expired' ? translate({id: 'playground.mlops.authExpiredMsg', message: '登录已过期，请重新登录后继续体验。'}) : '');

    setServings({});
    setServingsLoaded(false);
    setServingsLoading(false);
    setServingsErrorMap({});
    setSelectedModel('');
  }, [isLoggedIn, preloadAllServings]);

  // 根据 selectedScenario 获取场景组件
  const ScenarioComponent = scenarioComponents[selectedScenario] || null;
  const currentConfig = scenarioConfig[selectedScenario];
  const isComingSoon = currentConfig?.comingSoon;

  // 当前场景的 serving 列表
  const currentServings = servings[selectedScenario] || [];
  const selectedServing = currentServings.find(model => model.id === selectedModel) || null;

  const getScenarioCountText = (scenarioKey) => {
    if (isLoggedIn === false) {
      if (authExpiredNotice) {
        return translate({id: 'playground.mlops.authExpired', message: '登录已过期'});
      }
      return translate({id: 'playground.mlops.loginToView', message: '登录后查看模型'});
    }

    if (isLoggedIn && !servingsLoaded && servingsLoading) {
      return translate({id: 'playground.mlops.loading', message: '加载中...'});
    }

    if (servingsErrorMap[scenarioKey]) {
      return translate({id: 'playground.mlops.loadFailed', message: '加载失败'});
    }

    if (servingsLoaded) {
      return translate({id: 'playground.mlops.modelsAvailable', message: '{count} 个模型可用'}, {count: servings[scenarioKey].length});
    }

    return translate({id: 'playground.mlops.noModels', message: '0 个模型可用'});
  };

  useEffect(() => {
    if (isLoggedIn === false || isComingSoon) {
      setSelectedModel('');
      setModelDropdownOpen(false);
      return;
    }

    setSelectedModel(currentServings[0]?.id || '');
    setModelDropdownOpen(false);
  }, [currentServings, isComingSoon, isLoggedIn]);

  // Close model dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.mlopsTab}>
      <div className={styles.contentWrapper}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>{translate({id: 'playground.mlops.sidebar.title', message: '应用场景'})}</h2>
          </div>
          <div className={styles.scenarioList}>
            {Object.entries(scenarioConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  type="button"
                  className={clsx(styles.scenarioItem, selectedScenario === key && styles.selected)}
                  onClick={() => {
                    setSelectedScenario(key);
                  }}
                >
                  <div className={styles.scenarioItemIcon}>
                    <Icon />
                  </div>
                  <div className={styles.scenarioItemInfo}>
                    <div className={styles.scenarioItemName}>{config.name}</div>
                    <div className={styles.scenarioItemCount}>{getScenarioCountText(key)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.inferenceCard}>
            <div className={styles.inferenceHeader}>
              <div className={styles.inferenceHeaderLeft}>
                <h2>{currentConfig?.name || translate({id: 'playground.mlops.selectScene', message: '请选择场景'})}</h2>
                <p>{currentConfig?.description || translate({id: 'playground.mlops.selectSceneHint', message: '从左侧选择一个场景后开始体验。'})}</p>
              </div>
            </div>

            <div className={styles.inferenceBody}>
              {/* Model Selection — 仅非 comingSoon 场景显示 */}
              {!isComingSoon && (
              <div className={styles.formGroup}>
                <div className={styles.formLabel}>{translate({id: 'playground.mlops.selectModel', message: '选择模型'})}</div>
                {isLoggedIn === false ? (
                  <button type="button" className={styles.loginHint} onClick={() => redirectToLogin(loginBaseUrl)}>
                    <FiLock />
                    <span>{authExpiredNotice || translate({id: 'playground.mlops.loginFirst', message: '请先登录后选择模型'})}</span>
                  </button>
                ) : (isLoggedIn && !servingsLoaded && servingsLoading) ? (
                  <div className={styles.selectTrigger} style={{ cursor: 'wait' }}>
                    <span className={styles.selectValue}>{translate({id: 'playground.mlops.loadingModels', message: '加载模型列表中...'})}</span>
                  </div>
                ) : (
                  <div className={styles.customSelect} ref={modelDropdownRef}>
                    <button
                      type="button"
                      className={clsx(styles.selectTrigger, modelDropdownOpen && styles.selectOpen, !currentServings.length && styles.selectDisabled)}
                      onClick={() => currentServings.length && setModelDropdownOpen(!modelDropdownOpen)}
                      disabled={!currentServings.length}
                    >
                      <span className={styles.selectValue}>
                        {selectedModel
                          ? selectedServing?.name || `Serving #${selectedModel}`
                          : currentServings.length ? translate({id: 'playground.mlops.pickModel', message: '请选择模型'}) : translate({id: 'playground.mlops.noModelAvailable', message: '当前场景无可用模型'})}
                      </span>
                      <FiChevronDown className={clsx(styles.selectArrow, modelDropdownOpen && styles.selectArrowUp)} />
                    </button>
                    {modelDropdownOpen && currentServings.length > 0 && (
                      <ul className={styles.selectDropdown}>
                        {currentServings.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              className={clsx(styles.selectOption, selectedModel === m.id && styles.selectOptionActive)}
                              onClick={() => {
                                setSelectedModel(m.id);
                                setModelDropdownOpen(false);
                              }}
                            >
                              <span className={styles.selectOptionContent}>
                                <span className={styles.selectOptionName}>{m.name}</span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
              )}
              </div>
              )}

              {/* 场景组件 */}
              {ScenarioComponent && (
                <div className={clsx(styles.lockedContent, isLoggedIn === false && styles.lockedContentActive)}>
                  <div className={styles.lockedContentInner}>
                    <ScenarioComponent
                      apiBase={apiBase}
                      loginBaseUrl={loginBaseUrl}
                      isLoggedIn={isLoggedIn}
                      selectedModel={selectedModel}
                      selectedModelAlgorithm={selectedServing?.trainJobAlgorithm || ''}
                      scenarioConfig={scenarioConfig[selectedScenario]}
                    />
                  </div>

                  {isLoggedIn === false && !isComingSoon && (
                    <div className={styles.lockedOverlay}>
                      <div className={styles.lockedOverlayCard}>
                        <div className={styles.lockedOverlayIcon}>
                          <FiLock />
                        </div>
                        <div className={styles.lockedOverlayText}>
                          <strong>{authExpiredNotice ? translate({id: 'playground.mlops.authExpired', message: '登录已过期'}) : translate({id: 'playground.mlops.unlockExperience', message: '登录后解锁模型体验'})}</strong>
                          <span>
                            {authExpiredNotice || translate({id: 'playground.mlops.unlockDesc', message: '选择模型后可使用示例数据、上传数据并开始在线推理。'})}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.lockedOverlayButton}
                          onClick={() => redirectToLogin(loginBaseUrl)}
                        >
                          {translate({id: 'playground.mlops.loginNow', message: '立即登录'})}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
