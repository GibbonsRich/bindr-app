import { useEffect } from 'react';
import { Platform } from 'react-native';

const VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

export function useWebAppShell() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const root = document.getElementById('root');
    const { documentElement: html, body } = document;

    const metaViewport = document.querySelector('meta[name="viewport"]');
    const previousViewport = metaViewport?.getAttribute('content') ?? null;
    metaViewport?.setAttribute('content', VIEWPORT_CONTENT);

    html.style.height = '100%';
    body.style.height = '100%';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.touchAction = 'manipulation';
    body.style.setProperty('-webkit-touch-callout', 'none');

    if (root) {
      root.style.height = '100%';
      root.style.overflow = 'hidden';
    }

    const blockMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };

    document.addEventListener('touchmove', blockMultiTouch, { passive: false });

    return () => {
      if (previousViewport) {
        metaViewport?.setAttribute('content', previousViewport);
      }
      document.removeEventListener('touchmove', blockMultiTouch);
    };
  }, []);
}
