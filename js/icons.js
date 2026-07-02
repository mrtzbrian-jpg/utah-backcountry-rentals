/* Reusable SVG art — outdoorsy mountains, shapes & decorations. */
window.ART = (function () {

  // Layered mountain range used in the hero. Self-contained, no external images.
  function heroScene() {
    return `
    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 900 220" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#1c2d52"/>
          <stop offset="30%"  stop-color="#2e4a7a"/>
          <stop offset="58%"  stop-color="#b54e20"/>
          <stop offset="78%"  stop-color="#e07828"/>
          <stop offset="100%" stop-color="#f0a030"/>
        </linearGradient>
        <radialGradient id="sunglow" cx="64%" cy="72%" r="35%">
          <stop offset="0%"   stop-color="#ffe566" stop-opacity="1"/>
          <stop offset="20%"  stop-color="#ffaa22" stop-opacity="0.7"/>
          <stop offset="60%"  stop-color="#e06010" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#c04000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#d4623a"/>
          <stop offset="40%"  stop-color="#9a3e22"/>
          <stop offset="100%" stop-color="#5a2210"/>
        </linearGradient>
        <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#7a3018"/>
          <stop offset="100%" stop-color="#2e1008"/>
        </linearGradient>
        <linearGradient id="mtn3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#2a1a0a"/>
          <stop offset="100%" stop-color="#120a04"/>
        </linearGradient>
        <linearGradient id="forest1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#1a2e18"/>
          <stop offset="100%" stop-color="#0a1408"/>
        </linearGradient>
        <linearGradient id="forest2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#0e1a0c"/>
          <stop offset="100%" stop-color="#060c04"/>
        </linearGradient>
        <radialGradient id="glowband" cx="50%" cy="100%" r="60%">
          <stop offset="0%"   stop-color="#f09030" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#f09030" stop-opacity="0"/>
        </radialGradient>
        <filter id="hblur2"><feGaussianBlur stdDeviation="2"/></filter>
        <filter id="hblur1"><feGaussianBlur stdDeviation="1"/></filter>
        <clipPath id="hclip"><rect width="900" height="220"/></clipPath>
      </defs>
      <g clip-path="url(#hclip)">
        <rect width="900" height="220" fill="url(#sky)"/>
        <rect width="900" height="220" fill="url(#sunglow)"/>
        <rect width="900" height="220" fill="url(#glowband)"/>
        <!-- Sun -->
        <circle cx="576" cy="140" r="16" fill="#ffe566"/>
        <circle cx="576" cy="140" r="24" fill="#ffdd44" opacity="0.25" filter="url(#hblur1)"/>
        <circle cx="576" cy="140" r="44" fill="#ffaa22" opacity="0.12" filter="url(#hblur2)"/>
        <!-- Clouds -->
        <g filter="url(#hblur1)" opacity="0.7">
          <path d="M20,36 Q50,22 90,30 Q120,18 155,28 Q175,20 195,26 Q185,40 155,42 Q120,46 80,40 Q50,44 20,38 Z" fill="#c05828"/>
          <path d="M240,20 Q275,10 315,18 Q345,8 378,16 Q395,10 412,15 Q402,28 370,30 Q335,34 295,26 Q265,32 240,26 Z" fill="#a04a70" opacity="0.8"/>
          <path d="M640,32 Q675,20 715,28 Q745,16 778,24 Q795,18 812,22 Q800,36 768,38 Q732,42 695,34 Q665,40 640,36 Z" fill="#c05828"/>
          <path d="M460,14 Q488,6 518,12 Q538,4 560,10 Q548,22 520,24 Q492,28 462,20 Z" fill="#8a3a60" opacity="0.7"/>
        </g>
        <!-- Distant mountains — alpenglow -->
        <path d="M-10,130 C20,130 30,90 55,72 C70,60 80,75 98,68 C112,62 118,50 140,38 C158,28 165,42 182,52 C196,60 202,46 220,35 C236,25 244,40 260,55 C272,66 278,50 298,40 C318,30 325,48 342,60 C356,70 360,52 380,38 C398,25 406,44 424,56 C438,65 442,48 462,34 C480,20 490,40 510,55 C525,66 530,48 550,35 C568,22 578,40 596,30 C612,20 618,38 636,50 C650,60 655,42 674,30 C692,18 700,36 720,50 C735,60 740,44 758,32 C775,20 782,38 800,48 C818,58 828,42 850,35 C868,28 878,40 910,50 L910,140 L-10,140 Z" fill="url(#mtn1)" opacity="0.9"/>
        <!-- Snow patches -->
        <path d="M136,38 C140,30 146,24 152,22 C158,20 164,26 162,34 C160,38 154,40 148,40 C142,40 136,40 136,38Z" fill="#f2d8c0" opacity="0.85"/>
        <path d="M218,35 C222,26 230,20 238,19 C246,18 250,26 248,34 C246,38 240,40 232,40 C224,40 218,38 218,35Z" fill="#f2d8c0" opacity="0.82"/>
        <path d="M376,38 C380,28 388,22 398,20 C408,18 414,28 410,38 C408,44 400,46 392,45 C384,44 378,42 376,38Z" fill="#f2d8c0" opacity="0.8"/>
        <path d="M458,34 C463,23 472,16 483,14 C494,12 500,22 496,33 C494,40 486,43 476,42 C466,41 460,38 458,34Z" fill="#f2d8c0" opacity="0.78"/>
        <path d="M546,35 C551,24 560,17 570,15 C580,13 586,24 582,35 C580,42 572,45 562,44 C552,43 546,40 546,35Z" fill="#efcfb0" opacity="0.75"/>
        <path d="M670,30 C675,20 684,13 694,11 C704,9 710,20 706,31 C704,38 696,41 686,40 C676,39 670,36 670,30Z" fill="#efcfb0" opacity="0.72"/>
        <!-- Mid mountains -->
        <path d="M-10,155 C15,155 25,125 48,110 C62,100 70,115 88,108 C102,102 110,88 130,78 C148,68 156,84 172,95 C184,103 190,88 208,76 C225,64 234,82 252,95 C266,105 272,88 292,74 C310,60 320,80 338,92 C352,102 358,84 378,70 C396,56 406,76 424,90 C438,100 444,82 464,68 C482,54 492,75 512,90 C528,102 534,82 554,68 C572,54 582,74 602,88 C618,99 624,80 644,66 C662,52 672,72 692,86 C708,97 714,78 734,64 C752,50 762,70 782,85 C798,97 808,76 828,63 C848,50 862,68 900,80 L910,160 L-10,160 Z" fill="url(#mtn2)"/>
        <!-- Foreground ridge -->
        <path d="M-10,175 C18,175 28,155 50,145 C65,138 75,150 95,143 C110,137 120,125 142,118 C160,112 168,128 186,138 C200,146 208,130 228,120 C246,110 256,128 276,140 C292,150 300,132 320,120 C338,108 350,128 368,142 C382,153 390,135 410,122 C428,109 440,130 460,144 C475,155 483,136 504,123 C523,110 535,132 555,146 C570,157 578,138 600,125 C620,112 632,134 652,148 C667,159 675,140 697,127 C717,114 730,136 750,150 C766,162 775,142 797,129 C818,116 832,138 860,152 C878,162 892,148 920,155 L920,220 L-10,220 Z" fill="url(#mtn3)"/>
        <!-- Back forest canopy -->
        <path d="M-10,185 C5,185 8,178 14,174 C18,170 22,176 28,173 C32,170 36,164 42,161 C46,158 50,164 56,168 C60,172 64,166 70,162 C74,158 78,162 84,165 C88,168 92,160 98,156 C103,152 107,158 113,162 C118,166 122,158 128,154 C133,150 137,156 143,160 C148,164 152,157 158,153 C163,149 167,155 173,159 C178,163 182,155 188,151 C193,147 197,154 204,158 C210,162 214,154 220,149 C226,144 230,152 237,156 C243,160 248,152 254,148 C260,144 265,151 272,155 C278,159 283,151 290,147 C296,143 301,150 308,154 C314,158 319,150 326,146 C332,142 337,150 344,154 C350,158 355,149 362,145 C368,141 373,148 380,152 C386,156 391,148 398,144 C404,140 410,148 417,152 C423,156 428,147 435,143 C441,139 446,147 453,151 C459,155 464,146 471,142 C477,138 483,146 490,150 C496,154 501,145 508,141 C514,137 520,145 527,149 C533,153 538,144 545,140 C551,136 557,144 564,148 C570,152 575,143 582,139 C588,135 594,143 601,147 C607,151 612,142 619,138 C625,134 631,142 638,146 C644,150 649,141 656,137 C662,133 668,141 675,145 C681,149 686,140 693,136 C699,132 705,140 712,144 C718,148 723,139 730,135 C736,131 742,139 749,143 C755,147 760,138 767,134 C773,130 779,138 786,142 C792,146 797,137 804,133 C810,129 820,136 835,140 C845,143 860,136 880,140 C895,143 905,138 920,140 L920,220 L-10,220 Z" fill="url(#forest1)" opacity="0.95"/>
        <!-- Front forest canopy -->
        <path d="M-10,200 C6,200 10,192 17,188 C22,185 27,190 33,187 C38,184 43,178 50,175 C55,172 60,178 66,182 C71,186 76,179 82,175 C87,171 92,177 99,181 C105,185 110,177 117,173 C123,169 129,175 136,179 C142,183 147,175 154,171 C160,167 166,173 173,177 C179,181 184,173 191,169 C197,165 203,172 210,176 C217,180 222,172 229,168 C236,164 242,171 249,175 C256,179 261,171 268,167 C275,163 281,170 288,174 C295,178 300,170 307,166 C314,162 320,169 327,173 C334,177 339,169 346,165 C353,161 359,168 366,172 C373,176 378,168 385,164 C392,160 398,167 405,171 C412,175 417,167 424,163 C431,159 437,166 444,170 C451,174 456,166 463,162 C470,158 476,165 483,169 C490,173 495,165 502,161 C509,157 515,164 522,168 C529,172 534,164 541,160 C548,156 554,163 561,167 C568,171 573,163 580,159 C587,155 593,162 600,166 C607,170 612,162 619,158 C626,154 632,161 639,165 C646,169 651,161 658,157 C665,153 671,160 678,164 C685,168 690,160 697,156 C704,152 710,159 717,163 C724,167 729,159 736,155 C743,151 749,158 756,162 C763,166 768,158 775,154 C782,150 790,157 800,161 C812,166 828,158 848,162 C862,165 880,158 910,162 L920,220 L-10,220 Z" fill="url(#forest2)"/>
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
