// BeaconLogo.jsx
// The Beacon logomark: concentric arcs emanating from a dot- a real beacon/signal.
// Clean, geometric, scalable. Works at 16px (favicon) and 40px (navbar).

export function BeaconMark({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background square with rounded corners */}
      <rect width="28" height="28" rx="7" fill="#1D4ED8" />

      {/* Center dot- the source */}
      <circle cx="10" cy="18" r="2.2" fill="white" />

      {/* Arc 1- closest */}
      <path
        d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* Arc 2- mid */}
      <path
        d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />

      {/* Arc 3- far */}
      <path
        d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />
    </svg>
  );
}

// Full lockup: mark + wordmark
export function BeaconLockup({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <BeaconMark size={28} />
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: '-0.02em',
        }}
      >
        Beacon
      </span>
    </div>
  );
}

// Standalone SVG string- export this as favicon.svg
// Save the content of BeaconFaviconSVG as /public/favicon.svg
export const BeaconFaviconSVG = `<svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="28" height="28" rx="7" fill="#1D4ED8"/>
  <circle cx="10" cy="18" r="2.2" fill="white"/>
  <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.9"/>
  <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.55"/>
  <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.25"/>
</svg>`;