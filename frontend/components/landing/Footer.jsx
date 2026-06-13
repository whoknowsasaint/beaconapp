"use client"

const COLS = [
  {
    heading: "Product",
    links: [
      { label: "Features",      href: "#features"  },
      { label: "Dashboard",     href: "/login"      },
      { label: "Status pages",  href: "#features"  },
      { label: "API",           href: "https://github.com/beacon", external: true },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "Documentation", href: "https://github.com/beacon", external: true },
      { label: "GitHub",        href: "https://github.com/beacon", external: true },
      { label: "Changelog",     href: "https://github.com/beacon", external: true },
      { label: "Self-hosting",  href: "https://github.com/beacon", external: true },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Open source",   href: "https://github.com/beacon", external: true },
      { label: "MIT License",   href: "https://github.com/beacon", external: true },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "#08090C" }}>
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="7" fill="#1D4ED8"/>
              <circle cx="10" cy="18" r="2.2" fill="white"/>
              <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
              <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
              <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25"/>
            </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Beacon</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              Free, open source uptime monitoring and status pages.
            </p>
          </div>

          {COLS.map(col => (
            <div key={col.heading}>
              <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", transition: "color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a href={link.href}
                        style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", transition: "color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
            Beacon is open source. MIT License.
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            Built with Next.js and Django.
          </p>
        </div>
      </div>
    </footer>
  )
}