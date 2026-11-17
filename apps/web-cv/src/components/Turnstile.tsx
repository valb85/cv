'use client';

import { useEffect, useRef } from 'react';

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loading: Promise<TurnstileApi> | null = null;

/** Loads Cloudflare's script once per page, however many widgets mount. */
const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')));
    script.onerror = () => {
      loading = null;
      reject(new Error('Could not load the Turnstile script.'));
    };
    document.head.append(script);
  });

  return loading;
};

/**
 * Cloudflare Turnstile, rendered explicitly so it also works after client-side
 * navigation (the implicit `.cf-turnstile` scan only runs on the first load).
 * The widget puts its token in a hidden `cf-turnstile-response` input inside
 * this element, so placed inside a <form> it is posted with the form.
 *
 * A token is single-use: bump `resetSignal` after every submit attempt.
 */
export const Turnstile = ({ siteKey, resetSignal }: { siteKey: string; resetSignal: number }) => {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) {
          return;
        }

        widgetId.current = api.render(container.current, {
          sitekey: siteKey,
          theme: 'dark',
          action: 'contact',
        });
      })
      .catch((error: unknown) => console.error(error));

    return () => {
      cancelled = true;

      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, [resetSignal]);

  return <div ref={container} className="turnstile" />;
};
