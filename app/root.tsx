import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router'
import { ArrowLeft, RotateCcw } from 'lucide-react'

import type { Route } from './+types/root'
import { forwardDocumentHeaders } from './lib/document-cache'
import { LOCALE_STORAGE_KEY, THEME_STORAGE_KEY } from './lib/config'
import './app.css'
import './styles/showcase.css'

const themeBootstrapScript = `(function(){var el=document.documentElement;var t=null;try{var p=new URLSearchParams(window.location.search);var pt=p.get('theme');if(pt==='dark'||pt==='light'){t=pt;window.localStorage.setItem('${THEME_STORAGE_KEY}',pt)}else{t=window.localStorage.getItem('${THEME_STORAGE_KEY}')}var pl=p.get('lang');if(pl==='en'||pl==='zh'){window.localStorage.setItem('${LOCALE_STORAGE_KEY}',pl);if(pl==='en'){el.lang='en'}}}catch(e){}var isDark=t==='dark'||(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(isDark){el.classList.add('dark','theme-dark');el.classList.remove('theme-light')}else{el.classList.add('theme-light');el.classList.remove('dark','theme-dark')}try{if(window.localStorage.getItem('${LOCALE_STORAGE_KEY}')==='en'){el.lang='en'}}catch(e){}})()`

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050505" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="vMaker" />
        <link href="/site.webmanifest" rel="manifest" />
        <link
          href="/feed.xml"
          rel="alternate"
          title="vMaker RSS Feed"
          type="application/rss+xml"
        />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link
          crossOrigin=""
          href="https://fonts.gstatic.com"
          rel="preconnect"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration
          getKey={(location) => {
            // Restore scroll based on pathname, ignoring search param / sort changes on the same page
            return location.pathname
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

// The index route has no error boundary of its own, so a thrown 304 is handled
// here. Its headers() is then the one react-router calls, which makes this the only
// place the document's validators can come from.
export function headers({ errorHeaders, loaderHeaders }: Route.HeadersArgs) {
  return forwardDocumentHeaders({ errorHeaders, loaderHeaders })
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let code = 'Error'
  let message = '遇到了一些问题'
  let details = '页面加载时发生了未预期的错误，请刷新或返回首页。'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    code = String(error.status)
    if (error.status === 404) {
      message = '页面未找到'
      details = '您访问的项目或页面可能不存在，或者已经被移除。'
    } else {
      message = error.statusText || '请求异常'
      details = `HTTP 状态代码: ${error.status}`
    }
  } else if (error && error instanceof Error) {
    message = '应用渲染错误'
    details = error.message || details
    if (import.meta.env.DEV) {
      stack = error.stack
    }
  }

  return (
    <main className="theme-shell home-canvas flex min-h-svh items-center justify-center p-6 text-zinc-900 select-none dark:text-white">
      <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-zinc-200/80 bg-white/80 p-8 text-center shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-2xl">
        <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 font-mono text-xs font-semibold tracking-wider text-purple-600 uppercase dark:text-purple-400">
          {code}
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {message}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {details}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            to="/"
          >
            <ArrowLeft className="size-4" />
            返回首页
          </Link>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={() => window.location.reload()}
            type="button"
          >
            <RotateCcw className="size-4" />
            重新加载
          </button>
        </div>

        {stack && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer font-mono text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              展开错误调用栈 (Debug Stack)
            </summary>
            <pre className="mt-2 max-h-48 w-full overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-[11px] text-zinc-300 select-text">
              <code>{stack}</code>
            </pre>
          </details>
        )}
      </div>
    </main>
  )
}
