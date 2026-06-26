import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import iconPng from "@/assets/astralnaut-icon-512.png.asset.json";
import appleTouchIcon from "@/assets/astralnaut-apple-touch-icon.png.asset.json";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { TourOverlay } from "@/components/tour/TourOverlay";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { VisitorTracker } from "@/components/visitor-tracker";
import { Toaster } from "@/components/ui/sonner";
import { useCartSync } from "@/hooks/useCartSync";
import { CookieConsent } from "@/components/cookie-consent";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Real World Comics — The next page only drops here" },
      { name: "description", content: "Five new pages a week. Motion-enhanced art. Subscriber-only votes that change the canon. Read the first act free." },
      { name: "author", content: "Phil Russell — Real World Comics, LLC (Astralnaut Studios)" },
      { name: "copyright", content: "© 2026 Real World Comics, LLC. All rights reserved." },
      { name: "rights", content: "© 2026 Real World Comics, LLC. Unauthorized reproduction or AI-training use prohibited." },
      { property: "og:site_name", content: "Real World Comics — Astralnaut Studios" },
      { property: "article:publisher", content: "Real World Comics, LLC" },
      { property: "og:title", content: "Real World Comics — The next page only drops here" },
      { property: "og:description", content: "Five new pages a week. Motion-enhanced art. Subscriber-only votes that change the canon. Read the first act free." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Real World Comics — The next page only drops here" },
      { name: "twitter:description", content: "Five new pages a week. Motion-enhanced art. Subscriber-only votes that change the canon. Read the first act free." },
      { name: "google-site-verification", content: "EgmLLVaNZgWO2RP5Vsz7saG00ZwyVOIZ_GWN0pMMk6E" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Astralnaut" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="512x512" href={iconPng.url} />
        <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon.url} />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useCartSync();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <PaymentTestModeBanner />
        <Outlet />
        <TourOverlay />
          <AnalyticsTracker />
          <VisitorTracker />
          <CookieConsent />
          <Toaster position="top-right" />


      </TooltipProvider>
    </QueryClientProvider>
  );
}
