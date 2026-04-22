import React, { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { FiAlertTriangle, FiCheck, FiImage, FiPlay, FiUploadCloud } from 'react-icons/fi';
import {translate} from '@docusaurus/Translate';

import { authFetch } from '@site/src/lib/playgroundAuth';

import styles from './index.module.css';

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

function formatPercent(value) {
  return Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(1)}%` : '--';
}

function formatMs(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}ms` : '-';
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result || ''));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function normalizeResponse(json) {
  const root = json?.data || json || {};
  const first = Array.isArray(root.results) ? (root.results[0] || {}) : {};
  const raw = Array.isArray(first.predictions)
    ? first.predictions
    : Array.isArray(root.predictions)
      ? root.predictions
      : [];

  return {
    success: Boolean((json?.success ?? root.success ?? true) && (first.success ?? true)),
    error: first.error || root.error?.message || root.error || '',
    metadata: root.metadata || json?.metadata || {},
    prediction: raw.length ? {
      id: Number.isFinite(Number(raw[0]?.class_id)) ? Number(raw[0].class_id) : 0,
      name: raw[0]?.class_name || raw[0]?.label || raw[0]?.prediction || '未知类别',
      confidence: Number(raw[0]?.confidence ?? raw[0]?.score ?? raw[0]?.probability),
    } : null,
  };
}

export default function ImageClassification({ apiBase, loginBaseUrl, selectedModel, scenarioConfig }) {
  const [mode, setMode] = useState('sample');
  const [uploadPayload, setUploadPayload] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const payload = mode === 'upload' ? uploadPayload : '';
  const preview = mode === 'upload' ? uploadPayload : '';
  const previewLabel = mode === 'upload' ? (uploadName || '上传图片') : '示例图片';
  const hasPreview = mode === 'upload' ? Boolean(uploadPayload) : false;

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!acceptedTypes.includes(file.type)) {
      setUploadError('仅支持 JPG、PNG、WEBP、BMP 图片');
      return;
    }

    try {
      setUploadPayload(await readAsDataUrl(file));
      setUploadName(file.name);
      setUploadError('');
      setFormError('');
      setResult(null);
    } catch {
      setUploadError('图片读取失败');
    }
  };

  const handleRun = async () => {
    if (!selectedModel) {
      setFormError('请选择一个模型');
      return;
    }
    if (mode === 'sample') {
      setFormError('暂无示例图片，请切换到上传图片后再进行识别');
      return;
    }
    if (mode === 'upload' && !uploadPayload) {
      setUploadError('请先上传图片');
      return;
    }

    setLoading(true);
    setFormError('');
    setResult(null);

    try {
      const response = await authFetch(
        `${apiBase}/predict/${scenarioConfig.algorithmType}/${selectedModel}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: [payload], config: { top_k: 1 } }),
        },
        { redirectOnMissingToken: true, loginBaseUrl },
      );

      if (response.reason === 'missing-token') {
        return;
      }
      if (response.reason === 'auth-expired') {
        setFormError('登录已过期，请重新登录后重试');
        return;
      }
      if (response.reason === 'http-error') {
        throw new Error(`推理请求失败: ${response.status}`);
      }
      if (response.reason === 'network-error') {
        throw (response.error || new Error('网络请求失败'));
      }

      const normalized = normalizeResponse(await response.response.json());
      if (!normalized.success) {
        setFormError(normalized.error || '图片分类失败，请稍后重试');
        return;
      }

      setResult(normalized);
    } catch (error) {
      setFormError(`推理失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>数据源</div>
      <div className={styles.dataSourceTabs}>
        <button type="button" className={clsx(styles.dataSourceTab, mode === 'sample' && styles.dataSourceTabActive)} onClick={() => { setMode('sample'); setResult(null); setFormError(''); }}>
          示例图片
        </button>
        <button type="button" className={clsx(styles.dataSourceTab, mode === 'upload' && styles.dataSourceTabActive)} onClick={() => { setMode('upload'); setResult(null); setFormError(''); }}>
          上传图片
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/bmp" style={{ display: 'none' }} onChange={handleUpload} />

      {uploadError ? <div className={styles.error}><FiAlertTriangle />{uploadError}</div> : null}
      {formError ? <div className={styles.error}><FiAlertTriangle />{formError}</div> : null}

      <div className={styles.card}>
        <div className={styles.layout}>
          <div className={styles.leftPane}>
            {mode === 'upload' && !uploadPayload ? (
              <div className={clsx(styles.uploadPanel, uploadError && styles.uploadPanelError)}>
                <button type="button" className={styles.uploadPanelTrigger} onClick={() => inputRef.current?.click()}>
                  <span className={styles.uploadPanelIcon}><FiUploadCloud /></span>
                  <span className={styles.uploadPanelTitle}>上传待识别图片</span>
                  <span className={styles.uploadPanelHint}>支持 JPG、PNG、WEBP、BMP。上传后会在这里展示原图，并在识别完成后展示分类结果。</span>
                </button>
              </div>
            ) : (
              <div className={styles.previewCard}>
                {result?.prediction ? (
                  <div className={styles.resultHeader}>
                    <div className={styles.resultHeaderMain}>
                      <span className={styles.resultIndicator} aria-hidden="true">
                        <FiCheck />
                      </span>
                      <span className={styles.resultHeaderTitle}>{previewLabel}</span>
                    </div>
                    <div className={styles.resultHeaderActions}>
                      {mode === 'upload' && uploadPayload ? <button type="button" className={clsx(styles.resultAction, styles.resultActionSubtle)} onClick={() => inputRef.current?.click()}>重新上传</button> : null}
                      <span className={styles.resultStatus}><FiCheck /> 识别完成</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.previewHeader}>
                    <div className={styles.previewTitle}><FiImage /> {previewLabel}</div>
                    {mode === 'upload' && uploadPayload ? <button type="button" className={styles.subbtn} onClick={() => inputRef.current?.click()}>重新上传</button> : null}
                  </div>
                )}
                <div className={styles.previewFrame}>
                  {mode === 'sample' ? (
                    <div className={styles.samplePlaceholder}>
                      <div className={styles.samplePlaceholderTitle}>暂无示例</div>
                      <div className={styles.samplePlaceholderDesc}>当前场景暂未提供示例图片，请切换到上传图片后体验分类能力。</div>
                    </div>
                  ) : hasPreview ? <img src={preview} alt="preview" className={styles.img} /> : null}
                </div>
                {result?.prediction ? (
                  <div className={styles.resultSummary}>
                    <div className={clsx(styles.resultStat, styles.resultStatPrimary)}>
                      <span className={styles.resultStatLabel}>识别类别</span>
                      <span className={styles.resultStatValue}>{result.prediction.name}</span>
                    </div>
                    <div className={styles.resultStat}>
                      <span className={styles.resultStatLabel}>置信度</span>
                      <span className={styles.resultStatValue}>{formatPercent(result.prediction.confidence)}</span>
                    </div>
                    <div className={styles.resultStat}>
                      <span className={styles.resultStatLabel}>推理耗时</span>
                      <span className={styles.resultStatValue}>{formatMs(result.metadata?.total_time_ms)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      
        <button type="button" className={styles.run} disabled={loading || !selectedModel || !payload} onClick={handleRun}>
          <FiPlay /> 识别这张图片
        </button>
      
        {loading ? <div className={styles.loading}>图片分类中...</div> : null}
      </div>
    </div>
  );
}
