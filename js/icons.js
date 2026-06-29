/* Reusable SVG art — outdoorsy mountains, shapes & decorations. */
window.ART = (function () {

  // Layered mountain range used in the hero. Self-contained, no external images.
  function heroScene() {
    return `
    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2b4a57"/>
          <stop offset="55%" stop-color="#3c6168"/>
          <stop offset="100%" stop-color="#6e8f6f"/>
        </linearGradient>
        <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#24404b"/><stop offset="100%" stop-color="#1b3022"/>
        </linearGradient>
        <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a5a4a"/><stop offset="100%" stop-color="#2c4636"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sky)"/>
      <circle cx="312" cy="62" r="34" fill="#ffd9a8" opacity="0.85"/>
      <circle cx="312" cy="62" r="50" fill="#ffd9a8" opacity="0.18"/>
      <!-- back ridge -->
      <path d="M0 150 L70 96 L120 138 L185 80 L250 140 L310 100 L400 158 L400 300 L0 300 Z" fill="url(#m2)" opacity="0.85"/>
      <!-- snow caps -->
      <path d="M185 80 L168 96 L178 99 L185 92 L193 100 L205 96 Z" fill="#f3f0f0" opacity="0.9"/>
      <path d="M70 96 L58 110 L66 112 L70 105 L76 113 L84 108 Z" fill="#f3f0f0" opacity="0.85"/>
      <!-- front ridge -->
      <path d="M0 210 L90 150 L150 196 L220 142 L300 200 L400 156 L400 300 L0 300 Z" fill="url(#m1)"/>
      <path d="M220 142 L200 164 L213 168 L220 158 L229 169 L244 163 Z" fill="#f3f0f0" opacity="0.92"/>
      <!-- pines -->
      <g fill="#13251a" opacity="0.9">
        <path d="M40 270 l9 -26 l9 26 z"/><path d="M44 256 l5 -16 l5 16 z"/>
        <path d="M62 274 l7 -20 l7 20 z"/>
        <path d="M350 268 l9 -26 l9 26 z"/><path d="M354 254 l5 -16 l5 16 z"/>
      </g>
    </svg>`;
  }

  // Slim decorative mountain band for section tops / empty states.
  function mountainBand(opacity = 0.08) {
    return `
    <svg class="w-full h-10" viewBox="0 0 400 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0 40 L60 12 L100 30 L160 6 L220 32 L280 10 L340 30 L400 14 L400 40 Z" fill="#061b0e" opacity="${opacity}"/>
    </svg>`;
  }

  // A small route/topo flourish (dashed trail with a pin).
  function trailLine() {
    return `
    <svg viewBox="0 0 120 40" class="w-28 h-10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 30 C 28 8, 48 36, 70 18 S 104 8, 116 22" fill="none" stroke="#ab3500" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 7"/>
      <circle cx="4" cy="30" r="3.5" fill="#1b3022"/>
      <path d="M116 22 l-4 -8 a4.5 4.5 0 1 1 8 0 z" fill="#ab3500"/>
      <circle cx="116" cy="14" r="1.6" fill="#fff"/>
    </svg>`;
  }

  // Faux topographic map for the confirmation screen.
  function topoMap() {
    return `
    <svg class="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="400" height="200" fill="#aebfa0"/>
      <g fill="none" stroke="#8aa07c" stroke-width="1.5" opacity="0.8">
        <path d="M40 200 C 120 120, 200 180, 280 90 S 380 40, 420 70"/>
        <path d="M0 180 C 100 140, 180 200, 260 120 S 360 70, 440 100"/>
        <path d="M0 120 C 90 80, 160 130, 250 60"/>
      </g>
      <g stroke="#ffffff" stroke-width="2" opacity="0.85" fill="none" stroke-linejoin="round" stroke-linecap="round">
        <path d="M70 0 L120 70 L80 130 L160 200"/>
        <path d="M220 0 L240 80 L320 110 L300 200"/>
        <path d="M120 70 L240 80"/>
      </g>
      <circle cx="206" cy="96" r="9" fill="#ab3500"/>
      <circle cx="206" cy="96" r="9" fill="none" stroke="#fff" stroke-width="2.5"/>
      <circle cx="206" cy="96" r="18" fill="#ab3500" opacity="0.2"/>
    </svg>`;
  }

  return { heroScene, mountainBand, trailLine, topoMap };
})();
