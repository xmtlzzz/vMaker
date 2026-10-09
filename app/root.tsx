import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router'

import type { Route } from './+types/root'
import { forwardDocumentHeaders } from './lib/document-cache'
import { LOCALE_STORAGE_KEY, THEME_STORAGE_KEY } from './lib/config'
import './app.css'
import './styles/showcase.css'

// Runs before hydration so a dark-theme visitor never sees the light first paint.
// The theme classes live on <html>; the route shell only carries theme-shell/home-canvas.
const themeBootstrapScript = `(function(){var el=document.documentElement;var t=null;try{t=window.localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}if(t==='dark'){el.classList.add('dark','theme-dark')}else{el.classList.add('theme-light')}try{if(window.localStorage.getItem('${LOCALE_STORAGE_KEY}')==='en'){el.lang='en'}}catch(e){}})()`

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050505" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="vMaker" />
        <link href="/site.webmanifest" rel="manifest" />
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
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
