import React, { useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { FiLogOut, FiUser } from 'react-icons/fi';

import { fetchLoginInfo, getCachedLoginInfo, logout } from '@site/src/lib/playgroundAuth';
import useAuthStateSync from '@site/src/lib/useAuthStateSync';

import styles from './styles.module.css';

function getAccountRoleLabel(loginInfo) {
  if (!loginInfo) {
    return '';
  }

  if (loginInfo.isSuperuser) {
    return '管理员';
  }

  if (loginInfo.isFirstLogin) {
    return '访客';
  }

  return '普通用户';
}

export default function LogoutNavbarButton({ mobile = false, label = '账号' }) {
  const { siteConfig } = useDocusaurusContext();
  const loginInfoUrl = siteConfig.customFields.loginInfoUrl;
  const isLoggedIn = useAuthStateSync();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginInfo, setLoginInfo] = useState(() => getCachedLoginInfo());
  const [profileLoading, setProfileLoading] = useState(false);
  const menuRef = useRef(null);
  const normalizedLabel = useMemo(() => label.trim() || '账号', [label]);
  const accountTitle = useMemo(() => {
    if (!loginInfo) {
      return normalizedLabel;
    }

    return loginInfo.displayName || loginInfo.username || normalizedLabel;
  }, [loginInfo, normalizedLabel]);
  const accountIdentityLabel = useMemo(() => {
    return getAccountRoleLabel(loginInfo);
  }, [loginInfo]);

  useEffect(() => {
    if (!isLoggedIn) {
      setMenuOpen(false);
      setLoginInfo(null);
      setProfileLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let cancelled = false;

    if (!isLoggedIn) {
      return undefined;
    }

    setLoginInfo((current) => current || getCachedLoginInfo());
    setProfileLoading(true);

    fetchLoginInfo(loginInfoUrl)
      .then((result) => {
        if (!cancelled) {
          setLoginInfo(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoginInfo((current) => current || getCachedLoginInfo());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, loginInfoUrl]);

  useEffect(() => {
    if (!menuOpen || mobile) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen, mobile]);

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  if (mobile) {
    return (
      <button
        type="button"
        className={clsx(styles.mobileLogoutButton, 'clean-btn')}
        onClick={handleLogout}
      >
        <FiLogOut />
        <span>退出登录</span>
      </button>
    );
  }

  return (
    <div className={styles.accountMenu} ref={menuRef}>
      <button
        type="button"
        className={clsx(styles.accountButton, menuOpen && styles.accountButtonOpen)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={accountTitle}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className={styles.accountAvatar}>
          <FiUser />
        </span>
      </button>

      {menuOpen && (
        <div className={styles.menuPanel} role="menu" aria-label={`${normalizedLabel}菜单`}>
          <div className={styles.menuHeader}>
            <div className={styles.menuTitleRow}>
              <span className={styles.menuTitle} title={accountTitle}>{accountTitle}</span>
              {accountIdentityLabel ? (
                <span className={styles.identityBadge}>{accountIdentityLabel}</span>
              ) : null}
            </div>
            {loginInfo?.username ? (
              <span className={styles.menuUsername} title={`用户名：@${loginInfo.username}`}>
                用户名：@{loginInfo.username}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={handleLogout}
          >
            <FiLogOut />
            <span>退出登录</span>
          </button>
        </div>
      )}
    </div>
  );
}
