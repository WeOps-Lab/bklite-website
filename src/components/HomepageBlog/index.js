import React from 'react';

import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Heading from '@theme/Heading';

import { FadeInUp, StaggerContainer, StaggerItem } from '@site/src/components/ScrollAnimations';

import styles from './styles.module.css';

function getBlogPosts() {
  return [
    {
      tag: translate({id: 'homepage.blog.post.3.tag', message: '告警中心'}),
      date: translate({id: 'homepage.blog.post.3.date', message: '2026-04-29'}),
      title: translate({id: 'homepage.blog.post.3.title', message: '10 条告警背后其实是 1 个问题，如何高效治理'}),
      summary: translate({
        id: 'homepage.blog.post.3.summary',
        message: '从一次发布后的告警刷屏现场出发，拆开 Event、Alert、Incident 各自该承担的角色，看看 BK Lite 如何把 10 条噪声收成 1 条可处理对象。',
      }),
      to: '/blog/alert-noise-to-one-actionable-alert',
    },
    {
      tag: translate({id: 'homepage.blog.post.2.tag', message: '日志中心'}),
      date: translate({id: 'homepage.blog.post.2.date', message: '2026-04-29'}),
      title: translate({id: 'homepage.blog.post.2.title', message: '日志告警总像“狼来了”，问题卡在哪'}),
      summary: translate({
        id: 'homepage.blog.post.2.summary',
        message: '从一次发布后的复盘追问出发，拆开关键字告警、聚合告警和告警中心各自该承担的角色，看看日志异常为什么总会变成难接手的“狼来了”。',
      }),
      to: '/blog/log-alert-wolf-cry-root-cause',
    },
    {
      tag: translate({id: 'homepage.blog.post.1.tag', message: 'CMDB'}),
      date: translate({id: 'homepage.blog.post.1.date', message: '2026-04-28'}),
      title: translate({id: 'homepage.blog.post.1.title', message: 'CMDB 真正失灵的时刻，不是查不到资产，而是查不动关系'}),
      summary: translate({
        id: 'homepage.blog.post.1.summary',
        message: '从一次真实的凌晨故障复盘出发，聊聊 CMDB 在故障排查里真正有价值的能力，以及 BlueKing Lite 怎么把关系链路串起来。',
      }),
      to: '/blog/cmdb-dependency-chain-troubleshooting',
    }
  ];
}

function BlogPostCard({ tag, date, title, summary, to }) {
  return (
    <article className={styles.postCard}>
      <div className={styles.postMeta}>
        <span className={styles.postTag}>{tag}</span>
        <span className={styles.postDate}>{date}</span>
      </div>

      <div className={styles.postContent}>
        <Heading as="h3" className={styles.postTitle}>
          {title}
        </Heading>
        <p className={styles.postSummary}>{summary}</p>
      </div>

      <Link className={styles.postLink} to={to}>
        <Translate id="homepage.blog.post.readMore">阅读全文</Translate>
      </Link>
    </article>
  );
}

export default function HomepageBlog() {
  const blogPosts = getBlogPosts();

  return (
    <section className={styles.blogSection}>
      <div className={styles.container}>
        <FadeInUp>
          <div className={styles.sectionHeader}>
            <Heading as="h2" className={styles.sectionTitle}>
              <Translate id="homepage.blog.title">来自博客</Translate>
            </Heading>
            <p className={styles.sectionSubtitle}>
              <Translate id="homepage.blog.subtitle">
                了解产品更新、最佳实践与运维场景洞察。
              </Translate>
            </p>
          </div>
        </FadeInUp>

        <StaggerContainer className={styles.postGrid} staggerDelay={0.08}>
          {blogPosts.map((post) => (
            <StaggerItem key={post.to} direction="up">
              <BlogPostCard {...post} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.12}>
          <div className={styles.sectionFooter}>
            <Link className={styles.viewAllLink} to="/blog">
              <Translate id="homepage.blog.viewAll">查看全部博客</Translate>
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
