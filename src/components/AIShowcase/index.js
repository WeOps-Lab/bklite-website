import clsx from 'clsx';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';
import { FadeInUp, StaggerContainer, StaggerItem } from '@site/src/components/ScrollAnimations';
import { TiltCard } from '@site/src/components/TiltCard';
import styles from './styles.module.css';

function getPlatformFeatures() {
  return [
    {
      icon: '🔒',
      title: translate({id: 'showcase.security.title', message: '涉密环境支持'}),
      description: translate({id: 'showcase.security.desc', message: '端到端安全架构，满足等保三级要求，为关键系统提供可信运行环境'}),
      badge: translate({id: 'showcase.security.badge', message: '安全可信'}),
      color: 'purple',
      metric: translate({id: 'showcase.security.metric', message: '等保三级'}),
      highlights: [
        translate({id: 'showcase.security.highlight1', message: '国密算法'}),
        translate({id: 'showcase.security.highlight2', message: '数据隔离'}),
      ]
    },
    {
      icon: '⚡',
      title: translate({id: 'showcase.lightweight.title', message: '极致轻量'}),
      description: translate({id: 'showcase.lightweight.desc', message: '优化架构设计与资源调度，在保障能力的同时显著降低系统能耗'}),
      badge: translate({id: 'showcase.lightweight.badge', message: '高效节能'}),
      color: 'green',
      metric: translate({id: 'showcase.lightweight.metric', message: '50%↓能耗'}),
      highlights: [
        translate({id: 'showcase.lightweight.highlight1', message: '智能调度'}),
        translate({id: 'showcase.lightweight.highlight2', message: '绿色运维'}),
      ]
    },
    {
      icon: '💰',
      title: translate({id: 'showcase.cost.title', message: '成本优化'}),
      description: translate({id: 'showcase.cost.desc', message: '简化部署与运维流程，通过自动化大幅降低总体持有成本'}),
      badge: translate({id: 'showcase.cost.badge', message: 'TCO优化'}),
      color: 'blue',
      metric: translate({id: 'showcase.cost.metric', message: '60%↓成本'}),
      highlights: [
        translate({id: 'showcase.cost.highlight1', message: '自动运维'}),
        translate({id: 'showcase.cost.highlight2', message: '按需扩展'}),
      ]
    },
    {
      icon: '🚀',
      title: translate({id: 'showcase.edge.title', message: '边缘自治'}),
      description: translate({id: 'showcase.edge.desc', message: '支持边缘环境独立运行，具备断网续航与故障自愈能力'}),
      badge: translate({id: 'showcase.edge.badge', message: '边缘计算'}),
      color: 'orange',
      metric: translate({id: 'showcase.edge.metric', message: '离线运行'}),
      highlights: [
        translate({id: 'showcase.edge.highlight1', message: '自动修复'}),
        translate({id: 'showcase.edge.highlight2', message: '智能决策'}),
      ]
    },
    {
      icon: '🤖',
      title: translate({id: 'showcase.ai.title', message: 'AI 原生'}),
      description: translate({id: 'showcase.ai.desc', message: '深度集成大模型能力，提供智能诊断、决策辅助与自动修复'}),
      badge: translate({id: 'showcase.ai.badge', message: 'AI驱动'}),
      color: 'indigo',
      metric: translate({id: 'showcase.ai.metric', message: '智能预测'}),
      highlights: [
        translate({id: 'showcase.ai.highlight1', message: '智能诊断'}),
        translate({id: 'showcase.ai.highlight2', message: '自主修复'}),
      ]
    },
    {
      icon: '📈',
      title: translate({id: 'showcase.scaling.title', message: '无感扩容'}),
      description: translate({id: 'showcase.scaling.desc', message: '一体机模式即插即用，新节点自动识别并纳管，平滑扩展集群'}),
      badge: translate({id: 'showcase.scaling.badge', message: '弹性伸缩'}),
      color: 'teal',
      metric: translate({id: 'showcase.scaling.metric', message: '即插即用'}),
      highlights: [
        translate({id: 'showcase.scaling.highlight1', message: '零配置'}),
        translate({id: 'showcase.scaling.highlight2', message: '平滑扩展'}),
      ]
    },
    {
      icon: '🌍',
      title: translate({id: 'showcase.i18n.title', message: '国际化'}),
      description: translate({id: 'showcase.i18n.desc', message: '支持多语言界面与多地区合规适配，满足全球化部署需求'}),
      badge: translate({id: 'showcase.i18n.badge', message: '全球化'}),
      color: 'cyan',
      metric: translate({id: 'showcase.i18n.metric', message: '多语言'}),
      highlights: [
        translate({id: 'showcase.i18n.highlight1', message: '合规适配'}),
        translate({id: 'showcase.i18n.highlight2', message: '全球部署'}),
      ]
    },
    {
      icon: '🔗',
      title: translate({id: 'showcase.ecosystem.title', message: '开放生态'}),
      description: translate({id: 'showcase.ecosystem.desc', message: '提供完善的插件体系与开放API，支持第三方系统深度集成'}),
      badge: translate({id: 'showcase.ecosystem.badge', message: '生态开放'}),
      color: 'pink',
      metric: translate({id: 'showcase.ecosystem.metric', message: '开放API'}),
      highlights: [
        translate({id: 'showcase.ecosystem.highlight1', message: '插件系统'}),
        translate({id: 'showcase.ecosystem.highlight2', message: '生态集成'}),
      ]
    }
  ];
}

function PlatformFeature({ icon, title, description, badge, color, metric, highlights }) {
  return (
    <TiltCard className={styles.platformFeatureItem} tiltAmount={6} scale={1.02}>
      <div className={clsx(styles.platformFeatureCard, styles[color])}>
        <div className={styles.cardHeader}>
          <div className={styles.platformFeatureIcon}>
            <span className={styles.iconEmoji}>{icon}</span>
          </div>
          <div className={styles.cardBadge}>{badge}</div>
        </div>

        <div className={styles.platformFeatureContent}>
          <Heading as="h3" className={styles.platformFeatureTitle}>
            {title}
          </Heading>
          <p className={styles.platformFeatureDescription}>
            {description}
          </p>

          <div className={styles.metricHighlight}>
            <span className={styles.metricValue}>{metric}</span>
            <div className={styles.highlightTags}>
              {highlights.map((highlight, idx) => (
                <span key={idx} className={styles.highlightTag}>
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.cardGlow}></div>
      </div>
    </TiltCard>
  );
}

export default function PlatformShowcase() {
  const platformFeatures = getPlatformFeatures();
  return (
    <section className={styles.platformShowcase}>
      <div className={styles.container}>
        <FadeInUp>
          <div className={styles.sectionHeader}>
            <Heading as="h2" className={styles.sectionTitle}>
              <Translate id="showcase.sectionTitle">关键特性</Translate>
            </Heading>
          </div>
        </FadeInUp>

        <StaggerContainer className={styles.platformFeatureGrid} staggerDelay={0.06}>
          {platformFeatures.map((feature, idx) => (
            <StaggerItem key={idx} direction="up">
              <PlatformFeature {...feature} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}