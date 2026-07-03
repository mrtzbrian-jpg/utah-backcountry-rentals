/* All screens, rendered as HTML strings. Relies on window.DATA, window.ART,
   and helpers (fmt, STATE, etc.) defined in app.js. */
window.VIEWS = (function () {
  const D = window.DATA;
  const ART = window.ART;

  /* HTML-escape any value that originates from a customer (renter name, phone,
     email, etc.) before injecting it into innerHTML. Without this, a customer
     could book under a name like "<img onerror=…>" and run script in the
     OWNER's logged-in browser (stored XSS) — the one place a booking field is
     rendered in a privileged context. */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- pickup time windows ---------- */
  const PICKUP_TIMES = [
    { label: "Morning",   sub: "9 AM – 11 AM" },
    { label: "Midday",    sub: "11 AM – 1 PM" },
    { label: "Afternoon", sub: "2 PM – 5 PM" },
    { label: "By Appt",   sub: "Contact us" }
  ];

  /* ---------- product imagery ----------
     Stable stock photos keyed by the item's Material icon, so every product
     shows a real image even before the owner uploads their own. An item's own
     `img` (uploaded in Manage Gear) always wins; if a photo fails to load we
     fall back to the icon tile underneath. */
  const PHOTO_BY_ICON = {
    backpack:        "photo-1622260614153-03223fb72052",
    hiking:          "photo-1501555088652-021faa106b9b",
    satellite_alt:   "photo-1517824806704-9040b037703b",
    cabin:           "photo-1504280390367-361c6d9f38f4",
    bedtime:         "photo-1565992441121-4367c2967103",
    king_bed:        "photo-1565992441121-4367c2967103",
    lunch_dining:    "photo-1486870591958-9b9d0d1dda99",
    ac_unit:         "photo-1418985991508-e47386d96a71",
    water_drop:      "photo-1559825481-12a05cc00344",
    health_and_safety:"photo-1559825481-12a05cc00344",
    _default:        "photo-1533873984035-25970ab07461"
  };
  function photoUrl(item, w) {
    const id = PHOTO_BY_ICON[item.icon] || PHOTO_BY_ICON._default;
    return `https://images.unsplash.com/${id}?auto=format&fit=crop&q=70&w=${w || 800}`;
  }
  function imageFor(item, w) { return item.img || photoUrl(item, w); }

  /* ---------- shared chrome ---------- */

  function topBar({ title, leading = "menu", back = false, location = false, trailing = "" }) {
    if (back) {
      const trail = trailing || `<span class="w-8"></span>`;
      return `
      <header class="bg-surface w-full top-0 sticky border-b-2 border-granite-wash z-50">
        <div class="flex items-center gap-2 px-4 py-4 max-w-container-max mx-auto">
          <button data-action="back" class="p-2 -ml-2 rounded-full hover:bg-granite-wash press text-on-surface shrink-0">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 class="flex-1 font-heading text-headline-sm text-forest-deep text-center leading-tight">${title}</h1>
          ${trail}
        </div>
      </header>`;
    }
    return `
    <header class="bg-surface w-full top-0 sticky border-b-2 border-granite-wash z-50">
      <div class="flex items-center justify-between px-4 py-4 max-w-container-max mx-auto">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-forest-deep text-[24px]">landscape</span>
          <h1 class="font-heading text-headline-md font-bold text-forest-deep">Take a Hike Rentals</h1>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1.5 bg-granite-wash rounded-full border border-outline-variant">
          <span class="material-symbols-outlined text-[14px] text-on-surface-variant">location_on</span>
          <span class="text-[12px] font-semibold leading-tight text-forest-deep">SLC, UT</span>
        </div>
      </div>
    </header>`;
  }

  function bottomNav(active) {
    const items = [
      { route: "#/", icon: "home", label: "Home" },
      { route: "#/builder", icon: "backpack", label: "Build" },
      { route: "#/bookings", icon: "calendar_today", label: "Bookings" },
      { route: "#/how", icon: "info", label: "Guide" }
    ];
    return `
    <nav class="fixed bottom-0 inset-x-0 z-50 bg-paper-white border-t-2 border-granite-wash shadow-[0_-2px_10px_rgba(6,27,14,0.08)] safe-bottom">
      <div class="flex justify-around items-center px-2 pt-2 pb-1 max-w-container-max mx-auto">
        ${items.map(i => {
          const on = i.route === active;
          return `
          <button data-action="nav" data-route="${i.route}"
            class="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-xl press transition-all
            ${on ? "bg-secondary-container text-on-secondary-container" : "text-earth-brown hover:bg-granite-wash"}">
            <span class="material-symbols-outlined ${on ? "ms-fill" : ""}">${i.icon}</span>
            <span class="text-[11px] font-semibold leading-tight tracking-wide">${i.label}</span>
          </button>`;
        }).join("")}
      </div>
    </nav>`;
  }

  function page(inner, { active = "#/", pad = true } = {}) {
    return `<div class="view-enter min-h-screen flex flex-col">
      ${inner}
      <div class="${pad ? "h-[92px]" : ""}"></div>
      ${bottomNav(active)}
    </div>`;
  }

  /* ---------- reusable pieces ---------- */

  // Renders a product photo (if item.img is set) layered over an icon that shows
  // through automatically whenever the image is missing or fails to load.
  function mediaLayer(item, iconPx) {
    const icon = `<span class="material-symbols-outlined" style="font-size:${iconPx}px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>`;
    if (!item.img) return icon;
    const base = item.img.replace(/\.[a-z0-9]+$/i, ""); // accept jpg/png/webp automatically
    return `<img src="${item.img}" alt="${item.name}" loading="lazy" data-base="${base}" data-exts="png,webp,jpeg"
      class="absolute inset-0 w-full h-full object-contain p-3" onerror="tryImg(this)"/>${icon}`;
  }

  function gearTile(item, { h = "aspect-[4/3]", big = false } = {}) {
    return `
    <div class="relative ${h} gear-tile rounded-xl overflow-hidden flex items-center justify-center">
      ${mediaLayer(item, big ? 120 : 64)}
      <div class="absolute bottom-0 inset-x-0 opacity-60 pointer-events-none">${ART.mountainBand(0.10)}</div>
    </div>`;
  }

  function gearCard(item, i = 0) {
    if (item.category === "Bundles") return bundleCard(item, i);
    const fav = window.STATE.favs.has(item.id);
    return `
    <article class="group flex flex-col bg-paper-white border border-outline-variant/70 rounded-2xl overflow-hidden hover:shadow-[0_10px_28px_-8px_rgba(6,27,14,0.22)] hover:-translate-y-0.5 transition-all duration-200 reveal" style="animation-delay:${i * 60}ms">
      <div data-action="view" data-id="${item.id}" class="relative aspect-[4/3] overflow-hidden bg-surface-container flex items-center justify-center cursor-pointer">
        <img src="${imageFor(item, 800)}" alt="${item.name}" loading="lazy"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onerror="imgFallback(this)" />
        <span class="gear-fallback-icon material-symbols-outlined opacity-0"
          style="font-size:72px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
        ${item.badge ? `<span class="absolute top-2.5 left-2.5 bg-paper-white/95 text-forest-deep text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full shadow-sm">${item.badge}</span>` : ""}
        <button data-action="fav" data-id="${item.id}"
          class="absolute top-2 right-2 bg-paper-white/85 backdrop-blur rounded-full p-1.5 press opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${fav ? "!opacity-100" : ""}">
          <span class="material-symbols-outlined text-[18px] ${fav ? "ms-fill text-canyon-clay" : "text-outline"}">favorite</span>
        </button>
      </div>
      <div class="p-3.5 sm:p-4 flex flex-col flex-1">
        <div data-action="view" data-id="${item.id}" class="cursor-pointer flex-1">
          <span class="text-[10px] font-bold tracking-[0.13em] uppercase text-canyon-clay">${item.category}</span>
          <h3 class="font-heading text-[15px] sm:text-[16px] text-forest-deep leading-snug mt-0.5 line-clamp-2">${item.name}</h3>
          <p class="text-[12px] text-earth-brown mt-1 line-clamp-1 hidden sm:block">${item.tagline || item.desc || ""}</p>
        </div>
        <div class="flex items-center justify-between gap-2 mt-3">
          <div class="leading-none min-w-0">
            <span class="text-[10px] text-outline uppercase tracking-wider font-semibold">Rental</span>
            <p class="text-[17px] font-extrabold text-forest-deep leading-tight">${fmt.money(item.price)}</p>
          </div>
          <button data-action="book" data-id="${item.id}"
            class="bg-canyon-clay text-on-secondary rounded-lg px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] font-bold tracking-wide press hover:brightness-105 shrink-0">
            Book
          </button>
        </div>
      </div>
    </article>`;
  }

  function kitCard(kit) {
    const items = kit.items.map(id => D.packLibrary.find(x => x.id === id)).filter(Boolean);
    const weight = items.reduce((s, x) => s + x.weight, 0);
    const price = items.reduce((s, x) => s + x.price, 0);
    return `
    <div class="bg-surface-container-lowest rounded-xl shadow-card p-md flex flex-col">
      <div class="flex items-center gap-sm">
        <div class="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1;">${kit.icon}</span>
        </div>
        <div>
          <h3 class="font-heading text-headline-sm leading-tight">${kit.name}</h3>
          <p class="text-label-sm text-outline">${items.length} items · ${weight.toFixed(1)} lbs</p>
        </div>
      </div>
      <p class="text-body-md text-on-surface-variant mt-sm flex-1">${kit.blurb}</p>
      <div class="mt-sm flex items-center justify-between">
        <span class="font-heading text-headline-sm text-secondary">${fmt.money(price)}</span>
        <button data-action="load-kit" data-kit="${kit.id}" class="bg-primary text-on-primary rounded-full px-md py-2 text-label-md press flex items-center gap-1">
          <span class="material-symbols-outlined text-[18px]">add_circle</span>Load kit
        </button>
      </div>
    </div>`;
  }

  /* ---------- BUNDLE CARD (full-width horizontal) ---------- */

  function bundleCard(item, i = 0) {
    const fav = window.STATE.favs.has(item.id);
    const chips = (item.includes || []).slice(0, 3).map(x =>
      `<span class="text-[11px] bg-granite-wash text-forest-deep px-2 py-0.5 rounded-full whitespace-nowrap leading-snug">${x.replace(/ backpack| pack/i, "")}</span>`
    ).join("");
    const extra = (item.includes || []).length - 3;
    return `
    <article class="col-span-full bg-paper-white border border-outline-variant card-elevation rounded-xl overflow-hidden reveal flex h-40 sm:h-44" style="animation-delay:${i * 70}ms">
      <div class="relative w-36 sm:w-44 shrink-0 bg-surface-container cursor-pointer" data-action="view" data-id="${item.id}">
        <img src="${imageFor(item, 600)}" alt="${item.name}" loading="lazy"
          class="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onerror="imgFallback(this)" />
        <span class="gear-fallback-icon material-symbols-outlined opacity-0 absolute inset-0 flex items-center justify-center text-[60px]"
          style="color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
        ${item.badge ? `<span class="absolute top-2 left-2 bg-forest-deep text-paper-white text-[10px] font-bold px-2 py-0.5 rounded-full">${item.badge}</span>` : ""}
        <button data-action="fav" data-id="${item.id}"
          class="absolute top-2 right-2 bg-paper-white/90 rounded-full p-1 press">
          <span class="material-symbols-outlined text-[18px] ${fav ? "ms-fill text-canyon-clay" : "text-outline"}">favorite</span>
        </button>
      </div>
      <div class="flex-1 p-4 flex flex-col gap-1.5 min-w-0">
        <div data-action="view" data-id="${item.id}" class="cursor-pointer">
          <span class="text-[10px] font-bold tracking-widest uppercase text-canyon-clay">Bundle</span>
          <h3 class="font-heading text-headline-sm text-forest-deep leading-tight">${item.name}</h3>
          <p class="text-[13px] text-earth-brown mt-0.5 line-clamp-1">${item.tagline || ""}</p>
        </div>
        <div class="flex flex-wrap gap-1 mt-0.5">
          ${chips}
          ${extra > 0 ? `<span class="text-[11px] bg-granite-wash text-outline px-2 py-0.5 rounded-full">+${extra} more</span>` : ""}
        </div>
        <div class="flex items-center justify-between mt-auto pt-1">
          <div>
            <span class="text-[10px] text-outline uppercase tracking-wider font-semibold">Weekend</span>
            <p class="text-base font-bold text-forest-deep leading-tight">${fmt.money(item.price)}</p>
          </div>
          <button data-action="book" data-id="${item.id}"
            class="bg-canyon-clay text-on-secondary rounded-lg px-3 py-2 text-[13px] font-bold tracking-wide inner-shadow-stamped press hover:brightness-105 shrink-0">
            Book Bundle
          </button>
        </div>
      </div>
    </article>`;
  }

  /* ---------- BUNDLE MINI CARD (showcase strip) ---------- */

  function bundleMiniCard(item) {
    const count = (item.bundleItems || item.includes || []).length;
    return `
    <article class="group snap-start shrink-0 w-60 sm:w-64 bg-paper-white border border-outline-variant/70 rounded-2xl overflow-hidden card-elevation press">
      <div class="relative aspect-[3/2] bg-surface-container overflow-hidden cursor-pointer" data-action="view" data-id="${item.id}">
        <img src="${imageFor(item, 600)}" alt="${item.name}" loading="lazy"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onerror="imgFallback(this)" />
        <span class="gear-fallback-icon material-symbols-outlined opacity-0 absolute inset-0 flex items-center justify-center text-[56px]"
          style="color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
        <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent pointer-events-none"></div>
        ${item.badge ? `<span class="absolute top-2.5 left-2.5 bg-paper-white/95 text-forest-deep text-[10px] font-bold px-2 py-0.5 rounded-full">${item.badge}</span>` : ""}
      </div>
      <div class="p-3.5">
        <span class="text-[10px] font-bold tracking-[0.14em] uppercase text-canyon-clay">Bundle · ${count} items</span>
        <h3 class="font-heading text-[16px] text-forest-deep leading-tight mt-0.5 line-clamp-1 cursor-pointer" data-action="view" data-id="${item.id}">${item.name}</h3>
        <p class="text-[12px] text-earth-brown mt-0.5 line-clamp-1">${item.tagline || ""}</p>
        <div class="flex items-center justify-between mt-2.5">
          <div class="leading-none">
            <span class="text-[10px] text-outline uppercase tracking-wider font-semibold">From</span>
            <p class="text-[17px] font-extrabold text-forest-deep leading-tight">${fmt.money(item.price)}</p>
          </div>
          <button data-action="book" data-id="${item.id}"
            class="bg-canyon-clay text-on-secondary rounded-lg px-3.5 py-2 text-[12px] font-bold tracking-wide press hover:brightness-105 shrink-0">
            Book
          </button>
        </div>
      </div>
    </article>`;
  }

  /* ---------- HOME ---------- */

  function home() {
    const cat = window.STATE.category;
    const search = (window.STATE.search || "").toLowerCase().trim();
    const all = window.CATALOG.gear();
    const bundles = all.filter(g => g.category === "Bundles");
    const singles = all.filter(g => g.category !== "Bundles");
    const filtered = search
      ? all.filter(g => (g.name + " " + (g.tagline || "") + " " + g.category).toLowerCase().includes(search))
      : (cat === "All" ? singles : all.filter(g => g.category === cat));
    const feed = filtered;
    // Show the bundles showcase strip only on the default "All" view (never mixed into the gear grid).
    const showBundleStrip = !search && cat === "All" && bundles.length > 0;

    const pills = ["All", ...window.CATALOG.categories()].map(c => {
      const on = c === cat;
      return `<button data-action="category" data-cat="${c}"
        class="shrink-0 px-4 py-2 rounded-full text-[13px] font-bold tracking-wide whitespace-nowrap press transition-colors
        ${on ? "bg-forest-deep text-paper-white inner-shadow-stamped" : "bg-paper-white border border-outline-variant text-forest-deep hover:bg-granite-wash"}">${c}</button>`;
    }).join("");

    const inner = `
      ${topBar({ title: "Take a Hike Rentals", location: true })}
      <main class="flex-grow max-w-container-max mx-auto w-full">
        <!-- Hero — full-bleed, edge to edge -->
        <section class="relative min-h-[220px] sm:min-h-[280px] overflow-hidden flex flex-col justify-end">
          ${ART.heroScene()}
          <div class="hero-gradient absolute inset-0 pointer-events-none"></div>
          <div class="relative z-10 p-6 sm:p-10">
            <p class="text-white/70 text-[11px] font-bold tracking-[0.18em] uppercase mb-2 flex items-center gap-1.5"><span class="material-symbols-outlined text-[15px]" style="font-variation-settings:'FILL' 1;">distance</span>Saratoga Springs · Utah</p>
            <h2 style="font-family:Montserrat,system-ui,sans-serif;font-size:clamp(26px,4.8vw,42px);line-height:1.12;letter-spacing:-0.02em;font-weight:800;"
              class="text-white drop-shadow-lg mb-2">The Trail Is Calling.<br/><span style="color:#f5c060;">Grab the Gear &amp; Go.</span></h2>
            <p class="text-white/85 text-body-md mb-5 max-w-md">Premium hiking, camping &amp; backpacking gear — rent it, reserve your dates, and hit the backcountry without the retail price tag.</p>
            <div class="flex flex-wrap gap-3">
              <button data-action="browse-gear"
                class="bg-canyon-clay text-on-secondary px-5 py-3 rounded-lg text-[13px] font-bold tracking-wide inner-shadow-stamped press">
                Browse Gear
              </button>
              <button data-action="nav" data-route="#/builder"
                class="bg-paper-white text-forest-deep px-5 py-3 rounded-lg text-[13px] font-bold tracking-wide press inner-shadow-stamped">
                Build a Bundle
              </button>
            </div>
          </div>
        </section>

        <div class="px-4 sm:px-6">
          <!-- Value props strip (REI-style trust bar) -->
          <section class="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            ${[
              ["forest", "Trail-Tested Gear", "Top brands, ready to roll"],
              ["distance", "Local Pickup", "Saratoga Springs, UT"],
              ["event_available", "Reserve Online", "Pick your trail dates"],
              ["verified_user", "Refundable Hold", "Back when you return"]
            ].map(([icon, title, sub]) => `
              <div class="flex items-center gap-2.5 rounded-xl border border-outline-variant bg-paper-white px-3 py-2.5">
                <span class="material-symbols-outlined text-[24px] text-forest-deep shrink-0" style="font-variation-settings:'FILL' 1;">${icon}</span>
                <div class="min-w-0">
                  <p class="text-[12px] font-bold text-forest-deep leading-tight">${title}</p>
                  <p class="text-[11px] text-earth-brown leading-tight truncate">${sub}</p>
                </div>
              </div>`).join("")}
          </section>

          <!-- Build your own pack banner -->
          <button data-action="nav" data-route="#/builder"
            class="w-full mt-5 text-left bg-forest-deep text-paper-white rounded-xl p-5 flex items-center gap-4 press overflow-hidden relative inner-shadow-stamped">
            <span class="material-symbols-outlined text-[44px] text-primary-fixed-dim shrink-0" style="font-variation-settings:'FILL' 1;">backpack</span>
            <div class="flex-1 min-w-0">
              <p class="font-heading text-headline-sm">Build Your Own Pack</p>
              <p class="text-body-md text-primary-fixed-dim mt-0.5">Hand-pick gear, see total weight &amp; price</p>
            </div>
            <span class="text-[12px] font-bold tracking-widest text-primary-fixed-dim shrink-0">START →</span>
          </button>

          <!-- Search bar -->
          <div class="mt-5 relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-outline pointer-events-none">search</span>
            <input id="gear-search" type="search" placeholder="Search gear…" value="${search}"
              class="w-full rounded-xl border border-outline-variant bg-paper-white pl-10 pr-4 py-2.5 text-body-md focus:border-primary focus:ring-0" />
            ${search ? `<button data-action="search-clear" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-container press"><span class="material-symbols-outlined text-[18px] text-outline">close</span></button>` : ""}
          </div>

          <!-- Category pills — hidden while searching -->
          ${search ? "" : `<section class="mt-3 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div class="flex gap-3 overflow-x-auto no-scrollbar py-1">${pills}</div>
          </section>`}

          <!-- Featured bundles showcase (kept separate from the gear grid) -->
          ${showBundleStrip ? `<section class="mt-7">
            <div class="flex items-end justify-between mb-3">
              <div>
                <p class="text-[11px] font-bold tracking-[0.15em] uppercase text-canyon-clay">Curated &amp; ready</p>
                <h2 class="font-heading text-headline-md text-forest-deep leading-tight">Shop Bundles</h2>
              </div>
              <button data-action="category" data-cat="Bundles" class="text-[13px] font-bold text-canyon-clay press flex items-center gap-0.5 shrink-0">View all<span class="material-symbols-outlined text-[18px]">chevron_right</span></button>
            </div>
            <div class="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
              ${bundles.map(b => bundleMiniCard(b)).join("")}
            </div>
          </section>` : ""}

          <!-- Section header -->
          ${search ? "" : `<div class="flex items-baseline justify-between mt-8 mb-1 scroll-mt-20">
            <h2 class="font-heading text-headline-md text-forest-deep">${cat === "All" ? "Shop Gear" : cat === "Bundles" ? "Ready-Made Bundles" : cat}</h2>
            <span class="text-[12px] font-semibold text-outline">${feed.length} item${feed.length === 1 ? "" : "s"}</span>
          </div>`}

          <!-- Feed -->
          <section id="gear-feed" class="mt-3 pb-4 grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 scroll-mt-20">
            ${feed.length ? feed.map((g, i) => gearCard(g, i)).join("") : `<div class="col-span-full text-center py-lg text-on-surface-variant"><span class="material-symbols-outlined text-[40px] opacity-40">search_off</span><p class="mt-2 text-body-md">${search ? `No gear matches "${search}"` : "Nothing here yet — check back soon."}</p></div>`}
          </section>
        </div>
      </main>`;
    return page(inner + cartFab(), { active: "#/" });
  }

  /* ---------- PRODUCT DETAIL ---------- */

  /* ---------- BUNDLE DETAIL ---------- */

  function bundleDetail(id) {
    const item = window.CATALOG.get(id);
    if (!item) return notFound();
    const fav = window.STATE.favs.has(item.id);
    const hold = Math.min(item.deposit || 0, 250);
    const allImgs = [item.img, ...(item.imgs || [])].filter(Boolean);
    const primary = allImgs[0] || null;

    const includesList = (item.includes || []).map(x =>
      `<li class="flex items-start gap-2 text-body-md text-on-surface-variant">
        <span class="material-symbols-outlined text-[18px] text-canyon-clay mt-0.5">check_circle</span>${x}
      </li>`).join("");

    const gallery = allImgs.length > 1
      ? `<section class="relative bg-surface-container" id="gallery-wrap">
          <div class="relative h-64 sm:h-80 overflow-hidden flex items-center justify-center">
            <img id="gallery-main" src="${primary}" alt="${item.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover"/>
            <span class="gear-fallback-icon material-symbols-outlined opacity-0" style="font-size:120px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
          </div>
          <div class="flex gap-2 px-4 py-3 overflow-x-auto">
            ${allImgs.map((src, idx) => `<button data-action="gallery-thumb" data-idx="${idx}" class="gallery-thumb shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${idx === 0 ? "border-canyon-clay" : "border-transparent"} press">
              <img src="${src}" alt="" loading="lazy" class="w-full h-full object-cover"/></button>`).join("")}
          </div>
        </section>`
      : `<section class="relative h-64 sm:h-80 overflow-hidden bg-surface-container flex items-center justify-center">
          <img src="${primary ? primary : imageFor(item, 1000)}" alt="${item.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover"/>
          <span class="gear-fallback-icon material-symbols-outlined opacity-0" style="font-size:120px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
        </section>`;

    const inner = `
      ${topBar({ title: item.name, back: true, trailing: `<button data-action="fav" data-id="${item.id}" class="p-2 rounded-full hover:bg-granite-wash press"><span class="material-symbols-outlined text-[22px] ${fav ? "ms-fill text-canyon-clay" : "text-outline"}">favorite</span></button>` })}
      <main class="flex-grow max-w-container-max mx-auto w-full pb-[120px]">
        ${gallery}
        <div class="px-4 sm:px-6 mt-5">
          <span class="inline-block text-[11px] font-bold tracking-widest uppercase text-canyon-clay">Bundle</span>
          <h1 class="font-heading text-headline-lg text-forest-deep mt-1 leading-tight">${item.name}</h1>
          ${item.tagline ? `<p class="text-body-lg text-earth-brown mt-1">${item.tagline}</p>` : ""}

          <div class="mt-3 flex items-baseline gap-2">
            <span class="font-heading text-headline-md text-forest-deep">${fmt.money(item.price)}</span>
            <span class="text-[12px] font-semibold tracking-wide text-outline uppercase">/ weekend rental</span>
          </div>

          ${item.desc ? `<p class="text-body-md text-on-surface-variant mt-4 leading-relaxed">${item.desc}</p>` : ""}

          ${includesList ? `
          <div class="mt-6">
            <h2 class="text-[12px] font-bold tracking-widest uppercase text-earth-brown mb-3">What's included</h2>
            <ul class="grid gap-2.5">${includesList}</ul>
          </div>` : ""}

          ${hold ? `<div class="mt-6 rounded-xl bg-granite-wash border border-outline-variant p-4 flex gap-3 items-start">
            <span class="material-symbols-outlined text-[20px] text-forest-deep mt-0.5">lock</span>
            <p class="text-[13px] text-earth-brown leading-relaxed">A refundable <strong class="text-forest-deep">${fmt.money(hold)}</strong> hold is placed on your card for damage or theft and released when you return the gear.</p>
          </div>` : ""}
        </div>
      </main>

      <div class="fixed bottom-0 inset-x-0 z-40 bg-paper-white border-t-2 border-granite-wash safe-bottom">
        <div class="max-w-container-max mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <div class="min-w-0 shrink-0">
            <p class="text-[11px] text-outline uppercase tracking-wider font-semibold">From</p>
            <p class="font-heading text-headline-sm text-forest-deep leading-none">${fmt.money(item.price)}</p>
          </div>
          <button data-action="cart-add" data-id="${item.id}"
            class="flex-1 border-2 border-canyon-clay text-canyon-clay rounded-lg py-3 text-[13px] font-bold tracking-wide press hover:bg-canyon-clay/5">
            + Cart
          </button>
          <button data-action="book" data-id="${item.id}"
            class="flex-1 bg-canyon-clay text-on-secondary rounded-lg py-3 text-[13px] font-bold tracking-wide inner-shadow-stamped press hover:brightness-105">
            Book Bundle
          </button>
        </div>
      </div>
      ${cartFab()}`;
    return `<div class="view-enter min-h-screen flex flex-col">${inner}</div>`;
  }

  /* ---------- PRODUCT DETAIL ---------- */

  function productDetail(id) {
    const item = window.CATALOG.get(id);
    if (!item) return notFound();
    if (item.category === "Bundles") return bundleDetail(id);
    const fav = window.STATE.favs.has(item.id);
    const hold = Math.min(item.deposit || 0, 250);
    const includes = (item.includes || []).map(x =>
      `<li class="flex items-start gap-2 text-body-md text-on-surface-variant"><span class="material-symbols-outlined text-[18px] text-canyon-clay mt-0.5">check_circle</span>${x}</li>`).join("");

    const inner = `
      ${topBar({ title: item.name, back: true })}
      <main class="flex-grow max-w-container-max mx-auto w-full pb-[120px]">
        <!-- photo gallery -->
        ${(() => {
          const allImgs = [item.img, ...(item.imgs || [])].filter(Boolean);
          const primary = allImgs[0] || null;
          if (allImgs.length > 1) {
            const thumbs = allImgs.map((src, idx) =>
              `<button data-action="gallery-thumb" data-idx="${idx}" class="gallery-thumb shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${idx === 0 ? "border-canyon-clay" : "border-transparent"} press">
                <img src="${src}" alt="" loading="lazy" class="w-full h-full object-cover" /></button>`
            ).join("");
            return `
            <section class="relative bg-surface-container" id="gallery-wrap">
              <div class="relative h-72 sm:h-96 overflow-hidden flex items-center justify-center">
                <img id="gallery-main" src="${primary}" alt="${item.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover" />
                <span class="gear-fallback-icon material-symbols-outlined opacity-0" style="font-size:120px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
                ${item.badge ? `<span class="absolute top-4 left-4 bg-forest-deep text-paper-white text-[11px] font-bold tracking-wide px-3 py-1 rounded-full">${item.badge}</span>` : ""}
                <button data-action="fav" data-id="${item.id}" class="absolute top-4 right-4 bg-paper-white/90 rounded-full p-2 press">
                  <span class="material-symbols-outlined text-[22px] ${fav ? "ms-fill text-canyon-clay" : "text-outline"}">favorite</span>
                </button>
              </div>
              <div class="flex gap-2 px-4 py-3 overflow-x-auto">${thumbs}</div>
            </section>`;
          }
          return `
          <section class="relative h-72 sm:h-96 overflow-hidden bg-surface-container flex items-center justify-center">
            <img src="${primary ? primary : imageFor(item, 1000)}" alt="${item.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover" />
            <span class="gear-fallback-icon material-symbols-outlined opacity-0" style="font-size:120px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
            ${item.badge ? `<span class="absolute top-4 left-4 bg-forest-deep text-paper-white text-[11px] font-bold tracking-wide px-3 py-1 rounded-full">${item.badge}</span>` : ""}
            <button data-action="fav" data-id="${item.id}" class="absolute top-4 right-4 bg-paper-white/90 rounded-full p-2 press">
              <span class="material-symbols-outlined text-[22px] ${fav ? "ms-fill text-canyon-clay" : "text-outline"}">favorite</span>
            </button>
          </section>`;
        })()}

        <div class="px-4 sm:px-6 mt-5">
          <span class="inline-block text-[11px] font-bold tracking-widest uppercase text-canyon-clay">${item.category || "Gear"}</span>
          <h1 class="font-heading text-headline-lg text-forest-deep mt-1 leading-tight">${item.name}</h1>
          ${item.tagline ? `<p class="text-body-lg text-earth-brown mt-1">${item.tagline}</p>` : ""}

          <div class="mt-4 flex items-baseline gap-2">
            <span class="font-heading text-headline-md text-forest-deep">${fmt.money(item.price)}</span>
            <span class="text-[12px] font-semibold tracking-wide text-outline uppercase">${item.perDay ? "/ day" : "rental"}</span>
          </div>

          ${item.desc ? `<p class="text-body-md text-on-surface-variant mt-4 leading-relaxed">${item.desc}</p>` : ""}

          ${includes ? `<div class="mt-6"><h2 class="text-[12px] font-bold tracking-widest uppercase text-earth-brown mb-2">What's included</h2><ul class="grid gap-2">${includes}</ul></div>` : ""}

          ${hold ? `<div class="mt-6 rounded-xl bg-granite-wash border border-outline-variant p-4 flex gap-3 items-start">
            <span class="material-symbols-outlined text-[20px] text-forest-deep mt-0.5">lock</span>
            <p class="text-[13px] text-earth-brown leading-relaxed">A refundable <strong class="text-forest-deep">${fmt.money(hold)}</strong> hold is placed on your card for damage or theft and released when you return the gear. Only the rental fee is charged.</p>
          </div>` : `<div class="mt-6 rounded-xl bg-surface-container border border-outline-variant p-4 flex gap-3 items-start">
            <span class="material-symbols-outlined text-[20px] text-primary mt-0.5">lock_open</span>
            <p class="text-[13px] text-earth-brown leading-relaxed"><strong class="text-on-surface">No auth hold</strong> — only the rental fee is charged. No security hold is placed on your card.</p>
          </div>`}
        </div>
      </main>

      <!-- sticky reserve bar -->
      <div class="fixed bottom-0 inset-x-0 z-40 bg-paper-white border-t-2 border-granite-wash safe-bottom">
        <div class="max-w-container-max mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <div class="min-w-0 shrink-0">
            <p class="text-[11px] text-outline uppercase tracking-wider font-semibold">From</p>
            <p class="font-heading text-headline-sm text-forest-deep leading-none">${fmt.money(item.price)}</p>
          </div>
          <button data-action="cart-add" data-id="${item.id}"
            class="flex-1 border-2 border-canyon-clay text-canyon-clay rounded-lg py-3 text-[13px] font-bold tracking-wide press hover:bg-canyon-clay/5">
            + Cart
          </button>
          <button data-action="book" data-id="${item.id}"
            class="flex-1 bg-canyon-clay text-on-secondary rounded-lg py-3 text-[13px] font-bold tracking-wide inner-shadow-stamped press hover:brightness-105">
            Book Now
          </button>
        </div>
      </div>
      ${cartFab()}`;
    return `<div class="view-enter min-h-screen flex flex-col">${inner}</div>`;
  }

  /* ---------- GEAR DETAIL + CALENDAR (book dates) ---------- */

  function calendar() {
    const m = window.STATE.calMonth;       // Date set to 1st of month
    const today = fmt.midnight(new Date());
    const year = m.getFullYear(), month = m.getMonth();
    const monthName = m.toLocaleString("en-US", { month: "long", year: "numeric" });
    const firstDow = new Date(year, month, 1).getDay();
    const daysIn = new Date(year, month + 1, 0).getDate();
    const { start, end } = window.STATE.dates;

    let cells = "";
    for (let i = 0; i < firstDow; i++) cells += `<div></div>`;
    const booked = window.STATE.unavailable || new Set();
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(year, month, d);
      const iso = fmt.iso(date);
      const past = date < today;
      const full = !past && booked.has(iso);
      let cls = "text-on-surface hover:bg-surface-container";
      let style = "";
      if (start && iso === start) { cls = "cal-end"; style = "border-radius:9999px 0 0 9999px"; }
      if (end && iso === end) { cls = "cal-end"; style = "border-radius:0 9999px 9999px 0"; }
      if (start && end && iso > start && iso < end) cls = "cal-mid";
      if (start && !end && iso === start) { cls = "cal-end"; style = "border-radius:9999px"; }
      if (full) cls = "text-outline line-through pointer-events-none";
      if (past) cls = "text-surface-dim pointer-events-none";
      cells += `<button ${(past || full) ? "disabled" : ""} data-action="cal-day" data-date="${iso}"
        title="${full ? "Fully booked" : ""}"
        class="cal-day h-11 flex items-center justify-center text-body-md ${cls}" style="${style}">${d}</button>`;
    }

    const allBooked = booked.size > 0 && booked.has(fmt.iso(today));
    const cfg = window.UBR_CONFIG || {};
    return `
    <div class="bg-surface-container-lowest rounded-xl shadow-card p-md">
      <div class="flex items-center justify-between mb-sm">
        <p class="font-heading text-headline-sm">${monthName}</p>
        <div class="flex gap-1">
          <button data-action="cal-prev" class="p-2 rounded-full hover:bg-surface-container press"><span class="material-symbols-outlined">chevron_left</span></button>
          <button data-action="cal-next" class="p-2 rounded-full hover:bg-surface-container press"><span class="material-symbols-outlined">chevron_right</span></button>
        </div>
      </div>
      <div class="grid grid-cols-7 text-center text-label-sm text-outline mb-1">
        ${["S","M","T","W","T","F","S"].map(d => `<div class="h-8 flex items-center justify-center">${d}</div>`).join("")}
      </div>
      <div class="grid grid-cols-7">${cells}</div>
      ${(() => {
        if (!booked.size) return "";
        const check = new Date(today);
        let nextAvail = null;
        for (let i = 0; i < 90; i++) {
          const iso = fmt.iso(check);
          if (!booked.has(iso)) { nextAvail = iso; break; }
          check.setDate(check.getDate() + 1);
        }
        if (!nextAvail || !allBooked) return "";
        const label = new Date(nextAvail + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `<p class="text-label-sm text-secondary mt-2 flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">event_available</span>Next available: ${label}</p>`;
      })()}
      ${allBooked && cfg.BACKEND_ENABLED && window.STATE.draft ? `
        <div class="mt-3 pt-3 border-t border-outline-variant">
          <p class="text-label-sm text-on-surface-variant mb-2 flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">notifications</span>Get notified when dates open up:</p>
          <div class="flex gap-2">
            <input id="waitlist-email" type="email" placeholder="Your email" class="flex-1 rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-3 py-2 text-label-sm min-w-0" />
            <button data-action="waitlist-join" data-id="${window.STATE.draft.id}"
              class="shrink-0 bg-primary text-on-primary rounded-lg px-3 py-2 text-label-sm press hover:bg-primary-container">
              Notify me
            </button>
          </div>
        </div>` : ""}
    </div>`;
  }

  function gear() {
    const item = window.STATE.draft;
    if (!item) return notFound();
    const qty = window.STATE.qty || 1;
    const days = Math.max(1, fmt.days(window.STATE.dates));
    const basePrice = (item.price || 0) * (item.perDay ? days : 1);
    const total = basePrice * qty;               // respects per-day pricing
    const hold = Math.min((item.deposit || 0) * qty, 250); // refundable card hold, capped at $250
    const pickupTime = window.STATE.pickupTime;
    const ready = !!window.STATE.dates.start && !!pickupTime; // both date AND pickup window required

    const includes = (item.includes || []).map(x =>
      `<li class="flex items-center gap-2 text-body-md text-on-surface-variant"><span class="material-symbols-outlined text-[18px] text-primary">check_circle</span>${x}</li>`).join("");

    const inner = `
      ${topBar({ title: "Select Dates", back: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[260px]">
        <!-- item summary — compact single row -->
        <section class="mt-md flex gap-3 items-center">
          <div class="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-surface-container relative flex items-center justify-center">
            <img src="${imageFor(item, 200)}" alt="${item.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover" />
            <span class="gear-fallback-icon material-symbols-outlined opacity-0" style="font-size:28px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="font-heading text-headline-xs text-on-surface truncate">${item.name}</h2>
            <p class="text-label-sm text-secondary">${fmt.money(item.price)}${item.perDay ? "/day" : " rental"}</p>
          </div>
        </section>

        <section class="mt-md">${calendar()}</section>

        <p class="text-center text-label-sm text-outline mt-2 flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-[15px]">touch_app</span>
          Tap your pickup day, then your return day
        </p>

        <!-- Pickup time window -->
        <section class="mt-4">
          <p class="text-label-md font-semibold text-on-surface mb-2 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[18px] text-canyon-clay">schedule</span>
            Pickup window
          </p>
          <div class="grid grid-cols-2 gap-2">
            ${PICKUP_TIMES.map(t => {
              const on = pickupTime === t.label;
              return `<button data-action="pickup-time" data-time="${t.label}"
                class="rounded-xl border-2 py-2.5 px-3 text-left press transition-colors
                ${on ? "border-canyon-clay bg-canyon-clay/5" : "border-outline-variant bg-paper-white hover:border-forest-deep"}">
                <p class="text-[13px] font-bold ${on ? "text-canyon-clay" : "text-forest-deep"}">${t.label}</p>
                <p class="text-[11px] ${on ? "text-canyon-clay/70" : "text-earth-brown"}">${t.sub}</p>
              </button>`;
            }).join("")}
          </div>
        </section>
      </main>

      <!-- sticky footer — quantity + total + confirm -->
      <div class="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest border-t border-outline-variant safe-bottom">
        <div class="max-w-container-max mx-auto px-md py-3">
          <!-- quantity + total on one row -->
          <div class="flex items-center gap-3 mb-2.5">
            <div class="flex items-center gap-2 shrink-0">
              <button data-action="qty-dec" class="w-8 h-8 rounded-full bg-surface-container press flex items-center justify-center ${qty > 1 ? "" : "opacity-30 pointer-events-none"}"><span class="material-symbols-outlined text-[18px]">remove</span></button>
              <span class="text-label-md w-5 text-center">${qty}</span>
              <button data-action="qty-inc" class="w-8 h-8 rounded-full bg-primary text-on-primary press flex items-center justify-center"><span class="material-symbols-outlined text-[18px]">add</span></button>
            </div>
            <div class="flex-1 min-w-0">
              <span class="text-label-sm text-outline block truncate">
                ${window.STATE.dates.start ? fmt.range(window.STATE.dates) + (pickupTime ? " · " + pickupTime : "") : "Select dates"}
              </span>
              ${item.perDay && window.STATE.dates.start ? `<span class="text-label-sm text-secondary block">${fmt.money(item.price)}/day × ${days} day${days > 1 ? "s" : ""}</span>` : ""}
            </div>
            <div class="font-heading text-headline-sm text-primary shrink-0">${fmt.money(total)}</div>
          </div>
          ${hold ? `<p class="text-label-sm text-outline mb-2 flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">lock</span>
            + ${fmt.money(hold)} auth hold on card, released on return</p>`
            : `<p class="text-label-sm text-primary mb-2 flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">lock_open</span>
            No auth hold — rental fee only</p>`}
          <button data-action="confirm-dates" ${ready ? "" : "disabled"}
            class="w-full rounded-full py-3 text-label-md text-on-secondary press transition-colors ${ready ? "bg-secondary hover:bg-secondary-container" : "bg-secondary/40 cursor-not-allowed"}">
            Confirm Dates
          </button>
        </div>
      </div>`;
    return `<div class="view-enter min-h-screen flex flex-col">${inner}</div>`;
  }

  function safetyModal() {
    const accepted = window.STATE.safetyAccepted;
    const name = window.STATE.renterName || "";
    const qty = window.STATE.qty || 1;
    const dep = window.STATE.cartMode
      ? Math.min((window.STATE.cart || []).reduce((s, e) => s + (e.item.deposit || 0) * e.qty, 0), 250)
      : (window.STATE.draft ? Math.min((window.STATE.draft.deposit || 0) * qty, 250) : 0);
    const okBtn = accepted
      ? "bg-secondary hover:bg-secondary-container"
      : "bg-secondary/40 cursor-not-allowed";
    return `
    <div class="fixed inset-0 z-[55] flex items-end sm:items-center justify-center">
      <div data-action="cancel-modal" class="modal-backdrop absolute inset-0 bg-primary/40"></div>
      <div class="modal-sheet relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-lift">
        <div class="sticky top-0 bg-surface-container-lowest p-md border-b border-surface-container">
          <h3 class="font-heading text-headline-sm text-on-surface">Rental Agreement</h3>
        </div>
        <div class="p-md space-y-md">
          <!-- legal name -->
          <label class="block">
            <span class="text-label-md text-on-surface-variant">Full legal name (must match your photo ID &amp; payment card)</span>
            <input id="renter-name" type="text" value="${String(name).replace(/"/g, "&quot;")}" placeholder="e.g. Brian Martinez"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-secondary focus:ring-0 px-sm py-2.5" />
          </label>

          <!-- phone -->
          <label class="block">
            <span class="text-label-md text-on-surface-variant">Phone number <span class="text-outline">(so we can reach you about pickup)</span></span>
            <input id="renter-phone" type="tel" value="${String(window.STATE.phone || "").replace(/"/g, "&quot;")}" placeholder="e.g. (801) 555-0123"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-secondary focus:ring-0 px-sm py-2.5" />
          </label>

          <!-- terms -->
          <div class="rounded-md bg-surface-container p-sm text-label-sm text-on-surface-variant space-y-2">
            <p class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-primary shrink-0">badge</span>
              <span>I will present a <strong>valid government photo ID</strong> at pickup matching the name above, and the payment card must be in the <strong>same name</strong>.</span></p>
            <p class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-primary shrink-0">payments</span>
              <span>I am responsible for the <strong>full replacement cost</strong> of any lost, stolen, or damaged gear. Gear not returned may be reported stolen and the card charged up to its replacement value.</span></p>
            ${dep ? `<p class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-primary shrink-0">lock</span>
              <span>The rental fee is charged now and a <strong>refundable hold of ${fmt.money(dep)}</strong> (max $250) is placed on my card, released when the gear is returned in good condition.</span></p>` : ""}
            <p class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-primary shrink-0">hiking</span>
              <span>This equipment is for backcountry use and carries inherent risks, which I accept.</span></p>
          </div>

          <label class="flex gap-sm items-start cursor-pointer">
            <input type="checkbox" data-action="accept-safety" ${accepted ? "checked" : ""}
              class="tick mt-0.5 w-5 h-5 rounded border-outline-variant text-secondary focus:ring-secondary shrink-0" />
            <span class="text-body-md text-on-surface">I have read and agree to the rental terms above.</span>
          </label>
        </div>
        <div class="sticky bottom-0 bg-surface-container-low p-md flex flex-col gap-2">
          <button id="proceed-btn" data-action="proceed-checkout" ${accepted ? "" : "disabled"}
            class="w-full rounded-full py-3.5 text-label-md text-on-secondary press transition-colors ${okBtn}">
            Agree &amp; Continue to Payment
          </button>
          <button data-action="cancel-modal" class="w-full py-2 text-label-md text-on-surface-variant press">Cancel</button>
        </div>
      </div>
    </div>`;
  }

  /* ---------- PACK BUILDER ---------- */

  const PACK_SIZES = [
    { l: 18, label: "Day Hike",   nights: "Up to 1 night",  rec: "Minimalist / day trips" },
    { l: 22, label: "Overnight",  nights: "1 night",        rec: "Ultralight 1-nighter" },
    { l: 28, label: "2-Night",    nights: "2 nights",       rec: "Fast-and-light weekend" },
    { l: 35, label: "Weekend",    nights: "2–3 nights",     rec: "Most popular size" },
    { l: 45, label: "3–5 Night",  nights: "3–5 nights",     rec: "Multi-day trips" },
    { l: 55, label: "Week Trip",  nights: "5–7 nights",     rec: "Extended backcountry" },
    { l: 65, label: "Extended",   nights: "7+ nights",      rec: "Heavy hauler" },
    { l: 75, label: "Expedition", nights: "10+ nights",     rec: "Through-hiking / thru" }
  ];

  function builder() {
    const all = window.CATALOG.gear();
    const backpacks = all.filter(g => g.category === "Backpacks");
    const base = backpacks.find(b => b.id === window.STATE.packBase) || backpacks[0] || null;
    const addable = all.filter(g => g.category !== "Backpacks" && g.category !== "Bundles");

    const cats = ["All", ...Array.from(new Set(addable.map(g => g.category).filter(Boolean)))];
    const cat = (window.STATE.packCat && cats.includes(window.STATE.packCat)) ? window.STATE.packCat : "All";
    const lib = cat === "All" ? addable : addable.filter(g => g.category === cat);

    const chosen = window.STATE.pack;
    const packSize = window.STATE.packSize || null;
    const w = (x) => Number(x && x.weight) || 0;
    let price = base ? (base.price || 0) : 0;
    let deposit = base ? (base.deposit || 0) : 0;
    let weight = base ? w(base) : 0;
    chosen.forEach((count, id) => {
      const g = window.CATALOG.get(id);
      if (!g) return;
      price += (g.price || 0) * count; deposit += (g.deposit || 0) * count; weight += w(g) * count;
    });
    const hold = Math.min(deposit, 250);
    const nonBaseCount = [...chosen.values()].reduce((s, n) => s + n, 0);
    const totalItems = (base ? 1 : 0) + nonBaseCount;
    const fillPct = Math.min(1, nonBaseCount / 7);

    const sizeChips = PACK_SIZES.map(s => {
      const on = s.l === packSize;
      return `<button data-action="pack-size" data-size="${s.l}"
        class="shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border-2 press transition-all min-w-[72px] text-center
        ${on ? "border-canyon-clay bg-canyon-clay/10" : "border-outline-variant bg-paper-white hover:border-canyon-clay/50"}">
        <span class="font-heading text-xl font-black leading-none ${on ? "text-canyon-clay" : "text-forest-deep"}">${s.l}L</span>
        <span class="text-[10px] font-semibold mt-1 leading-tight ${on ? "text-canyon-clay" : "text-earth-brown"}">${s.label}</span>
        <span class="text-[10px] leading-tight ${on ? "text-canyon-clay/70" : "text-outline"}">${s.nights}</span>
      </button>`;
    }).join("");

    const pills = cats.map(c => {
      const on = c === cat;
      return `<button data-action="pack-cat" data-cat="${c}" class="shrink-0 px-4 py-2 rounded-full text-[13px] font-bold tracking-wide whitespace-nowrap press ${on ? "bg-forest-deep text-paper-white inner-shadow-stamped" : "bg-paper-white border border-outline-variant text-forest-deep hover:bg-granite-wash"}">${c}</button>`;
    }).join("");

    const backpackCards = backpacks.map(b => {
      const on = base && base.id === b.id;
      return `<button data-action="pack-base" data-id="${b.id}" class="shrink-0 w-40 text-left bg-paper-white rounded-xl overflow-hidden border-2 ${on ? "border-canyon-clay" : "border-outline-variant"} press">
        <div class="relative h-24 bg-surface-container flex items-center justify-center">
          <img src="${imageFor(b, 400)}" alt="${b.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover"/>
          <span class="gear-fallback-icon material-symbols-outlined opacity-0 text-[40px]" style="color:${b.tint};font-variation-settings:'FILL' 1;">${b.icon}</span>
          ${on ? `<span class="absolute top-1.5 right-1.5 bg-canyon-clay text-paper-white rounded-full w-6 h-6 flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">check</span></span>` : ""}
        </div>
        <div class="p-2">
          <p class="text-[13px] font-bold text-forest-deep leading-tight line-clamp-1">${b.name}</p>
          <p class="text-[12px] text-canyon-clay font-bold mt-0.5">${fmt.money(b.price)}</p>
        </div>
      </button>`;
    }).join("");

    // Drag-and-drop gear cards
    const dragCards = lib.map(x => {
      const count = chosen.get(x.id) || 0;
      return `
      <div class="relative bg-paper-white rounded-xl border-2 ${count ? "border-canyon-clay" : "border-outline-variant"} overflow-hidden flex flex-col select-none"
        draggable="true" data-pack-drag="${x.id}">
        <div class="relative h-20 bg-surface-container flex items-center justify-center cursor-grab active:cursor-grabbing">
          <img src="${imageFor(x, 300)}" alt="${x.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover pointer-events-none"/>
          <span class="gear-fallback-icon material-symbols-outlined opacity-0 text-[36px]" style="color:${x.tint};font-variation-settings:'FILL' 1;">${x.icon}</span>
          ${count ? `<span class="absolute top-1 right-1 bg-canyon-clay text-paper-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">${count}</span>` : ""}
        </div>
        <div class="px-2 pt-1.5 flex-1">
          <p class="text-[11px] font-bold text-forest-deep leading-tight line-clamp-2">${x.name}</p>
          <p class="text-[11px] text-canyon-clay font-bold mt-0.5">${fmt.money(x.price)}</p>
        </div>
        <div class="flex items-center justify-between px-2 pb-2 gap-1">
          <button data-action="pack-remove" data-id="${x.id}" class="w-6 h-6 rounded-full bg-surface-container press flex items-center justify-center text-earth-brown ${count ? "" : "opacity-30 pointer-events-none"}">
            <span class="material-symbols-outlined text-[14px]">remove</span>
          </button>
          <span class="text-[12px] font-bold w-4 text-center text-forest-deep">${count}</span>
          <button data-action="pack-add" data-id="${x.id}" class="w-6 h-6 rounded-full bg-forest-deep text-on-primary press flex items-center justify-center">
            <span class="material-symbols-outlined text-[14px]">add</span>
          </button>
        </div>
      </div>`;
    }).join("");

    // Packed items chips
    const packedChips = [];
    if (base) packedChips.push(`<span class="inline-flex items-center gap-1 bg-forest-deep/10 text-forest-deep text-[12px] font-semibold px-2.5 py-1 rounded-full">${base.name.replace(/ \d+L/i, "")}</span>`);
    chosen.forEach((count, id) => {
      const g = window.CATALOG.get(id); if (!g) return;
      packedChips.push(`<span class="inline-flex items-center gap-1 bg-canyon-clay/10 text-canyon-clay text-[12px] font-semibold px-2.5 py-1 rounded-full fly-in">
        ${count > 1 ? count + "× " : ""}${g.name}
        <button data-action="pack-remove-all" data-id="${id}" class="press ml-0.5 opacity-60 hover:opacity-100"><span class="material-symbols-outlined text-[13px]">close</span></button>
      </span>`);
    });

    const stepDisabled = !packSize;
    const packDisabled = !packSize || !base;

    const inner = `
      ${topBar({ title: "Build Your Pack", back: true, trailing: `<button data-action="pack-reset" class="text-[13px] text-earth-brown press px-2">Reset</button>` })}
      <main class="flex-grow max-w-container-max mx-auto w-full pb-[190px]">

        <!-- 1 · Size -->
        <section class="px-4 sm:px-6 mt-5">
          <h2 class="font-heading text-headline-sm text-forest-deep">1 · How long is your trip?</h2>
          <p class="text-[13px] text-earth-brown mt-0.5">Pick the pack size that fits your adventure.</p>
          <div class="flex gap-2.5 overflow-x-auto no-scrollbar mt-3 pb-1 -mx-4 sm:-mx-6 px-4 sm:px-6">${sizeChips}</div>
          ${packSize ? `<p class="mt-2 text-[12px] text-canyon-clay font-semibold">${(PACK_SIZES.find(s => s.l === packSize) || {}).rec || ""}</p>` : ""}
        </section>

        <!-- 2 · Backpack model -->
        <section class="px-4 sm:px-6 mt-6 transition-opacity ${stepDisabled ? "opacity-40 pointer-events-none" : ""}">
          <h2 class="font-heading text-headline-sm text-forest-deep">2 · Pick your backpack</h2>
          ${backpacks.length === 0
            ? `<p class="mt-3 text-body-md text-earth-brown">No backpacks in the catalog yet — add one in Manage Gear.</p>`
            : `<div class="flex gap-3 overflow-x-auto no-scrollbar mt-3 -mx-4 sm:-mx-6 px-4 sm:px-6">${backpackCards}</div>`}
        </section>

        <!-- 3 · Pack your bag (drop zone + gear grid) -->
        <section class="px-4 sm:px-6 mt-6 transition-opacity ${packDisabled ? "opacity-40 pointer-events-none" : ""}">
          <h2 class="font-heading text-headline-sm text-forest-deep">3 · Pack your bag</h2>
          <p class="text-[13px] text-earth-brown mt-0.5">Drag gear onto the pack — or tap <strong class="text-forest-deep">+</strong> to add items.</p>

          <!-- Drop zone centered -->
          <div class="mt-4 flex flex-col items-center">
            <div id="pack-zone" class="w-40 h-52 transition-all duration-200 cursor-pointer" title="Drop gear here">
              ${ART.packSvg(fillPct, nonBaseCount)}
            </div>
            ${packedChips.length
              ? `<div class="mt-3 flex flex-wrap gap-2 justify-center max-w-xs">${packedChips.join("")}</div>`
              : `<p class="mt-3 text-[13px] text-outline text-center">Drag items below onto the pack ↑<br/>or tap <strong>+</strong> to add them</p>`}
          </div>

          <!-- Category filter -->
          <div class="flex gap-2 overflow-x-auto no-scrollbar mt-5 -mx-4 sm:-mx-6 px-4 sm:px-6">${pills}</div>

          <!-- Gear drag grid -->
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">${dragCards}</div>
        </section>
      </main>

      <div class="fixed bottom-0 inset-x-0 z-40 bg-paper-white border-t-2 border-granite-wash safe-bottom">
        <div class="max-w-container-max mx-auto px-4 sm:px-6 pt-3">
          <div class="flex items-center justify-between mb-2">
            <div class="text-[12px] text-earth-brown">
              <p class="font-bold text-forest-deep">${totalItems} item${totalItems !== 1 ? "s" : ""} in your bundle</p>
              ${weight ? `<p>${weight.toFixed(1)} lbs${hold ? ` · ${fmt.money(hold)} hold` : ""}</p>` : (hold ? `<p>${fmt.money(hold)} refundable hold</p>` : "")}
            </div>
            <div class="text-right">
              <p class="text-[11px] text-outline uppercase tracking-wider font-semibold">Rental total</p>
              <p class="font-heading text-headline-md text-forest-deep leading-none">${fmt.money(price)}</p>
            </div>
          </div>
          <button data-action="continue-pack" ${base ? "" : "disabled"}
            class="w-full rounded-lg py-3.5 text-[14px] font-bold tracking-wide text-on-secondary press inner-shadow-stamped flex items-center justify-center gap-2 ${base ? "bg-canyon-clay hover:brightness-105" : "bg-canyon-clay/40 cursor-not-allowed"}">
            Continue to Dates <span class="material-symbols-outlined text-[20px]">calendar_month</span>
          </button>
        </div>
      </div>`;
    return `<div class="view-enter min-h-screen flex flex-col">${inner}</div>`;
  }

  /* ---------- CONFIRMATION ---------- */

  function confirmation(orderId) {
    const b = window.STATE.bookings.find(x => x.orderId === orderId) || window.STATE.bookings[0];
    if (!b) return notFound();
    const inner = `
      ${topBar({ title: "Booking Confirmed", location: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full text-center">
        <div class="mt-lg flex flex-col items-center">
          <div class="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center reveal">
            <span class="material-symbols-outlined text-[44px] text-primary" style="font-variation-settings:'FILL' 1;">check</span>
          </div>
          <h2 class="font-heading text-headline-lg text-on-surface mt-md">Gear Reserved!</h2>
          <p class="text-body-lg text-on-surface-variant mt-1">Your rental for <span class="font-semibold text-on-surface">${b.name}</span> is confirmed for ${b.rangeLabel}.</p>
        </div>

        <div class="mt-md bg-surface-container rounded-xl p-md text-left divide-y divide-surface-container-highest">
          <div class="flex justify-between py-2.5"><span class="text-on-surface-variant">Order ID</span><span class="font-semibold">#${b.ref || b.orderId}</span></div>
          <div class="flex justify-between py-2.5"><span class="text-on-surface-variant">Pick-up location</span><span class="font-semibold">${D.depot}</span></div>
          <div class="flex justify-between py-2.5"><span class="text-on-surface-variant">Total paid</span><span class="font-semibold text-secondary">${fmt.money(b.total)}</span></div>
          ${b.hold ? `<div class="flex justify-between py-2.5"><span class="text-on-surface-variant">Refundable card hold</span><span class="font-semibold">${fmt.money(b.hold)} <span class="text-outline font-normal text-sm">· released on return</span></span></div>` : ""}
        </div>

        <div class="mt-md rounded-xl bg-secondary-fixed border border-secondary/30 p-md flex gap-2 items-start text-left">
          <span class="material-symbols-outlined text-[20px] text-secondary mt-0.5">badge</span>
          <p class="text-label-sm text-on-secondary-fixed">Bring a <strong>government photo ID</strong>${b.renterName ? ` matching <strong>${esc(b.renterName)}</strong>` : ""} to pickup. Your payment card must be in the same name.</p>
        </div>

        <div class="mt-md rounded-xl overflow-hidden h-44 shadow-card relative">${ART.topoMap()}
          <div class="absolute inset-0 flex items-end justify-center pb-2">
            <button data-action="directions" class="bg-surface-container-lowest/90 text-secondary text-label-md px-3 py-1.5 rounded-full shadow-sm press flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">near_me</span>Get Directions</button>
          </div>
        </div>

        <div class="mt-md flex flex-col gap-sm">
          <button data-action="nav" data-route="#/bookings" class="w-full rounded-full py-3.5 bg-secondary text-on-secondary text-label-md press hover:bg-secondary-container">View My Bookings</button>
          <button data-action="nav" data-route="#/" class="w-full rounded-full py-3.5 border-2 border-primary text-primary text-label-md press">Back to Home</button>
          ${(b.status === "confirmed" || b.status === "prepped") ? `
          <button data-action="customer-cancel" data-id="${b.orderId}"
            class="w-full py-2.5 text-label-sm text-error press hover:underline flex items-center justify-center gap-1 mt-1">
            <span class="material-symbols-outlined text-[16px]">cancel</span>Cancel my booking
          </button>` : (b.status === "cancelled" ? `
          <p class="text-center text-label-sm text-error mt-1 flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[15px]">cancel</span>This booking was cancelled
          </p>` : "")}
        </div>
      </main>`;
    return page(inner, { active: "#/bookings" });
  }

  function confirmationLoading() {
    const inner = `
      ${topBar({ title: "Confirming…", location: true })}
      <main class="flex-grow flex flex-col items-center justify-center text-center px-md">
        <div class="w-16 h-16 rounded-full border-4 border-surface-container-highest border-t-secondary animate-spin"></div>
        <p class="font-heading text-headline-sm mt-md">Finalizing your reservation</p>
        <p class="text-body-md text-on-surface-variant mt-1">Confirming your payment with Stripe…</p>
      </main>`;
    return page(inner, { active: "#/bookings" });
  }

  /* ---------- MY BOOKINGS ---------- */

  function bookings() {
    const tab = window.STATE.bookingTab;
    const all = window.STATE.bookings;
    const upcoming = all.filter(b => !b.past);
    const past = all.filter(b => b.past);
    const list = tab === "Upcoming" ? upcoming : past;

    const tabBtn = (name, n) => {
      const on = tab === name;
      return `<button data-action="booking-tab" data-tab="${name}"
        class="flex-1 py-3 text-[13px] font-bold tracking-wide press transition-colors border-b-4
        ${on ? "text-canyon-clay border-canyon-clay" : "text-earth-brown border-transparent hover:text-forest-deep"}">
        ${name}${n ? ` (${n})` : ""}
      </button>`;
    };

    const empty = `
      <div class="col-span-2 mt-16 text-center flex flex-col items-center">
        <div class="w-40 opacity-60">${ART.trailLine()}</div>
        <p class="font-heading text-headline-sm text-forest-deep mt-4">No ${tab.toLowerCase()} rentals yet</p>
        <p class="text-body-md text-earth-brown mt-1">Your next adventure is one tap away.</p>
        <button data-action="nav" data-route="#/"
          class="mt-6 bg-canyon-clay text-on-secondary px-6 py-3 rounded-lg text-[13px] font-bold tracking-wide inner-shadow-stamped press">
          Browse Gear
        </button>
      </div>`;

    const cards = list.map(b => {
      const tileContent = `
        <img src="${imageFor(b, 300)}" alt="${b.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover" />
        <span class="gear-fallback-icon material-symbols-outlined opacity-0 text-[52px]" style="color:${b.tint};font-variation-settings:'FILL' 1,'wght' 300;">${b.icon}</span>`;
      if (b.past) {
        return `
        <article class="bg-paper-white border border-outline-variant card-elevation rounded-xl overflow-hidden">
          <div class="flex">
            <div class="w-28 shrink-0 bg-granite-wash flex items-center justify-center relative overflow-hidden">${tileContent}</div>
            <div class="flex-1 p-4">
              <span class="inline-block text-[11px] font-bold tracking-wider bg-granite-wash text-earth-brown px-2 py-0.5 rounded uppercase">Completed</span>
              <h3 class="font-heading text-headline-sm text-forest-deep mt-1.5 leading-tight">${b.name}</h3>
              <p class="text-[13px] text-earth-brown mt-0.5">${b.rangeLabel}</p>
              <button data-action="rent-again" data-id="${b.itemId}"
                class="mt-3 inline-flex items-center gap-1 border-2 border-forest-deep text-forest-deep rounded-lg px-3 py-1.5 text-[12px] font-bold tracking-wide press hover:bg-granite-wash">
                <span class="material-symbols-outlined text-[16px]">restart_alt</span>Rent Again
              </button>
            </div>
          </div>
        </article>`;
      }
      return `
      <article class="bg-paper-white border border-outline-variant card-elevation rounded-xl overflow-hidden">
        <div class="flex">
          <div class="w-28 shrink-0 bg-granite-wash flex items-center justify-center relative overflow-hidden">
            ${tileContent}
            <span class="absolute top-2 left-1 z-10 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold px-1.5 py-0.5 rounded">✓ OK</span>
          </div>
          <div class="flex-1 p-4">
            <span class="inline-block text-[11px] font-bold tracking-wider bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded uppercase">Confirmed</span>
            <h3 class="font-heading text-headline-sm text-forest-deep mt-1.5 leading-tight">${b.name}</h3>
            <p class="text-[13px] text-earth-brown mt-0.5 flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px] text-forest-deep">calendar_month</span>${b.rangeLabel}
            </p>
            <p class="text-[13px] text-earth-brown flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px] text-forest-deep">location_on</span>${D.depot}
            </p>
            <div class="flex gap-2 mt-3">
              <button data-action="nav" data-route="#/confirmation/${b.orderId}"
                class="bg-forest-deep text-paper-white px-3 py-2 rounded-lg text-[11px] font-bold tracking-widest pressed-state press">
                VIEW DETAILS
              </button>
              <button data-action="directions"
                class="border-2 border-forest-deep text-forest-deep px-3 py-2 rounded-lg text-[11px] font-bold tracking-widest press hover:bg-granite-wash">
                DIRECTIONS
              </button>
            </div>
          </div>
        </div>
      </article>`;
    }).join("");

    const inner = `
      ${topBar({ title: "Take a Hike Rentals", location: true })}
      <main class="flex-grow px-4 sm:px-6 max-w-container-max mx-auto w-full">
        <div class="mt-6">
          <h2 class="font-heading text-headline-lg text-forest-deep">My Bookings</h2>
          <!-- Order lookup by email -->
          ${(window.UBR_CONFIG || {}).BACKEND_ENABLED ? `
          <div class="mt-3 flex gap-2">
            <input id="lookup-email" type="email" placeholder="Enter booking email to look up orders"
              class="flex-1 rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-3 py-2.5 text-label-md min-w-0" />
            <button data-action="lookup-booking"
              class="shrink-0 bg-surface-container text-on-surface rounded-lg px-4 py-2.5 text-label-md press hover:bg-granite-wash flex items-center gap-1">
              <span class="material-symbols-outlined text-[18px]">search</span>Find
            </button>
          </div>` : ""}
          <p class="text-body-md text-earth-brown mt-1">Manage your upcoming adventures and past gear rentals.</p>
        </div>
        <div class="flex mt-6 border-b-2 border-granite-wash">
          ${tabBtn("Upcoming", upcoming.length)}${tabBtn("Past", past.length)}
        </div>
        <section class="mt-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${list.length ? cards : empty}
        </section>
      </main>`;
    return page(inner, { active: "#/bookings" });
  }

  /* ---------- HOW IT WORKS ---------- */

  function howItWorks() {
    const steps = D.steps.map((s, i) => `
      <div class="flex gap-md items-start reveal" style="animation-delay:${i * 90}ms">
        <div class="shrink-0 w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center relative">
          <span class="material-symbols-outlined text-primary">${s.icon}</span>
          <span class="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-secondary text-on-secondary text-label-sm font-bold flex items-center justify-center">${i + 1}</span>
        </div>
        <div>
          <h3 class="font-heading text-headline-sm">${s.title}</h3>
          <p class="text-body-md text-on-surface-variant mt-1">${s.text}</p>
        </div>
      </div>`).join(`<div class="ml-6 my-2 h-6 border-l-2 border-dashed border-outline-variant"></div>`);

    const faqs = [
      ["What if I damage the gear?", "Normal trail wear is on us. You're only responsible for the replacement cost of lost or significantly damaged items, per the rental agreement."],
      ["Where do I pick up?", "All gear is picked up and returned at our Saratoga Springs, UT depot. We'll text you the exact details after booking."],
      ["Is the gear clean?", "Always. Every item is inspected, sanitized, and trail-tested between rentals."]
    ].map(([q, a]) => `
      <details class="bg-surface-container-lowest rounded-xl shadow-card p-md group">
        <summary class="flex items-center justify-between cursor-pointer list-none text-label-md"><span>${q}</span><span class="material-symbols-outlined text-outline group-open:rotate-180 transition-transform">expand_more</span></summary>
        <p class="text-body-md text-on-surface-variant mt-2">${a}</p>
      </details>`).join("");

    const inner = `
      ${topBar({ title: "How it Works", location: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full">
        <section class="relative mt-md rounded-xl overflow-hidden h-40 shadow-card">
          ${ART.heroScene()}
          <div class="absolute inset-0 bg-primary/30 flex items-center justify-center">
            <p class="font-heading text-headline-md text-white text-center px-md drop-shadow">Gear up in three easy steps</p>
          </div>
        </section>
        <section class="mt-lg">${steps}</section>
        <section class="mt-lg">
          <h2 class="font-heading text-headline-md mb-sm">Common questions</h2>
          <div class="space-y-sm">${faqs}</div>
        </section>
        <button data-action="nav" data-route="#/" class="w-full mt-lg rounded-full py-3.5 bg-secondary text-on-secondary text-label-md press hover:bg-secondary-container">Start Browsing Gear</button>
      </main>`;
    return page(inner, { active: "#/how" });
  }

  /* ---------- PROFILE ---------- */

  function profile() {
    const favCount = window.STATE.favs.size;
    const trips = window.STATE.bookings.length;

    const row = (icon, label, sub = "", route = "") => `
      <button data-action="nav" data-route="${route}" class="w-full flex items-center gap-4 px-4 py-4 bg-paper-white hover:bg-granite-wash press text-left border-b border-granite-wash last:border-b-0 transition-colors">
        <span class="material-symbols-outlined text-canyon-clay">${icon}</span>
        <span class="flex-1">
          <span class="block text-[14px] font-semibold tracking-wide text-forest-deep">${label}</span>
          ${sub ? `<span class="block text-[12px] text-earth-brown mt-0.5">${sub}</span>` : ""}
        </span>
        <span class="material-symbols-outlined text-earth-brown">chevron_right</span>
      </button>`;

    const inner = `
      ${topBar({ title: "Profile", location: true })}
      <main class="flex-grow px-4 sm:px-6 max-w-container-max mx-auto w-full">

        <!-- Profile Header Card -->
        <section class="mt-6 bg-paper-white rounded-xl border border-outline-variant card-elevation p-6">
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 rounded-full bg-forest-deep text-on-primary flex items-center justify-center shrink-0 border-4 border-granite-wash">
              <span class="material-symbols-outlined text-[36px]" style="font-variation-settings:'FILL' 1;">person</span>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="font-heading text-headline-sm text-forest-deep">My Account</h2>
              <p class="text-body-md text-earth-brown mt-0.5 truncate">${D.depot}</p>
              <div class="flex items-center gap-3 mt-2 flex-wrap">
                <span class="flex items-center gap-1 text-[13px] text-forest-deep font-semibold">
                  <span class="material-symbols-outlined text-[15px]">explore</span>${trips} Trip${trips !== 1 ? "s" : ""}
                </span>
                <span class="text-outline text-[12px]">·</span>
                <span class="flex items-center gap-1 text-[13px] text-earth-brown font-semibold">
                  <span class="material-symbols-outlined text-[15px] text-canyon-clay">favorite</span>${favCount} Saved
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Stats -->
        <section class="mt-4 grid grid-cols-2 gap-3">
          <div class="bg-paper-white rounded-xl border border-outline-variant card-elevation py-5 text-center">
            <p class="font-heading text-headline-lg text-forest-deep">${trips}</p>
            <p class="text-[11px] font-bold tracking-widest text-earth-brown uppercase mt-1">Rentals</p>
          </div>
          <div class="bg-paper-white rounded-xl border border-outline-variant card-elevation py-5 text-center">
            <p class="font-heading text-headline-lg text-forest-deep">${favCount}</p>
            <p class="text-[11px] font-bold tracking-widest text-earth-brown uppercase mt-1">Saved Gear</p>
          </div>
        </section>

        <!-- Menu rows -->
        <section class="mt-4 rounded-xl overflow-hidden border border-outline-variant card-elevation divide-y divide-granite-wash">
          ${row("favorite", "Saved Gear", `${favCount} item${favCount === 1 ? "" : "s"}`, "#/bookings")}
          ${row("receipt_long", "Rental History", `${trips} booking${trips === 1 ? "" : "s"}`, "#/bookings")}
          ${row("local_shipping", "Pick-up &amp; Returns", D.depot + " Depot", "#/pickup")}
          ${row("verified_user", "Safety &amp; Waivers", "", "#/safety")}
          ${row("help", "Help &amp; Support", "", "#/help")}
        </section>

        <!-- Manage Gear -->
        <button data-action="nav" data-route="#/admin"
          class="w-full mt-4 flex items-center gap-4 p-5 bg-forest-deep text-paper-white rounded-xl press inner-shadow-stamped">
          <span class="material-symbols-outlined text-primary-fixed-dim">inventory_2</span>
          <span class="flex-1 min-w-0">
            <span class="block text-[14px] font-bold tracking-wide">Manage Gear</span>
            <span class="block text-[12px] text-primary-fixed-dim mt-0.5">Owner: add, edit &amp; reorder products</span>
          </span>
          <span class="material-symbols-outlined text-primary-fixed-dim">chevron_right</span>
        </button>

        <div class="mt-6 mb-4 text-center text-[12px] text-outline">Take a Hike Rentals · v1.0</div>
      </main>`;
    return page(inner, { active: "#/profile" });
  }

  /* ---------- ADMIN: Manage Gear ---------- */

  const ADMIN_ICONS = ["backpack", "hiking", "satellite_alt", "cabin", "bedtime", "king_bed",
    "lunch_dining", "outdoor_grill", "ac_unit", "water_drop", "health_and_safety",
    "flashlight_on", "battery_charging_full", "medical_services"];

  function adminGate() {
    return `<div class="view-enter min-h-screen flex flex-col items-center justify-center px-md text-center">
      <div class="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mb-md">
        <span class="material-symbols-outlined text-[32px]" style="font-variation-settings:'FILL' 1;">lock</span>
      </div>
      <h1 class="font-heading text-headline-lg">Manage Gear</h1>
      <p class="text-body-md text-on-surface-variant mt-1 mb-md">Enter your owner passcode to continue.</p>
      <input id="admin-pass" type="password" placeholder="Passcode"
        class="w-full max-w-xs rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-md py-3 text-center mb-sm" />
      <button data-action="admin-login" class="w-full max-w-xs rounded-full py-3.5 bg-secondary text-on-secondary text-label-md press hover:bg-secondary-container">Unlock</button>
      <button data-action="nav" data-route="#/" class="mt-sm text-label-md text-on-surface-variant press">Back to site</button>
    </div>`;
  }

  function adminProductRow(item) {
    return `
    <div draggable="true" data-drag-id="${item.id}"
      class="admin-row bg-surface-container-lowest rounded-xl shadow-card p-2 flex items-center gap-sm cursor-grab active:cursor-grabbing">
      <span class="material-symbols-outlined text-outline shrink-0" title="Drag to reorder">drag_indicator</span>
      <div class="w-14 h-14 shrink-0 rounded-md gear-tile relative overflow-hidden flex items-center justify-center">${mediaLayer(item, 28)}</div>
      <div class="min-w-0 flex-1">
        <p class="text-label-md text-on-surface truncate">${item.name}</p>
        <p class="text-label-sm text-outline truncate">${item.category} · ${fmt.money(item.price)}${item.perDay ? "/day" : ""} · qty ${item.quantity != null ? item.quantity : 1} · ${item.deposit > 0 ? fmt.money(item.deposit) + " hold" : '<span class="text-primary font-semibold">no hold</span>'}</p>
      </div>
      <button data-action="admin-edit" data-id="${item.id}" class="p-2 rounded-full hover:bg-surface-container press shrink-0"><span class="material-symbols-outlined text-on-surface-variant">edit</span></button>
      <button data-action="admin-delete" data-id="${item.id}" class="p-2 rounded-full hover:bg-error-container press shrink-0"><span class="material-symbols-outlined text-error">delete</span></button>
    </div>`;
  }

  function adminForm() {
    const e = window.STATE.adminEdit || {};
    const isNew = !e.id;
    const item = isNew ? {} : (window.CATALOG.get(e.id) || {});
    const icon = e.icon || item.icon || "backpack";
    const img = e.img !== undefined ? e.img : item.img;
    const cats = window.CATALOG.categories().map(c => `<option value="${c}" ${item.category === c ? "selected" : ""}>${c}</option>`).join("");
    const icons = ADMIN_ICONS.map(ic => `
      <button type="button" data-action="admin-icon" data-icon="${ic}"
        class="admin-icon w-11 h-11 rounded-lg flex items-center justify-center press ${ic === icon ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}">
        <span class="material-symbols-outlined">${ic}</span></button>`).join("");

    return `
    <div class="fixed inset-0 z-[55] flex items-end sm:items-center justify-center">
      <div data-action="admin-cancel" class="modal-backdrop absolute inset-0 bg-primary/40"></div>
      <div class="modal-sheet relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-lift">
        <div class="sticky top-0 bg-surface-container-lowest p-md border-b border-surface-container flex items-center justify-between">
          <h3 class="font-heading text-headline-sm">${isNew ? "Add product" : "Edit product"}</h3>
          <button data-action="admin-cancel" class="p-2 -mr-2 rounded-full hover:bg-surface-container press"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-md space-y-md">
          <!-- multi-photo gallery -->
          <div>
            <span class="text-label-md text-on-surface-variant">Photos <span class="text-outline font-normal">(first photo is the cover)</span></span>
            <div id="admin-photo-grid" class="mt-2 flex flex-wrap gap-2">
              ${(() => {
                const allImgs = [e.img !== undefined ? e.img : item.img, ...((e.imgs !== undefined ? e.imgs : (item.imgs || [])))].filter(Boolean);
                return allImgs.map((src, idx) => `
                  <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant shrink-0">
                    <img src="${src}" class="w-full h-full object-cover" />
                    <button type="button" data-action="admin-photo-remove" data-idx="${idx}"
                      class="absolute top-0.5 right-0.5 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center press">
                      <span class="material-symbols-outlined text-white text-[13px]">close</span>
                    </button>
                  </div>`).join("") +
                `<label class="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center cursor-pointer shrink-0 hover:border-primary press">
                  <span class="material-symbols-outlined text-on-surface-variant text-[28px]">add_photo_alternate</span>
                  <span class="text-[10px] text-on-surface-variant mt-0.5">Add photo</span>
                  <input type="file" accept="image/*" data-action="admin-image" class="hidden" />
                </label>`;
              })()}
            </div>
          </div>

          <label class="block"><span class="text-label-md text-on-surface-variant">Name</span>
            <input id="admin-name" value="${(item.name || "").replace(/"/g, "&quot;")}" placeholder="e.g. Osprey Rook 65"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" /></label>

          <label class="block"><span class="text-label-md text-on-surface-variant">Category</span>
            <select id="admin-cat" onchange="document.getElementById('admin-bundle-section').style.display=this.value==='Bundles'?'':'none'"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5">${cats}</select></label>

          <label class="block"><span class="text-label-md text-on-surface-variant">Card tagline <span class="text-outline font-normal text-[12px]">— one short line shown on the listing card</span></span>
            <input id="admin-tagline" value="${(item.tagline || "").replace(/"/g, "&quot;")}" placeholder="e.g. 65L pack with adjustable suspension"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" /></label>

          <label class="block"><span class="text-label-md text-on-surface-variant">Full description <span class="text-outline font-normal text-[12px]">— shown on the product page</span></span>
            <textarea id="admin-desc" rows="3" placeholder="Describe the gear, condition, what makes it great for the trail…"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5 resize-y text-[14px]">${(item.desc || "").replace(/</g, "&lt;")}</textarea></label>

          <div class="grid grid-cols-2 gap-sm">
            <label class="block"><span class="text-label-md text-on-surface-variant">Rental price ($)</span>
              <input id="admin-price" type="number" min="0" value="${item.price != null ? item.price : ""}" placeholder="65"
                class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" /></label>
            <label class="block"><span class="text-label-md text-on-surface-variant">Auth hold on card ($)</span>
              <input id="admin-deposit" type="number" min="0" value="${item.deposit != null ? item.deposit : ""}" placeholder="0"
                class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" />
              <span class="block text-label-sm text-outline mt-1">Set to 0 = no hold placed on customer's card.</span></label>
          </div>

          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" id="admin-per-day" ${item.perDay ? "checked" : ""}
              class="tick w-5 h-5 rounded border-outline-variant text-secondary focus:ring-secondary shrink-0" />
            <span class="text-label-md text-on-surface">Price is <strong>per day</strong> (multiplied by trip length at checkout)</span>
          </label>

          <div class="grid grid-cols-2 gap-sm">
            <label class="block"><span class="text-label-md text-on-surface-variant">Quantity in stock</span>
              <input id="admin-quantity" type="number" min="0" step="1" value="${item.quantity != null ? item.quantity : 1}" placeholder="1"
                class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" />
              <span class="block text-label-sm text-outline mt-1">Booked days grey out when all units are reserved.</span></label>
            <label class="block"><span class="text-label-md text-on-surface-variant">Weight (lbs)</span>
              <input id="admin-weight" type="number" min="0" step="0.1" value="${item.weight != null ? item.weight : ""}" placeholder="2.5"
                class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" />
              <span class="block text-label-sm text-outline mt-1">Shown in pack builder total.</span></label>
          </div>

          <!-- What's included bullets -->
          <div>
            <span class="text-label-md text-on-surface-variant">What's included <span class="text-outline font-normal">(shown on product page)</span></span>
            <div id="admin-includes-list" class="mt-1 space-y-1.5">
              ${(item.includes || []).map((x, i) => `
                <div class="flex gap-1.5 items-center">
                  <input type="text" class="admin-include-item flex-1 rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2" value="${x.replace(/"/g, "&quot;")}" placeholder="e.g. Garmin inReach Mini" />
                  <button type="button" data-action="admin-include-remove" data-idx="${i}" class="p-1.5 rounded-full hover:bg-error-container press shrink-0"><span class="material-symbols-outlined text-[18px] text-error">close</span></button>
                </div>`).join("")}
            </div>
            <button type="button" data-action="admin-include-add" class="mt-1.5 flex items-center gap-1 text-label-sm text-primary press hover:underline">
              <span class="material-symbols-outlined text-[16px]">add</span>Add item
            </button>
          </div>

          <!-- Bundle items (only shown when category = Bundles) -->
          <div id="admin-bundle-section" style="${(item.category === "Bundles" || (e.cat === "Bundles")) ? "" : "display:none"}">
            <span class="text-label-md text-on-surface-variant">Bundle items <span class="text-outline font-normal">(items this bundle includes — one per line: <code>product-id × qty</code>)</span></span>
            <textarea id="admin-bundle-items" rows="4"
              placeholder="osprey-aether-65 × 1&#10;msr-hubba-tent × 1&#10;nemo-disco-15 × 1"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5 resize-y text-[13px] font-mono">${((item.bundleItems || e.bundleItems) || []).map(bi => `${bi.id} × ${bi.qty || 1}`).join("\n")}</textarea>
            <span class="text-label-sm text-outline mt-1 block">Optional — used for bundle pricing detail display. Each line: <code class="text-[11px]">product-id × qty</code></span>
          </div>

          <div><span class="text-label-md text-on-surface-variant">Icon (shown when there's no photo)</span>
            <div class="mt-1 grid grid-cols-7 gap-1">${icons}</div></div>
        </div>
        <div class="sticky bottom-0 bg-surface-container-low p-md flex gap-2">
          <button data-action="admin-cancel" class="flex-1 rounded-full py-3 border-2 border-primary text-primary text-label-md press">Cancel</button>
          <button data-action="admin-save" class="flex-1 rounded-full py-3 bg-secondary text-on-secondary text-label-md press hover:bg-secondary-container">${isNew ? "Add product" : "Save"}</button>
        </div>
      </div>
    </div>`;
  }

  function admin() {
    const items = window.CATALOG.gear();
    const customized = window.CATALOG.isCustomized();
    const cfg = window.UBR_CONFIG || {};
    const backendOn = !!cfg.BACKEND_ENABLED;

    // Pre-compute conditional snippets to avoid deep nested template literals
    const publishBlock = backendOn
      ? '<button id="publish-btn" data-action="admin-publish" class="w-full mt-md rounded-xl py-3.5 bg-primary text-on-primary text-label-md font-semibold press flex items-center justify-center gap-2 shadow-lift hover:bg-primary-container"><span class="material-symbols-outlined text-[20px]">cloud_upload</span>Publish to site</button><p class="text-label-sm text-outline text-center mt-1.5">Makes your changes live for all customers instantly.</p>'
      : "";
    const loadBtn = backendOn
      ? '<button data-action="admin-load" class="bg-surface-container text-on-surface rounded-full px-md py-2.5 text-label-md press flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">cloud_download</span>Load from site</button>'
      : "";
    const resetBtn = customized
      ? '<button data-action="admin-reset" class="text-on-surface-variant rounded-full px-md py-2.5 text-label-md press flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">restart_alt</span>Reset</button>'
      : "";
    const dragHint = backendOn
      ? "Drag to reorder. Tap <strong>Publish to site</strong> when ready."
      : "Drag to reorder. Changes save automatically to this browser.";
    const emptyMsg = items.length
      ? items.map(adminProductRow).join("")
      : '<p class="text-center text-on-surface-variant py-lg">No products yet — tap "Add product".</p>';
    const infoClass = backendOn
      ? "bg-primary-container/30 text-on-primary-container"
      : "bg-surface-container text-on-surface-variant";
    const infoIcon = backendOn ? "cloud_done" : "info";
    const infoText = backendOn
      ? "<strong>Live mode:</strong> edit products below, then tap <strong>Publish to site</strong> to make changes visible to all customers. Use <strong>Export</strong> to back up your catalog."
      : "<strong>Demo mode:</strong> edits save in this browser only. Once your database is connected, the Publish button appears and changes go live for all customers.";

    const inner = `
      <header class="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-surface-container">
        <div class="flex items-center gap-2 px-md py-sm max-w-container-max mx-auto">
          <button data-action="nav" data-route="#/" class="p-2 -ml-2 rounded-full hover:bg-surface-container press text-on-surface"><span class="material-symbols-outlined">arrow_back</span></button>
          <h1 class="flex-1 font-heading text-headline-md text-primary text-center">Manage Gear</h1>
          <button data-action="admin-logout" class="p-2 -mr-2 rounded-full hover:bg-surface-container press text-on-surface-variant" title="Lock"><span class="material-symbols-outlined">lock</span></button>
        </div>
      </header>
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[100px]">
        <!-- orders dashboard shortcut -->
        <button data-action="nav" data-route="#/orders"
          class="w-full mt-md mb-0 bg-forest-deep text-paper-white rounded-xl p-4 flex items-center gap-4 press inner-shadow-stamped">
          <span class="material-symbols-outlined text-[36px] text-primary-fixed-dim shrink-0" style="font-variation-settings:'FILL' 1;">receipt_long</span>
          <div class="flex-1 min-w-0 text-left">
            <p class="font-heading text-headline-sm">Orders &amp; Work Orders</p>
            <p class="text-[13px] text-primary-fixed-dim mt-0.5">See bookings, update status, notify customers, print work orders</p>
          </div>
          <span class="material-symbols-outlined text-primary-fixed-dim shrink-0">chevron_right</span>
        </button>
        ${publishBlock}
        <div class="mt-md flex flex-wrap gap-2">
          <button data-action="admin-new" class="bg-secondary text-on-secondary rounded-full px-md py-2.5 text-label-md press flex items-center gap-1 hover:bg-secondary-container"><span class="material-symbols-outlined text-[18px]">add</span>Add product</button>
          <button data-action="admin-export" class="bg-surface-container text-on-surface rounded-full px-md py-2.5 text-label-md press flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">download</span>Export</button>
          <label class="bg-surface-container text-on-surface rounded-full px-md py-2.5 text-label-md press flex items-center gap-1 cursor-pointer"><span class="material-symbols-outlined text-[18px]">upload</span>Import
            <input type="file" accept="application/json" data-action="admin-import" class="hidden" /></label>
          ${loadBtn}
          ${resetBtn}
        </div>
        <p class="text-label-sm text-outline mt-sm flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">drag_indicator</span>
          ${dragHint}
        </p>
        <!-- Category management -->
        <div class="mt-md">
          <h2 class="text-[12px] font-bold tracking-widest uppercase text-earth-brown mb-2">Categories</h2>
          <div id="cat-list" class="flex flex-wrap gap-2 mb-2">
            ${window.CATALOG.categories().map(c => {
              const inUse = window.CATALOG.gear().some(g => g.category === c);
              return `<span class="flex items-center gap-1 bg-surface-container rounded-full pl-3 pr-1 py-1 text-label-sm text-on-surface">
                ${c}
                ${inUse
                  ? `<span class="material-symbols-outlined text-[14px] text-outline ml-1" title="In use by products">lock</span>`
                  : `<button data-action="admin-cat-delete" data-cat="${c}" class="p-0.5 rounded-full hover:bg-error-container press" title="Remove category"><span class="material-symbols-outlined text-[16px] text-error">close</span></button>`}
              </span>`;
            }).join("")}
          </div>
          <div class="flex gap-2">
            <input id="new-cat-input" type="text" placeholder="New category name"
              class="flex-1 rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2 text-label-md" />
            <button data-action="admin-cat-add" class="bg-secondary text-on-secondary rounded-full px-md py-2 text-label-md press hover:bg-secondary-container flex items-center gap-1">
              <span class="material-symbols-outlined text-[18px]">add</span>Add
            </button>
          </div>
        </div>

        <!-- Product list -->
        <h2 class="text-[12px] font-bold tracking-widest uppercase text-earth-brown mt-md mb-2">Products</h2>
        <div id="admin-list" class="mt-sm space-y-2">${emptyMsg}</div>
        <div class="mt-md rounded-xl p-md text-label-sm flex gap-2 ${infoClass}">
          <span class="material-symbols-outlined text-[18px] text-primary">${infoIcon}</span>
          <p>${infoText}</p>
        </div>

        <!-- Blocked / closed dates -->
        <div class="mt-md">
          <h2 class="text-[12px] font-bold tracking-widest uppercase text-earth-brown mb-2">Closed Dates</h2>
          <p class="text-label-sm text-outline mb-2">Days you're unavailable — customers can't book these dates.</p>
          <div class="flex gap-2 mb-2">
            <input id="block-date-input" type="date" class="flex-1 rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2 text-label-md" />
            <button data-action="admin-block-date" class="bg-secondary text-on-secondary rounded-full px-md py-2 text-label-md press hover:bg-secondary-container flex items-center gap-1">
              <span class="material-symbols-outlined text-[18px]">block</span>Block
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            ${(window.STATE.blockedDates || []).sort().map(d => `
              <span class="flex items-center gap-1 bg-error-container/40 text-error rounded-full pl-3 pr-1 py-1 text-label-sm">
                ${d}
                <button data-action="admin-unblock-date" data-date="${d}" class="p-0.5 rounded-full hover:bg-error-container press"><span class="material-symbols-outlined text-[16px]">close</span></button>
              </span>`).join("") || '<p class="text-label-sm text-outline">No dates blocked.</p>'}
          </div>
          ${backendOn ? `<button data-action="admin-save-blocked" class="mt-2 text-label-sm text-primary press hover:underline flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">cloud_upload</span>Save closed dates to site</button>` : ""}
        </div>

        <!-- Business info -->
        <div class="mt-md">
          <h2 class="text-[12px] font-bold tracking-widest uppercase text-earth-brown mb-2">Business Info</h2>
          <p class="text-label-sm text-outline mb-2">Shown on Pick-up & Returns and Help pages.</p>
          <div class="space-y-2">
            <input id="biz-phone" type="tel" placeholder="Phone number" value="${esc((window.STATE.businessInfo || {}).phone || "")}"
              class="w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5 text-label-md" />
            <input id="biz-email" type="email" placeholder="Contact email" value="${esc((window.STATE.businessInfo || {}).email || "")}"
              class="w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5 text-label-md" />
            <input id="biz-address" type="text" placeholder="Full pickup address" value="${esc((window.STATE.businessInfo || {}).address || "")}"
              class="w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5 text-label-md" />
            <textarea id="biz-hours" placeholder="Hours (e.g. Mon–Sat 8 AM – 6 PM)" rows="2"
              class="w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5 text-label-md resize-none">${esc((window.STATE.businessInfo || {}).hours || "")}</textarea>
            <button data-action="admin-save-biz" class="w-full rounded-full py-2.5 bg-surface-container text-on-surface text-label-md press hover:bg-granite-wash flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[18px]">save</span>Save Business Info
            </button>
          </div>
        </div>
      </main>
      ${window.STATE.adminEdit ? adminForm() : ""}`;
    return `<div class="view-enter min-h-screen flex flex-col">${inner}</div>`;
  }

  /* ---------- ADMIN: Orders / Work Orders ---------- */

  const STATUS_FLOW = [
    { key: "confirmed", label: "New",       icon: "fiber_new",        color: "#AB3500" },
    { key: "prepped",   label: "Prepped",   icon: "inventory_2",      color: "#5C5346" },
    { key: "ready",     label: "Ready",     icon: "check_circle",     color: "#1b3022" },
    { key: "picked_up", label: "Picked up", icon: "directions_walk",  color: "#061B0E" },
    { key: "returned",  label: "Returned",  icon: "assignment_turned_in", color: "#5C5346" }
  ];
  function statusMeta(k) { return STATUS_FLOW.find(s => s.key === k) || STATUS_FLOW[0]; }
  function fmtFullDate(iso) {
    if (!iso) return "Flexible";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  function nextStatus(k) {
    const i = STATUS_FLOW.findIndex(s => s.key === k);
    return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1].key : null;
  }

  function adminOrders() {
    const filter = window.STATE.ordersFilter || "upcoming";
    const orders = window.STATE.orders || [];
    const loading = window.STATE.ordersLoading;

    const filterBtn = (key, label) => {
      const on = filter === key;
      return `<button data-action="orders-filter" data-filter="${key}"
        class="shrink-0 px-4 py-2 rounded-full text-[13px] font-bold tracking-wide whitespace-nowrap press
        ${on ? "bg-forest-deep text-paper-white inner-shadow-stamped" : "bg-paper-white border border-outline-variant text-forest-deep hover:bg-granite-wash"}">${label}</button>`;
    };

    const cards = orders.map(o => {
      const sm = statusMeta(o.status);
      const ref = o.ref || ("UBR-" + String(o.orderId).slice(-6).toUpperCase());
      const next = nextStatus(o.status);
      const nextMeta = next ? statusMeta(next) : null;
      const notified = !!o.notifiedReadyAt;
      return `
      <article class="bg-paper-white border border-outline-variant card-elevation rounded-xl overflow-hidden">
        <div class="p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <span class="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider px-2 py-0.5 rounded uppercase" style="background:${sm.color}1a;color:${sm.color}">
                <span class="material-symbols-outlined text-[14px]">${sm.icon}</span>${sm.label}
              </span>
              <h3 class="font-heading text-headline-sm text-forest-deep mt-1.5 leading-tight">${esc(o.name || "Gear rental")}${o.qty > 1 ? ` ×${o.qty}` : ""}</h3>
              <p class="text-[12px] text-outline">#${esc(ref)}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-[13px] font-bold text-forest-deep">${fmtFullDate(o.startDate)}</p>
              ${o.pickupTime ? `<p class="text-[12px] text-canyon-clay font-semibold">${esc(o.pickupTime)}</p>` : ""}
            </div>
          </div>

          <div class="mt-3 grid gap-1 text-[13px]">
            <p class="flex items-center gap-1.5 text-earth-brown"><span class="material-symbols-outlined text-[15px] text-forest-deep">person</span>${esc(o.renterName || o.customerName || "—")}</p>
            ${o.phone ? `<p class="flex items-center gap-2 text-earth-brown"><span class="material-symbols-outlined text-[15px] text-forest-deep">call</span>${esc(o.phone)}
              <a href="sms:${esc(String(o.phone).replace(/[^\d+]/g, ""))}" class="inline-flex items-center gap-1 text-canyon-clay font-semibold underline"><span class="material-symbols-outlined text-[14px]">sms</span>Text</a>
              <a href="tel:${esc(String(o.phone).replace(/[^\d+]/g, ""))}" class="inline-flex items-center gap-1 text-forest-deep font-semibold underline"><span class="material-symbols-outlined text-[14px]">call</span>Call</a></p>` : ""}
            ${o.email ? `<p class="flex items-center gap-1.5 text-earth-brown min-w-0"><span class="material-symbols-outlined text-[15px] text-forest-deep">mail</span><span class="truncate">${esc(o.email)}</span></p>` : ""}
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            ${next ? `<button data-action="order-advance" data-id="${o.orderId}" data-status="${next}"
              class="bg-forest-deep text-paper-white px-3 py-2 rounded-lg text-[12px] font-bold tracking-wide press flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">${nextMeta.icon}</span>Mark ${nextMeta.label}</button>` : ""}
            <button data-action="order-notify" data-id="${o.orderId}"
              class="border-2 px-3 py-2 rounded-lg text-[12px] font-bold tracking-wide press flex items-center gap-1 ${notified ? "border-outline-variant text-earth-brown" : "border-canyon-clay text-canyon-clay hover:bg-canyon-clay/5"}">
              <span class="material-symbols-outlined text-[16px]">${notified ? "mark_chat_read" : "send"}</span>${notified ? "Notify again" : "Gear ready"}</button>
            <button data-action="work-order" data-id="${o.orderId}"
              class="border-2 border-forest-deep text-forest-deep px-3 py-2 rounded-lg text-[12px] font-bold tracking-wide press flex items-center gap-1 hover:bg-granite-wash">
              <span class="material-symbols-outlined text-[16px]">print</span>Work order</button>
            ${o.hold > 0 ? `<button data-action="order-void-hold" data-id="${o.orderId}"
              class="border-2 border-secondary text-secondary px-3 py-2 rounded-lg text-[12px] font-bold tracking-wide press flex items-center gap-1 hover:bg-secondary/5">
              <span class="material-symbols-outlined text-[16px]">lock_open</span>Release hold</button>` : ""}
            ${o.hold > 0 ? `<button data-action="order-capture-hold" data-id="${o.orderId}"
              class="border-2 border-error text-error px-3 py-2 rounded-lg text-[12px] font-bold tracking-wide press flex items-center gap-1 hover:bg-error/5">
              <span class="material-symbols-outlined text-[16px]">warning</span>Charge damage</button>` : ""}
            ${o.status !== "cancelled" && o.status !== "returned" ? `<button data-action="order-cancel" data-id="${o.orderId}"
              class="border-2 border-outline-variant text-on-surface-variant px-3 py-2 rounded-lg text-[12px] font-bold tracking-wide press flex items-center gap-1 hover:bg-surface-container">
              <span class="material-symbols-outlined text-[16px]">cancel</span>Cancel &amp; refund</button>` : ""}
          </div>
          ${notified ? `<p class="text-[11px] text-outline mt-2 flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">schedule</span>Customer notified ${new Date(o.notifiedReadyAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>` : ""}
        </div>
      </article>`;
    }).join("");

    const body = loading
      ? `<div class="mt-16 flex flex-col items-center text-center"><div class="w-12 h-12 rounded-full border-4 border-granite-wash border-t-forest-deep animate-spin"></div><p class="text-body-md text-earth-brown mt-4">Loading orders…</p></div>`
      : (orders.length
        ? `<section class="mt-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">${cards}</section>`
        : `<div class="mt-16 text-center flex flex-col items-center"><div class="w-40 opacity-60">${ART.trailLine()}</div><p class="font-heading text-headline-sm text-forest-deep mt-4">No ${filter === "today" ? "pickups today" : filter === "all" ? "orders" : "upcoming orders"}</p><p class="text-body-md text-earth-brown mt-1">Paid bookings show up here automatically.</p></div>`);

    const inner = `
      <header class="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-surface-container">
        <div class="flex items-center gap-2 px-md py-sm max-w-container-max mx-auto">
          <button data-action="nav" data-route="#/admin" class="p-2 -ml-2 rounded-full hover:bg-surface-container press text-on-surface"><span class="material-symbols-outlined">arrow_back</span></button>
          <h1 class="flex-1 font-heading text-headline-md text-primary text-center">Orders</h1>
          <button data-action="orders-refresh" class="p-2 -mr-2 rounded-full hover:bg-surface-container press text-on-surface-variant" title="Refresh"><span class="material-symbols-outlined">refresh</span></button>
        </div>
      </header>
      <main class="flex-grow px-4 sm:px-6 max-w-container-max mx-auto w-full pb-[40px]">
        <div class="flex gap-2 overflow-x-auto no-scrollbar mt-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          ${filterBtn("today", "Today's pickups")}${filterBtn("upcoming", "Upcoming")}${filterBtn("all", "All")}
        </div>
        ${body}
      </main>`;
    return `<div class="view-enter min-h-screen flex flex-col">${inner}</div>`;
  }

  function workOrder(orderId) {
    const o = (window.STATE.orders || []).find(x => x.orderId === orderId);
    if (!o) return notFound();
    const ref = o.ref || ("UBR-" + String(o.orderId).slice(-6).toUpperCase());
    const includes = (o.includes || []).map(x =>
      `<li style="padding:6px 0;border-bottom:1px solid #e5e1df;display:flex;align-items:center;gap:10px;">
        <span style="display:inline-block;width:18px;height:18px;border:2px solid #061B0E;border-radius:4px;"></span>${esc(x)}</li>`).join("");

    const inner = `
      <div class="no-print sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-surface-container">
        <div class="flex items-center gap-2 px-md py-sm max-w-container-max mx-auto">
          <button data-action="nav" data-route="#/orders" class="p-2 -ml-2 rounded-full hover:bg-surface-container press text-on-surface"><span class="material-symbols-outlined">arrow_back</span></button>
          <h1 class="flex-1 font-heading text-headline-md text-primary text-center">Work Order</h1>
          <button data-action="do-print" class="bg-forest-deep text-paper-white px-4 py-2 rounded-lg text-[13px] font-bold tracking-wide press flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">print</span>Print</button>
        </div>
      </div>
      <div id="work-order-sheet" style="max-width:680px;margin:0 auto;padding:32px 28px;background:#fff;color:#061B0E;font-family:Inter,system-ui,sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #061B0E;padding-bottom:16px;">
          <div>
            <div style="font-size:24px;font-weight:800;letter-spacing:-0.01em;">⛰ Take a Hike Rentals</div>
            <div style="font-size:13px;color:#5C5346;margin-top:2px;">Gear Pickup Work Order</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;color:#5C5346;">Order</div>
            <div style="font-size:18px;font-weight:700;">#${esc(ref)}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;">
          <tr><td style="padding:6px 0;color:#5C5346;width:42%;">Renter (verify photo ID)</td><td style="padding:6px 0;font-weight:700;font-size:16px;">${esc(o.renterName || o.customerName || "—")}</td></tr>
          <tr><td style="padding:6px 0;color:#5C5346;">Card / PayPal name</td><td style="padding:6px 0;font-weight:600;">${esc(o.customerName || "—")}</td></tr>
          <tr><td style="padding:6px 0;color:#5C5346;">Phone</td><td style="padding:6px 0;font-weight:600;">${esc(o.phone || "—")}</td></tr>
          <tr><td style="padding:6px 0;color:#5C5346;">Email</td><td style="padding:6px 0;font-weight:600;">${esc(o.email || "—")}</td></tr>
        </table>

        <div style="display:flex;gap:16px;margin-top:16px;">
          <div style="flex:1;background:#f6f3f2;border-radius:8px;padding:14px;">
            <div style="font-size:12px;color:#5C5346;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;">Pickup date</div>
            <div style="font-size:18px;font-weight:700;margin-top:2px;">${fmtFullDate(o.startDate)}</div>
            ${o.pickupTime ? `<div style="font-size:14px;color:#AB3500;font-weight:700;margin-top:2px;">${o.pickupTime}</div>` : ""}
          </div>
          <div style="flex:1;background:#f6f3f2;border-radius:8px;padding:14px;">
            <div style="font-size:12px;color:#5C5346;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;">Return date</div>
            <div style="font-size:18px;font-weight:700;margin-top:2px;">${fmtFullDate(o.endDate)}</div>
            ${o.days ? `<div style="font-size:14px;color:#5C5346;margin-top:2px;">${o.days} day${o.days !== 1 ? "s" : ""}</div>` : ""}
          </div>
        </div>

        <div style="margin-top:22px;">
          <div style="font-size:15px;font-weight:800;border-bottom:2px solid #061B0E;padding-bottom:6px;">Gear to prepare${o.qty > 1 ? ` (×${o.qty})` : ""}</div>
          ${includes
            ? `<ul style="list-style:none;padding:0;margin:10px 0 0;font-size:14px;">${includes}</ul>`
            : `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;font-size:15px;">
                 <span style="display:inline-block;width:18px;height:18px;border:2px solid #061B0E;border-radius:4px;"></span>
                 <strong>${esc(o.name || "Gear rental")}</strong>${o.qty > 1 ? ` ×${o.qty}` : ""}</div>`}
        </div>

        <table style="width:100%;border-collapse:collapse;margin-top:22px;font-size:14px;border-top:2px solid #061B0E;">
          <tr><td style="padding:8px 0;color:#5C5346;">Rental charged</td><td style="padding:8px 0;font-weight:700;text-align:right;">${fmt.money((o.amount || 0) / 100)}</td></tr>
          ${o.hold ? `<tr><td style="padding:8px 0;color:#5C5346;">Refundable hold on card</td><td style="padding:8px 0;font-weight:700;text-align:right;">${fmt.money((o.hold || 0) / 100)}</td></tr>` : ""}
          ${o.deposit ? `<tr><td style="padding:8px 0;color:#5C5346;">Max auth hold</td><td style="padding:8px 0;font-weight:700;text-align:right;">${fmt.money((o.deposit || 0) / 100)}</td></tr>` : ""}
        </table>

        <div style="margin-top:18px;padding:14px;border:2px solid #061B0E;border-radius:8px;">
          <div style="font-size:13px;font-weight:800;">At pickup checklist</div>
          <div style="font-size:13px;color:#5C5346;margin-top:8px;display:grid;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;"><span style="display:inline-block;width:16px;height:16px;border:2px solid #061B0E;border-radius:3px;"></span>Photo ID matches renter name above</div>
            <div style="display:flex;align-items:center;gap:10px;"><span style="display:inline-block;width:16px;height:16px;border:2px solid #061B0E;border-radius:3px;"></span>ID name matches card / PayPal name</div>
            <div style="display:flex;align-items:center;gap:10px;"><span style="display:inline-block;width:16px;height:16px;border:2px solid #061B0E;border-radius:3px;"></span>All gear inspected &amp; handed over</div>
            <div style="display:flex;align-items:center;gap:10px;"><span style="display:inline-block;width:16px;height:16px;border:2px solid #061B0E;border-radius:3px;"></span>Return date confirmed with renter</div>
          </div>
        </div>

        <div style="margin-top:18px;font-size:12px;color:#5C5346;">
          Agreed to rental terms: ${o.agreedTerms ? "Yes" + (o.agreedAt ? " · " + new Date(o.agreedAt).toLocaleString("en-US") : "") : "—"}<br/>
          Take a Hike Rentals · Saratoga Springs, UT
        </div>
      </div>`;
    return `<div class="view-enter min-h-screen flex flex-col bg-white">${inner}</div>`;
  }

  /* ---------- PICKUP & RETURNS ---------- */
  function pickupInfo() {
    const info = window.STATE.businessInfo || {};
    const address = info.address || "Saratoga Springs, UT";
    const phone = info.phone || "";
    const hours = info.hours || "Mon–Sat 8 AM – 6 PM, Sun 9 AM – 4 PM";
    const inner = `
      ${topBar({ title: "Pick-up & Returns", back: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[40px]">
        <div class="mt-md space-y-md">
          <section class="bg-paper-white rounded-xl border border-outline-variant card-elevation p-md">
            <h2 class="font-heading text-headline-sm text-forest-deep flex items-center gap-2 mb-sm">
              <span class="material-symbols-outlined text-canyon-clay">location_on</span>Depot Location
            </h2>
            <p class="text-body-md text-on-surface-variant">${esc(address)}</p>
            ${phone ? `<a href="tel:${esc(phone.replace(/[^\d+]/g,""))}" class="mt-2 flex items-center gap-2 text-label-md text-secondary press hover:underline"><span class="material-symbols-outlined text-[18px]">call</span>${esc(phone)}</a>` : ""}
          </section>
          <section class="bg-paper-white rounded-xl border border-outline-variant card-elevation p-md">
            <h2 class="font-heading text-headline-sm text-forest-deep flex items-center gap-2 mb-sm">
              <span class="material-symbols-outlined text-canyon-clay">schedule</span>Hours
            </h2>
            <p class="text-body-md text-on-surface-variant whitespace-pre-line">${esc(hours)}</p>
          </section>
          <section class="bg-paper-white rounded-xl border border-outline-variant card-elevation p-md">
            <h2 class="font-heading text-headline-sm text-forest-deep flex items-center gap-2 mb-sm">
              <span class="material-symbols-outlined text-canyon-clay">local_shipping</span>Pick-up Process
            </h2>
            <ol class="space-y-3 text-body-md text-on-surface-variant list-none">
              <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-forest-deep text-paper-white text-[12px] font-bold flex items-center justify-center shrink-0">1</span>Bring your <strong>government photo ID</strong> — it must match the name on your booking.</li>
              <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-forest-deep text-paper-white text-[12px] font-bold flex items-center justify-center shrink-0">2</span>We'll inspect and hand over the gear together. Check it over before you go.</li>
              <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-forest-deep text-paper-white text-[12px] font-bold flex items-center justify-center shrink-0">3</span>Return gear clean and dry by your return date. Late returns may incur an extra day charge.</li>
              <li class="flex gap-3"><span class="w-6 h-6 rounded-full bg-forest-deep text-paper-white text-[12px] font-bold flex items-center justify-center shrink-0">4</span>Once we confirm good condition, the auth hold on your card is released — usually within 1–3 business days.</li>
            </ol>
          </section>
          <section class="bg-paper-white rounded-xl border border-outline-variant card-elevation p-md">
            <h2 class="font-heading text-headline-sm text-forest-deep flex items-center gap-2 mb-sm">
              <span class="material-symbols-outlined text-canyon-clay">warning</span>Late & Damaged Gear
            </h2>
            <p class="text-body-md text-on-surface-variant">Gear not returned by your return date may be charged an additional day's rental fee. Damaged, lost, or stolen gear may be charged up to the full replacement value held on your card.</p>
          </section>
        </div>
      </main>`;
    return page(inner, { active: "#/profile" });
  }

  /* ---------- SAFETY & WAIVERS ---------- */
  function safetyWaivers() {
    const inner = `
      ${topBar({ title: "Safety & Waivers", back: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[40px]">
        <div class="mt-md space-y-md">
          <section class="bg-paper-white rounded-xl border border-outline-variant card-elevation p-md">
            <h2 class="font-heading text-headline-sm text-forest-deep flex items-center gap-2 mb-sm">
              <span class="material-symbols-outlined text-canyon-clay">verified_user</span>Rental Agreement
            </h2>
            <div class="space-y-3 text-body-md text-on-surface-variant">
              <p>By completing a booking you agree to the following terms:</p>
              <ul class="space-y-2 list-none">
                <li class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-forest-deep shrink-0 mt-0.5">check_circle</span>You are responsible for the full replacement cost of any lost, stolen, or damaged gear.</li>
                <li class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-forest-deep shrink-0 mt-0.5">check_circle</span>Gear must be returned clean, dry, and in the same condition it was received.</li>
                <li class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-forest-deep shrink-0 mt-0.5">check_circle</span>An authorization hold (up to $250) is placed on your card at checkout and released upon safe return.</li>
                <li class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-forest-deep shrink-0 mt-0.5">check_circle</span>Gear not returned may be reported stolen and the card charged up to the full replacement value.</li>
                <li class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-forest-deep shrink-0 mt-0.5">check_circle</span>This equipment is for backcountry use and carries inherent risks, which you accept by renting.</li>
              </ul>
            </div>
          </section>
          <section class="bg-paper-white rounded-xl border border-outline-variant card-elevation p-md">
            <h2 class="font-heading text-headline-sm text-forest-deep flex items-center gap-2 mb-sm">
              <span class="material-symbols-outlined text-canyon-clay">health_and_safety</span>Safety Guidelines
            </h2>
            <div class="space-y-2 text-body-md text-on-surface-variant">
              <p>Backcountry travel involves serious risks. Before heading out:</p>
              <ul class="space-y-2 list-none mt-2">
                <li class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-canyon-clay shrink-0 mt-0.5">warning</span>Always tell someone your route and expected return time.</li>
                <li class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-canyon-clay shrink-0 mt-0.5">warning</span>Check weather conditions before and during your trip.</li>
                <li class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-canyon-clay shrink-0 mt-0.5">warning</span>Know how to use all gear — especially the Garmin inReach — before you leave.</li>
                <li class="flex gap-2"><span class="material-symbols-outlined text-[18px] text-canyon-clay shrink-0 mt-0.5">warning</span>Carry the 10 Essentials on every overnight trip.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>`;
    return page(inner, { active: "#/profile" });
  }

  /* ---------- HELP & SUPPORT ---------- */
  function helpSupport() {
    const info = window.STATE.businessInfo || {};
    const phone = info.phone || "";
    const email = info.email || "";
    const faqs = [
      ["Can I extend my rental?", "Contact us before your return date and we'll do our best to accommodate an extension, subject to availability."],
      ["What if gear is damaged on the trail?", "Accidents happen. Contact us immediately. The auth hold covers damage up to $250 — anything beyond that may be billed separately."],
      ["Can I cancel my booking?", "Cancellations must be requested at least 48 hours before pickup for a full refund. Contact us by phone or email."],
      ["Do you deliver gear?", "Currently we are pickup-only from our Saratoga Springs depot. We're exploring delivery options for the future."],
      ["Is there a minimum rental period?", "Our minimum rental is 1 day. Multi-day rentals are priced per day."],
      ["What ID do I need at pickup?", "A valid government-issued photo ID (driver's license or passport). The name must match your booking and payment card."],
    ];
    const inner = `
      ${topBar({ title: "Help & Support", back: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[40px]">
        <div class="mt-md space-y-md">
          ${(phone || email) ? `
          <section class="bg-paper-white rounded-xl border border-outline-variant card-elevation p-md">
            <h2 class="font-heading text-headline-sm text-forest-deep flex items-center gap-2 mb-sm">
              <span class="material-symbols-outlined text-canyon-clay">contact_support</span>Contact Us
            </h2>
            <div class="space-y-2">
              ${phone ? `<a href="tel:${esc(phone.replace(/[^\d+]/g,""))}" class="flex items-center gap-3 text-body-md text-secondary press hover:underline"><span class="material-symbols-outlined text-[20px]">call</span>${esc(phone)}</a>` : ""}
              ${email ? `<a href="mailto:${esc(email)}" class="flex items-center gap-3 text-body-md text-secondary press hover:underline"><span class="material-symbols-outlined text-[20px]">mail</span>${esc(email)}</a>` : ""}
            </div>
          </section>` : ""}
          <section class="bg-paper-white rounded-xl border border-outline-variant card-elevation p-md">
            <h2 class="font-heading text-headline-sm text-forest-deep flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined text-canyon-clay">help</span>Frequently Asked Questions
            </h2>
            <div class="divide-y divide-granite-wash">
              ${faqs.map(([q, a]) => `
                <details class="group py-3">
                  <summary class="flex items-center justify-between cursor-pointer text-[14px] font-semibold text-forest-deep list-none">
                    ${q}<span class="material-symbols-outlined text-[20px] text-outline group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <p class="mt-2 text-body-md text-on-surface-variant">${a}</p>
                </details>`).join("")}
            </div>
          </section>
        </div>
      </main>`;
    return page(inner, { active: "#/profile" });
  }

  function notFound() {
    return page(`${topBar({ title: "Not found", back: true })}
      <main class="flex-grow flex flex-col items-center justify-center text-center px-md">
        <div class="w-40 opacity-70">${ART.trailLine()}</div>
        <p class="font-heading text-headline-md mt-sm">Off the trail</p>
        <p class="text-body-md text-on-surface-variant mt-1">We couldn't find that page.</p>
        <button data-action="nav" data-route="#/" class="mt-md bg-secondary text-on-secondary px-md py-2.5 rounded-full text-label-md press">Back to Home</button>
      </main>`, { active: "#/" });
  }

  /* ---------- CART ---------- */
  function cartCalendar() {
    const m = window.STATE.calMonth;
    const today = fmt.midnight(new Date());
    const year = m.getFullYear(), month = m.getMonth();
    const monthName = m.toLocaleString("en-US", { month: "long", year: "numeric" });
    const firstDow = new Date(year, month, 1).getDay();
    const daysIn = new Date(year, month + 1, 0).getDate();
    const { start, end } = window.STATE.cartDates;
    let cells = "";
    for (let i = 0; i < firstDow; i++) cells += `<div></div>`;
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(year, month, d);
      const iso = fmt.iso(date);
      const isPast = date < today;
      const isStart = iso === start, isEnd = iso === end;
      const inRange = start && end && iso > start && iso < end;
      let cls = "relative h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold transition-colors ";
      if (isPast) cls += "text-outline cursor-not-allowed opacity-40";
      else if (isStart || isEnd) cls += "bg-canyon-clay text-paper-white cursor-pointer";
      else if (inRange) cls += "bg-canyon-clay/15 text-forest-deep cursor-pointer";
      else cls += "text-on-surface hover:bg-granite-wash cursor-pointer press";
      cells += isPast
        ? `<div class="${cls}">${d}</div>`
        : `<button data-action="cal-day" data-date="${iso}" class="${cls}">${d}</button>`;
    }
    return `<div data-cart-cal="1">
      <div class="flex items-center justify-between mb-3">
        <button data-action="cal-prev" class="p-1.5 rounded-full hover:bg-granite-wash press"><span class="material-symbols-outlined text-[20px]">chevron_left</span></button>
        <span class="text-label-md font-semibold text-on-surface">${monthName}</span>
        <button data-action="cal-next" class="p-1.5 rounded-full hover:bg-granite-wash press"><span class="material-symbols-outlined text-[20px]">chevron_right</span></button>
      </div>
      <div class="grid grid-cols-7 gap-0.5 mb-1">
        ${["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => `<div class="h-7 flex items-center justify-center text-[11px] font-bold text-outline">${d}</div>`).join("")}
      </div>
      <div class="grid grid-cols-7 gap-0.5">${cells}</div>
    </div>`;
  }

  function cart() {
    const items = window.STATE.cart || [];
    const dates = window.STATE.cartDates;
    const pickupTime = window.STATE.cartPickupTime;
    const daysCount = dates.start && dates.end
      ? Math.round((fmt.parse(dates.end) - fmt.parse(dates.start)) / 86400000) + 1 : 1;
    const total = items.reduce((s, e) => {
      const d = e.item.perDay ? daysCount : 1;
      return s + (e.item.price || 0) * e.qty * d;
    }, 0);
    const holdAmt = Math.min(items.reduce((s, e) => s + (e.item.deposit || 0) * e.qty, 0), 250);
    const ready = items.length > 0 && dates.start && pickupTime;

    const itemRows = items.map(({ item, qty }) => `
      <div class="bg-paper-white rounded-xl border border-outline-variant p-3 flex gap-3 items-center">
        <div class="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-surface-container relative flex items-center justify-center">
          <img src="${imageFor(item, 200)}" alt="${item.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover"/>
          <span class="gear-fallback-icon material-symbols-outlined opacity-0" style="font-size:28px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-label-md font-semibold text-on-surface truncate">${item.name}</p>
          <p class="text-label-sm text-outline">${item.perDay ? `${fmt.money(item.price)}/day × ${daysCount} day${daysCount > 1 ? "s" : ""} × ${qty} = ${fmt.money(item.price * qty * daysCount)}` : `${fmt.money(item.price)} × ${qty} = ${fmt.money(item.price * qty)}`}</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button data-action="cart-qty-dec" data-id="${item.id}" class="w-7 h-7 rounded-full bg-surface-container press flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">remove</span></button>
          <span class="w-5 text-center text-label-md">${qty}</span>
          <button data-action="cart-qty-inc" data-id="${item.id}" class="w-7 h-7 rounded-full bg-primary text-on-primary press flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">add</span></button>
          <button data-action="cart-remove" data-id="${item.id}" class="w-7 h-7 rounded-full hover:bg-error-container press flex items-center justify-center ml-1"><span class="material-symbols-outlined text-[16px] text-error">close</span></button>
        </div>
      </div>`).join("");

    const emptyState = `<div class="text-center py-16 flex flex-col items-center">
      <span class="material-symbols-outlined text-[48px] text-outline opacity-50">shopping_cart</span>
      <p class="font-heading text-headline-sm text-on-surface mt-3">Your cart is empty</p>
      <p class="text-body-md text-on-surface-variant mt-1">Browse gear and tap "Add to Cart"</p>
      <button data-action="nav" data-route="#/" class="mt-5 bg-secondary text-on-secondary px-6 py-3 rounded-full text-label-md press">Browse Gear</button>
    </div>`;

    const inner = `
      ${topBar({ title: "Your Cart", back: true, trailing: items.length > 0 ? `<button data-action="cart-clear" class="text-[13px] text-error press px-2">Clear</button>` : `<span class="w-8"></span>` })}
      <main class="flex-grow max-w-container-max mx-auto w-full px-4 sm:px-6 pb-[200px]">
        ${items.length === 0 ? emptyState : `
          <!-- Items -->
          <section class="mt-4 grid gap-3">${itemRows}</section>

          <!-- Trip dates -->
          <section class="mt-6">
            <h2 class="text-label-md font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px] text-canyon-clay">calendar_today</span>Trip Dates
            </h2>
            ${cartCalendar()}
          </section>

          <!-- Pickup window -->
          <section class="mt-5">
            <h2 class="text-label-md font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px] text-canyon-clay">schedule</span>Pickup Window
            </h2>
            <div class="grid grid-cols-2 gap-2">
              ${PICKUP_TIMES.map(t => {
                const on = pickupTime === t.label;
                return `<button data-action="cart-pickup-time" data-time="${t.label}"
                  class="rounded-xl border-2 py-2.5 px-3 text-left press transition-colors
                  ${on ? "border-canyon-clay bg-canyon-clay/5" : "border-outline-variant bg-paper-white hover:border-forest-deep"}">
                  <p class="text-[13px] font-bold ${on ? "text-canyon-clay" : "text-forest-deep"}">${t.label}</p>
                  <p class="text-[11px] ${on ? "text-canyon-clay/70" : "text-earth-brown"}">${t.sub}</p>
                </button>`;
              }).join("")}
            </div>
          </section>
        `}
      </main>

      ${items.length > 0 ? `
      <div class="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest border-t border-outline-variant safe-bottom">
        <div class="max-w-container-max mx-auto px-4 sm:px-6 py-3">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-label-sm text-outline">${items.length} item${items.length > 1 ? "s" : ""}${dates.start ? " · " + fmt.range(dates) : ""}</p>
              <p class="font-heading text-headline-sm text-primary">${fmt.money(total)} rental${holdAmt ? ` + ${fmt.money(holdAmt)} hold` : ""}</p>
            </div>
            <button data-action="nav" data-route="#/" class="text-[13px] text-primary font-semibold press underline">+ Add more</button>
          </div>
          <button data-action="cart-checkout" ${ready ? "" : "disabled"}
            class="w-full rounded-full py-3.5 text-label-md text-on-secondary press transition-colors ${ready ? "bg-secondary hover:bg-secondary-container" : "bg-secondary/40 cursor-not-allowed"}">
            ${ready ? "Proceed to Checkout" : !dates.start ? "Select trip dates above" : "Choose a pickup window"}
          </button>
        </div>
      </div>` : ""}`;
    return `<div class="view-enter min-h-screen flex flex-col">${inner}</div>`;
  }

  function cartFab() {
    const count = (window.STATE.cart || []).length;
    if (!count) return "";
    const cartDays = (() => { const d = window.STATE.cartDates; return (d.start && d.end) ? Math.round((fmt.parse(d.end) - fmt.parse(d.start)) / 86400000) + 1 : 1; })();
    const total = (window.STATE.cart || []).reduce((s, e) => s + (e.item.price || 0) * e.qty * (e.item.perDay ? cartDays : 1), 0);
    return `<div class="fixed bottom-[72px] right-4 z-50">
      <button data-action="nav" data-route="#/cart"
        class="bg-canyon-clay text-paper-white rounded-2xl pl-3 pr-4 py-2.5 flex items-center gap-2 shadow-lift press">
        <span class="relative">
          <span class="material-symbols-outlined text-[20px]">shopping_cart</span>
          <span class="absolute -top-1.5 -right-1.5 bg-forest-deep text-paper-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">${count}</span>
        </span>
        <div class="text-left leading-none">
          <p class="text-[10px] font-semibold opacity-80">${count} item${count > 1 ? "s" : ""}</p>
          <p class="text-[14px] font-bold">${fmt.money(total)}</p>
        </div>
      </button>
    </div>`;
  }

  return { home, productDetail, gear, cart, builder, bookings, confirmation, confirmationLoading, howItWorks, profile, pickupInfo, safetyWaivers, helpSupport, admin, adminGate, safetyModal, adminOrders, workOrder, notFound };
})();
