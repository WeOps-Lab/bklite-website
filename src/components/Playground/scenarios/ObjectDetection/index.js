import React, { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { FiAlertTriangle, FiCheck, FiImage, FiPlay, FiSliders, FiTarget, FiUploadCloud } from 'react-icons/fi';
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

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value), min), max);
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
  const raw = Array.isArray(first.detections)
    ? first.detections
    : Array.isArray(root.detections)
      ? root.detections
      : [];

  return {
    success: Boolean((json?.success ?? root.success ?? true) && (first.success ?? true)),
    error: first.error || root.error?.message || root.error || '',
    metadata: root.metadata || json?.metadata || {},
    detections: raw
      .map((item, index) => ({
        id: `${item?.class_id ?? index}-${index}`,
        classId: Number.isFinite(Number(item?.class_id)) ? Number(item.class_id) : index,
        className: item?.class_name || item?.label || `${translate({id: 'objectDetection.targetPrefix', message: '目标'})} ${index + 1}`,
        confidence: Number(item?.confidence ?? item?.score ?? item?.probability),
        bbox: {
          x1: Number(item?.bbox?.x1 ?? 0),
          y1: Number(item?.bbox?.y1 ?? 0),
          x2: Number(item?.bbox?.x2 ?? 0),
          y2: Number(item?.bbox?.y2 ?? 0),
        },
      }))
      .sort((a, b) => Number(b.confidence || -1) - Number(a.confidence || -1)),
  };
}

function getBoxStyle(bbox) {
  return {
    left: `${clamp(bbox.x1 * 100, 0, 100)}%`,
    top: `${clamp(bbox.y1 * 100, 0, 100)}%`,
    width: `${clamp((bbox.x2 - bbox.x1) * 100, 0, 100)}%`,
    height: `${clamp((bbox.y2 - bbox.y1) * 100, 0, 100)}%`,
  };
}

export default function ObjectDetection({ apiBase, loginBaseUrl, selectedModel, scenarioConfig }) {
  const [mode, setMode] = useState('sample');
  const [uploadPayload, setUploadPayload] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [conf, setConf] = useState(0.25);
  const [iou, setIou] = useState(0.45);
  const [maxDetections, setMaxDetections] = useState(20);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!settingsOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [settingsOpen]);

  const payload = mode === 'upload' ? uploadPayload : '';
  const preview = mode === 'upload' ? uploadPayload : '';
  const previewLabel = mode === 'upload' ? (uploadName || translate({id: 'objectDetection.uploadImage', message: '上传图片'})) : translate({id: 'objectDetection.sampleImage', message: '示例图片'});
  const hasPreview = mode === 'upload' ? Boolean(uploadPayload) : false;
  const visibleResult = result;
  const isUploadEmpty = mode === 'upload' && !uploadPayload && !visibleResult;
  const detectionCount = visibleResult?.detections.length ?? 0;
  const topConfidence = visibleResult ? Math.max(...visibleResult.detections.map((item) => Number(item.confidence || 0))) : null;

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!acceptedTypes.includes(file.type)) {
      setUploadError(translate({id: 'objectDetection.error.unsupportedFormat', message: '仅支持 JPG、PNG、WEBP、BMP 图片'}));
      return;
    }

    try {
      setUploadPayload(await readAsDataUrl(file));
      setUploadName(file.name);
      setUploadError('');
      setFormError('');
      setResult(null);
      setSettingsOpen(false);
    } catch {
      setUploadError(translate({id: 'objectDetection.error.readFailed', message: '图片读取失败'}));
    }
  };

  const renderSettingsTrigger = () => (
    <div ref={settingsRef} className={styles.settingsWrap}>
      <button
        type="button"
        className={styles.resultAction}
        onClick={() => setSettingsOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={settingsOpen}
      >
        <FiSliders /> {translate({id: 'objectDetection.paramSettings', message: '参数设置'})}
      </button>
      {settingsOpen ? (
        <div className={styles.settingsPopover} role="dialog" aria-label={translate({id: 'objectDetection.detectionParamSettings', message: '检测参数设置'})}>
          <div className={styles.settingsPopoverHeader}>
            <div className={styles.settingsPopoverTitle}>{translate({id: 'objectDetection.detectionParams', message: '检测参数'})}</div>
            <div className={styles.settingsPopoverHint}>{translate({id: 'objectDetection.paramHint', message: '调整框选严格程度与输出数量'})}</div>
          </div>
          <div className={styles.settingsPopoverFields}>
            <label className={styles.popoverField}>
              <div className={styles.popoverFieldTop}>
                <span className={styles.popoverFieldLabel}>{translate({id: 'objectDetection.confidence', message: '置信度'})}</span>
                <strong className={styles.popoverFieldValue}>{conf.toFixed(2)}</strong>
              </div>
              <input type="range" min="0.05" max="1" step="0.05" value={conf} onChange={(e) => setConf(Number(e.target.value))} />
            </label>
            <label className={styles.popoverField}>
              <div className={styles.popoverFieldTop}>
                <span className={styles.popoverFieldLabel}>IoU</span>
                <strong className={styles.popoverFieldValue}>{iou.toFixed(2)}</strong>
              </div>
              <input type="range" min="0.05" max="1" step="0.05" value={iou} onChange={(e) => setIou(Number(e.target.value))} />
            </label>
            <label className={styles.popoverField}>
              <div className={styles.popoverFieldTop}>
                <span className={styles.popoverFieldLabel}>{translate({id: 'objectDetection.maxTargets', message: '最大目标数'})}</span>
                <strong className={styles.popoverFieldValue}>{maxDetections}</strong>
              </div>
              <input type="number" min="1" max="300" value={maxDetections} onChange={(e) => setMaxDetections(clamp(e.target.value || 1, 1, 300))} />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );

  const handleRun = async () => {
    if (!selectedModel) {
      setFormError(translate({id: 'objectDetection.error.selectModel', message: '请选择一个模型'}));
      return;
    }
    if (mode === 'sample') {
      setFormError(translate({id: 'objectDetection.error.noSampleSwitch', message: '暂无示例图片，请切换到上传图片后再进行检测'}));
      return;
    }
    if (mode === 'upload' && !uploadPayload) {
      setUploadError(translate({id: 'objectDetection.error.uploadFirst', message: '请先上传图片'}));
      return;
    }

    setLoading(true);
    setFormError('');
    setResult(null);
    setSettingsOpen(false);

    try {
      const response = await authFetch(
        `${apiBase}/predict/${scenarioConfig.algorithmType}/${selectedModel}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: [payload],
            config: {
              conf_threshold: conf,
              iou_threshold: iou,
              max_detections: maxDetections,
            },
          }),
        },
        { redirectOnMissingToken: true, loginBaseUrl },
      );

      if (response.reason === 'missing-token') {
        return;
      }
      if (response.reason === 'auth-expired') {
        setFormError(translate({id: 'objectDetection.error.authExpired', message: '登录已过期，请重新登录后重试'}));
        return;
      }
      if (response.reason === 'http-error') {
        throw new Error(`${translate({id: 'objectDetection.error.inferenceRequestFailed', message: '推理请求失败'})}: ${response.status}`);
      }
      if (response.reason === 'network-error') {
        throw (response.error || new Error(translate({id: 'objectDetection.error.networkFailed', message: '网络请求失败'})));
      }

      const normalized = normalizeResponse(await response.response.json());
      if (!normalized.success) {
        setFormError(normalized.error || translate({id: 'objectDetection.error.detectFailed', message: '目标检测失败，请稍后重试'}));
        return;
      }

      setResult(normalized);
    } catch (error) {
      setFormError(`${translate({id: 'objectDetection.error.inferenceFailed', message: '推理失败'})}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>{translate({id: 'objectDetection.dataSource', message: '数据源'})}</div>
      <div className={styles.dataSourceTabs}>
        <button type="button" className={clsx(styles.dataSourceTab, mode === 'sample' && styles.dataSourceTabActive)} onClick={() => { setMode('sample'); setResult(null); setFormError(''); setSettingsOpen(false); }}>
          {translate({id: 'objectDetection.sampleImage', message: '示例图片'})}
        </button>
        <button type="button" className={clsx(styles.dataSourceTab, mode === 'upload' && styles.dataSourceTabActive)} onClick={() => { setMode('upload'); setResult(null); setFormError(''); setSettingsOpen(false); }}>
          {translate({id: 'objectDetection.uploadImage', message: '上传图片'})}
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/bmp" style={{ display: 'none' }} onChange={handleUpload} />

      {uploadError ? <div className={styles.error}><FiAlertTriangle />{uploadError}</div> : null}
      {formError ? <div className={styles.error}><FiAlertTriangle />{formError}</div> : null}

      <div className={styles.card}>
        <div>
          <div className={clsx(styles.leftPane, isUploadEmpty && styles.leftPaneUploadEmpty)}>
            {isUploadEmpty ? (
              <div className={clsx(styles.uploadPanel, uploadError && styles.uploadPanelError)}>
                <button type="button" className={styles.uploadPanelTrigger} onClick={() => inputRef.current?.click()}>
                  <span className={styles.uploadPanelIcon}><FiUploadCloud /></span>
                  <span className={styles.uploadPanelTitle}>{translate({id: 'objectDetection.uploadPanelTitle', message: '上传待检测图片'})}</span>
                  <span className={styles.uploadPanelHint}>{translate({id: 'objectDetection.uploadPanelHint', message: '支持 JPG、PNG、WEBP、BMP。上传后会在这里展示原图，并在检测完成后叠加框选结果。'})}</span>
                </button>
              </div>
            ) : (
              <div>
              {visibleResult ? (
                <div className={styles.resultHeader}>
                  <div className={styles.resultHeaderMain}>
                    <span className={styles.resultIndicator} aria-hidden="true">
                      <FiTarget />
                    </span>
                    <span className={styles.resultHeaderTitle}>{previewLabel}</span>
                  </div>
                  <div className={styles.resultHeaderActions}>
                    {renderSettingsTrigger()}
                    {mode === 'upload' && uploadPayload ? <button type="button" className={clsx(styles.resultAction, styles.resultActionSubtle)} onClick={() => inputRef.current?.click()}>{translate({id: 'objectDetection.reupload', message: '重新上传'})}</button> : null}
                    <span className={styles.resultStatus}><FiCheck /> {translate({id: 'objectDetection.detectionDone', message: '检测完成'})}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.previewHeader}>
                  <div className={styles.previewTitle}><FiImage /> {previewLabel}</div>
                  <div className={styles.resultHeaderActions}>
                    {renderSettingsTrigger()}
                    {mode === 'upload' && uploadPayload ? <button type="button" className={styles.subbtn} onClick={() => inputRef.current?.click()}>{translate({id: 'objectDetection.reupload', message: '重新上传'})}</button> : null}
                  </div>
                </div>
              )}
              <div className={styles.previewFrame}>
                {mode === 'sample' ? (
                  <div className={styles.samplePlaceholder}>
                    <div className={styles.samplePlaceholderTitle}>{translate({id: 'objectDetection.noSampleTitle', message: '暂无示例'})}</div>
                    <div className={styles.samplePlaceholderDesc}>{translate({id: 'objectDetection.noSampleDesc', message: '当前场景暂未提供示例图片，请切换到上传图片后体验目标检测能力。'})}</div>
                  </div>
                ) : hasPreview ? (
                  <>
                    <img src={preview} alt={translate({id: "objectDetection.previewAlt", message: "预览图片"})} className={styles.img} />
                    {visibleResult ? (
                      <div className={styles.overlay}>
                        {visibleResult.detections.map((item, index) => (
                          <div key={`${item.id}-${index}`} className={styles.box} style={getBoxStyle(item.bbox)}>
                            <span>{item.className} · {formatPercent(item.confidence)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
              {visibleResult ? (
                <div className={styles.resultSummary}>
                  <div className={styles.resultStat}>
                    <span className={styles.resultStatLabel}>{translate({id: 'objectDetection.detectedTargets', message: '识别目标数'})}</span>
                    <span className={styles.resultStatValue}>{detectionCount}</span>
                  </div>
                  <div className={styles.resultStat}>
                    <span className={styles.resultStatLabel}>{translate({id: 'objectDetection.topConfidence', message: '最高识别置信度'})}</span>
                    <span className={styles.resultStatValue}>{formatPercent(topConfidence)}</span>
                  </div>
                  <div className={styles.resultStat}>
                    <span className={styles.resultStatLabel}>{translate({id: 'objectDetection.inferenceTime', message: '推理耗时'})}</span>
                    <span className={styles.resultStatValue}>{formatMs(visibleResult.metadata?.total_time_ms)}</span>
                  </div>
                </div>
              ) : null}
              </div>
            )}
          </div>

        </div>

        <button type="button" className={styles.run} disabled={loading || !selectedModel || !payload} onClick={handleRun}>
          <FiPlay /> {translate({id: 'objectDetection.runButton', message: '检测这张图片'})}
        </button>

        {loading ? <div className={styles.loading}>{translate({id: 'objectDetection.loading', message: '目标检测中...'})}</div> : null}
      </div>    </div>
  );
}
