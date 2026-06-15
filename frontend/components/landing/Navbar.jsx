'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BeaconLockup } from './BeaconLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4"
      style={{ pointerEvents: 'none' }}
    >
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          pointerEvents: 'auto',
          
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          width: '100%',
          maxWidth: 780,
          padding: '10px 16px',
          borderRadius: 14,
          border: scrolled
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(255,255,255,0.06)',
          background: scrolled
            ? 'rgba(8,11,16,0.88)'
            : 'rgba(8,11,16,0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'background 250ms ease, border-color 250ms ease',
          boxShadow: scrolled
            ? '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
            : 'none',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mr-auto flex-shrink-0" aria-label="Beacon home">
          <BeaconMark />
          <span style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.92)',
            letterSpacing: '-0.02em',
          }}>
            Beacon
          </span>
        </Link>

        {/* Nav links — center */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Docs', href: '/docs' },
            { label: 'GitHub', href: 'https://github.com/your-org/beacon' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                fontSize: 14,
                fontWeight: 450,
                color: 'rgba(255,255,255,0.5)',
                padding: '6px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'color 150ms ease, background 150ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.88)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA — right */}
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/login"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.45)',
              padding: '7px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'color 150ms ease',
              display: 'none',
            }}
            className="md:block"
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
          >
            Sign in
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#fff',
              padding: '7px 16px',
              borderRadius: 8,
              background: '#2563EB',
              textDecoration: 'none',
              transition: 'background 150ms ease, box-shadow 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#1D4ED8';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#2563EB';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Get started
          </Link>
        </div>
      </motion.nav>
    </header>
  );
}


function BeaconMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect width="28" height="28" rx="7" fill="#1D4ED8"/>
      <circle cx="10" cy="18" r="2.2" fill="white"/>
      <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
      <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25"/>
    </svg>
  );
}