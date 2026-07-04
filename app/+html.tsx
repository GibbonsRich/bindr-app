import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

import { Pokemon } from '@/constants/Colors';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bindr" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1B2B5A" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html,
body,
#root {
  height: 100%;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}

body {
  background-color: ${Pokemon.bluePale};
  color-scheme: light;
  position: fixed;
  inset: 0;
  touch-action: manipulation;
  -webkit-touch-callout: none;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #000000;
    color-scheme: dark;
  }
}
`;
