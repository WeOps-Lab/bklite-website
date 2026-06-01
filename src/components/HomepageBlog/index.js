import React from 'react';

import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import Heading from '@theme/Heading';

import { FadeInUp, StaggerContainer, StaggerItem } from '@site/src/components/ScrollAnimations';

import styles from './styles.module.css';

function getBlogPosts() {
  return [
    {
      tag: translate({id: 'homepage.blog.post.3.tag', message: '日志中心'}),
      date: translate({id: 'homepage.blog.post.3.date', message: '2026-06-01'}),
      title: translate({id: 'homepage.blog.post.3.title', message: '日志权限全量放开，排障更慢也更危险'}),
      summary: translate({
        id: 'homepage.blog.post.3.summary',
        message: '从一次发布后的支付回调排障出发，拆解全量日志权限为什么会同时带来数据越界和定位变慢，以及 BK Lite 如何把日志访问变成可控搜索空间。',
      }),
      to: '/blog/log-access-search-space-control',
    },
    {
      tag: translate({id: 'homepage.blog.post.2.tag', message: 'CMDB'}),
      date: translate({id: 'homepage.blog.post.2.date', message: '2026-05-26'}),
      title: translate({id: 'homepage.blog.post.2.title', message: 'CMDB 失真，往往不是录入问题'}),
      summary: translate({
        id: 'homepage.blog.post.2.summary',
        message: '很多团队的 CMDB 不是没资产，而是资产信息跟不上环境变化。模型标准、自动发现、关系回写和变更追踪，决定了它能不能重新成为排障入口。',
      }),
      to: '/blog/cmdb-data-drift-is-not-an-input-problem',
    },
    {
      tag: translate({id: 'homepage.blog.post.1.tag', message: '作业管理'}),
      date: translate({id: 'homepage.blog.post.1.date', message: '2026-05-18'}),
      title: translate({id: 'homepage.blog.post.1.title', message: '夜里该跑的巡检和清理，怎么总在交接班后断档？'}),
      summary: translate({
        id: 'homepage.blog.post.1.summary',
        message: '从夜间巡检和日志清理经常在交接班后断档的现场切入，拆开服务器例行维护为什么总是靠人记着跑，以及 BK Lite 作业管理如何把动作、对象、时间和结果重新收进一套稳定执行方式。',
      }),
      to: '/blog/server-maintenance-breaks-after-shift-handover',
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
