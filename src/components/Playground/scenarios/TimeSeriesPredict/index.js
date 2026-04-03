import React, { useState, useEffect, useRef } from 'react';

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
    throw new Error('CSV 格式错误：需要包含 timestamp 和 value 列');
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
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '未知时长';

  if (totalSeconds % 86400 === 0) {
    const days = totalSeconds / 86400;
    return `${days}天`;
  }

  if (totalSeconds % 3600 === 0) {
    const hours = totalSeconds / 3600;
    return `${hours}小时`;
  }

  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.round((totalSeconds % 3600) / 60);
    return minutes ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }

  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes}分钟`;
}

function getSampleMetaText(series) {
  if (!Array.isArray(series) || series.length === 0) return '加载中...';

  const frequencySeconds = detectSeriesFrequencySeconds(series) || 5 * 60;
  const spanSeconds = series.length > 1 ? series[series.length - 1].time - series[0].time : frequencySeconds;
  return `${formatDurationLabel(spanSeconds || frequencySeconds)} · ${series.length} points`;
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
        <span>模型推理中...</span>
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

function buildForecastChartOption({
  sourceSeries,
  resultData,
  fallbackFrequencySeconds,
  previewLabel,
  showPercentAxis = false,
  fixedBounds = null,
}) {
  const hasResult = Boolean(resultData?.history?.length);

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

  const history = resultData.history || [];
  const prediction = resultData.prediction || [];
  const allData = [...history, ...prediction];
  const allValues = allData.map(d => d.value);
  const bounds = getChartBounds(allValues);
  const interval = Math.max(1, Math.floor(allData.length / 6));
  const spanSeconds = allData.length > 1 ? allData[allData.length - 1].time - allData[0].time : 0;
  const effectiveFrequencySeconds = detectSeriesFrequencySeconds(allData) || fallbackFrequencySeconds;
  const historyValues = history.map(d => d.value);
  const predictionStartIndex = Math.max(0, history.length - 1);
  const predictionEndIndex = Math.max(predictionStartIndex, allData.length - 1);
  const overlapPadding = new Array(Math.max(0, history.length - 1)).fill(null);
  const overlapPrediction = [
    history[history.length - 1]?.value ?? null,
    ...prediction.map(d => d.value),
  ];

  return {
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, filterMode: 'none', minSpan: 10 },
    ],
    grid: { top: 24, right: 24, bottom: 40, left: 56 },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: allData.map(d => d.time),
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
      axisLabel: { fontSize: 11, color: chartColors.text },
      splitLine: { lineStyle: { color: chartColors.border, type: 'dashed' } }
    },
    series: [
      {
        name: '历史数据',
        data: historyValues,
        type: 'line',
        smooth: true,
        symbol: 'none',
        showSymbol: false,
        lineStyle: { color: chartColors.primaryLight, width: 2.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        }
      },
      {
        name: '预测数据',
        data: [...overlapPadding, ...overlapPrediction],
        type: 'line',
        smooth: true,
        symbol: 'none',
        showSymbol: false,
        lineStyle: { color: '#F59E0B', width: 2.5, type: 'dashed' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 158, 11, 0.18)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.02)' }
          ])
        }
      },
      {
        type: 'scatter',
        data: [],
        symbol: 'none',
        silent: true,
        tooltip: { show: false },
        emphasis: { disabled: true },
        markArea: {
          silent: true,
          label: { show: false },
          itemStyle: {
            color: 'rgba(245, 158, 11, 0.08)',
            borderWidth: 0,
          },
          data: prediction.length > 0
            ? [[
              {
                xAxis: predictionStartIndex,
                yAxis: 'min',
              },
              {
                xAxis: predictionEndIndex,
                yAxis: 'max',
              }
            ]]
            : []
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: chartColors.border,
      borderWidth: 1,
      textStyle: { fontSize: 13 },
      formatter: params => {
        const point = params[0] || params[1];
        if (!point) return '';
        let html = `<strong>${formatTimestamp(Number(point.axisValue), spanSeconds, effectiveFrequencySeconds, 'tooltip')}</strong>`;
        params.forEach(p => {
          if (p.value != null) {
            const color = p.seriesName === '预测数据' ? '#F59E0B' : chartColors.primaryLight;
            html += `<br/><span style="color:${color}">${p.seriesName}: ${p.value.toFixed(1)}</span>`;
          }
        });
        return html;
      }
    }
  };
}

const minPredictionSteps = 1;
const maxPredictionSteps = 12;

// ==================== 组件 ====================

export default function TimeSeriesPredict({ apiBase, loginBaseUrl, isLoggedIn, selectedModel, scenarioConfig }) {
  const [dataSource, setDataSource] = useState('sample');
  const [selectedSteps, setSelectedSteps] = useState(maxPredictionSteps);
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
  const frequencyLabel = detectedFrequencySeconds ? formatDurationLabel(detectedFrequencySeconds) : '5分钟';
  const hasResult = Boolean(resultData && !loading);

  const getPredictionTimeLabel = (steps) => {
    const baseFrequency = detectedFrequencySeconds || 5 * 60;
    return formatDurationLabel(baseFrequency * steps);
  };

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
          throw new Error(`示例数据加载失败: ${response.status}`);
        }

        const text = await response.text();
        const data = parseCsvSeries(text);
        if (!data.length) {
          throw new Error('示例数据文件为空或格式错误');
        }

        if (cancelled) {
          return;
        }

        setFormError('');
        setSampleData(data);
      } catch (err) {
        console.error('示例数据加载失败:', err);
        if (!cancelled) {
          setSampleData(null);
          setFormError(`示例数据加载失败: ${err.message}`);
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

    chart.setOption(buildForecastChartOption({
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

    chart.setOption(buildForecastChartOption({
      sourceSeries: uploadData,
      resultData,
      fallbackFrequencySeconds: detectSeriesFrequencySeconds(uploadData) || detectedFrequencySeconds || 5 * 60,
      previewLabel: '数值',
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
      setFormError('请选择一个模型');
      return;
    }
    if (dataSource === 'sample' && !sampleData?.length) {
      setFormError('示例数据尚未加载完成');
      return;
    }
    if (dataSource === 'upload' && !uploadData) {
      setUploadError('请先上传数据文件');
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
          body: JSON.stringify({ data: payload, config: { steps: selectedSteps } }),
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
      const inner = json.data || {};
      const history = (inner.history || []).map(item => ({
        time: item.timestamp,
        value: item.value,
      }));
      const prediction = (inner.prediction || []).map(item => ({
        time: item.timestamp,
        value: item.value,
      }));
      setResultData({
        type: 'timeseries-predict',
        history,
        prediction,
        metadata: inner.metadata || {},
      });
      setInferenceTime(inner.metadata?.execution_time_ms ?? null);
    } catch (err) {
      console.error('推理请求失败:', err);
      setFormError(`推理失败: ${err.message}`);
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
          setUploadError('未解析到有效数据，请检查文件格式');
          return;
        }
        setUploadData(parsed);
      } catch (err) {
        console.error('文件解析失败:', err);
        setUploadError('文件解析失败，请检查文件格式');
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
      '# 说明:',
      '# timestamp: Unix 秒级整数时间戳 (如 1704067200 表示 2024-01-01 08:00:00)',
      '# value: 数值型指标'
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
          {dataSource === 'upload' ? uploadFileName : '服务器 CPU 使用率监控数据'}
        </span>
      </div>
      <div className={styles.resultHeaderActions}>
        {dataSource === 'upload' && uploadData && (
          <button type="button" className={clsx(styles.resultAction, styles.resultActionSubtle)} onClick={handleReplaceUpload}>
            重新上传
          </button>
        )}
        <button type="button" className={styles.resultAction} onClick={handleResetResult}>
          重置结果
        </button>
        <span className={styles.resultStatus}>
          <FiCheck />
          预测完成
        </span>
      </div>
    </div>
  );

  const renderChartLegend = () => (
    <div className={styles.chartLegend}>
      <span className={styles.chartLegendItem}>
        <span className={clsx(styles.chartLegendLine, styles.chartLegendLineHistory)} aria-hidden="true"></span>
        历史数据
      </span>
      <span className={styles.chartLegendItem}>
        <span className={clsx(styles.chartLegendLine, styles.chartLegendLinePrediction)} aria-hidden="true"></span>
        预测数据
      </span>
    </div>
  );

  const renderSummary = () => (
    <div className={styles.resultSummary}>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>输入数据点</span>
        <span className={styles.resultStatValue}>
          {resultData?.metadata?.input_data_points || resultData?.history?.length || 0}
        </span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>预测时间</span>
        <span className={styles.resultStatValue}>
          {getPredictionTimeLabel(resultData?.metadata?.prediction_steps || selectedSteps || resultData?.prediction?.length || 0)}
        </span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>预测频率</span>
        <span className={styles.resultStatValue}>
          {resultData?.metadata?.input_frequency || '-'}
        </span>
      </div>
      <div className={styles.resultStat}>
        <span className={styles.resultStatLabel}>推理耗时</span>
        <span className={styles.resultStatValue}>{inferenceTime != null ? (inferenceTime / 1000).toFixed(2) + 's' : '-'}</span>
      </div>
    </div>
  );

  // ==================== JSX ====================

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
              setUploadFileName('');
              setUploadData(null);
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
                    服务器 CPU 使用率监控数据
                  </span>
                  <span className={styles.sampleDataInfo}>{getSampleMetaText(sampleData)}</span>
                </div>
              )}
              {hasResult && renderChartLegend()}
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
                  {uploadFileName ? `已选择: ${uploadFileName}` : '点击或拖拽上传文件'}
                </p>
                <p className={styles.uploadAreaHint}>支持 CSV, JSON 格式，时间戳支持 Unix 整数或日期字符串</p>
              </button>
              <button type="button" className={styles.templateDownload} onClick={handleDownloadTemplate}>
                <FiDownload />
                下载数据模板
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
                    重新上传
                  </button>
                </div>
              )}
              {hasResult && renderChartLegend()}
              <div className={clsx(styles.sampleDataChart, hasResult && styles.sampleDataChartResult)} ref={uploadChartRef}></div>
              {hasResult && renderSummary()}
              {loading && <LoadingOverlay />}
            </div>
          </div>
        )}
      </div>

      <div className={styles.formGroup}>
        <div className={styles.formLabel}>预测时间</div>
        <div className={styles.stepsCard}>
          <div className={styles.stepsHeader}>
            <p className={styles.stepsHint}>拖动下方滑块可调整未来预测时长，当前每个数据点约为 {frequencyLabel}。</p>
            <div className={styles.stepsValue}>
              <div className={styles.stepsValueMain}>
                <span className={styles.stepsValueLabel}>当前预测范围</span>
                <span className={styles.stepsValueText}>{getPredictionTimeLabel(selectedSteps)}</span>
              </div>
            </div>
          </div>
          <div className={styles.stepsSliderGroup}>
            <input
              type="range"
              min={minPredictionSteps}
              max={maxPredictionSteps}
              step={1}
              value={selectedSteps}
              className={styles.stepsSlider}
              onChange={(e) => setSelectedSteps(Number(e.target.value))}
              disabled={loading}
            />
            <div className={styles.stepsScale}>
              <span className={styles.stepsScaleLabel}>{getPredictionTimeLabel(minPredictionSteps)}</span>
              <span className={styles.stepsScaleLabel}>{getPredictionTimeLabel(maxPredictionSteps)}</span>
            </div>
          </div>
        </div>
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
          开始时序预测
        </button>
      </div>

    </div>
  );
}
