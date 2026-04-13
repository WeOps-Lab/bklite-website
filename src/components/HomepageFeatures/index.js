import clsx from 'clsx';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';
import { FadeInUp, StaggerContainer, StaggerItem } from '@site/src/components/ScrollAnimations';
import { TiltCard } from '@site/src/components/TiltCard';
import styles from './styles.module.css';
import { FaUserShield, FaSearch, FaChartBar, FaBell, FaLaptopCode, FaCloud, FaChartLine, FaTasks } from 'react-icons/fa';
import { RiMindMap, RiFlowChart } from 'react-icons/ri';
import { HiOutlineDatabase, HiOutlineChip } from 'react-icons/hi';

function getFeatureGroups() {
  return [
    {
      groupTitle: translate({id: 'features.classic.title', message: '经典运维'}),
      groupSubtitle: translate({id: 'features.classic.subtitle', message: '成熟稳定的运维能力体系'}),
      features: [
        {
          title: translate({id: 'features.monitor.title', message: '监控中心'}),
          icon: <FaChartBar color="var(--ifm-color-primary)" />,
          gradient: 'gradient-monitoring',
          badge: translate({id: 'features.monitor.badge', message: '全域监控'}),
          highlights: [
            translate({id: 'features.monitor.highlight1', message: '秒级监控'}),
            translate({id: 'features.monitor.highlight2', message: '弹性采集'}),
            translate({id: 'features.monitor.highlight3', message: '精准告警'}),
          ],
          description: (
            <Translate id="features.monitor.description">
              全域监控体系，秒级采集与精准告警，保障系统稳定运行
            </Translate>
          ),
        },
        {
          title: translate({id: 'features.log.title', message: '日志中心'}),
          icon: <FaSearch color="var(--ifm-color-primary)" />,
          gradient: 'gradient-log',
          badge: translate({id: 'features.log.badge', message: '日志分析'}),
          highlights: [
            translate({id: 'features.log.highlight1', message: '故障定位'}),
            translate({id: 'features.log.highlight2', message: '合规留存'}),
            translate({id: 'features.log.highlight3', message: '日志洞察'}),
          ],
          description: (
            <Translate id="features.log.description">
              支持日志的合规留存与快速检索，为故障排查与审计追溯提供可靠依据
            </Translate>
          ),
        },
        {
          title: translate({id: 'features.cmdb.title', message: 'CMDB'}),
          icon: <HiOutlineDatabase color="var(--ifm-color-primary)" />,
          gradient: 'gradient-3',
          badge: translate({id: 'features.cmdb.badge', message: '资产地图'}),
          highlights: [
            translate({id: 'features.cmdb.highlight1', message: '资产可视'}),
            translate({id: 'features.cmdb.highlight2', message: '架构清晰'}),
            translate({id: 'features.cmdb.highlight3', message: '数据可信'}),
          ],
          description: (
            <Translate id="features.cmdb.description">
              构建可信的IT资产地图。全面采集与架构还原，为运维决策与合规管理提供数据基础
            </Translate>
          ),
        },
        {
          title: translate({id: 'features.alert.title', message: '告警中心'}),
          icon: <FaBell color="var(--ifm-color-primary)" />,
          gradient: 'gradient-6',
          badge: translate({id: 'features.alert.badge', message: '告警响应'}),
          highlights: [
            translate({id: 'features.alert.highlight1', message: '降低干扰'}),
            translate({id: 'features.alert.highlight2', message: '精准分派'}),
            translate({id: 'features.alert.highlight3', message: '快速闭环'}),
          ],
          description: (
            <Translate id="features.alert.description">
              汇聚多源告警并智能降噪，通过精准分派加速响应，确保问题快速闭环
            </Translate>
          ),
        },
        {
          title: translate({id: 'features.itsm.title', message: 'ITSM'}),
          icon: <RiFlowChart color="var(--ifm-color-primary)" />,
          gradient: 'gradient-2',
          badge: translate({id: 'features.itsm.badge', message: '流程规范'}),
          highlights: [
            translate({id: 'features.itsm.highlight1', message: '标准执行'}),
            translate({id: 'features.itsm.highlight2', message: '透明可控'}),
            translate({id: 'features.itsm.highlight3', message: '合规保障'}),
          ],
          description: (
            <Translate id="features.itsm.description">
              规范工单、变更与事件流程，确保运维执行标准化、过程可追溯、合规有保障
            </Translate>
          ),
        },
        {
          title: translate({id: 'features.job.title', message: '作业管理'}),
          icon: <FaTasks color="var(--ifm-color-primary)" />,
          gradient: 'gradient-job',
          badge: translate({id: 'features.job.badge', message: '自动化执行'}),
          highlights: [
            translate({id: 'features.job.highlight1', message: '批量执行'}),
            translate({id: 'features.job.highlight2', message: '文件分发'}),
            translate({id: 'features.job.highlight3', message: '定时调度'}),
          ],
          description: (
            <Translate id="features.job.description">
              统一任务下发平台，支持脚本执行、文件分发与定时调度，提升批量运维效率
            </Translate>
          ),
        },
        {
          title: translate({id: 'features.analysis.title', message: '运营分析'}),
          icon: <FaChartLine color="var(--ifm-color-primary)" />,
          gradient: 'gradient-9',
          badge: translate({id: 'features.analysis.badge', message: '洞察分析'}),
          highlights: [
            translate({id: 'features.analysis.highlight1', message: '数据融合'}),
            translate({id: 'features.analysis.highlight2', message: '智能分析'}),
            translate({id: 'features.analysis.highlight3', message: '价值呈现'}),
          ],
          description: (
            <Translate id="features.analysis.description">
              融合多源运维数据，通过智能分析将运维洞察转化为业务价值与决策依据
            </Translate>
          ),
        },
      ]
    },
    {
      groupTitle: translate({id: 'features.platform.title', message: '平台底座'}),
      groupSubtitle: translate({id: 'features.platform.subtitle', message: '统一的基础支撑能力'}),
      features: [
        {
          title: translate({id: 'features.console.title', message: '控制台'}),
          icon: <FaLaptopCode color="var(--ifm-color-primary)" />,
          gradient: 'gradient-7',
          badge: translate({id: 'features.console.badge', message: '工作门户'}),
          highlights: [
            translate({id: 'features.console.highlight1', message: '一站访问'}),
            translate({id: 'features.console.highlight2', message: '通知聚合'}),
            translate({id: 'features.console.highlight3', message: '智能推荐'}),
          ],
          description: (
            <Translate id="features.console.description">
              统一工作门户。汇聚多源通知，提供智能入口与个性化配置，提升团队协作效率
            </Translate>
          ),
        },
        {
          title: translate({id: 'features.system.title', message: '系统管理'}),
          icon: <FaUserShield color="var(--ifm-color-primary)" />,
          gradient: 'gradient-8',
          badge: translate({id: 'features.system.badge', message: '安全合规'}),
          highlights: [
            translate({id: 'features.system.highlight1', message: '权限隔离'}),
            translate({id: 'features.system.highlight2', message: '精细管控'}),
            translate({id: 'features.system.highlight3', message: '全程追溯'}),
          ],
          description: (
            <Translate id="features.system.description">
              多租户权限管理与审计追踪，确保系统访问安全可控、操作全程可追溯
            </Translate>
          ),
        },
        {
          title: translate({id: 'features.node.title', message: '节点管理'}),
          icon: <FaCloud color="var(--ifm-color-primary)" />,
          gradient: 'gradient-10',
          badge: translate({id: 'features.node.badge', message: '节点治理'}),
          highlights: [
            translate({id: 'features.node.highlight1', message: '跨云管理'}),
            translate({id: 'features.node.highlight2', message: '自动部署'}),
            translate({id: 'features.node.highlight3', message: '状态可视'}),
          ],
          description: (
            <Translate id="features.node.description">
              跨云节点的统一管理。支持探针自动部署与进程托管，简化大规模集群运维
            </Translate>
          ),
        },
      ]
    },
    {
      groupTitle: translate({id: 'features.intelligent.title', message: '智能运维'}),
      groupSubtitle: translate({id: 'features.intelligent.subtitle', message: 'AI驱动的运维创新'}),
      features: [
        {
          title: translate({id: 'features.opspilot.title', message: 'OpsPilot'}),
          icon: <RiMindMap color="var(--ifm-color-primary)" />,
          gradient: 'gradient-opspilot',
          badge: translate({id: 'features.opspilot.badge', message: '运维领航员'}),
          highlights: [
            translate({id: 'features.opspilot.highlight1', message: '自主诊断'}),
            translate({id: 'features.opspilot.highlight2', message: '智能决策'}),
            translate({id: 'features.opspilot.highlight3', message: '自动修复'}),
          ],
          description: (
            <Translate id="features.opspilot.description">
              基于大模型与知识图谱，引导团队快速定位问题、智能决策并高效修复
            </Translate>
          ),
        },
        {
          title: translate({id: 'features.mlops.title', message: 'MLOps'}),
          icon: <HiOutlineChip color="var(--ifm-color-primary)" />,
          gradient: 'gradient-11',
          badge: translate({id: 'features.mlops.badge', message: '模型工厂'}),
          highlights: [
            translate({id: 'features.mlops.highlight1', message: '数据标注'}),
            translate({id: 'features.mlops.highlight2', message: '模型训练'}),
            translate({id: 'features.mlops.highlight3', message: '能力发布'}),
          ],
          description: (
            <Translate id="features.mlops.description">
              面向运维场景，整合数据标注、模型训练与能力发布，打造统一的模型工厂，加速智能运维能力落地
            </Translate>
          ),
        },
      ]
    },
  ];
}

function Feature({ title, description, gradient, icon, badge, metric, highlights }) {
  return (
    <TiltCard className={styles.featureItem} tiltAmount={8} scale={1.02}>
      <div className={clsx(styles.featureCard, styles[gradient])}>
        <div className={styles.cardHeader}>
          <div className={styles.featureIcon}>
            <div className={styles.iconEmoji}>{icon}</div>
          </div>
          <div className={styles.cardBadge}>{badge}</div>
        </div>

        <div className={styles.featureContent}>
          <Heading as="h3" className={styles.featureTitle}>
            {title}
          </Heading>
          <p className={styles.featureDescription}>{description}</p>

          <div className={styles.metricHighlight}>
            <div className={styles.highlightTags}>
              {highlights.map((highlight, idx) => (
                <span key={idx} className={styles.highlightTag}>
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={clsx(styles.featureGlow, styles[gradient])}></div>
      </div>
    </TiltCard>
  );
}

export default function HomepageFeatures() {
  const FeatureGroups = getFeatureGroups();
  return (
    <section className={styles.features}>
      <div className={styles.aiOrb1}></div>
      <div className={styles.aiOrb2}></div>
      <div className={styles.aiOrb3}></div>
      <div className={styles.gridPattern}></div>

      <div className="container">
        <FadeInUp>
          <div className={styles.sectionHeader}>
            <Heading as="h2" className={styles.sectionTitle}>
              <Translate id="features.sectionTitle">产品模块</Translate>
            </Heading>
          </div>
        </FadeInUp>

        {FeatureGroups.map((group, groupIdx) => {
          const gridClass = group.features.length === 7
            ? styles.featuresGrid7
            : group.features.length === 2
            ? styles.featuresGrid2
            : group.features.length === 3
              ? styles.featuresGrid3
              : styles.featuresGrid;

          return (
            <div key={groupIdx} className={styles.featureGroup}>
              <FadeInUp delay={groupIdx * 0.1}>
                <div className={styles.groupHeader}>
                  <h3 className={styles.groupTitle}>{group.groupTitle}</h3>
                  <p className={styles.groupSubtitle}>{group.groupSubtitle}</p>
                </div>
              </FadeInUp>
              <StaggerContainer className={gridClass} staggerDelay={0.08}>
                {group.features.map((props, idx) => (
                  <StaggerItem key={idx} direction="up">
                    <Feature {...props} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          );
        })}
      </div>
    </section>
  );
}
