/**
 * 认证工具模块
 * 处理 bklite_token 检查、第三方登录跳转、回调验证
 */

const TOKEN_COOKIE_NAME = 'bklite_token';
const LOGIN_CODE_KEY = 'bklite_third_login_code';
const LOGIN_CODE_FALLBACK_COOKIE_NAME = 'bklite_third_login_code_fallback';
export const AUTH_STATE_CHANGE_EVENT = 'bklite-auth-state-change';
const LOGIN_INFO_CACHE_KEY = 'bklite_login_info_cache';
const AUTH_HINT_KEY = 'bklite_auth_hint';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function normalizeBooleanFlag(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === 'true' || normalizedValue === '1') {
      return true;
    }

    if (normalizedValue === 'false' || normalizedValue === '0' || normalizedValue === '') {
      return false;
    }
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  return false;
}

/**
 * 从 cookie 中获取指定名称的值
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * 设置 cookie
 */
function setCookie(name, value) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}

function removeCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

function notifyAuthStateChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT));
}

function getSessionStorageItem(key) {
  if (!isBrowser()) return null;

  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.error(`读取 sessionStorage(${key}) 失败:`, error);
    return null;
  }
}

function setSessionStorageItem(key, value) {
  if (!isBrowser()) return false;

  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`写入 sessionStorage(${key}) 失败:`, error);
    return false;
  }
}

function removeSessionStorageItem(key) {
  if (!isBrowser()) return;

  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`删除 sessionStorage(${key}) 失败:`, error);
  }
}

function getLoginCode() {
  return getSessionStorageItem(LOGIN_CODE_KEY) || getCookie(LOGIN_CODE_FALLBACK_COOKIE_NAME);
}

function persistLoginCode(code) {
  if (!isBrowser() || !code) return false;

  const storedInSession = setSessionStorageItem(LOGIN_CODE_KEY, code);
  if (storedInSession) {
    removeCookie(LOGIN_CODE_FALLBACK_COOKIE_NAME);
    return true;
  }

  setCookie(LOGIN_CODE_FALLBACK_COOKIE_NAME, code);
  return true;
}

function clearLoginCode() {
  removeSessionStorageItem(LOGIN_CODE_KEY);
  removeCookie(LOGIN_CODE_FALLBACK_COOKIE_NAME);
}

function clearAuthState() {
  removeCookie(TOKEN_COOKIE_NAME);
  clearLoginCode();
  removeSessionStorageItem(LOGIN_INFO_CACHE_KEY);
}

function readLoginInfoCache() {
  if (!isBrowser()) return null;

  try {
    const raw = getSessionStorageItem(LOGIN_INFO_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('读取登录信息缓存失败:', error);
    removeSessionStorageItem(LOGIN_INFO_CACHE_KEY);
    return null;
  }
}

function writeLoginInfoCache(loginInfo) {
  if (!isBrowser()) return;

  try {
    if (!loginInfo) {
      removeSessionStorageItem(LOGIN_INFO_CACHE_KEY);
      return;
    }

    setSessionStorageItem(LOGIN_INFO_CACHE_KEY, JSON.stringify(loginInfo));
  } catch (error) {
    console.error('写入登录信息缓存失败:', error);
  }
}

function writeAuthHint(reason) {
  if (!isBrowser() || !reason) return;

  setSessionStorageItem(AUTH_HINT_KEY, JSON.stringify({ reason, ts: Date.now() }));
}

function clearAuthHint() {
  if (!isBrowser()) return;
  removeSessionStorageItem(AUTH_HINT_KEY);
}

export function getAndClearAuthHint() {
  if (!isBrowser()) return null;

  try {
    const raw = getSessionStorageItem(AUTH_HINT_KEY);
    clearAuthHint();
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('读取认证提示失败:', error);
    clearAuthHint();
    return null;
  }
}

/**
 * 检查是否已登录（cookie 中存在 bklite_token）
 */
export function hasToken() {
  return !!getCookie(TOKEN_COOKIE_NAME);
}

/**
 * 获取当前 token
 */
export function getToken() {
  return getCookie(TOKEN_COOKIE_NAME);
}

/**
 * 带认证的 fetch 封装
 * 自动注入 Authorization header，统一处理 token 缺失、401 失效、HTTP 错误和网络异常
 * @param {string} url - 请求地址
 * @param {RequestInit} init - 透传给 fetch 的选项
 * @param {object} options - 额外控制选项
 * @param {string} [options.loginBaseUrl] - 登录页地址，redirectOnMissingToken 为 true 时使用
 * @param {boolean} [options.redirectOnMissingToken=false] - token 缺失时是否跳转登录
 * @returns {Promise<{ok: boolean, reason?: string, status?: number, response?: Response, error?: Error}>}
 */
export async function authFetch(url, init = {}, options = {}) {
  const {
    loginBaseUrl,
    redirectOnMissingToken = false,
  } = options;

  const token = getToken();

  if (!token) {
    if (redirectOnMissingToken && loginBaseUrl) {
      redirectToLogin(loginBaseUrl);
    }

    return {
      ok: false,
      reason: 'missing-token',
    };
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      writeAuthHint('auth-expired');
      invalidateAuth();
      return {
        ok: false,
        reason: 'auth-expired',
        status: 401,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        reason: 'http-error',
        status: response.status,
        response,
      };
    }

    return {
      ok: true,
      response,
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'network-error',
      error,
    };
  }
}

export function getCachedLoginInfo() {
  return readLoginInfoCache();
}

export function normalizeLoginInfoPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const source = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  const profile = source.user && typeof source.user === 'object' ? source.user : source;

  const username = profile.username || profile.user_name || profile.bk_username || profile.name || '';
  const displayName = profile.display_name || profile.nickname || profile.real_name || profile.chname || username || '账号';
  const email = profile.email || profile.mail || '';
  const avatar = profile.avatar_url || profile.avatar || profile.picture || '';
  const locale = profile.locale || source.locale || '';
  const isSuperuser = normalizeBooleanFlag(profile.is_superuser ?? source.is_superuser);
  const isFirstLogin = normalizeBooleanFlag(profile.is_first_login ?? source.is_first_login);
  const groups = Array.isArray(profile.group_list)
    ? profile.group_list
    : Array.isArray(source.group_list)
      ? source.group_list
      : [];
  const primaryGroupName = groups[0]?.name || '';

  return {
    username,
    displayName,
    email,
    avatar,
    locale,
    isSuperuser,
    isFirstLogin,
    primaryGroupName,
    raw: payload,
  };
}

export async function fetchLoginInfo(loginInfoUrl) {
  if (!isBrowser() || !loginInfoUrl) {
    writeLoginInfoCache(null);
    return null;
  }

  const result = await authFetch(loginInfoUrl, { method: 'GET' });

  if (result.reason === 'missing-token' || result.reason === 'auth-expired') {
    writeLoginInfoCache(null);
    return null;
  }

  if (result.reason === 'http-error') {
    const error = new Error(`获取账号信息失败: ${result.status}`);
    console.error('获取账号信息失败:', error);
    throw error;
  }

  if (result.reason === 'network-error') {
    console.error('获取账号信息失败:', result.error);
    throw result.error;
  }

  const json = await result.response.json();
  const normalized = normalizeLoginInfoPayload(json);
  writeLoginInfoCache(normalized);
  return normalized;
}

/**
 * 生成随机 third_login_code
 */
function generateLoginCode() {
  if (typeof crypto === 'undefined') return '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 跳转到登录页面
 * 1. 生成 third_login_code 存入 sessionStorage
 * 2. 构建登录 URL（含 callbackUrl）
 * 3. 跳转
 * @param {string} loginBaseUrl - 登录页地址，由调用方传入
 */
export function redirectToLogin(loginBaseUrl) {
  if (!isBrowser()) return;

  clearAuthHint();

  const code = generateLoginCode();
  if (!persistLoginCode(code)) {
    return;
  }

  // 回调地址：当前站点的 /playground 页面，附带 third_login_code 参数
  const callbackUrl = window.location.origin + '/playground?third_login_code=' + code;
  const loginUrl = new URL(loginBaseUrl, window.location.origin);
  loginUrl.searchParams.set('callbackUrl', callbackUrl);
  loginUrl.searchParams.set('thirdLogin', 'true');

  window.location.href = loginUrl.toString();
}

/**
 * 验证回调中的 third_login_code
 * 检查 URL 参数中的 code 是否与 sessionStorage 中存储的一致
 * @returns {boolean} 验证是否通过
 */
export function verifyLoginCallback() {
  if (!isBrowser()) return false;

  const params = new URLSearchParams(window.location.search);
  const urlCode = params.get('third_login_code');
  const token = params.get('token');

  if (!urlCode) return false;

  const storedCode = getLoginCode();
  const isValid = urlCode === storedCode;

  if (isValid && token) {
    clearAuthHint();
    setCookie(TOKEN_COOKIE_NAME, token);
    notifyAuthStateChange();
  }

  // 验证完毕，清理 sessionStorage 和 URL 参数
  clearLoginCode();
  cleanUrlParams();

  return isValid;
}

/**
 * 清理 URL 中的认证参数，保持地址栏干净
 */
function cleanUrlParams() {
  if (!isBrowser()) return;

  const url = new URL(window.location.href);
  url.searchParams.delete('third_login_code');
  url.searchParams.delete('token');
  window.history.replaceState({}, '', url.pathname + url.search);
}

/**
 * 认证拦截：检查 token，未登录则跳转
 * @param {string} loginBaseUrl - 登录页地址，由调用方传入
 * @returns {boolean} true=已登录可继续，false=未登录已跳转
 */
export function requireAuth(loginBaseUrl) {
  if (hasToken()) return true;
  redirectToLogin(loginBaseUrl);
  return false;
}

/**
 * 退出登录：清理 token 与中间态，并广播认证状态变更
 */
export function logout() {
  if (!isBrowser()) return;

  clearAuthHint();
  clearAuthState();
  notifyAuthStateChange();
}

/**
 * 认证失效：清理本地认证状态，并在状态实际变化时广播
 * @returns {boolean} true=本次发生了状态清理，false=已处于未登录态
 */
export function invalidateAuth() {
  if (!isBrowser()) return false;

  const hadToken = hasToken();
  const hadLoginCode = !!getLoginCode();

  if (!hadToken && !hadLoginCode) {
    return false;
  }

  clearAuthState();
  notifyAuthStateChange();
  return true;
}
