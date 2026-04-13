import React, { useState, useEffect, useRef } from 'react';
import {translate} from '@docusaurus/Translate';

import * as echarts from 'echarts';
import clsx from 'clsx';
import {
  FiActivity,
  FiUploadCloud,
  FiDownload,
  FiPlay,
  FiCheck,
  FiTrendingUp,
  FiAlertTriangle,
} from 'react-icons/fi';

import { authFetch } from '@site/src/lib/playgroundAuth';

import styles from './index.module.css';

const defaultSampleDataUrl = new URL('./sample-data/default.csv', import.meta.url).href;

// ==================== 工具函数 ====================

function formatTimestamp(ts, spanSeconds, frequencySeconds, mode = 'axis') {
  const d = new Date(ts * 1000);
  if (spanSeconds == null) spanSeconds = 0;
  if (frequencySeconds == null) frequencySeconds = 0;
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());

  if (mode === 'tooltip') {
    if (frequencySeconds >= 365 * 86400) return `${yyyy}-${MM}`;
    if (frequencySeconds >= 86400) return `${yyyy}-${MM}-${dd}`;
    if (frequencySeconds >= 3600) return `${yyyy}-${MM}-${dd} ${hh}:00`;
    if (frequencySeconds >= 60) return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
  }

  if (frequencySeconds >= 365 * 86400) return `${yyyy}-${MM}`;
  if (frequencySeconds >= 86400) return `${MM}-${dd}`;
  if (frequencySeconds >= 3600) {
    return spanSeconds > 2 * 86400 ? `${MM}-${dd} ${hh}:00` : `${hh}:00`;
  }
  if (frequencySeconds >= 60) {
    return spanSeconds > 86400 ? `${MM}-${dd} ${hh}:${mm}` : `${hh}:${mm}`;
  }
  if (frequencySeconds > 0) {
    return spanSeconds > 3600 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  if (spanSeconds > 365 * 86400) return `${yyyy}-${MM}`;
  if (spanSeconds > 7 * 86400) return `${MM}-${dd}`;
  if (spanSeconds > 86400) return `${MM}-${dd} ${hh}:${mm}`;
  return `${hh}:${mm}`;
}

function detectSeriesFrequencySeconds(series) {
  if (!Array.isArray(series) || series.length < 2) return null;

  const gaps = [];
  for (let i = 1; i < series.length; i++) {
    const gap = series[i].time - series[i - 1].time;
    if (Number.isFinite(gap) && gap > 0) {
      gaps.push(gap);
    }
  }

  if (!gaps.length) return null;

  const counts = new Map();
  gaps.forEach((gap) => {
    counts.set(gap, (counts.get(gap) || 0) + 1);
  });

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

function formatDurationLabel(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return translate({id: 'anomalyDetection.unknownDuration', message: '未知时长'});

  if (totalSeconds % 86400 === 0) {
    const days = totalSeconds / 86400;
    return translate({id: 'anomalyDetection.durationDays', message: '{days}天'}, {days});
  }

  if (totalSeconds % 3600 === 0) {
    const hours = totalSeconds / 3600;
    return translate({id: 'anomalyDetection.durationHours', message: '{hours}小时'}, {hours});
  }

  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.round((totalSeconds % 3600) / 60);
    return minutes ? translate({id: 'anomalyDetection.durationHoursMinutes', message: '{hours}小时{minutes}分钟'}, {hours, minutes}) : translate({id: 'anomalyDetection.durationHoursOnly', message: '{hours}小时'}, {hours});
  }

  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return translate({id: 'anomalyDetection.durationMinutes', message: '{minutes}分钟'}, {minutes});
}

function getSampleMetaText(series) {
  if (!Array.isArray(series) || series.length === 0) return translate({id: 'anomalyDetection.loading', message: '加载中...'});

  const frequencySeconds = detectSeriesFrequencySeconds(series) || 5 * 60;
  const spanSeconds = series.length > 1 ? series[series.length - 1].time - series[0].time : frequencySeconds;
  return `${formatDurationLabel(spanSeconds || frequencySeconds)} · ${series.length} points`;
}

function parseTimestamp(raw) {
  if (raw == null || raw === '') return NaN;
  const str = String(raw).trim();
  const num = Number(str);
  if (!isNaN(num) && str !== '') {
    if (num > 1e12) return Math.floor(num / 1000);
    if (num > 1e8) return Math.floor(num);
    return NaN;
  }
  const ms = Date.parse(str);
  if (!isNaN(ms)) return Math.floor(ms / 1000);
  return NaN;
}

function parseCsvSeries(text) {
  const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
  const header = lines[0]?.split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const tsIdx = header?.findIndex(h => ['timestamp', 'time', 'ts'].includes(h));
  const valIdx = header?.findIndex(h => ['value', 'val'].includes(h));

  if (tsIdx === -1 || valIdx === -1) {
    throw new Error(translate({id: 'anomalyDetection.csvFormatError', message: 'CSV 格式错误：需要包含 timestamp 和 value 列'}));
  }

  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length > Math.max(tsIdx, valIdx)) {
      parsed.push({
        time: parseTimestamp(cols[tsIdx].trim()),
        value: Number(cols[valIdx].trim())
      });
    }
  }

  return parsed
    .filter(d => !isNaN(d.time) && !isNaN(d.value))
    .sort((a, b) => a.time - b.time);
}

const chartColors = {
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  danger: '#EF4444',
  border: '#E2E8F0',
  text: '#64748B',
  surface: '#F8FAFC'
};

function LoadingOverlay() {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingOverlayContent}>
        <div className={styles.loadingSpinner}></div>
        <span>{translate({id: 'anomalyDetection.modelInference', message: '模型推理中...'})}</span>
      </div>
    </div>
  );
}

function getChartBounds(values, fixedBounds) {
  if (fixedBounds) return fixedBounds;

  const minVal = Math.floor(Math.min(...values));
  const maxVal = Math.ceil(Math.max(...values));
  const padding = Math.max(1, Math.round((maxVal - minVal) * 0.1));

  return {
    min: minVal - padding,
    max: maxVal + padding,
  };
}

function buildAnomalyChartOption({
  sourceSeries,
  resultData,
  fallbackFrequencySeconds,
  previewLabel,
  showPercentAxis = false,
  fixedBounds = null,
}) {
  const hasResult = Boolean(resultData?.data?.length);

  if (!hasResult) {
    const values = sourceSeries.map(d => d.value);
    const spanSeconds = sourceSeries.length > 1 ? sourceSeries[sourceSeries.length - 1].time - sourceSeries[0].time : 0;
    const interval = Math.max(0, Math.floor(sourceSeries.length / 6) - 1);
    const bounds = getChartBounds(values, fixedBounds);

    return {
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none', minSpan: 10 },
      ],
      grid: { top: 24, right: 24, bottom: 32, left: 56 },
      xAxis: {
        type: 'category',
        data: sourceSeries.map(d => d.time),
        axisLabel: {
          fontSize: 11,
          color: chartColors.text,
          interval,
          formatter: value => formatTimestamp(Number(value), spanSeconds, fallbackFrequencySeconds)
        },
        axisLine: { lineStyle: { color: chartColors.border } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: bounds.min,
        max: bounds.max,
        axisLabel: {
          fontSize: 11,
          color: chartColors.text,
          formatter: showPercentAxis ? '{value}%' : undefined,
        },
        splitLine: { lineStyle: { color: chartColors.border, type: 'dashed' } }
      },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: chartColors.primaryLight, width: 2.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        }
      }],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: chartColors.border,
        borderWidth: 1,
        textStyle: { color: chartColors.primary, fontSize: 13 },
        formatter: params => {
          const point = params[0];
          if (!point) return '';
          const valueText = showPercentAxis ? `${point.value.toFixed(1)}%` : point.value;
          return `<strong>${formatTimestamp(Number(point.axisValue), spanSeconds, fallbackFrequencySeconds, 'tooltip')}</strong><br/>${previewLabel}: ${valueText}`;
        }
      }
    };
  }

  const anomalyData = resultData.data || [];
  const anomalyPoints = anomalyData
    .map((d, i) => d.isAnomaly ? { xAxis: i, yAxis: d.value, value: d.value } : null)
    .filter(p => p !== null);
  const values = anomalyData.map(d => d.value);
  const bounds = getChartBounds(values, fixedBounds);
  const interval = Math.max(1, Math.floor(anomalyData.length / 6));
  const spanSeconds = anomalyData.length > 1 ? anomalyData[anomalyData.length - 1].time - anomalyData[0].time : 0;
  const effectiveFrequencySeconds = detectSeriesFrequencySeconds(anomalyData) || fallbackFrequencySeconds;

  return {
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, filterMode: 'none', minSpan: 10 },
    ],
    grid: { top: 48, right: 24, bottom: 40, left: 56 },
    legend: {
      data: [translate({id: 'anomalyDetection.timeSeriesData', message: '时序数据'}), translate({id: 'anomalyDetection.anomalyPoints', message: '异常点'})],
      top: 8,
      textStyle: { fontSize: 12, color: chartColors.text }
    },
    xAxis: {
      type: 'category',
      data: anomalyData.map(d => d.time),
      axisLabel: {
        fontSize: 11,
        color: chartColors.text,
        interval,
        formatter: value => formatTimestamp(Number(value), spanSeconds, effectiveFrequencySeconds)
      },
      axisLine: { lineStyle: { color: chartColors.border } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: bounds.min,
      max: bounds.max,
      axisLabel: {
        fontSize: 11,
        color: chartColors.text,
        formatter: showPercentAxis ? '{value}%' : undefined,
      },
      splitLine: { lineStyle: { color: chartColors.border, type: 'dashed' } }
    },
    series: [
      {
        name: translate({id: 'anomalyDetection.timeSeriesData', message: '时序数据'}),
        data: values,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: chartColors.primaryLight, width: 2.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        },
        markPoint: {
          symbol: 'circle',
          symbolSize: 7,
          itemStyle: {
            color: chartColors.danger,
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(239, 68, 68, 0.5)',
            shadowBlur: 8
          },
          label: { show: false },
          data: anomalyPoints
        }
      },
      {
        name: translate({id: 'anomalyDetection.anomalyPoints', message: '异常点'}),
        type: 'scatter',
        data: [],
        itemStyle: { color: chartColors.danger }
      }
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: chartColors.border,
      borderWidth: 1,
      textStyle: { fontSize: 13 },
      formatter: params => {
        const point = params[0];
        if (!point) return '';
        const idx = point.dataIndex;
        const datum = anomalyData[idx];
        const valueText = showPercentAxis ? `${point.value.toFixed(1)}%` : point.value.toFixed(1);
        let html = `<strong>${formatTimestamp(Number(point.axisValue), spanSeconds, effectiveFrequencySeconds, 'tooltip')}</strong><br/>${previewLabel}: ${valueText}`;
        if (datum?.anomalyProbability != null) html += `<br/>${translate({id: 'anomalyDetection.anomalyProbability', message: '异常概率'})}: ${(datum.anomalyProbability * 100).toFixed(2)}%`;
        if (datum?.isAnomaly) html += `<br/><span style="color:#EF4444;font-weight:600">⚠ ${translate({id: 'anomalyDetection.anomalyDetected', message: '检测到异常'})}</span>`;
        return html;
      }
    }
  };
}

// ==================== 组件 ====================

export default function AnomalyDetection({ apiBase, loginBaseUrl, isLoggedIn, selectedModel, scenarioConfig }) {
  const [dataSource, setDataSource] = useState('sample');
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [inferenceTime, setInferenceTime] = useState(null);
  const [sampleData, setSampleData] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadData, setUploadData] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');

  const sampleChartRef = useRef(null);
  const sampleChartInstance = useRef(null);
  const fileInputRef = useRef(null);
  const uploadChartRef = useRef(null);
  const uploadChartInstance = useRef(null);

  const activeSeries = dataSource === 'upload' && uploadData?.length ? uploadData : sampleData;
  const hasSampleData = Boolean(sampleData?.length);
  const detectedFrequencySeconds = detectSeriesFrequencySeconds(activeSeries);
  const hasResult = Boolean(resultData && !loading);

  const handleResetResult = () => {
    setResultData(null);
    setInferenceTime(null);
    setFormError('');
  };

  const handleReplaceUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // ==================== 图表 ====================

  // 示例数据加载
  useEffect(() => {
    let cancelled = false;

    const loadSampleData = async () => {
      if (dataSource !== 'sample' || sampleData?.length) {
        return;
      }

      try {
        const response = await fetch(defaultSampleDataUrl);
        if (!response.ok) {
          throw new Error(translate({id: 'anomalyDetection.sampleDataLoadFailed', message: '示例数据加载失败: {status}'}, {status: response.status}));
        }

        const text = await response.text();
        const data = parseCsvSeries(text);
        if (!data.length) {
          throw new Error(translate({id: 'anomalyDetection.sampleDataEmptyOrInvalid', message: '示例数据文件为空或格式错误'}));
        }

        if (cancelled) {
          return;
        }

        setFormError('');
        setSampleData(data);
      } catch (err) {
        console.error(translate({id: 'anomalyDetection.sampleDataLoadError', message: '示例数据加载失败:'}), err);
        if (!cancelled) {
          setSampleData(null);
          setFormError(translate({id: 'anomalyDetection.sampleDataLoadFailedWithError', message: '示例数据加载失败: {error}'}, {error: err.message}));
        }
      }
    };

    loadSampleData();

    return () => {
      cancelled = true;
    };
  }, [dataSource, sampleData]);

  // 示例数据图表
  useEffect(() => {
    if (dataSource !== 'sample' || !sampleData?.length || !sampleChartRef.current) {
      return;
    }

    if (sampleChartInstance.current) {
      sampleChartInstance.current.dispose();
    }

    const chart = echarts.init(sampleChartRef.current);
    sampleChartInstance.current = chart;

    chart.setOption(buildAnomalyChartOption({
      sourceSeries: sampleData,
      resultData,
      fallbackFrequencySeconds: detectSeriesFrequencySeconds(sampleData) || 5 * 60,
      previewLabel: 'CPU',
      showPercentAxis: true,
      fixedBounds: { min: 0, max: 100 },
    }));

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [dataSource, sampleData, resultData]);

  // 上传数据图表
  useEffect(() => {
    if (dataSource !== 'upload' || !uploadData?.length || !uploadChartRef.current) {
      return;
    }

    if (uploadChartInstance.current) {
      uploadChartInstance.current.dispose();
    }

    const chart = echarts.init(uploadChartRef.current);
    uploadChartInstance.current = chart;

    chart.setOption(buildAnomalyChartOption({
      sourceSeries: uploadData,
      resultData,
      fallbackFrequencySeconds: detectSeriesFrequencySeconds(uploadData) || detectedFrequencySeconds || 5 * 60,
      previewLabel: translate({id: 'anomalyDetection.previewLabelValue', message: '数值'}),
    }));

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [dataSource, uploadData, resultData, detectedFrequencySeconds]);

  // ==================== 推理 ====================

  const handleRunInference = async () => {
    if (!selectedModel) {
      setFormError(translate({id: 'anomalyDetection.pleaseSelectModel', message: '请选择一个模型'}));
      return;
    }
    if (dataSource === 'sample' && !sampleData?.length) {
      setFormError(translate({id: 'anomalyDetection.sampleDataNotReady', message: '示例数据尚未加载完成'}));
      return;
    }
    if (dataSource === 'upload' && !uploadData) {
      setUploadError(translate({id: 'anomalyDetection.pleaseUploadFirst', message: '请先上传数据文件'}));
      return;
    }

    setFormError('');
    setLoading(true);
    setResultData(null);
    setInferenceTime(null);

    try {
      const source = dataSource === 'upload' ? uploadData : sampleData;
      const payload = source.map(d => ({ timestamp: d.time, value: d.value }));

      const result = await authFetch(
        `${apiBase}/predict/${scenarioConfig.algorithmType}/${selectedModel}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: payload, config: {} }),
        },
        { redirectOnMissingToken: true, loginBaseUrl },
      );

      if (result.reason === 'missing-token') {
        return;
      }
      if (result.reason === 'auth-expired') {
        setFormError(translate({id: 'anomalyDetection.loginExpired', message: '登录已过期，请重新登录后重试'}));
        return;
      }
      if (result.reason === 'http-error') {
        throw new Error(translate({id: 'anomalyDetection.inferenceRequestFailed', message: '推理请求失败: {status}'}, {status: result.status}));
      }
      if (result.reason === 'network-error') {
        throw result.error || new Error(translate({id: 'anomalyDetection.networkRequestFailed', message: '网络请求失败'}));
      }

      const json = await result.response.json();
      const results = json.data?.results || [];
      const adapted = results.map(item => ({
        time: item.timestamp,
        value: item.value,
        isAnomaly: item.label === 1,
        anomalyScore: item.anomaly_score,
      }));
      setResultData({
        type: 'timeseries-anomaly',
        data: adapted,
        metadata: json.data?.metadata || {},
      });
      setInferenceTime(json.data?.metadata?.execution_time_ms ?? null);
    } catch (err) {
      console.error(translate({id: 'anomalyDetection.inferenceError', message: '推理请求失败:'}), err);
      setFormError(translate({id: 'anomalyDetection.inferenceFailed', message: '推理失败: {error}'}, {error: err.message}));
    } finally {
      setLoading(false);
    }
  };

  // ==================== 文件上传 ====================

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleResetResult();
    setUploadFileName(file.name);
    setUploadError('');
    setUploadData(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        let parsed = [];

        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          const arr = Array.isArray(json) ? json : json.data || [];
          parsed = arr.map(item => ({
            time: parseTimestamp(item.timestamp ?? item.time ?? item.ts),
            value: Number(item.value || item.val || 0)
          }));
        } else {
          parsed = parseCsvSeries(text);
        }

        if (parsed.length === 0) {
          setUploadError(translate({id: 'anomalyDetection.noValidDataParsed', message: '未解析到有效数据，请检查文件格式'}));
          return;
        }
        setUploadData(parsed);
      } catch (err) {
        console.error(translate({id: 'anomalyDetection.fileParseError', message: '文件解析失败:'}), err);
        setUploadError(translate({id: 'anomalyDetection.fileParseFailed', message: '文件解析失败，请检查文件格式'}));
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const csvContent = [
      'timestamp,value',
      '1704067200,45.2',
      '1704067500,47.8',
      '1704067800,42.1',
      '1704068100,50.5',
      '1704068400,48.3',
      '# ' + translate({id: 'anomalyDetection.templateNote', message: '说明:'}),
      '# timestamp: ' + translate({id: 'anomalyDetection.templateTimestampDesc', message: 'Unix 秒级整数时间戳 (如 1704067200 表示 2024-01-01 08:00:00)'}),
      '# value: ' + translate({id: 'anomalyDetection.templateValueDesc', message: '数值型指标'})
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const renderResultHeader = () => (
    <div className={styles.resultHeader}>
      <div className={styles.resultHeaderMain}>
        <span className={styles.resultIndicator} aria-hidden="true">
          <FiTrendingUp />
        </span>
        <span className={styles.resultHeaderTitle}>
          {dataSource === 'upload' ? uploadFileName : translate({id: 'anomalyDetection.serverCpuMonitorData', message: '服务器 CPU 使用率监控数据'})}
        </span>
      </div>
      <div className={styles.resultHeaderActions}>
        {dataSource === 'upload' && uploadData && (
          <button type="button" className={clsx(styles.resultAction, styles.resultActionSubtle)} onClick={handleReplaceUpload}>
            {translate({id: 'anomalyDetection.reUpload', message: '重新上传'})}
          </button>
        )}
        <button type="button" className={styles.resultAction} onClick={handleResetResult}>
          {translate({id: 'anomalyDetection.resetResult', message: '重置结果'})}
        </button>
        <span className={styles.resultStatus}>
          <FiCheck />
          {translate({id: 'anomalyDetection.detectionComplete', message: '检测完成'})}
        </span>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className={styles.resultSummary}>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>{translate({id: 'anomalyDetection.totalDataPoints', message: '数据点总数'})}</span>
        <span className={styles.resultStatValue}>
          {resultData?.data?.length || 0}
        </span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>{translate({id: 'anomalyDetection.anomaliesDetected', message: '检测到异常'})}</span>
        <span className={clsx(styles.resultStatValue, styles.resultStatValueAnomaly)}>
          {resultData?.data?.filter(d => d.isAnomaly).length || 0}
        </span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>{translate({id: 'anomalyDetection.anomalyRatio', message: '异常占比'})}</span>
        <span className={styles.resultStatValue}>
          {resultData?.data?.length ? `${(resultData.data.filter(d => d.isAnomaly).length / resultData.data.length * 100).toFixed(2)}%` : '0%'}
        </span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>{translate({id: 'anomalyDetection.inferenceTime', message: '推理耗时'})}</span>
        <span className={styles.resultStatValue}>{inferenceTime != null ? (inferenceTime / 1000).toFixed(2) + 's' : '-'}</span>
      </div>
    </div>
  );

  // ==================== JSX ====================

  return (
    <div className={styles.scenarioContent}>
      <div className={styles.formGroup}>
        <div className={styles.formLabel}>{translate({id: 'anomalyDetection.dataSource', message: '数据源'})}</div>
        <div className={styles.dataSourceTabs}>
          <button
            type="button"
            className={clsx(styles.dataSourceTab, dataSource === 'sample' && styles.active)}
            onClick={() => {
              handleResetResult();
              setDataSource('sample');
              setUploadFileName('');
              setUploadData(null);
              setUploadError('');
            }}
          >
            {translate({id: 'anomalyDetection.sampleData', message: '示例数据'})}
          </button>
          <button
            type="button"
            className={clsx(styles.dataSourceTab, dataSource === 'upload' && styles.active)}
            onClick={() => {
              handleResetResult();
              setDataSource('upload');
            }}
          >
            {translate({id: 'anomalyDetection.uploadFile', message: '上传文件'})}
          </button>
        </div>

        {dataSource === 'upload' && (
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".csv,.json"
            onChange={handleFileUpload}
          />
        )}

        {dataSource === 'sample' && (
          <div className={styles.sampleDataSection}>
            <div className={clsx(styles.sampleDataCard, hasResult && styles.sampleDataCardResult)}>
              {hasResult ? renderResultHeader() : (
                <div className={styles.sampleDataHeader}>
                  <span className={styles.sampleDataTitle}>
                    <FiActivity />
                    {translate({id: 'anomalyDetection.serverCpuMonitorData', message: '服务器 CPU 使用率监控数据'})}
                  </span>
                  <span className={styles.sampleDataInfo}>{getSampleMetaText(sampleData)}</span>
                </div>
              )}
              <div className={clsx(styles.sampleDataChart, hasResult && styles.sampleDataChartResult)} ref={sampleChartRef}></div>
              {hasResult && renderSummary()}
              {loading && <LoadingOverlay />}
            </div>
          </div>
        )}

        {dataSource === 'upload' && !uploadData && (
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
                  {uploadFileName ? translate({id: 'anomalyDetection.fileSelected', message: '已选择: {fileName}'}, {fileName: uploadFileName}) : translate({id: 'anomalyDetection.clickOrDragUpload', message: '点击或拖拽上传文件'})}
                </p>
                <p className={styles.uploadAreaHint}>{translate({id: 'anomalyDetection.supportedFormats', message: '支持 CSV, JSON 格式，时间戳支持 Unix 整数或日期字符串'})}</p>
              </button>
              <button type="button" className={styles.templateDownload} onClick={handleDownloadTemplate}>
                <FiDownload />
                {translate({id: 'anomalyDetection.downloadTemplate', message: '下载数据模板'})}
              </button>
            </div>
            {uploadError && (
              <p className={styles.uploadErrorText}>{uploadError}</p>
            )}
          </div>
        )}

        {dataSource === 'upload' && uploadData && (
          <div className={styles.sampleDataSection}>
            <div className={clsx(styles.sampleDataCard, hasResult && styles.sampleDataCardResult)}>
              {hasResult ? renderResultHeader() : (
                <div className={styles.sampleDataHeader}>
                  <div className={styles.sampleDataHeaderMain}>
                    <span className={styles.sampleDataTitle}>
                      <FiActivity />
                      {uploadFileName}
                    </span>
                    <span className={styles.sampleDataInfo}>{uploadData.length} points</span>
                  </div>
                  <button
                    type="button"
                    className={styles.uploadReplaceTop}
                    onClick={handleReplaceUpload}
                  >
                    {translate({id: 'anomalyDetection.reUpload', message: '重新上传'})}
                  </button>
                </div>
              )}
              <div className={clsx(styles.sampleDataChart, hasResult && styles.sampleDataChartResult)} ref={uploadChartRef}></div>
              {hasResult && renderSummary()}
              {loading && <LoadingOverlay />}
            </div>
          </div>
        )}
      </div>

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
          disabled={loading || !selectedModel || (dataSource === 'sample' ? !hasSampleData : !uploadData?.length)}
        >
          <FiPlay />
          开始异常检测
        </button>
      </div>

    </div>
  );
}
