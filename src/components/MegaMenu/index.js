import React, { useState, useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

function getProductGroups() {
    return [
        {
            title: translate({id: 'megamenu.classic.title', message: '经典运维'}),
            products: [
                { name: translate({id: 'megamenu.monitor.name', message: '监控中心'}), description: translate({id: 'megamenu.monitor.desc', message: '秒级监控 · 精准告警 · 稳定保障'}), link: '/docs/monitor/introduce' },
                { name: translate({id: 'megamenu.log.name', message: '日志中心'}), description: translate({id: 'megamenu.log.desc', message: '快速检索 · 故障定位 · 合规留存'}), link: '/docs/log/introduce' },
                { name: translate({id: 'megamenu.cmdb.name', message: 'CMDB'}), description: translate({id: 'megamenu.cmdb.desc', message: '资产可视 · 架构清晰 · 数据可信'}), link: '/docs/cmdb' },
                { name: translate({id: 'megamenu.alert.name', message: '告警中心'}), description: translate({id: 'megamenu.alert.desc', message: '智能降噪 · 精准分派 · 快速闭环'}), link: '/docs/alert' },
                { name: translate({id: 'megamenu.itsm.name', message: 'ITSM'}), description: translate({id: 'megamenu.itsm.desc', message: '标准执行 · 透明可控 · 合规保障'}), link: '/docs/itsm/feature' },
                { name: translate({id: 'megamenu.job.name', message: '作业管理'}), description: translate({id: 'megamenu.job.desc', message: '批量执行 · 文件分发 · 定时调度'}), link: '/docs/job/introduce' },
                { name: translate({id: 'megamenu.analysis.name', message: '运营分析'}), description: translate({id: 'megamenu.analysis.desc', message: '数据融合 · 智能分析 · 价值呈现'}), link: '/docs/analysis' },
            ]
        },
        {
            title: translate({id: 'megamenu.platform.title', message: '平台底座'}),
            products: [
                { name: translate({id: 'megamenu.console.name', message: '控制台'}), description: translate({id: 'megamenu.console.desc', message: '一站访问 · 通知聚合 · 智能推荐'}), link: '/docs/console/introduce' },
                { name: translate({id: 'megamenu.system.name', message: '系统管理'}), description: translate({id: 'megamenu.system.desc', message: '权限隔离 · 精细管控 · 全程追溯'}), link: '/docs/system/introduce' },
                { name: translate({id: 'megamenu.node.name', message: '节点管理'}), description: translate({id: 'megamenu.node.desc', message: '跨云管理 · 自动部署 · 状态可视'}), link: '/docs/node/introduce' },
            ]
        },
        {
            title: translate({id: 'megamenu.intelligent.title', message: '智能运维'}),
            products: [
                { name: translate({id: 'megamenu.opspilot.name', message: 'OpsPilot'}), description: translate({id: 'megamenu.opspilot.desc', message: '自主诊断 · 智能决策 · 自动修复'}), link: '/docs/opspilot/introduce' },
                { name: translate({id: 'megamenu.mlops.name', message: 'MLOps'}), description: translate({id: 'megamenu.mlops.desc', message: '数据标注 · 模型训练 · 能力发布'}), link: '/docs/mlops/introduce' },
            ]
        },
    ];
}

export default function MegaMenu() {
    const productGroups = getProductGroups();
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);

            // 计算下拉菜单位置
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownStyle({
                    top: `${rect.bottom + 8}px`,
                    left: `${rect.left - 200}px`,
                });
            }
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={styles.megaMenuWrapper}>
            <button
                ref={buttonRef}
                className={`${styles.megaMenuTrigger} ${isOpen ? styles.active : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
            >
                {translate({id: 'megamenu.trigger', message: '产品文档'})}
                <svg
                    className={`${styles.megaMenuArrow} ${isOpen ? styles.open : ''}`}
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                >
                    <path d="M6 8L2 4h8z" />
                </svg>
            </button>

            {isOpen && (
                <div
                    ref={menuRef}
                    className={styles.megaMenuDropdown}
                    style={dropdownStyle}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className={styles.megaMenuContainer}>
                        <div className={styles.megaMenuGroups}>
                            {productGroups.map((group, groupIdx) => (
                                <div key={groupIdx} className={styles.productGroup}>
                                    <div className={styles.groupTitle}>{group.title}</div>
                                    <div className={styles.groupProducts}>
                                        {group.products.map((product, idx) => (
                                            <Link
                                                key={idx}
                                                to={product.link}
                                                className={styles.megaMenuItem}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <div className={styles.itemName}>{product.name}</div>
                                                <div className={styles.itemDescription}>{product.description}</div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
