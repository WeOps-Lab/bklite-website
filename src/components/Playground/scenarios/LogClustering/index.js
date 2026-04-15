import React, { useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import {
  FiAlertTriangle,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiLayers,
  FiPlay,
  FiUploadCloud,
} from 'react-icons/fi';

import { authFetch } from '@site/src/lib/playgroundAuth';
import {translate} from '@docusaurus/Translate';

import styles from './index.module.css';

const defaultSampleDataUrl = new URL('./sample-data/default.txt', import.meta.url).href;

const MAX_LOG_LINES = 10000;
const PREVIEW_LINE_COUNT = 50;
const CLUSTER_PAGE_SIZE = 6;
const UNKNOWN_PAGE_SIZE = 20;

function LoadingOverlay() {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingOverlayContent}>
        <div className={styles.loadingSpinner}></div>
        <span>{translate({id: 'logClustering.inferenceLoading', message: '模型推理中...'})}</span>
      </div>
    </div>
  );
}

function clampPage(page, totalPages) {
  if (!totalPages) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: 'page',
      page: index + 1,
    }));
  }

  const items = [{ type: 'page', page: 1 }];
  const siblingCount = totalPages <= 10 ? 1 : 2;
  let startPage = Math.max(2, currentPage - siblingCount);
  let endPage = Math.min(totalPages - 1, currentPage + siblingCount);

  if (currentPage <= 1 + siblingCount * 2 + 1) {
    startPage = 2;
    endPage = Math.min(totalPages - 1, 2 + siblingCount * 2 + 1);
  }

  if (currentPage >= totalPages - (siblingCount * 2 + 1)) {
    startPage = Math.max(2, totalPages - (siblingCount * 2 + 1));
    endPage = totalPages - 1;
  }

  if (startPage > 2) {
    items.push({ type: 'ellipsis', key: 'ellipsis-start' });
  }

  for (let page = startPage; page <= endPage; page += 1) {
    items.push({ type: 'page', page });
  }

  if (endPage < totalPages - 1) {
    items.push({ type: 'ellipsis', key: 'ellipsis-end' });
  }

  items.push({ type: 'page', page: totalPages });

  return items;
}

function slicePage(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function getStableLineKey(prefix, line, index) {
  return `${prefix}-${line.slice(0, 48)}-${line.length}-${index}`;
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) return translate({id: 'logClustering.unknownSize', message: '未知大小'});
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function parseTextLogs(text) {
  const rawLines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const normalized = rawLines.map(line => line.trim()).filter(Boolean);
  const logs = normalized.slice(0, MAX_LOG_LINES);

  return {
    logs,
    stats: {
      totalLines: rawLines.length,
      nonEmptyLines: normalized.length,
      sentLines: logs.length,
      truncated: normalized.length > MAX_LOG_LINES,
    },
  };
}

function isTxtFile(file) {
  return typeof file?.name === 'string' && /\.txt$/i.test(file.name);
}

function normalizeResponse(json) {
  const inner = json?.data || json || {};
  const summary = inner.summary || {};

  const templateGroups = Array.isArray(inner.template_groups)
    ? inner.template_groups.map((item, index) => ({
      cluster_id: Number.isFinite(Number(item?.cluster_id)) ? Number(item.cluster_id) : index,
      template: item?.template || `<unknown-${index}>`,
      count: Number(item?.count) || 0,
      percentage: Number(item?.percentage) || 0,
      log_indices: Array.isArray(item?.log_indices) ? item.log_indices : [],
      sample_logs: Array.isArray(item?.sample_logs) ? item.sample_logs : [],
    }))
    : [];

  const unknownLogs = Array.isArray(inner.unknown_logs)
    ? inner.unknown_logs.map((item, index) => ({
      index: Number.isFinite(Number(item?.index)) ? Number(item.index) : index,
      log: item?.log || '',
      reason: item?.reason || 'no_matching_template',
    }))
    : [];

  return {
    summary: {
      total_logs: Number(summary.total_logs) || 0,
      matched_logs: Number(summary.matched_logs) || 0,
      unknown_logs: Number(summary.unknown_logs) || unknownLogs.length,
      num_templates: Number(summary.num_templates) || templateGroups.length,
      coverage_rate: Number(summary.coverage_rate) || 0,
      processing_time_ms: Number(summary.processing_time_ms) || 0,
    },
    templateGroups,
    unknownLogs,
    modelInfo: inner.model_info || {},
  };
}

function PaginationControls({ currentPage, totalCount, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <nav className={styles.paginationBar} aria-label={translate({id: 'logClustering.pagination.ariaLabel', message: '分页导航'})}>
      <span className={styles.paginationInfo}>
        {translate({id: 'logClustering.pagination.pagePrefix', message: '第'})}&nbsp;<strong>{currentPage}</strong><em>/</em><strong>{totalPages}</strong>&nbsp;{translate({id: 'logClustering.pagination.pageSuffix', message: '页'})}
        <em>·</em>
        {translate({id: 'logClustering.pagination.totalPrefix', message: '共'})}&nbsp;<strong>{totalCount}</strong>&nbsp;{translate({id: 'logClustering.pagination.totalSuffix', message: '项'})}
      </span>
      <div className={styles.paginationControls}>
        <button
          type="button"
          className={clsx(styles.paginationButton, styles.paginationNavButton)}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={translate({id: 'logClustering.pagination.prevPage', message: '上一页'})}
          title={translate({id: 'logClustering.pagination.prevPage', message: '上一页'})}
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        <div className={styles.paginationPages}>
          {paginationItems.map((item) => {
            if (item.type === 'ellipsis') {
              return <span key={item.key} className={styles.paginationEllipsis}>…</span>;
            }

            return (
              <button
                key={item.page}
                type="button"
                className={clsx(styles.paginationButton, styles.paginationPageButton, item.page === currentPage && styles.paginationButtonActive)}
                onClick={() => onPageChange(item.page)}
                disabled={item.page === currentPage}
                aria-current={item.page === currentPage ? 'page' : undefined}
                aria-label={`${translate({id: 'logClustering.pagination.pagePrefix', message: '第'})} ${item.page} ${translate({id: 'logClustering.pagination.pageSuffix', message: '页'})}`}
              >
                {item.page}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={clsx(styles.paginationButton, styles.paginationNavButton)}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label={translate({id: 'logClustering.pagination.nextPage', message: '下一页'})}
          title={translate({id: 'logClustering.pagination.nextPage', message: '下一页'})}
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

function LogInputPreview({ title, fileLabel, infoText, logs, truncated, action, loading }) {
  return (
    <div className={styles.sampleDataSection}>
      <div className={styles.sampleDataCard}>
        <div className={styles.sampleDataHeader}>
          <div className={styles.sampleDataHeaderMain}>
            <span className={styles.sampleDataTitle}>
              <FiFileText />
              {title}
            </span>
            <span className={styles.sampleDataInfo}>{infoText}</span>
          </div>
          {action || (fileLabel ? <span className={styles.previewTag}>{fileLabel}</span> : null)}
        </div>

        <div className={styles.logPreviewBody}>
          <div className={styles.previewNotice}>
            {truncated
              ? `${translate({id: 'logClustering.preview.truncatedPrefix', message: '当前仅发送前'})} ${MAX_LOG_LINES.toLocaleString()} ${translate({id: 'logClustering.preview.truncatedMiddle', message: '条有效日志，预览展示前'})} ${PREVIEW_LINE_COUNT} ${translate({id: 'logClustering.preview.truncatedSuffix', message: '条。'})}`
              : `${translate({id: 'logClustering.preview.normalPrefix', message: '当前预览前'})} ${Math.min(logs.length, PREVIEW_LINE_COUNT)} ${translate({id: 'logClustering.preview.normalSuffix', message: '条日志。'})}`}
          </div>

          <div className={styles.logPreviewList}>
            {logs.length ? logs.map((line, index) => (
              <div key={getStableLineKey('preview', line, index)} className={styles.logPreviewItem}>
                <span className={styles.logLineNumber}>{index + 1}</span>
                <span className={styles.logLineText}>{line}</span>
              </div>
            )) : (
              <div className={styles.emptyStateInline}>{translate({id: 'logClustering.preview.noLogs', message: '暂无可预览日志'})}</div>
            )}
          </div>
        </div>

        {loading && <LoadingOverlay />}
      </div>
    </div>
  );
}

export default function LogClustering({
  apiBase,
  loginBaseUrl,
  selectedModel,
  scenarioConfig,
}) {
  const [dataSource, setDataSource] = useState('sample');
  const [sampleLogs, setSampleLogs] = useState([]);
  const [sampleStats, setSampleStats] = useState(null);
  const [sampleError, setSampleError] = useState('');
  const [uploadLogs, setUploadLogs] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [resultData, setResultData] = useState(null);
  const [activeTab, setActiveTab] = useState('clusters');
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [clusterPage, setClusterPage] = useState(1);
  const [unknownPage, setUnknownPage] = useState(1);
  const [clusterSearch, setClusterSearch] = useState('');
  const [clusterSort, setClusterSort] = useState('count');

  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadSampleData = async () => {
      try {
        const response = await fetch(defaultSampleDataUrl);
        if (!response.ok) {
          throw new Error(`${translate({id: 'logClustering.error.sampleLoadFailed', message: '示例数据加载失败'})}: ${response.status}`);
        }

        const text = await response.text();
        const parsed = parseTextLogs(text);

        if (!parsed.logs.length) {
          throw new Error(translate({id: 'logClustering.error.sampleEmpty', message: '示例数据文件为空或格式错误'}));
        }

        if (!cancelled) {
          setSampleLogs(parsed.logs);
          setSampleStats(parsed.stats);
          setSampleError('');
        }
      } catch (err) {
        console.error('示例数据加载失败:', err);
        if (!cancelled) {
          setSampleError(err.message || translate({id: 'logClustering.error.sampleLoadFailed', message: '示例数据加载失败'}));
        }
      }
    };

    loadSampleData();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeLogs = dataSource === 'upload' ? uploadLogs : sampleLogs;
  const activeStats = dataSource === 'upload' ? uploadStats : sampleStats;
  const hasResult = Boolean(resultData);

  const filteredClusters = useMemo(() => {
    const groups = resultData?.templateGroups || [];
    const keyword = clusterSearch.trim().toLowerCase();

    const next = keyword
      ? groups.filter(item => item.template.toLowerCase().includes(keyword) || String(item.cluster_id).includes(keyword))
      : groups;

    return [...next].sort((a, b) => {
      if (clusterSort === 'cluster_id') {
        return a.cluster_id - b.cluster_id;
      }
      return b.count - a.count;
    });
  }, [clusterSearch, clusterSort, resultData]);

  const pagedClusters = useMemo(() => slicePage(filteredClusters, clusterPage, CLUSTER_PAGE_SIZE), [filteredClusters, clusterPage]);
  const topClusters = useMemo(() => [...(resultData?.templateGroups || [])].sort((a, b) => b.count - a.count).slice(0, 5), [resultData]);
  const pagedUnknownLogs = useMemo(() => slicePage(resultData?.unknownLogs || [], unknownPage, UNKNOWN_PAGE_SIZE), [resultData, unknownPage]);
  const selectedCluster = useMemo(() => {
    const source = resultData?.templateGroups || [];
    return source.find(item => item.cluster_id === selectedClusterId) || null;
  }, [resultData, selectedClusterId]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredClusters.length / CLUSTER_PAGE_SIZE));
    setClusterPage(prev => clampPage(prev, totalPages));

    if (!filteredClusters.length) {
      setSelectedClusterId(null);
      return;
    }

    if (!filteredClusters.some(item => item.cluster_id === selectedClusterId)) {
      setSelectedClusterId(filteredClusters[0].cluster_id);
    }
  }, [filteredClusters, selectedClusterId]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((resultData?.unknownLogs?.length || 0) / UNKNOWN_PAGE_SIZE));
    setUnknownPage(prev => clampPage(prev, totalPages));
  }, [resultData]);

  const handleResetResult = () => {
    setResultData(null);
    setFormError('');
    setActiveTab('clusters');
    setSelectedClusterId(null);
    setClusterPage(1);
    setUnknownPage(1);
    setClusterSearch('');
    setClusterSort('count');
  };

  const handleReplaceUpload = () => {
    handleResetResult();
    setUploadLogs(null);
    setUploadStats(null);
    setUploadFileName('');
    setUploadFileSize('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isTxtFile(file)) {
      setUploadError(translate({id: 'logClustering.error.txtOnly', message: '仅支持上传 .txt 文本文件'}));
      setUploadLogs(null);
      setUploadStats(null);
      setUploadFileName('');
      setUploadFileSize('');
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    handleResetResult();
    setUploadFileName(file.name);
    setUploadFileSize(formatFileSize(file.size));
    setUploadError('');
    setUploadLogs(null);
    setUploadStats(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = parseTextLogs(evt.target?.result);

        if (!parsed.logs.length) {
          setUploadError(translate({id: 'logClustering.error.noValidLogs', message: '未解析到有效日志，请检查文件内容'}));
          return;
        }

        setUploadLogs(parsed.logs);
        setUploadStats(parsed.stats);
      } catch (err) {
        console.error('文件解析失败:', err);
        setUploadError(translate({id: 'logClustering.error.parseFailed', message: '文件解析失败，请检查文件格式'}));
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const content = [
      '2024-01-15 10:23:45 ERROR Failed to connect to database server',
      '2024-01-15 10:23:46 ERROR Connection timeout to database',
      '2024-01-15 10:23:47 INFO User login successful',
      '2024-01-15 10:23:48 WARN Cache miss on key profile:1234',
      '2024-01-15 10:23:49 ERROR Failed to connect to database replica',
      '2024-01-15 10:23:50 INFO User logout successful',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'log_template.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleRunInference = async () => {
    if (!selectedModel) {
      setFormError(translate({id: 'logClustering.error.selectModel', message: '请选择一个模型'}));
      return;
    }

    if (dataSource === 'sample' && !sampleLogs.length) {
      setFormError(sampleError || translate({id: 'logClustering.error.sampleNotLoaded', message: '示例数据尚未加载完成'}));
      return;
    }

    if (dataSource === 'upload' && !uploadLogs?.length) {
      setUploadError(translate({id: 'logClustering.error.uploadFirst', message: '请先上传日志文件'}));
      return;
    }

    setFormError('');
    setLoading(true);
    handleResetResult();

    try {
      const result = await authFetch(
        `${apiBase}/predict/${scenarioConfig.algorithmType}/${selectedModel}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: activeLogs,
            config: { max_samples: 5, sort_by: 'count' },
          }),
        },
        { redirectOnMissingToken: true, loginBaseUrl },
      );

      if (result.reason === 'missing-token') {
        return;
      }
      if (result.reason === 'auth-expired') {
        setFormError(translate({id: 'logClustering.error.authExpired', message: '登录已过期，请重新登录后重试'}));
        return;
      }
      if (result.reason === 'http-error') {
        throw new Error(`${translate({id: 'logClustering.error.inferenceFailed', message: '推理请求失败'})}: ${result.status}`);
      }
      if (result.reason === 'network-error') {
        throw result.error || new Error(translate({id: 'logClustering.error.networkFailed', message: '网络请求失败'}));
      }

      const json = await result.response.json();
      const normalized = normalizeResponse(json);
      setResultData(normalized);
      setSelectedClusterId(normalized.templateGroups[0]?.cluster_id ?? null);
      setClusterPage(1);
      setUnknownPage(1);
      setActiveTab('clusters');
    } catch (err) {
      console.error('推理请求失败:', err);
      setFormError(`${translate({id: 'logClustering.error.inferenceFailed', message: '推理失败'})}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderResultHeader = () => (
    <div className={styles.resultHeader}>
      <div className={styles.resultHeaderMain}>
        <span className={styles.resultIndicator} aria-hidden="true">
          <FiLayers />
        </span>
        <span className={styles.resultHeaderTitle}>
          {dataSource === 'upload' ? uploadFileName : translate({id: 'logClustering.builtinSample', message: '内置日志样例'})}
        </span>
      </div>
      <div className={styles.resultHeaderActions}>
        {dataSource === 'upload' && uploadLogs?.length ? (
          <button type="button" className={clsx(styles.resultAction, styles.resultActionSubtle)} onClick={handleReplaceUpload}>
            {translate({id: 'logClustering.reupload', message: '重新上传'})}
          </button>
        ) : null}
        <button type="button" className={styles.resultAction} onClick={handleResetResult}>
          {translate({id: 'logClustering.resetResult', message: '重置结果'})}
        </button>
        <span className={styles.resultStatus}>
          <FiCheck />
          {translate({id: 'logClustering.clusteringComplete', message: '聚类完成'})}
        </span>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className={styles.resultSummary}>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>{translate({id: 'logClustering.summary.totalLogs', message: '日志总数'})}</span>
        <span className={styles.resultStatValue}>{resultData.summary.total_logs}</span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>{translate({id: 'logClustering.summary.templateCount', message: '模板数量'})}</span>
        <span className={styles.resultStatValue}>{resultData.summary.num_templates}</span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>{translate({id: 'logClustering.summary.unknownLogs', message: '未归类日志'})}</span>
        <span className={styles.resultStatValue}>{resultData.summary.unknown_logs}</span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>{translate({id: 'logClustering.summary.inferenceTime', message: '推理耗时'})}</span>
        <span className={styles.resultStatValue}>{resultData.summary.processing_time_ms ? `${(resultData.summary.processing_time_ms / 1000).toFixed(2)}s` : '-'}</span>
      </div>
    </div>
  );

  const renderResultContent = () => (
    <>
      <div className={styles.topClusters}>
        <div className={styles.sectionHeading}>{translate({id: 'logClustering.keyTemplates', message: '重点模板'})}</div>
        <div className={styles.topClusterList}>
          {topClusters.length ? topClusters.map(cluster => (
            <button
              key={cluster.cluster_id}
              type="button"
              className={styles.topClusterButton}
              onClick={() => {
                setActiveTab('clusters');
                setClusterSearch('');
                setClusterSort('count');
                setSelectedClusterId(cluster.cluster_id);
              }}
            >
              <span className={styles.topClusterTemplate}>{cluster.template}</span>
              <span className={styles.topClusterCount}>{cluster.count} {translate({id: 'logClustering.unit.items', message: '条'})}</span>
            </button>
          )) : (
            <div className={styles.emptyStateInline}>{translate({id: 'logClustering.noTemplates', message: '暂无聚类模板'})}</div>
          )}
        </div>
      </div>

      <div className={styles.resultTabs}>
        <button
          type="button"
          className={clsx(styles.resultTab, activeTab === 'clusters' && styles.resultTabActive)}
          onClick={() => setActiveTab('clusters')}
        >
          {translate({id: 'logClustering.tab.clusterResults', message: '聚类结果'})} ({resultData.templateGroups.length})
        </button>
        <button
          type="button"
          className={clsx(styles.resultTab, activeTab === 'unknown' && styles.resultTabActive)}
          onClick={() => setActiveTab('unknown')}
        >
          {translate({id: 'logClustering.tab.unknownLogs', message: '未归类日志'})} ({resultData.unknownLogs.length})
        </button>
      </div>

      {activeTab === 'clusters' ? (
        <div className={styles.browserLayout}>
          <div className={styles.browserColumn}>
            <div className={styles.browserToolbar}>
              <input
                type="text"
                className={styles.searchInput}
                value={clusterSearch}
                onChange={(e) => {
                  setClusterSearch(e.target.value);
                  setClusterPage(1);
                }}
                placeholder={translate({id: 'logClustering.search.placeholder', message: '按模板内容或 ID 搜索'})}
              />
              <div className={styles.sortTabs}>
                <button
                  type="button"
                  className={clsx(styles.sortTab, clusterSort === 'count' && styles.sortTabActive)}
                  onClick={() => setClusterSort('count')}
                >
                  {translate({id: 'logClustering.sort.byCount', message: '按数量'})}
                </button>
                <button
                  type="button"
                  className={clsx(styles.sortTab, clusterSort === 'cluster_id' && styles.sortTabActive)}
                  onClick={() => setClusterSort('cluster_id')}
                >
                  {translate({id: 'logClustering.sort.byId', message: '按 ID'})}
                </button>
              </div>
            </div>

            <div className={styles.clusterList}>
              {pagedClusters.length ? pagedClusters.map(cluster => (
                <button
                  key={cluster.cluster_id}
                  type="button"
                  className={clsx(styles.clusterCard, selectedClusterId === cluster.cluster_id && styles.clusterCardActive)}
                  onClick={() => setSelectedClusterId(cluster.cluster_id)}
                >
                  <div className={styles.clusterCardHeader}>
                    <span className={styles.clusterId}>Cluster #{cluster.cluster_id}</span>
                    <span className={styles.clusterCount}>{cluster.count} {translate({id: 'logClustering.unit.items', message: '条'})}</span>
                  </div>
                  <div className={styles.clusterTemplate}>{cluster.template}</div>
                  <div className={styles.clusterMeta}>
                    {translate({id: 'logClustering.hitRatio', message: '命中占比'})} {cluster.percentage.toFixed(2)}%
                  </div>
                  <div className={styles.clusterSample}>
                    {cluster.sample_logs[0] || translate({id: 'logClustering.noSampleLogs', message: '暂无样例日志'})}
                  </div>
                </button>
              )) : (
                <div className={styles.emptyState}>{translate({id: 'logClustering.noMatchingTemplates', message: '未找到匹配的模板结果'})}</div>
              )}
            </div>
          </div>

          <div className={styles.detailColumn}>
            {selectedCluster ? (
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <span className={styles.detailTitle}>Cluster #{selectedCluster.cluster_id}</span>
                  <span className={styles.detailBadge}>{selectedCluster.count} {translate({id: 'logClustering.unit.items', message: '条'})}</span>
                </div>

                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>{translate({id: 'logClustering.detail.templateContent', message: '模板内容'})}</div>
                  <div className={styles.detailTemplate}>{selectedCluster.template}</div>
                </div>

                <div className={styles.detailStats}>
                  <div className={styles.detailStat}>
                    <span className={styles.detailStatLabel}>{translate({id: 'logClustering.detail.hitRatio', message: '命中占比'})}</span>
                    <span className={styles.detailStatValue}>{selectedCluster.percentage.toFixed(2)}%</span>
                  </div>
                  <div className={styles.detailStat}>
                    <span className={styles.detailStatLabel}>{translate({id: 'logClustering.detail.indexCount', message: '索引数量'})}</span>
                    <span className={styles.detailStatValue}>{selectedCluster.log_indices.length}</span>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>{translate({id: 'logClustering.detail.sampleLogs', message: '样例日志'})}</div>
                  <div className={styles.sampleLogList}>
                    {selectedCluster.sample_logs.length ? selectedCluster.sample_logs.map((line, index) => (
                      <div key={getStableLineKey(`cluster-${selectedCluster.cluster_id}`, line, index)} className={styles.sampleLogItem}>
                        <span className={styles.sampleLogIndex}>{index + 1}</span>
                        <span className={styles.sampleLogText}>{line}</span>
                      </div>
                    )) : <div className={styles.emptyStateInline}>{translate({id: 'logClustering.noSampleLogs', message: '暂无样例日志'})}</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>请选择左侧模板查看详情</div>
            )}
          </div>

          <div className={styles.browserPaginationRow}>
            <PaginationControls
              currentPage={clusterPage}
              pageSize={CLUSTER_PAGE_SIZE}
              totalCount={filteredClusters.length}
              onPageChange={(page) => setClusterPage(clampPage(page, Math.ceil(filteredClusters.length / CLUSTER_PAGE_SIZE)))}
            />
          </div>
        </div>
      ) : (
        <div className={styles.unknownPanelWrap}>
          <div className={styles.unknownPanel}>
            <div className={styles.unknownHeader}>
              <div className={styles.sectionHeading}>未归类日志</div>
              <div className={styles.unknownHint}>这些日志未命中已有模板，可能代表新型模式或异常。</div>
            </div>

            <div className={styles.unknownList}>
              {pagedUnknownLogs.length ? pagedUnknownLogs.map(item => (
                <div key={`${item.index}-${item.log.slice(0, 12)}`} className={styles.unknownItem}>
                  <div className={styles.unknownMeta}>
                    <span>索引 #{item.index}</span>
                    <span>{item.reason}</span>
                  </div>
                  <div className={styles.unknownText}>{item.log}</div>
                </div>
              )) : (
                <div className={styles.emptyState}>当前没有未归类日志</div>
              )}
            </div>
          </div>

          <div className={styles.unknownPaginationRow}>
            <PaginationControls
              currentPage={unknownPage}
              pageSize={UNKNOWN_PAGE_SIZE}
              totalCount={resultData.unknownLogs.length}
              onPageChange={(page) => setUnknownPage(clampPage(page, Math.ceil(resultData.unknownLogs.length / UNKNOWN_PAGE_SIZE)))}
            />
          </div>
        </div>
      )}
    </>
  );

  const renderPreview = () => {
    if (dataSource === 'sample') {
      return (
        <LogInputPreview
          title="内置日志样例"
          fileLabel="示例数据"
          infoText={sampleStats ? `${sampleStats.sentLines} 条日志` : '加载中...'}
          logs={sampleLogs.slice(0, PREVIEW_LINE_COUNT)}
          truncated={Boolean(sampleStats?.truncated)}
          action={null}
          loading={loading}
        />
      );
    }

    if (!uploadLogs?.length) {
      return null;
    }

    return (
      <div className={styles.sampleDataSection}>
        <LogInputPreview
          title={uploadFileName}
          infoText={`${uploadStats?.sentLines || 0} 条日志`}
          logs={uploadLogs.slice(0, PREVIEW_LINE_COUNT)}
          truncated={Boolean(uploadStats?.truncated)}
          action={(
            <button
              type="button"
              className={styles.uploadReplaceTop}
              onClick={handleReplaceUpload}
            >
              重新上传
            </button>
          )}
          loading={loading}
        />
      </div>
    );
  };

  const renderDataCard = () => {
    if (!hasResult) {
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
            className={clsx(styles.dataSourceTab, dataSource === 'sample' && styles.active)}
            onClick={() => {
              handleResetResult();
              setDataSource('sample');
              setUploadLogs(null);
              setUploadStats(null);
              setUploadFileName('');
              setUploadFileSize('');
              setUploadError('');
            }}
          >
            示例数据
          </button>
          <button
            type="button"
            className={clsx(styles.dataSourceTab, dataSource === 'upload' && styles.active)}
            onClick={() => {
              handleResetResult();
              setDataSource('upload');
            }}
          >
            上传文件
          </button>
        </div>

        {dataSource === 'upload' && (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".txt,text/plain"
            onChange={handleFileUpload}
          />
        )}

        {dataSource === 'upload' && !uploadLogs && (
          <div>
            <div className={clsx(styles.uploadArea, styles.active, uploadError && styles.uploadAreaError)}>
              <button
                type="button"
                className={styles.uploadTrigger}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.uploadAreaIcon}>
                  <FiUploadCloud />
                </div>
                <p className={styles.uploadAreaText}>
                  {uploadFileName ? `已选择: ${uploadFileName}` : '点击或拖拽上传日志文件'}
                </p>
                <p className={styles.uploadAreaHint}>仅支持 TXT 文件，按行解析，一行视为一条日志。</p>
              </button>
              <button type="button" className={styles.templateDownload} onClick={handleDownloadTemplate}>
                <FiDownload />
                下载示例模板
              </button>
            </div>
            {uploadError && (
              <p className={styles.uploadErrorText}>{uploadError}</p>
            )}
          </div>
        )}

        {renderDataCard()}
      </div>

      {sampleError && dataSource === 'sample' && !sampleLogs.length && (
        <div className={styles.formErrorMsg}>
          <FiAlertTriangle />
          {sampleError}
        </div>
      )}

      {formError && (
        <div className={styles.formErrorMsg}>
          <FiAlertTriangle />
          {formError}
        </div>
      )}

      <div className={styles.actionButtons}>
        <button
          type="button"
          className={clsx(styles.btn, styles.btnPrimary)}
          onClick={handleRunInference}
          disabled={loading || !selectedModel || !activeLogs?.length}
        >
          <FiPlay />
          开始日志聚类
        </button>
      </div>

    </div>
  );
}
