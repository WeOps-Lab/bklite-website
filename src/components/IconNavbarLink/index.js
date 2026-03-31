import React from 'react';

import clsx from 'clsx';
import { FaGithub } from 'react-icons/fa';
import { RiBookOpenLine } from 'react-icons/ri';

import styles from './styles.module.css';

const iconMap = {
  github: {
    Icon: FaGithub,
    iconClassName: styles.githubGlyph,
  },
  deepwiki: {
    Icon: RiBookOpenLine,
    iconClassName: styles.deepwikiGlyph,
  },
};

function getIconConfig(icon) {
  return iconMap[icon] || iconMap.deepwiki;
}

export default function IconNavbarLink({ href, icon, label, mobile = false }) {
  const { Icon, iconClassName } = getIconConfig(icon);

  if (mobile) {
    return (
      <a
        href={href}
        className={clsx(styles.mobileNavbarLink, 'menu__link')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
      >
        <span className={clsx(styles.iconBadge, iconClassName)}>
          <Icon />
        </span>
        <span>{label}</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      className={styles.navbarIconLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
    >
      <span className={clsx(styles.iconBadge, iconClassName)}>
        <Icon />
      </span>
    </a>
  );
}
