import React, { useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {translate} from '@docusaurus/Translate';
import { FiLogIn, FiLogOut, FiUser } from 'react-icons/fi';

import { fetchLoginInfo, getCachedLoginInfo, logout, redirectToLogin } from '@site/src/lib/playgroundAuth';
import useAuthStateSync from '@site/src/lib/useAuthStateSync';

import styles from './styles.module.css';

function getAccountRoleLabel(loginInfo) {
  if (!loginInfo) {
    return '';
  }

  if (loginInfo.isSuperuser) {
    return translate({id: 'account.role.admin', message: '管理员'});
  }

  if (loginInfo.isFirstLogin) {
    return translate({id: 'account.role.guest', message: '访客'});
  }

  return translate({id: 'account.role.user', message: '普通用户'});
}

export default function LogoutNavbarButton({ mobile = false, label = '账号' }) {
  const { siteConfig } = useDocusaurusContext();
  const loginBaseUrl = siteConfig.customFields.loginBaseUrl;
  const loginInfoUrl = siteConfig.customFields.loginInfoUrl;
  const isLoggedIn = useAuthStateSync();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginInfo, setLoginInfo] = useState(() => getCachedLoginInfo());
  const [profileLoading, setProfileLoading] = useState(false);
  const menuRef = useRef(null);
  const normalizedLabel = useMemo(() => label.trim() || translate({id: 'account.label', message: '账号'}), [label]);
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

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const handleLogin = () => {
    redirectToLogin(loginBaseUrl);
  };

  if (mobile) {
    if (!isLoggedIn) {
      return (
        <button
          type="button"
          className={clsx(styles.mobileLoginButton, 'clean-btn')}
          onClick={handleLogin}
        >
          <FiUser />
          <span>{translate({id: 'account.login', message: '登录'})}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        className={clsx(styles.mobileLogoutButton, 'clean-btn')}
        onClick={handleLogout}
      >
        <FiLogOut />
        <span>{translate({id: 'account.logout', message: '退出登录'})}</span>
      </button>
      );
  }

  const buttonTitle = isLoggedIn ? accountTitle : translate({id: 'account.login', message: '登录'});
  const menuAriaLabel = isLoggedIn ? `${normalizedLabel}${translate({id: 'account.menu', message: '菜单'})}` : translate({id: 'account.loginEntry', message: '登录入口'});

  return (
    <div className={styles.accountMenu} ref={menuRef}>
      <button
        type="button"
        className={clsx(styles.accountButton, menuOpen && styles.accountButtonOpen)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={buttonTitle}
        title={buttonTitle}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span
          className={clsx(
            styles.accountAvatar,
            isLoggedIn ? styles.accountAvatarLoggedIn : styles.accountAvatarLoggedOut,
          )}
        >
          <FiUser />
        </span>
      </button>

      {menuOpen && (
        <div className={styles.menuPanel} role="menu" aria-label={menuAriaLabel}>
          {isLoggedIn ? (
            <>
              <div className={styles.menuHeader}>
                <div className={styles.menuTitleRow}>
                  <span className={styles.menuTitle} title={accountTitle}>{accountTitle}</span>
                  {accountIdentityLabel ? (
                    <span className={styles.identityBadge}>{accountIdentityLabel}</span>
                  ) : null}
                </div>
                {loginInfo?.username ? (
                  <span className={styles.menuUsername} title={`${translate({id: 'account.username.label', message: '用户名'})}：@${loginInfo.username}`}>
                    {translate({id: 'account.username.label', message: '用户名'})}：@{loginInfo.username}
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
            </>
          ) : (
            <>
              <div className={styles.menuHeader}>
                <div className={styles.menuTitleRow}>
                  <span className={styles.menuTitle}>{translate({id: 'account.loginAccount', message: '登录账号'})}</span>
                </div>
                <span className={styles.menuDescription}>
                  {translate({id: 'account.loginDesc', message: '登录以体验 AI 能力，解锁模型选择、在线推理与更多功能。'})}
                </span>
              </div>
              <button
                type="button"
                className={clsx(styles.menuItem, styles.loginMenuItem)}
                role="menuitem"
                onClick={handleLogin}
              >
                <FiLogIn />
                <span>{translate({id: 'account.login', message: '登录'})}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
