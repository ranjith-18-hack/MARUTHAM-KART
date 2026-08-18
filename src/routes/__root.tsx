import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
  useNavigate
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { NetworkStatusPill } from "../components/common/NetworkStatusPill";
import { isRouteAllowedForCurrentApp, getCurrentAppTarget } from "../lib/app-config";
import { CustomerAppSplash } from "../components/customer/CustomerAppSplash";
import { useMobileApp } from "../hooks/use-mobile-app";

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
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

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
      { name: "viewport", content: "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" },
      { title: "MARUTHAM KART — FROM FARMERS. FOR EVERYONE." },
      { name: "description", content: "Fresh agricultural products directly from farmers to your doorstep. Premium Quality Rice, Wheat, Flour, Pulses, Dairy and Vegetables." },
      { name: "author", content: "Marutham Kart" },
      { property: "og:title", content: "MARUTHAM KART — Agricultural Marketplace" },
      { property: "og:description", content: "Connecting Farmers directly to Every Home, Hotel and Business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster position="top-center" expand={false} richColors />
        <Scripts />
      </body>
    </html>
  );
}

function RouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const target = getCurrentAppTarget();

  useEffect(() => {
    if (!isRouteAllowedForCurrentApp(location.pathname)) {
      console.warn(`Access denied to ${location.pathname} for ${target.appName} (${target.appId}). Redirecting to default route: ${target.defaultRoute}`);
      navigate({ to: target.defaultRoute as any });
    }
  }, [location.pathname, target, navigate]);

  if (!isRouteAllowedForCurrentApp(location.pathname)) {
    return null;
  }

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useMobileApp();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomerAppSplash />
        <RouteGuard>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </RouteGuard>
        <NetworkStatusPill />
      </AuthProvider>
    </QueryClientProvider>
  );
}
