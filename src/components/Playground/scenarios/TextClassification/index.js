import React, { useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import {
  FiAlertTriangle,
  FiCheck,
  FiDownload,
  FiFileText,
  FiPlay,
  FiType,
  FiUploadCloud,
} from 'react-icons/fi';

import { authFetch } from '@site/src/lib/playgroundAuth';

import styles from './index.module.css';

const defaultSampleDataUrl = new URL('./sample-data/default.txt', import.meta.url).href;
const MAX_BATCH_SIZE = 1000;
const MAX_TEXT_LENGTH = 5000;
const PREVIEW_COUNT = 20;
const RESULTS_PAGE_SIZE = 10;

function clampPage(page, totalPages) {
  if (!totalPages) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

function LoadingOverlay() {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingOverlayContent}>
        <div className={styles.loadingSpinner}></div>
        <span>模型推理中...</span>
      </div>
    </div>
  );
}

function PaginationControls({ currentPage, totalCount, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className={styles.paginationBar}>
      <span className={styles.paginationInfo}>
        第 {currentPage} / {totalPages} 页 · 共 {totalCount} 项
      </span>
      <div className={styles.paginationButtons}>
        <button
          type="button"
          className={styles.paginationButton}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          上一页
        </button>
        <button
          type="button"
          className={styles.paginationButton}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

function toSafeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeWarningItem(warning) {
  if (typeof warning === 'string') {
    return { message: warning };
  }

  if (warning && typeof warning === 'object') {
    return {
      ...warning,
      message: warning.message || warning.reason || warning.code || '服务端返回处理提示',
    };
  }

  return { message: '服务端返回处理提示' };
}

function normalizePredictionItem(prediction, index) {
  if (!prediction || typeof prediction !== 'object') {
    return {
      rank: index + 1,
      label: `候选 ${index + 1}`,
      probability: null,
    };
  }

  const probability = Number(prediction.probability);

  return {
    ...prediction,
    rank: Number.isFinite(Number(prediction.rank)) ? Number(prediction.rank) : index + 1,
    label: prediction.label || prediction.prediction || prediction.class_name || `候选 ${index + 1}`,
    probability: Number.isFinite(probability) ? probability : null,
  };
}

function normalizeFeatureItem(feature, index) {
  if (typeof feature === 'string') {
    return { feature, score: null, rank: index + 1 };
  }

  if (feature && typeof feature === 'object') {
    return {
      ...feature,
      feature: feature.feature || feature.token || feature.term || `特征 ${index + 1}`,
      score: Number.isFinite(Number(feature.score)) ? Number(feature.score) : null,
      rank: Number.isFinite(Number(feature.rank)) ? Number(feature.rank) : index + 1,
    };
  }

  return {
    feature: `特征 ${index + 1}`,
    score: null,
    rank: index + 1,
  };
}

function buildDistribution(results) {
  return results.reduce((acc, item) => {
    const label = item.prediction || '未分类';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function getAverageProbability(results) {
  const validProbabilities = results
    .map(item => Number(item.probability))
    .filter(Number.isFinite);

  if (!validProbabilities.length) {
    return 0;
  }

  return validProbabilities.reduce((sum, value) => sum + value, 0) / validProbabilities.length;
}

function parseTextLines(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function normalizeResponse(json) {
  const inner = json?.data || json || {};
  const rawResults = Array.isArray(inner.results) ? inner.results : [];
  const results = rawResults.map((item, index) => {
    const normalizedItem = item && typeof item === 'object' ? item : {};
    const snippet = normalizedItem.text_snippet || normalizedItem.text || normalizedItem.input_text || '';
    const probability = Number(normalizedItem.probability);

    return {
      ...normalizedItem,
      index: Number.isFinite(Number(normalizedItem.index)) ? Number(normalizedItem.index) : index,
      text_snippet: snippet,
      prediction: normalizedItem.prediction || normalizedItem.label || normalizedItem.class_name || '未分类',
      probability: Number.isFinite(probability) ? probability : null,
      text_length: Number.isFinite(Number(normalizedItem.text_length))
        ? Number(normalizedItem.text_length)
        : snippet.length,
      token_count: Number.isFinite(Number(normalizedItem.token_count))
        ? Number(normalizedItem.token_count)
        : 0,
      top_predictions: Array.isArray(normalizedItem.top_predictions)
        ? normalizedItem.top_predictions.map(normalizePredictionItem)
        : [],
      feature_importance: Array.isArray(normalizedItem.feature_importance)
        ? normalizedItem.feature_importance.map(normalizeFeatureItem)
        : [],
      warnings: Array.isArray(normalizedItem.warnings)
        ? normalizedItem.warnings.map(normalizeWarningItem)
        : [],
    };
  });
  const summary = inner.summary && typeof inner.summary === 'object' ? inner.summary : {};
  const metadata = inner.metadata && typeof inner.metadata === 'object' ? inner.metadata : {};
  const warningsCountFromResults = results.reduce((sum, item) => sum + item.warnings.length, 0);
  const classDistribution = summary.class_distribution && typeof summary.class_distribution === 'object'
    ? summary.class_distribution
    : buildDistribution(results);
  const avgProbability = Number(summary.avg_probability);

  const error = inner.error && typeof inner.error === 'object'
    ? inner.error
    : inner.error
      ? { message: String(inner.error) }
      : inner.message
        ? { message: String(inner.message) }
        : null;

  return {
    success: typeof inner.success === 'boolean' ? inner.success : rawResults.length > 0,
    results,
    summary: {
      ...summary,
      total_samples: toSafeNumber(summary.total_samples, results.length),
      class_distribution: classDistribution,
      avg_probability: Number.isFinite(avgProbability) ? avgProbability : getAverageProbability(results),
      processing_time_ms: toSafeNumber(summary.processing_time_ms, toSafeNumber(metadata.execution_time_ms, 0)),
      warnings_count: toSafeNumber(summary.warnings_count, warningsCountFromResults),
    },
    metadata,
    error,
  };
}

function formatProbability(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '-';
  }

  return `${(number * 100).toFixed(1)}%`;
}

function getTextSourceLabel(dataSource, uploadFileName) {
  if (dataSource === 'upload') {
    return uploadFileName || '上传文本文件';
  }

  return '内置文本样例';
}

function isTxtFile(file) {
  return typeof file?.name === 'string' && /\.txt$/i.test(file.name);
}

function getMetadataEntries(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return [];
  }

  const candidates = [
    ['model_name', '模型名称'],
    ['model_version', '模型版本'],
    ['request_id', '请求 ID'],
    ['input_count', '输入条数'],
    ['truncated_count', '截断文本'],
  ];

  return candidates
    .filter(([key]) => metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '')
    .map(([key, label]) => ({
      key,
      label,
      value: String(metadata[key]),
    }));
}

export default function TextClassification({
  apiBase,
  loginBaseUrl,
  selectedModel,
  scenarioConfig,
}) {
  const [dataSource, setDataSource] = useState('sample');
  const [sampleTexts, setSampleTexts] = useState([]);
  const [sampleError, setSampleError] = useState('');
  const [uploadTexts, setUploadTexts] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [resultData, setResultData] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState('all');
  const [resultPage, setResultPage] = useState(1);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadSampleData = async () => {
      try {
        const response = await fetch(defaultSampleDataUrl);
        if (!response.ok) {
          throw new Error(`示例数据加载失败: ${response.status}`);
        }

        const text = await response.text();
        const parsed = parseTextLines(text);

        if (!parsed.length) {
          throw new Error('示例数据文件为空或格式错误');
        }

        if (!cancelled) {
          setSampleTexts(parsed);
          setSampleError('');
        }
      } catch (err) {
        console.error('示例数据加载失败:', err);
        if (!cancelled) {
          setSampleTexts([]);
          setSampleError(err.message || '示例数据加载失败');
        }
      }
    };

    loadSampleData();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeTexts = useMemo(() => {
    if (dataSource === 'upload') {
      return uploadTexts || [];
    }

    return sampleTexts;
  }, [dataSource, sampleTexts, uploadTexts]);

  const previewTexts = useMemo(() => activeTexts.slice(0, PREVIEW_COUNT), [activeTexts]);

  const hasOverlongText = useMemo(
    () => activeTexts.some(text => text.length > MAX_TEXT_LENGTH),
    [activeTexts],
  );

  const filteredResults = useMemo(() => {
    const results = resultData?.results || [];
    if (selectedLabel === 'all') {
      return results;
    }

    return results.filter(item => item.prediction === selectedLabel);
  }, [resultData, selectedLabel]);

  const pagedResults = useMemo(() => {
    const startIndex = (resultPage - 1) * RESULTS_PAGE_SIZE;
    return filteredResults.slice(startIndex, startIndex + RESULTS_PAGE_SIZE);
  }, [filteredResults, resultPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredResults.length / RESULTS_PAGE_SIZE));
    setResultPage(prev => clampPage(prev, totalPages));
  }, [filteredResults]);

  const distributionItems = useMemo(() => {
    const distribution = resultData?.summary?.class_distribution || {};
    const total = resultData?.summary?.total_samples || 0;

    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label,
        count,
        percentage: total ? (count / total) * 100 : 0,
      }));
  }, [resultData]);

  const filterOptions = useMemo(() => {
    const totalCount = resultData?.results?.length || 0;

    return [
      { value: 'all', label: '全部标签', count: totalCount },
      ...distributionItems.map(item => ({
        value: item.label,
        label: item.label,
        count: item.count,
      })),
    ];
  }, [distributionItems, resultData]);

  const warningCount = useMemo(() => {
    return toSafeNumber(
      resultData?.summary?.warnings_count,
      (resultData?.results || []).reduce((sum, item) => sum + (item.warnings?.length || 0), 0),
    );
  }, [resultData]);

  const metadataEntries = useMemo(() => getMetadataEntries(resultData?.metadata), [resultData]);

  const handleResetResult = () => {
    setResultData(null);
    setFormError('');
    setSelectedLabel('all');
    setResultPage(1);
  };

  const handleReplaceUpload = () => {
    handleResetResult();
    setUploadTexts(null);
    setUploadFileName('');
    setUploadError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isTxtFile(file)) {
      setUploadError('仅支持上传 .txt 文本文件');
      setUploadTexts(null);
      setUploadFileName('');
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    handleResetResult();
    setUploadFileName(file.name);
    setUploadTexts(null);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseTextLines(event.target?.result);
        if (!parsed.length) {
          setUploadError('未解析到有效文本，请检查文件内容');
          return;
        }

        setUploadTexts(parsed);
      } catch (err) {
        console.error('文件解析失败:', err);
        setUploadError('文件解析失败，请检查文件格式');
      }
    };
    reader.onerror = () => {
      setUploadError('文件解析失败，请检查文件格式');
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const content = [
      '凌晨批处理作业执行失败，返回码 137',
      '缓存命中率持续下降，接口响应时间明显升高',
      '用户反馈登录页面提示验证码错误且无法重试',
      '巡检任务执行成功，所有服务状态正常',
      '数据库主从延迟超过阈值，告警已触发',
      '应用发布完成，灰度流量切换成功',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'text_classification_template.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleRunInference = async () => {
    if (!selectedModel) {
      setFormError('请选择一个模型');
      return;
    }

    if (!activeTexts.length) {
      setFormError('请先提供待分类文本');
      return;
    }

    if (activeTexts.length > MAX_BATCH_SIZE) {
      setFormError(`单次最多提交 ${MAX_BATCH_SIZE} 条文本，请拆分后重试`);
      return;
    }

    setFormError('');
    setLoading(true);
    setResultData(null);
    setSelectedLabel('all');
    setResultPage(1);

    try {
      const result = await authFetch(
        `${apiBase}/predict/${scenarioConfig.algorithmType}/${selectedModel}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: activeTexts,
          }),
        },
        { redirectOnMissingToken: true, loginBaseUrl },
      );

      if (result.reason === 'missing-token') {
        return;
      }
      if (result.reason === 'auth-expired') {
        setFormError('登录已过期，请重新登录后重试');
        return;
      }
      if (result.reason === 'http-error') {
        throw new Error(`推理请求失败: ${result.status}`);
      }
      if (result.reason === 'network-error') {
        throw result.error || new Error('网络请求失败');
      }

      const json = await result.response.json();
      const normalized = normalizeResponse(json);

      if (!normalized.success) {
        setFormError(normalized.error?.message || '文本分类失败，请稍后重试');
        return;
      }

      setResultData(normalized);
    } catch (err) {
      console.error('推理请求失败:', err);
      setFormError(`推理失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderResultHeader = () => (
    <div className={styles.resultHeader}>
      <div className={styles.resultHeaderMain}>
        <span className={styles.resultIndicator} aria-hidden="true">
          <FiType />
        </span>
        <span className={styles.resultHeaderTitle}>
          {getTextSourceLabel(dataSource, uploadFileName)}
        </span>
      </div>
      <div className={styles.resultHeaderActions}>
        {dataSource === 'upload' && uploadTexts?.length ? (
          <button
            type="button"
            className={clsx(styles.resultAction, styles.resultActionSubtle)}
            onClick={handleReplaceUpload}
          >
            重新上传
          </button>
        ) : null}
        <button type="button" className={styles.resultAction} onClick={handleResetResult}>
          重置结果
        </button>
        <span className={styles.resultStatus}>
          <FiCheck />
          分类完成
        </span>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className={styles.resultSummary}>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>文本总数</span>
        <span className={styles.resultStatValue}>{resultData.summary?.total_samples || 0}</span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>标签种类</span>
        <span className={styles.resultStatValue}>{distributionItems.length}</span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>平均置信度</span>
        <span className={styles.resultStatValue}>{formatProbability(resultData.summary?.avg_probability)}</span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>推理耗时</span>
        <span className={styles.resultStatValue}>
          {resultData.summary?.processing_time_ms
            ? `${(resultData.summary.processing_time_ms / 1000).toFixed(2)}s`
            : '-'}
        </span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>警告数量</span>
        <span className={styles.resultStatValue}>{warningCount}</span>
      </div>
    </div>
  );

  const renderResultContent = () => (
    <>
      {metadataEntries.length ? (
        <div className={styles.resultMetaBar}>
          {metadataEntries.map(item => (
            <div key={item.key} className={styles.metaChip}>
              <span className={styles.metaChipLabel}>{item.label}</span>
              <span className={styles.metaChipValue}>{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.filterToolbar}>
        {filterOptions.map(option => (
          <button
            key={option.value}
            type="button"
            className={clsx(styles.filterChip, selectedLabel === option.value && styles.filterChipActive)}
            onClick={() => {
              setSelectedLabel(option.value);
              setResultPage(1);
            }}
          >
            <span className={styles.filterChipLabel}>{option.label}</span>
            <span className={styles.filterChipCount}>{option.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.resultPanelWrap}>
        <div className={styles.resultPanel}>
          <div className={styles.sectionHeading}>分类结果 ({filteredResults.length})</div>
          <div className={styles.resultListCompact}>
            {pagedResults.length ? pagedResults.map((item) => (
              <article key={`${item.index}-${item.text_snippet || item.text || item.input_text || ''}`} className={styles.resultCard}>
                <div className={styles.resultCardHeader}>
                  <div className={styles.resultCardBadges}>
                    <span className={styles.resultItemIndex}>#{item.index + 1}</span>
                    <span className={styles.resultItemLabel}>{item.prediction}</span>
                  </div>
                  <span className={styles.resultItemProb}>{formatProbability(item.probability)}</span>
                </div>

                <div className={styles.resultCardText}>
                  {item.text_snippet || item.text || item.input_text || '服务端未返回文本内容'}
                </div>

                <div className={styles.resultCardMeta}>
                  <span className={styles.infoChip}>文本长度 · {item.text_length || 0}</span>
                  {Array.isArray(item.top_predictions) && item.top_predictions.length ? (
                    <span className={styles.infoChip}>
                      Top-1 · {item.top_predictions[0].label} {formatProbability(item.top_predictions[0].probability)}
                    </span>
                  ) : null}
                </div>

                {Array.isArray(item.feature_importance) && item.feature_importance.length ? (
                  <div className={styles.resultCardSection}>
                    <div className={styles.chipList}>
                      {item.feature_importance.slice(0, 4).map(feature => (
                        <span
                          key={`${item.index}-${feature.rank}-${feature.feature}`}
                          className={styles.featureChip}
                        >
                          {feature.feature}
                          {feature.score != null ? ` · ${feature.score.toFixed(3)}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            )) : (
              <div className={styles.emptyState}>当前筛选条件下暂无结果</div>
            )}
          </div>

          {filteredResults.length ? (
            <PaginationControls
              currentPage={resultPage}
              pageSize={RESULTS_PAGE_SIZE}
              totalCount={filteredResults.length}
              onPageChange={(page) => setResultPage(clampPage(page, Math.ceil(filteredResults.length / RESULTS_PAGE_SIZE)))}
            />
          ) : null}
        </div>
      </div>
    </>
  );

  const renderPreview = () => {
    if (dataSource === 'upload' && !uploadTexts) {
      return null;
    }

    return (
      <div className={styles.sampleDataSection}>
        <div className={styles.sampleDataCard}>
          <div className={styles.sampleDataHeader}>
            <div className={styles.sampleDataHeaderMain}>
              <span className={styles.sampleDataTitle}>
                <FiFileText />
                {getTextSourceLabel(dataSource, uploadFileName)}
              </span>
              <span className={styles.sampleDataInfo}>{activeTexts.length} 条文本</span>
            </div>
            {dataSource === 'sample' ? <span className={styles.previewTag}>示例数据</span> : null}
            {dataSource === 'upload' && uploadTexts?.length ? (
              <button
                type="button"
                className={styles.uploadReplaceTop}
                onClick={handleReplaceUpload}
              >
                重新上传
              </button>
            ) : null}
          </div>

          <div className={styles.previewBody}>
            <div className={styles.previewNotice}>
              当前预览前 {Math.min(activeTexts.length, PREVIEW_COUNT)} 条文本，一行视为一条分类样本。
            </div>
            <div className={styles.previewList}>
              {previewTexts.length ? previewTexts.map((text, index) => (
                <div key={`${dataSource}-${text.slice(0, 48)}-${text.length}`} className={styles.previewItem}>
                  <span className={styles.previewIndex}>{index + 1}</span>
                  <span className={styles.previewText}>{text}</span>
                </div>
              )) : (
                <div className={styles.emptyStateInline}>暂无可预览文本</div>
              )}
            </div>
          </div>

          {loading && <LoadingOverlay />}
        </div>
      </div>
    );
  };

  const renderDataCard = () => {
    if (!resultData) {
      return renderPreview();
    }

    return (
      <div className={styles.sampleDataSection}>
        <div className={clsx(styles.sampleDataCard, styles.sampleDataCardResult)}>
          {renderResultHeader()}
          {renderResultContent()}
          {renderSummary()}
          {loading && <LoadingOverlay />}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.scenarioContent}>
      <div className={styles.formGroup}>
        <div className={styles.formLabel}>数据源</div>
        <div className={styles.dataSourceTabs}>
          <button
            type="button"
            className={clsx(styles.dataSourceTab, dataSource === 'sample' && styles.dataSourceTabActive)}
            onClick={() => {
              handleResetResult();
              setDataSource('sample');
            }}
          >
            示例数据
          </button>
          <button
            type="button"
            className={clsx(styles.dataSourceTab, dataSource === 'upload' && styles.dataSourceTabActive)}
            onClick={() => {
              handleResetResult();
              setDataSource('upload');
            }}
          >
            上传文件
          </button>
        </div>

        {dataSource === 'upload' ? (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".txt,text/plain"
            onChange={handleFileUpload}
          />
        ) : null}

        {dataSource === 'upload' && !uploadTexts ? (
          <div>
            <div className={clsx(styles.uploadArea, styles.uploadAreaActive, uploadError && styles.uploadAreaError)}>
              <button
                type="button"
                className={styles.uploadTrigger}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.uploadAreaIcon}>
                  <FiUploadCloud />
                </div>
                <p className={styles.uploadAreaText}>
                  {uploadFileName ? `已选择: ${uploadFileName}` : '点击上传文本文件'}
                </p>
                <p className={styles.uploadAreaHint}>仅支持 TXT 文件，按行解析，一行视为一条文本。</p>
              </button>
              <button type="button" className={styles.templateDownload} onClick={handleDownloadTemplate}>
                <FiDownload />
                下载示例模板
              </button>
            </div>
            {uploadError ? <p className={styles.uploadErrorText}>{uploadError}</p> : null}
          </div>
        ) : null}

        {renderDataCard()}
      </div>

      {sampleError && dataSource === 'sample' && !sampleTexts.length ? (
        <div className={styles.formErrorMsg}>
          <FiAlertTriangle />
          {sampleError}
        </div>
      ) : null}

      {hasOverlongText ? (
        <div className={styles.formNoticeMsg}>
          <FiAlertTriangle />
          部分文本超过 {MAX_TEXT_LENGTH} 字，提交后服务端会自动截断并返回提示。
        </div>
      ) : null}

      {formError ? (
        <div className={styles.formErrorMsg}>
          <FiAlertTriangle />
          {formError}
        </div>
      ) : null}

      <div className={styles.actionButtons}>
        <button
          type="button"
          className={clsx(styles.btn, styles.btnPrimary)}
          onClick={handleRunInference}
          disabled={loading || !selectedModel || !activeTexts.length}
        >
          <FiPlay />
          开始文本分类
        </button>
      </div>

    </div>
  );
}
