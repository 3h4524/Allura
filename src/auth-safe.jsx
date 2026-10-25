import React, { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useLanguage } from './language.jsx'

const GOOGLE_AUTH_PENDING_KEY = 'allura:google-auth-pending'
const ADMIN_LOGIN_ALIAS = 'admin'
const ADMIN_EMAIL = 'admin@allura.dev'

function normalizeLoginEmail(value) {
  const normalized = value.trim().toLowerCase()
  return normalized === ADMIN_LOGIN_ALIAS ? ADMIN_EMAIL : normalized
}

async function getPostLoginPath(user) {
  if (!user || !supabase) return '/thiet-lap-mon-qua'
  try {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
    return profile?.is_admin ? '/admin' : '/thiet-lap-mon-qua'
  } catch {
    return '/thiet-lap-mon-qua'
  }
}

export default function AuthSafe({ mode, onNavigate }) {
  const login = mode === 'login'
  const { language } = useLanguage()
  const english = language === 'en'

  const copy = english
    ? {
        alt: 'ALLURA lotus flower lamp',
        natural: 'NATURAL',
        mindful: 'MINDFUL',
        connected: 'CONNECTED',
        heroTitle: <>Light up<br /><b>every feeling</b></>,
        heroAccent: <>Awaken<br />every memory</>,
        brand: 'ALLURA MEMBERSHIP',
        loginTitle: 'Welcome back',
        registerTitle: 'Begin with Allura',
        loginDescription: 'Sign in to keep your stories and personalize a gift.',
        registerDescription: 'Create an account to begin keeping beautiful memories.',
        fullName: 'FULL NAME',
        email: 'EMAIL ADDRESS',
        password: 'PASSWORD',
        namePlaceholder: 'Your name',
        emailPlaceholder: 'admin or name@example.com',
        passwordPlaceholder: 'Enter your password',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        forgot: 'Forgot your password?',
        terms: "I agree to Allura's terms",
        connecting: 'CONNECTING…',
        signIn: 'SIGN IN',
        createAccount: 'CREATE ACCOUNT',
        or: 'OR',
        google: 'Continue with Google',
        noAccount: "Don't have an account?",
        signUp: 'Sign up now',
        hasAccount: 'Already have an account?',
        login: 'Sign in',
        notConfigured: 'Supabase Auth is not configured yet.',
        network: 'Unable to connect to Supabase Auth. Check your connection and try again.',
        genericLogin: 'Unable to sign in. Please try again.',
        genericRegister: 'Unable to create your account. Please try again.',
        emailConfirmation: 'Your account was created. Please confirm your email, then sign in to continue.',
      }
    : {
        alt: 'Đèn hoa sen ALLURA',
        natural: 'TỰ NHIÊN',
        mindful: 'TĨNH LẶNG',
        connected: 'KẾT NỐI',
        heroTitle: <>Thắp sáng<br /><b>Sắc hương</b></>,
        heroAccent: <>Đánh thức<br />vấn vương</>,
        brand: 'ALLURA MEMBERSHIP',
        loginTitle: 'Chào mừng trở lại',
        registerTitle: 'Bắt đầu cùng Allura',
        loginDescription: 'Đăng nhập để lưu giữ những câu chuyện và cá nhân hóa món quà của bạn.',
        registerDescription: 'Tạo tài khoản để bắt đầu lưu giữ những kỷ niệm đẹp.',
        fullName: 'HỌ VÀ TÊN',
        email: 'ĐỊA CHỈ EMAIL',
        password: 'MẬT KHẨU',
        namePlaceholder: 'Tên của bạn',
        emailPlaceholder: 'admin hoặc tenban@example.com',
        passwordPlaceholder: 'Nhập mật khẩu',
        showPassword: 'Hiện mật khẩu',
        hidePassword: 'Ẩn mật khẩu',
        forgot: 'Quên mật khẩu?',
        terms: 'Tôi đồng ý với điều khoản của Allura',
        connecting: 'ĐANG KẾT NỐI…',
        signIn: 'ĐĂNG NHẬP',
        createAccount: 'TẠO TÀI KHOẢN',
        or: 'HOẶC',
        google: 'Đăng nhập với Google',
        noAccount: 'Chưa có tài khoản?',
        signUp: 'Đăng ký ngay',
        hasAccount: 'Đã có tài khoản?',
        login: 'Đăng nhập',
        notConfigured: 'Supabase Auth chưa được cấu hình.',
        network: 'Không thể kết nối Supabase Auth. Hãy kiểm tra mạng và thử lại.',
        genericLogin: 'Không thể đăng nhập. Vui lòng thử lại.',
        genericRegister: 'Không thể tạo tài khoản. Vui lòng thử lại.',
        emailConfirmation: 'Tài khoản đã được tạo. Hãy xác nhận email, sau đó đăng nhập để tiếp tục.',
      }

  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!login || !supabase) return undefined

    const callbackParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const callbackError = callbackParams.get('error_description') || callbackParams.get('error')
    if (callbackError) {
      sessionStorage.removeItem(GOOGLE_AUTH_PENDING_KEY)
      setError(callbackError)
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`)
    }

    const continueAfterGoogle = async (event, session) => {
      if (!session || !['SIGNED_IN', 'INITIAL_SESSION'].includes(event)) return
      if (sessionStorage.getItem(GOOGLE_AUTH_PENDING_KEY) !== '1') return

      sessionStorage.removeItem(GOOGLE_AUTH_PENDING_KEY)
      onNavigate(await getPostLoginPath(session.user))
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(continueAfterGoogle)
    supabase.auth.getSession().then(({ data }) => {
      continueAfterGoogle('INITIAL_SESSION', data.session)
    }).catch(() => {})

    return () => authListener.subscription.unsubscribe()
  }, [login, onNavigate])

  const signInWithGoogle = async () => {
    setError('')
    setSuccess('')

    if (!supabase) {
      setError(copy.notConfigured)
      return
    }

    sessionStorage.setItem(GOOGLE_AUTH_PENDING_KEY, '1')
    setBusy(true)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dang-nhap`,
        },
      })

      if (oauthError) throw oauthError
    } catch (eventError) {
      sessionStorage.removeItem(GOOGLE_AUTH_PENDING_KEY)
      const message = String(eventError?.message || '')
      setError(
        /failed to fetch|network error|fetch failed/i.test(message)
          ? copy.network
          : message || copy.genericLogin,
      )
    } finally {
      setBusy(false)
    }
  }

  const submit = async event => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)

    try {
      if (!supabase) throw new Error(copy.notConfigured)

      const result = login
        ? await supabase.auth.signInWithPassword({ email: normalizeLoginEmail(email), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: fullName.trim() } },
          })

      if (result.error) throw new Error(result.error.message)
      if (!login && !result.data?.session) {
        setSuccess(copy.emailConfirmation)
        return
      }
      onNavigate(login ? await getPostLoginPath(result.data?.user) : '/thiet-lap-mon-qua')
    } catch (eventError) {
      const message = String(eventError?.message || '')
      setError(
        /failed to fetch|network error|fetch failed/i.test(message)
          ? copy.network
          : message || (login ? copy.genericLogin : copy.genericRegister),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <img src="/assets/allura-login-bg.png" alt={copy.alt} />
        <div className="auth-visual-wash" />
        <div className="auth-visual-copy">
          <span>{copy.natural}<br />{copy.mindful}<br />{copy.connected}</span>
          <i />
          <h2>{copy.heroTitle}</h2>
          <em>{copy.heroAccent}</em>
          <i />
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-brand"><span>✦</span> {copy.brand}</div>

          <div className="auth-heading">
            <h1>{login ? copy.loginTitle : copy.registerTitle}</h1>
            <p>{login ? copy.loginDescription : copy.registerDescription}</p>
          </div>

          <form onSubmit={submit}>
            {!login && (
              <label>
                {copy.fullName}
                <input
                  value={fullName}
                  onChange={event => setFullName(event.target.value)}
                  placeholder={copy.namePlaceholder}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              {copy.email}
              <div className="auth-input">
                <Mail size={16} />
                <input
                  type={login ? 'text' : 'email'}
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder={copy.emailPlaceholder}
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label>
              {copy.password}
              <div className="auth-input">
                <LockKeyhole size={16} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder={copy.passwordPlaceholder}
                  autoComplete={login ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? copy.hidePassword : copy.showPassword}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {login && <button type="button" className="auth-forgot">{copy.forgot}</button>}
            </label>

            {!login && (
              <label className="auth-check">
                <input type="checkbox" required /> {copy.terms}
              </label>
            )}

            {error && <div className="error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button className="primary full auth-submit" disabled={busy}>
              {busy ? copy.connecting : login ? copy.signIn : copy.createAccount}
              <ArrowRight size={17} />
            </button>

            {login && (
              <>
                <div className="auth-divider"><span>{copy.or}</span></div>
                <button type="button" className="google-button" onClick={signInWithGoogle} disabled={busy}>
                  <b className="google-g">G</b> {busy ? copy.connecting : copy.google}
                </button>
              </>
            )}
          </form>

          <div className="auth-foot">
            {login ? (
              <>{copy.noAccount} <button onClick={() => onNavigate('/dang-ky')}>{copy.signUp}</button></>
            ) : (
              <>{copy.hasAccount} <button onClick={() => onNavigate('/dang-nhap')}>{copy.login}</button></>
            )}
          </div>
        </div>
        <div className="auth-leaf-decoration">◌</div>
      </div>
    </section>
  )
}
