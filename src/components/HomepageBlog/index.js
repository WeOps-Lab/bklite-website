import React from 'react';

import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Heading from '@theme/Heading';

import { FadeInUp, StaggerContainer, StaggerItem } from '@site/src/components/ScrollAnimations';

import styles from './styles.module.css';

function getBlogPosts() {
  return [
    {
      tag: translate({id: 'homepage.blog.post.3.tag', message: '监控中心'}),
      date: translate({id: 'homepage.blog.post.3.date', message: '2026-04-14'}),
      title: translate({id: 'homepage.blog.post.3.title', message: '千万级告警风暴求生指南：为啥买了几万台服务器算不出一笔明白账？'}),
      summary: translate({
        id: 'homepage.blog.post.3.summary',
        message: '从告警噪音、全局视图到事件闭环，拆解监控中心如何帮助团队在风暴中重新找回排障节奏。',
      }),
      to: '/blog/monitor-alert-fatigue-noise-reduction',
    },
    {
      tag: translate({id: 'homepage.blog.post.2.tag', message: '最佳实践'}),
      date: translate({id: 'homepage.blog.post.2.date', message: '2026-04-14'}),
      title: translate({id: 'homepage.blog.post.2.title', message: 'Pinterest 砍掉 96% OOM 报错的背后，你还在靠人肉拼凑 Java 异常堆栈？'}),
      summary: translate({
        id: 'homepage.blog.post.2.summary',
        message: '面对规模以 PB 计的离散运行数据，探讨如何通过前端原生多行截断合并让杂乱无章的报错信息真正具备可观测连词成句的价值。',
      }),
      to: '/blog/pinterest-oom-java-stack-trace',
    },
    {
      tag: translate({id: 'homepage.blog.post.1.tag', message: '痛点剖析'}),
      date: translate({id: 'homepage.blog.post.1.date', message: '2026-04-14'}),
      title: translate({id: 'homepage.blog.post.1.title', message: '买了几万台服务器，为啥算不出一笔明白账？'}),
      summary: translate({
        id: 'homepage.blog.post.1.summary',
        message: '基于图数据库驱动的新一代智能化 CMDB 如何穿透云原生“资产黑洞”，实现分钟级拓扑定位。',
      }),
      to: '/blog/cmdb-asset-blackhole',
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
