import { useEffect, useState } from 'react';

import { AUTH_STATE_CHANGE_EVENT, hasToken } from '@site/src/lib/playgroundAuth';

// 模块级认证快照与监听器：
// - 页面上只绑定一套全局 auth 事件监听
// - 各组件通过 hook 订阅同一个 isLoggedIn 快照
// - 避免导航栏、页面等多个 consumer 各自重复注册 window/document 监听器
let authStateSnapshot = hasToken();
let listenersBound = false;
const authStateListeners = new Set();

function getAuthStateSnapshot() {
  return authStateSnapshot;
}

function notifyAuthStateListeners() {
  authStateListeners.forEach((listener) => {
    listener(getAuthStateSnapshot());
  });
}

function syncAuthState() {
  const nextLoggedIn = hasToken();
  if (authStateSnapshot === nextLoggedIn) {
    return;
  }

  authStateSnapshot = nextLoggedIn;
  notifyAuthStateListeners();
}

function handleWindowFocus() {
  syncAuthState();
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    syncAuthState();
  }
}

function bindAuthStateListeners() {
  if (listenersBound || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  authStateSnapshot = hasToken();
  window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  listenersBound = true;
}

function unbindAuthStateListeners() {
  if (!listenersBound || authStateListeners.size > 0 || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
  window.removeEventListener('focus', handleWindowFocus);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  listenersBound = false;
}

export default function useAuthStateSync() {
  // 返回统一的登录态快照。
  // consumer 只关心结果，各自处理自己的业务副作用：
  // - Navbar: 控制账号按钮显隐/关闭菜单
  // - MLOpsTab: 触发模型预加载或清空页面状态
  const [isLoggedIn, setIsLoggedIn] = useState(() => getAuthStateSnapshot());

  useEffect(() => {
    bindAuthStateListeners();

    const handleAuthStateChange = (nextLoggedIn) => {
      setIsLoggedIn(nextLoggedIn);
    };

    authStateListeners.add(handleAuthStateChange);
    handleAuthStateChange(getAuthStateSnapshot());

    return () => {
      authStateListeners.delete(handleAuthStateChange);
      unbindAuthStateListeners();
    };
  }, []);

  return isLoggedIn;
}
