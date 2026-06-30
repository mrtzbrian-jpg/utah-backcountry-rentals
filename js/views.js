/* All screens, rendered as HTML strings. Relies on window.DATA, window.ART,
   and helpers (fmt, STATE, etc.) defined in app.js. */
window.VIEWS = (function () {
  const D = window.DATA;
  const ART = window.ART;

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
          <h1 class="font-heading text-headline-md font-bold text-forest-deep">Utah Backcountry</h1>
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
    const fav = window.STATE.favs.has(item.id);
    return `
    <article class="bg-paper-white border border-outline-variant card-elevation rounded-xl overflow-hidden reveal" style="animation-delay:${i * 70}ms">
      <div class="relative h-48 overflow-hidden bg-surface-container flex items-center justify-center">
        <img src="${imageFor(item, 800)}" alt="${item.name}" loading="lazy"
          class="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onerror="imgFallback(this)" />
        <span class="gear-fallback-icon material-symbols-outlined opacity-0"
          style="font-size:80px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
        ${item.badge ? `<span class="absolute top-3 left-3 bg-forest-deep text-paper-white text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full">${item.badge}</span>` : ""}
        <button data-action="fav" data-id="${item.id}"
          class="absolute top-3 right-3 bg-paper-white/90 rounded-full p-1.5 press">
          <span class="material-symbols-outlined text-[20px] ${fav ? "ms-fill text-canyon-clay" : "text-outline"}">favorite</span>
        </button>
      </div>
      <div class="p-4 flex flex-col gap-3">
        <div>
          <h3 class="font-heading text-headline-sm text-forest-deep leading-tight">${item.name}</h3>
          <p class="text-body-md text-earth-brown mt-1 line-clamp-2">${item.tagline}</p>
        </div>
        <div class="flex items-end justify-between pt-1">
          <div>
            <span class="text-[11px] text-outline uppercase tracking-wider font-semibold">Rental</span>
            <p class="text-lg font-bold text-forest-deep leading-tight">${fmt.money(item.price)}</p>
          </div>
          <button data-action="book" data-id="${item.id}"
            class="bg-canyon-clay text-on-secondary rounded-lg px-4 py-2.5 text-[13px] font-bold tracking-wide inner-shadow-stamped press hover:brightness-105">
            Book Dates
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

  /* ---------- HOME ---------- */

  function home() {
    const cat = window.STATE.category;
    const all = window.CATALOG.gear();
    const list = cat === "Bundles" ? all : all.filter(g => g.category === cat);
    const feed = (list.length ? list : all);

    const pills = D.categories.map(c => {
      const on = c === cat;
      return `<button data-action="category" data-cat="${c}"
        class="shrink-0 px-4 py-2 rounded-full text-[13px] font-bold tracking-wide whitespace-nowrap press transition-colors
        ${on ? "bg-forest-deep text-paper-white inner-shadow-stamped" : "bg-paper-white border border-outline-variant text-forest-deep hover:bg-granite-wash"}">${c}</button>`;
    }).join("");

    const inner = `
      ${topBar({ title: "Utah Backcountry Rentals", location: true })}
      <main class="flex-grow max-w-container-max mx-auto w-full">
        <!-- Hero — full-bleed, edge to edge -->
        <section class="relative min-h-[340px] sm:min-h-[420px] overflow-hidden flex flex-col justify-end">
          ${ART.heroScene()}
          <div class="hero-gradient absolute inset-0 pointer-events-none"></div>
          <div class="relative z-10 p-6 sm:p-10">
            <h2 style="font-family:Montserrat,system-ui,sans-serif;font-size:clamp(26px,5.5vw,44px);line-height:1.15;letter-spacing:-0.02em;font-weight:800;"
              class="text-white drop-shadow-lg mb-2">Rent Premium Gear.<br/>Skip the Retail Price.</h2>
            <p class="text-white/85 text-body-md mb-5 max-w-md">Pick your gear or build a custom bundle, choose your trail dates, and reserve online.</p>
            <div class="flex flex-wrap gap-3">
              <button data-action="scroll-feed"
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

          <!-- Category pills -->
          <section class="mt-5 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div class="flex gap-3 overflow-x-auto no-scrollbar py-1">${pills}</div>
          </section>

          <!-- Feed -->
          <section id="gear-feed" class="mt-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 scroll-mt-20">
            ${feed.map((g, i) => gearCard(g, i)).join("")}
          </section>
        </div>
      </main>`;
    return page(inner, { active: "#/" });
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
    </div>`;
  }

  function gear() {
    const item = window.STATE.draft;
    if (!item) return notFound();
    const qty = window.STATE.qty || 1;
    const total = (item.price || 0) * qty;       // flat price × quantity, charged now
    const hold = Math.min((item.deposit || 0) * qty, 250); // refundable card hold, capped at $250
    const ready = !!window.STATE.dates.start;     // pickup date chosen

    const includes = (item.includes || []).map(x =>
      `<li class="flex items-center gap-2 text-body-md text-on-surface-variant"><span class="material-symbols-outlined text-[18px] text-primary">check_circle</span>${x}</li>`).join("");

    const inner = `
      ${topBar({ title: "Select Dates", back: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[120px]">
        <!-- item summary -->
        <section class="mt-md bg-surface-container-lowest rounded-xl shadow-card p-md flex gap-md items-center">
          <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-surface-container relative flex items-center justify-center">
            <img src="${imageFor(item, 400)}" alt="${item.name}" loading="lazy" onerror="imgFallback(this)" class="absolute inset-0 w-full h-full object-cover" />
            <span class="gear-fallback-icon material-symbols-outlined opacity-0" style="font-size:44px;color:${item.tint};font-variation-settings:'FILL' 1,'wght' 300;">${item.icon}</span>
          </div>
          <div class="min-w-0">
            <h2 class="font-heading text-headline-sm text-on-surface">${item.name}</h2>
            <p class="text-body-md text-on-surface-variant line-clamp-2">${item.tagline || item.desc || ""}</p>
            <p class="mt-1 text-label-md text-secondary">${fmt.money(item.price)} rental</p>
          </div>
        </section>

        ${includes ? `<section class="mt-md"><p class="text-label-md text-outline uppercase tracking-wider mb-sm">What's included</p><ul class="grid gap-2">${includes}</ul></section>` : ""}

        <section class="mt-md">${calendar()}</section>

        <p class="text-center text-label-sm text-outline mt-sm flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-[16px]">touch_app</span>
          Tap your pickup day, then your return day
        </p>
      </main>

      <!-- sticky footer total -->
      <div class="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest shadow-float rounded-t-xl safe-bottom">
        <div class="max-w-container-max mx-auto px-md pt-md">
          <div class="flex items-center justify-between mb-sm">
            <span class="text-body-md text-on-surface-variant">Quantity</span>
            <div class="flex items-center gap-3">
              <button data-action="qty-dec" class="w-9 h-9 rounded-full bg-surface-container press flex items-center justify-center ${qty > 1 ? "" : "opacity-30 pointer-events-none"}"><span class="material-symbols-outlined text-[20px]">remove</span></button>
              <span class="text-label-md w-6 text-center">${qty}</span>
              <button data-action="qty-inc" class="w-9 h-9 rounded-full bg-primary text-on-primary press flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">add</span></button>
            </div>
          </div>
          <div class="flex items-center justify-between mb-sm">
            <div class="text-on-surface-variant text-body-md">
              ${ready ? "Rental total" : "Select your dates"}
              ${ready ? `<div class="text-label-sm text-outline">${fmt.range(window.STATE.dates)}</div>` : ""}
            </div>
            <div class="font-heading text-headline-md text-primary">${fmt.money(total)}</div>
          </div>
          ${hold ? `<p class="text-label-sm text-outline -mt-1 mb-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[15px] text-on-surface-variant">lock</span>
            + ${fmt.money(hold)} refundable hold on your card, released when you return the gear</p>` : ""}
          <button data-action="confirm-dates" ${ready ? "" : "disabled"}
            class="w-full rounded-full py-3.5 text-label-md text-on-secondary press transition-colors ${ready ? "bg-secondary hover:bg-secondary-container" : "bg-secondary/40 cursor-not-allowed"}">
            Confirm Dates
          </button>
        </div>
      </div>`;
    return `<div class="view-enter min-h-screen flex flex-col">${inner}</div>`;
  }

  function safetyModal() {
    const accepted = window.STATE.safetyAccepted;
    const qty = window.STATE.qty || 1;
    const dep = window.STATE.draft ? Math.min((window.STATE.draft.deposit || 0) * qty, 250) : 0;
    const depositNote = dep ? `
      <div class="mt-md rounded-md bg-surface-container p-sm flex gap-2 items-start">
        <span class="material-symbols-outlined text-[18px] text-primary mt-0.5">lock</span>
        <p class="text-label-sm text-on-surface-variant">We charge the rental fee now and place a <strong>refundable hold of ${fmt.money(dep)}</strong> (max $250) on your card for damage or theft. The hold is released when you return the gear in good condition.</p>
      </div>` : "";
    return `
    <div class="fixed inset-0 z-[55] flex items-end sm:items-center justify-center">
      <div data-action="cancel-modal" class="modal-backdrop absolute inset-0 bg-primary/40"></div>
      <div class="modal-sheet relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-lift overflow-hidden">
        <div class="p-md border-b border-surface-container">
          <h3 class="font-heading text-headline-md text-on-surface">Safety Disclaimer & Liability</h3>
        </div>
        <div class="p-md">
          <p class="text-body-md text-on-surface-variant">Please review and accept the following terms before proceeding with your rental.</p>
          <label class="mt-md flex gap-sm items-start cursor-pointer">
            <input type="checkbox" data-action="accept-safety" ${accepted ? "checked" : ""}
              class="tick mt-1 w-5 h-5 rounded border-outline-variant text-secondary focus:ring-secondary shrink-0" />
            <span class="text-body-md text-on-surface">I acknowledge that this equipment is for wilderness use and carries inherent risks. I am responsible for the replacement cost of any lost or damaged items.</span>
          </label>
          ${depositNote}
        </div>
        <div class="p-md bg-surface-container-low flex flex-col gap-2">
          <button data-action="proceed-checkout" ${accepted ? "" : "disabled"}
            class="w-full rounded-full py-3.5 text-label-md text-on-secondary press transition-colors ${accepted ? "bg-secondary hover:bg-secondary-container" : "bg-secondary/40 cursor-not-allowed"}">
            Proceed to Checkout
          </button>
          <button data-action="cancel-modal" class="w-full py-2 text-label-md text-on-surface-variant press">Cancel</button>
        </div>
      </div>
    </div>`;
  }

  /* ---------- PACK BUILDER ---------- */

  function builder() {
    const cat = window.STATE.packCat;
    // Every bundle is built on a base backpack that's always included.
    const BASE_ID = window.BASE_PACK_ID;
    const base = D.packLibrary.find(x => x.id === BASE_ID) || { name: "Backpack", price: 0, weight: 0, deposit: 0 };
    const lib = (cat === "All Items" ? D.packLibrary : D.packLibrary.filter(x => x.cat === cat)).filter(x => x.id !== BASE_ID);
    const chosen = window.STATE.pack;        // Map id->count (never contains the base pack)
    const totalWeight = base.weight + D.packLibrary.reduce((s, x) => s + (chosen.get(x.id) || 0) * x.weight, 0);
    const basePrice = base.price + D.packLibrary.reduce((s, x) => s + (chosen.get(x.id) || 0) * x.price, 0)
      + [...window.STATE.packAddons].reduce((s, id) => s + (D.addons.find(a => a.id === id)?.price || 0), 0);
    const depositTotal = base.deposit + D.packLibrary.reduce((s, x) => s + (chosen.get(x.id) || 0) * (x.deposit || 0), 0);

    const pills = D.packCats.map(c => {
      const on = c === cat;
      return `<button data-action="pack-cat" data-cat="${c}"
        class="shrink-0 px-md py-2 rounded-full text-label-md whitespace-nowrap press ${on ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface"}">${c}</button>`;
    }).join("");

    const cards = lib.map(x => {
      const count = chosen.get(x.id) || 0;
      const tips = x.tips ? `
        <div class="mt-2 border-l-2 border-secondary pl-2 text-label-sm text-on-surface-variant">
          <p class="font-semibold text-secondary">Pro-tips</p>
          <ul class="list-disc list-inside">${x.tips.map(t => `<li>${t}</li>`).join("")}</ul>
        </div>` : "";
      return `
      <div class="bg-surface-container-lowest rounded-xl shadow-card p-base flex flex-col ${count ? "ring-2 ring-secondary" : ""}">
        <div class="relative h-24 gear-tile rounded-md flex items-center justify-center mb-2 overflow-hidden">
          ${mediaLayer(x, 44)}
          ${count ? `<span class="absolute top-1 right-1 bg-secondary text-on-secondary text-label-sm font-bold w-6 h-6 rounded-full flex items-center justify-center z-10">${count}</span>` : ""}
        </div>
        <p class="text-label-md text-on-surface leading-tight">${x.name}</p>
        ${x.spec ? `<p class="text-label-sm text-outline mt-0.5 leading-tight">${x.spec}</p>` : ""}
        ${tips}
        <div class="mt-2 flex items-center justify-between text-label-sm">
          <span class="text-outline">${x.weight} lbs</span>
          <span class="text-secondary font-bold">${fmt.money(x.price)}</span>
        </div>
        <div class="mt-2 flex items-center justify-between">
          <button data-action="pack-remove" data-id="${x.id}" class="w-9 h-9 rounded-full bg-surface-container press flex items-center justify-center ${count ? "" : "opacity-30 pointer-events-none"}"><span class="material-symbols-outlined text-[20px]">remove</span></button>
          <span class="text-label-md w-6 text-center">${count}</span>
          <button data-action="pack-add" data-id="${x.id}" class="w-9 h-9 rounded-full bg-primary text-on-primary press flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">add</span></button>
        </div>
      </div>`;
    }).join("");

    const addonRows = D.addons.map(a => {
      const on = window.STATE.packAddons.has(a.id);
      return `<label class="flex items-center gap-sm py-2 cursor-pointer">
        <input type="checkbox" data-action="pack-addon" data-id="${a.id}" ${on ? "checked" : ""} class="tick w-5 h-5 rounded border-outline-variant text-secondary focus:ring-secondary"/>
        <span class="flex-1 text-body-md">${a.name}</span>
        <span class="text-label-md text-secondary">+${fmt.money(a.price)}</span>
      </label>`;
    }).join("");

    const totalItems = 1 /* base pack */ + [...chosen.values()].reduce((s, n) => s + n, 0) + window.STATE.packAddons.size;

    const inner = `
      ${topBar({ title: "Build Your Pack", back: true, trailing: `<button data-action="pack-reset" class="text-label-md text-on-surface-variant press px-2">Reset</button>` })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[180px]">
        <!-- pack silhouette -->
        <section class="mt-md flex flex-col items-center text-center">
          <div class="w-40 h-40 rounded-xl bg-surface-container-low flex items-center justify-center relative overflow-hidden">
            <span class="material-symbols-outlined text-[110px] text-outline-variant" style="font-variation-settings:'FILL' 1;">backpack</span>
            ${totalItems ? `<span class="absolute bottom-2 bg-primary text-on-primary text-label-sm px-3 py-1 rounded-full">${totalItems} item${totalItems > 1 ? "s" : ""} packed</span>` : ""}
          </div>
          <p class="font-heading text-headline-sm mt-sm">${base.name}</p>
          <p class="text-label-sm text-outline">Recommended for 3–5 day treks</p>
          <span class="mt-2 inline-flex items-center gap-1 bg-primary-fixed text-on-primary-fixed text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full">
            <span class="material-symbols-outlined text-[14px]">check_circle</span>Included in every bundle
          </span>
        </section>

        <!-- start from a kit -->
        <section class="mt-md">
          <h2 class="font-heading text-headline-md mb-sm">Start with a kit</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">${D.kits.map(kitCard).join("")}</div>
        </section>

        <!-- library -->
        <section class="mt-md">
          <div class="flex items-center justify-between">
            <h2 class="font-heading text-headline-md">Gear Library</h2>
          </div>
          <div class="flex gap-sm overflow-x-auto no-scrollbar py-sm -mx-md px-md">${pills}</div>
          <div class="grid grid-cols-2 gap-md mt-1">${cards}</div>
        </section>
      </main>

      <!-- sticky summary -->
      <div class="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest shadow-float rounded-t-xl safe-bottom">
        <div class="max-w-container-max mx-auto px-md pt-md">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-label-sm text-outline uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-secondary">scale</span>${totalWeight.toFixed(1)} lbs</p>
              <p class="text-label-sm text-outline flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">lock</span>${fmt.money(depositTotal)} deposit at pickup</p>
            </div>
            <div class="text-right">
              <p class="text-label-sm text-outline uppercase tracking-wider">Rental total</p>
              <p class="font-heading text-headline-md text-secondary">${fmt.money(basePrice)}</p>
            </div>
          </div>
          <div class="mt-2 border-t border-surface-container pt-2">
            <p class="text-label-sm text-outline uppercase tracking-wider mb-1">Essential add-ons</p>
            ${addonRows}
          </div>
          <button data-action="continue-pack" ${totalItems ? "" : "disabled"}
            class="w-full mt-2 rounded-full py-3.5 text-label-md text-on-secondary press flex items-center justify-center gap-2 transition-colors ${totalItems ? "bg-secondary hover:bg-secondary-container" : "bg-secondary/40 cursor-not-allowed"}">
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

        <div class="mt-md rounded-xl overflow-hidden h-44 shadow-card relative">${ART.topoMap()}
          <div class="absolute inset-0 flex items-end justify-center pb-2">
            <button data-action="directions" class="bg-surface-container-lowest/90 text-secondary text-label-md px-3 py-1.5 rounded-full shadow-sm press flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">near_me</span>Get Directions</button>
          </div>
        </div>

        <div class="mt-md flex flex-col gap-sm">
          <button data-action="nav" data-route="#/bookings" class="w-full rounded-full py-3.5 bg-secondary text-on-secondary text-label-md press hover:bg-secondary-container">View My Bookings</button>
          <button data-action="nav" data-route="#/" class="w-full rounded-full py-3.5 border-2 border-primary text-primary text-label-md press">Back to Home</button>
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
      ${topBar({ title: "Utah Backcountry Rentals", location: true })}
      <main class="flex-grow px-4 sm:px-6 max-w-container-max mx-auto w-full">
        <div class="mt-6">
          <h2 class="font-heading text-headline-lg text-forest-deep">My Bookings</h2>
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
        <div class="mt-lg pt-md border-t border-granite-wash text-center">
          <button data-action="nav" data-route="#/admin" class="text-label-sm text-outline press inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">lock</span>Owner · Manage gear
          </button>
        </div>
      </main>`;
    return page(inner, { active: "#/how" });
  }

  /* ---------- PROFILE ---------- */

  function profile() {
    const favCount = window.STATE.favs.size;
    const trips = window.STATE.bookings.length;

    const row = (icon, label, sub = "") => `
      <button class="w-full flex items-center gap-4 px-4 py-4 bg-paper-white hover:bg-granite-wash press text-left border-b border-granite-wash last:border-b-0 transition-colors">
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
          ${row("favorite", "Saved Gear", `${favCount} item${favCount === 1 ? "" : "s"}`)}
          ${row("receipt_long", "Rental History", `${trips} booking${trips === 1 ? "" : "s"}`)}
          ${row("local_shipping", "Pick-up &amp; Returns", D.depot + " Depot")}
          ${row("verified_user", "Safety &amp; Waivers")}
          ${row("help", "Help &amp; Support")}
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

        <div class="mt-6 mb-4 text-center text-[12px] text-outline">Utah Backcountry Rentals · v1.0</div>
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
        <p class="text-label-sm text-outline truncate">${item.category} · ${fmt.money(item.price)} · qty ${item.quantity != null ? item.quantity : 1}${item.deposit ? " · " + fmt.money(item.deposit) + " dep" : ""}</p>
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
    const cats = D.categories.map(c => `<option value="${c}" ${item.category === c ? "selected" : ""}>${c}</option>`).join("");
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
          <!-- photo dropzone -->
          <div data-dropzone class="relative h-40 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low flex items-center justify-center overflow-hidden">
            <img id="admin-img-preview" src="${img || ""}" class="${img ? "" : "hidden"} absolute inset-0 w-full h-full object-contain p-2" />
            <div id="admin-img-empty" class="${img ? "hidden" : ""} text-center text-on-surface-variant pointer-events-none">
              <span class="material-symbols-outlined text-[40px]">add_photo_alternate</span>
              <p class="text-label-sm">Drag a photo here, or tap to upload</p>
            </div>
            <input type="file" id="admin-file" accept="image/*" data-action="admin-image" class="absolute inset-0 opacity-0 cursor-pointer" title="Upload photo" />
          </div>
          ${img ? `<button data-action="admin-image-clear" class="text-label-sm text-error press">Remove photo</button>` : ""}

          <label class="block"><span class="text-label-md text-on-surface-variant">Name</span>
            <input id="admin-name" value="${(item.name || "").replace(/"/g, "&quot;")}" placeholder="e.g. Osprey Rook 65"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" /></label>

          <label class="block"><span class="text-label-md text-on-surface-variant">Category</span>
            <select id="admin-cat" class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5">${cats}</select></label>

          <label class="block"><span class="text-label-md text-on-surface-variant">Short description</span>
            <input id="admin-tagline" value="${(item.tagline || "").replace(/"/g, "&quot;")}" placeholder="One line shown on the card"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" /></label>

          <div class="grid grid-cols-2 gap-sm">
            <label class="block"><span class="text-label-md text-on-surface-variant">Rental price ($)</span>
              <input id="admin-price" type="number" min="0" value="${item.price != null ? item.price : ""}" placeholder="65"
                class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" /></label>
            <label class="block"><span class="text-label-md text-on-surface-variant">Deposit — your cost ($)</span>
              <input id="admin-deposit" type="number" min="0" value="${item.deposit != null ? item.deposit : ""}" placeholder="400"
                class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" /></label>
          </div>

          <label class="block"><span class="text-label-md text-on-surface-variant">Quantity in stock</span>
            <input id="admin-quantity" type="number" min="0" step="1" value="${item.quantity != null ? item.quantity : 1}" placeholder="1"
              class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" />
            <span class="block text-label-sm text-outline mt-1">How many you own. Once all units are booked for a date, that date greys out in the calendar.</span></label>

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
        <div id="admin-list" class="mt-sm space-y-2">${emptyMsg}</div>
        <div class="mt-md rounded-xl p-md text-label-sm flex gap-2 ${infoClass}">
          <span class="material-symbols-outlined text-[18px] text-primary">${infoIcon}</span>
          <p>${infoText}</p>
        </div>
      </main>
      ${window.STATE.adminEdit ? adminForm() : ""}`;
    return `<div class="view-enter min-h-screen flex flex-col">${inner}</div>`;
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

  return { home, gear, builder, bookings, confirmation, confirmationLoading, howItWorks, profile, admin, adminGate, safetyModal, notFound };
})();
