/**
 * Prototype Navigation Widget
 *
 * A self-contained, unobtrusive floating picker that lets you jump between
 * the main DAW app and the design prototype/comp pages.
 *
 * USAGE
 *   <script src="/_nav/prototype-nav.js"></script>
 *
 * BEHAVIOR
 *   - Collapsed state: small 28px circular trigger in the bottom-right corner
 *     at 40% opacity. Brightens to 100% on hover.
 *   - Click trigger to open the menu (slides up above the trigger).
 *   - Click an item to navigate. Active page is marked.
 *   - Click outside the menu to dismiss it.
 *   - Esc closes the menu.
 *   - All UI is injected into a Shadow DOM so it can't conflict with page
 *     styles or get accidentally targeted by query selectors in the host page.
 *
 * To add or rename a page, edit PAGES below.
 */

(function() {
  'use strict';

  // ─── Page registry ────────────────────────────────────────────────────────
  const PAGES = [
    {
      section: 'App',
      items: [
        { label: 'Main DAW',                  path: '/',                                                       icon: '◉' },
      ],
    },
    {
      section: 'Motion',
      items: [
        { label: 'Heartbeat · synchronized',  path: '/motion-prototypes/01-startup-heartbeat-synchronized.html', icon: '♥' },
        { label: 'Heartbeat · staggered',     path: '/motion-prototypes/02-startup-heartbeat-staggered.html',    icon: '♥' },
        { label: 'VU meter animation',        path: '/motion-prototypes/03-vu-meter-animation.html',             icon: '▮' },
        { label: 'Waveform · zoom motion',    path: '/comps/waveform-zoom-motion.html',                          icon: '↔' },
      ],
    },
    {
      section: 'Comps',
      items: [
        { label: 'Waveform · detail study',   path: '/comps/waveform-detail.html',                               icon: '~' },
        { label: 'Waveform · premium',        path: '/comps/waveform-premium.html',                              icon: '~' },
        { label: 'Plugin browser · inline',   path: '/comps/plugin-browser-inline.html',                         icon: '+' },
        { label: 'Plugin browser · hi-fi',    path: '/comps/plugin-browser-hifi.html',                           icon: '◆' },
      ],
    },
  ];

  // ─── Avoid double-injection ───────────────────────────────────────────────
  if (window.__prototypeNavMounted) return;
  window.__prototypeNavMounted = true;

  // ─── Build host element + Shadow DOM ──────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'prototype-nav';
  host.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    pointer-events: none;
  `;
  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      :host { all: initial; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      * { box-sizing: border-box; margin: 0; padding: 0; }

      .trigger {
        pointer-events: auto;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(17, 17, 24, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.10);
        color: #888899;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.4;
        transition: opacity 0.18s ease, transform 0.18s ease, color 0.18s ease;
        font-size: 14px;
        line-height: 1;
        user-select: none;
      }
      .trigger:hover {
        opacity: 1;
        color: #F0F0F5;
        transform: scale(1.05);
      }
      .trigger.open {
        opacity: 1;
        color: #6B5CE7;
        border-color: rgba(107, 92, 231, 0.4);
      }
      .trigger svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }

      .menu {
        pointer-events: auto;
        position: absolute;
        bottom: 44px;
        right: 0;
        width: 232px;
        background: rgba(17, 17, 24, 0.96);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 6px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2);
        opacity: 0;
        transform: translateY(6px) scale(0.96);
        transform-origin: bottom right;
        transition: opacity 0.16s ease, transform 0.16s ease;
        pointer-events: none;
      }
      .menu.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      .section-label {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #555567;
        padding: 8px 10px 4px;
      }

      .item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 500;
        color: #B8B8C2;
        background: transparent;
        border: 0;
        border-radius: 5px;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s ease, color 0.1s ease;
        font-family: inherit;
      }
      .item:hover { background: rgba(255,255,255,0.04); color: #F0F0F5; }
      .item.active {
        background: rgba(107, 92, 231, 0.14);
        color: #6B5CE7;
      }
      .item.active::after {
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #6B5CE7;
        margin-left: auto;
        box-shadow: 0 0 6px #6B5CE7;
      }
      .item .icon {
        flex-shrink: 0;
        width: 14px;
        text-align: center;
        font-size: 10px;
        color: #555567;
        font-weight: 700;
      }
      .item.active .icon { color: #6B5CE7; }

      .footer-hint {
        font-size: 9px;
        color: #555567;
        padding: 6px 10px 4px;
        letter-spacing: 0.04em;
        border-top: 1px solid rgba(255,255,255,0.05);
        margin-top: 4px;
        text-align: center;
      }
    </style>

    <button class="trigger" aria-label="Open prototype navigation" title="Prototype navigation">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2" y="2" width="4" height="4" rx="0.5"/>
        <rect x="10" y="2" width="4" height="4" rx="0.5"/>
        <rect x="2" y="10" width="4" height="4" rx="0.5"/>
        <rect x="10" y="10" width="4" height="4" rx="0.5"/>
      </svg>
    </button>

    <div class="menu" role="menu" aria-label="Prototype pages">
      ${PAGES.map(group => `
        <div class="section-label">${group.section}</div>
        ${group.items.map(item => `
          <button
            class="item"
            data-path="${item.path}"
            role="menuitem"
          >
            <span class="icon">${item.icon}</span>
            <span>${item.label}</span>
          </button>
        `).join('')}
      `).join('')}
      <div class="footer-hint">Esc to close · Press \` to toggle</div>
    </div>
  `;

  document.body.appendChild(host);

  const trigger = shadow.querySelector('.trigger');
  const menu = shadow.querySelector('.menu');

  // ─── Active page detection ────────────────────────────────────────────────
  const currentPath = window.location.pathname;
  shadow.querySelectorAll('.item').forEach(btn => {
    const itemPath = btn.dataset.path;
    let isActive = false;
    if (itemPath === '/') {
      // Main app — match exact root or paths that aren't a prototype
      isActive = currentPath === '/' || currentPath === '/index.html';
    } else {
      isActive = currentPath === itemPath || currentPath.endsWith(itemPath);
    }
    if (isActive) btn.classList.add('active');
  });

  // ─── Open / close logic ───────────────────────────────────────────────────
  let isOpen = false;

  function open() {
    if (isOpen) return;
    isOpen = true;
    trigger.classList.add('open');
    menu.classList.add('open');
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    trigger.classList.remove('open');
    menu.classList.remove('open');
  }

  function toggle() {
    isOpen ? close() : open();
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    toggle();
  });

  // Navigate on item click
  shadow.querySelectorAll('.item').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const path = btn.dataset.path;
      if (path && !btn.classList.contains('active')) {
        window.location.href = path;
      } else {
        close();
      }
    });
  });

  // Click outside to close (we listen on document but use composedPath to
  // detect clicks outside the shadow host)
  document.addEventListener('click', e => {
    if (!isOpen) return;
    if (e.composedPath().includes(host)) return;
    close();
  });

  // Esc closes
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) {
      close();
      e.stopPropagation();
    }
    // ` (backtick) toggles — quick keyboard access
    if (e.key === '`' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      toggle();
    }
  });
})();
