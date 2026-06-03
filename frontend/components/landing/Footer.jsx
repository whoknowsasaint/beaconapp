const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features",   href: "#features"  },
      { label: "Dashboard",  href: "/login"      },
      { label: "Status pages", href: "#scene-status-page" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "https://github.com/beacon", external: true },
      { label: "GitHub",        href: "https://github.com/beacon", external: true },
      { label: "Changelog",     href: "https://github.com/beacon", external: true },
    ],
  },
  {
    heading: "Self-host",
    links: [
      { label: "Docker",       href: "https://github.com/beacon", external: true },
      { label: "Environment",  href: "https://github.com/beacon", external: true },
      { label: "Telegram bot", href: "https://github.com/beacon", external: true },
    ],
  },
]

export default function Footer() {
  return (
    <footer
      className="border-t border-beacon-border mt-32"
      style={{ background: "var(--color-bg-elevated)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-md bg-beacon-blue flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
              <span className="text-sm font-semibold text-beacon-text">
                Beacon
              </span>
            </div>
            <p className="text-xs text-beacon-text-faint leading-relaxed">
              Free, self-hostable status pages and uptime monitoring.
            </p>
          </div>

          {FOOTER_LINKS.map(col => (
            <div key={col.heading}>
              <p className="text-xs font-medium text-beacon-text-faint uppercase tracking-wider mb-4">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(link => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-beacon-text-muted hover:text-beacon-text transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-beacon-text-muted hover:text-beacon-text transition-colors"
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-beacon-border">
          <p className="text-xs text-beacon-text-faint">
            Beacon is open source and free to self-host.
          </p>
          <p className="text-xs text-beacon-text-faint">
            MIT License
          </p>
        </div>
      </div>
    </footer>
  )
}