// ──────────────────────────────────────────────
// Beacon — Root Layout
// Wraps every page. Sets metadata, fonts, and
// the dark background that all scenes sit on.
// ──────────────────────────────────────────────

import "./globals.css"

export const metadata = {
  title: {
    default: "Beacon — Status pages that build trust",
    template: "%s | Beacon",
  },
  description:
    "A free, self-hostable alternative to Statuspage.io. Monitor your services, manage incidents, and keep your users informed.",
  keywords: [
    "status page",
    "uptime monitoring",
    "incident management",
    "self-hosted",
    "open source",
  ],
  authors: [{ name: "Beacon" }],
  openGraph: {
    title: "Beacon — Status pages that build trust",
    description:
      "A free, self-hostable alternative to Statuspage.io.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beacon — Status pages that build trust",
    description:
      "A free, self-hostable alternative to Statuspage.io.",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Inter & JetBrains Mono loaded via Google Fonts.
          In production, self-host these for performance.
          Preconnect tags speed up the font handshake.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}