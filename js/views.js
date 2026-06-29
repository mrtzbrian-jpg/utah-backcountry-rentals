/* All screens, rendered as HTML strings. Relies on window.DATA, window.ART,
   and helpers (fmt, STATE, etc.) defined in app.js. */
window.VIEWS = (function () {
  const D = window.DATA;
  const ART = window.ART;

  /* ---------- shared chrome ---------- */

  function topBar({ title, leading = "menu", back = false, location = false, trailing = "" }) {
    const lead = back
      ? `<button data-action="back" class="p-2 -ml-2 rounded-full hover:bg-surface-container press text-on-surface">
           <span class="material-symbols-outlined">arrow_back</span></button>`
      : `<button data-action="nav" data-route="#/profile" class="p-2 -ml-2 rounded-full hover:bg-surface-container press text-on-surface-variant">
           <span class="material-symbols-outlined">menu</span></button>`;
    const trail = location
      ? `<div class="flex items-center gap-xs text-on-surface-variant text-label-md">
           <span class="material-symbols-outlined text-[18px] text-secondary">location_on</span>
           <span class="text-[13px] leading-tight max-w-[92px]">${D.depot}</span></div>`
      : (trailing || `<span class="w-8"></span>`);
    return `
    <header class="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-surface-container">
      <div class="flex items-center gap-2 px-md py-sm max-w-container-max mx-auto">
        ${lead}
        <h1 class="flex-1 font-heading ${title.length > 18 ? "text-headline-sm" : "text-headline-md"} text-primary text-center leading-tight">${title}</h1>
        ${trail}
      </div>
    </header>`;
  }

  function bottomNav(active) {
    const items = [
      { route: "#/", icon: "home", label: "Home" },
      { route: "#/bookings", icon: "calendar_month", label: "Bookings" },
      { route: "#/how", icon: "info", label: "How it Works" },
      { route: "#/profile", icon: "person", label: "Profile" }
    ];
    return `
    <nav class="fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest shadow-float rounded-t-xl safe-bottom">
      <div class="flex justify-around items-center px-2 pt-2 max-w-container-max mx-auto">
        ${items.map(i => {
          const on = i.route === active;
          return `
          <button data-action="nav" data-route="${i.route}"
            class="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-full press group ${on ? "text-on-secondary-container" : "text-on-surface-variant"}">
            <span class="material-symbols-outlined ${on ? "ms-fill bg-secondary-container/70 px-4 py-0.5 rounded-full" : "group-hover:text-secondary"}">${i.icon}</span>
            <span class="text-label-sm ${on ? "font-semibold" : ""}">${i.label}</span>
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
    <article class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-card reveal" style="animation-delay:${i * 70}ms">
      <div class="relative p-md pb-0">
        ${gearTile(item)}
        ${item.badge ? `<span class="absolute top-md left-md bg-primary text-on-primary text-label-sm font-semibold px-3 py-1 rounded-full shadow-sm">${item.badge}</span>` : ""}
        <button data-action="fav" data-id="${item.id}"
          class="absolute top-md right-md bg-surface-container-lowest rounded-full p-2 shadow-sm press">
          <span class="material-symbols-outlined text-[20px] ${fav ? "ms-fill text-secondary" : "text-outline"}">favorite</span>
        </button>
      </div>
      <div class="p-md flex flex-col gap-sm">
        <div>
          <h3 class="font-heading text-headline-sm text-on-surface">${item.name}</h3>
          <p class="text-body-md text-on-surface-variant mt-1 line-clamp-2">${item.tagline}</p>
        </div>
        <div class="mt-auto flex items-end justify-between pt-1">
          <div class="flex flex-col">
            <span class="text-label-sm text-outline uppercase tracking-wider">Starting at</span>
            <span class="text-lg font-bold text-on-primary-fixed-variant">${fmt.money(item.perDay)} <span class="text-outline font-normal text-sm">/ day</span></span>
          </div>
          <button data-action="book" data-id="${item.id}"
            class="bg-secondary text-on-secondary rounded-lg px-md py-sm text-label-md shadow-sm press hover:bg-secondary-container">
            Book Dates
          </button>
        </div>
      </div>
    </article>`;
  }

  function kitCard(kit) {
    const items = kit.items.map(id => D.packLibrary.find(x => x.id === id)).filter(Boolean);
    const weight = items.reduce((s, x) => s + x.weight, 0);
    const perDay = items.reduce((s, x) => s + x.perDay, 0);
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
        <span class="font-heading text-headline-sm text-secondary">${fmt.money(perDay)}<span class="text-outline text-sm font-normal">/day</span></span>
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
        class="shrink-0 px-md py-2 rounded-full text-label-md whitespace-nowrap press transition-colors
        ${on ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface hover:bg-surface-container-highest"}">${c}</button>`;
    }).join("");

    const inner = `
      ${topBar({ title: "Utah Backcountry Rentals", location: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full">
        <!-- Hero -->
        <section class="relative mt-md rounded-xl overflow-hidden shadow-card min-h-[320px] sm:min-h-[300px]">
          ${ART.heroScene()}
          <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"></div>
          <div class="absolute inset-0 flex flex-col justify-end p-md">
            <h2 class="font-heading text-[26px] leading-[1.12] font-extrabold sm:text-headline-xl text-white drop-shadow mb-sm">Rent Premium Gear.<br/>Skip the Retail Price.</h2>
            <div class="glass-card p-base rounded-md flex items-center gap-sm">
              <div class="flex-1 flex items-center bg-surface-container-lowest rounded px-sm py-2.5 border border-transparent focus-within:border-primary">
                <span class="material-symbols-outlined text-outline mr-2 text-[20px]">calendar_today</span>
                <input id="hero-dates" class="w-full bg-transparent border-none focus:ring-0 p-0 text-body-md placeholder-outline" placeholder="Select rental dates…" />
              </div>
              <button data-action="nav" data-route="#/bookings" class="shrink-0 bg-secondary text-on-secondary px-md py-2.5 rounded text-label-md press hover:bg-secondary-container">Check</button>
            </div>
          </div>
        </section>

        <!-- Build your own pack banner -->
        <button data-action="nav" data-route="#/builder"
          class="w-full mt-md text-left bg-primary text-on-primary rounded-xl p-md flex items-center gap-md shadow-card press overflow-hidden relative">
          <div class="absolute right-0 bottom-0 opacity-20 w-40">${ART.heroScene()}</div>
          <span class="material-symbols-outlined text-[40px] text-inverse-primary relative">backpack</span>
          <div class="relative">
            <p class="font-heading text-headline-sm">Build Your Own Pack</p>
            <p class="text-body-md text-primary-fixed-dim">Hand-pick gear, see total weight & price</p>
          </div>
          <span class="material-symbols-outlined ml-auto relative">chevron_right</span>
        </button>

        <!-- Category pills -->
        <section class="mt-md -mx-md px-md">
          <div class="flex gap-sm overflow-x-auto no-scrollbar py-1">${pills}</div>
        </section>

        <!-- Feed -->
        <section class="mt-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          ${feed.map((g, i) => gearCard(g, i)).join("")}
        </section>
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
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(year, month, d);
      const iso = fmt.iso(date);
      const past = date < today;
      let cls = "text-on-surface hover:bg-surface-container";
      let style = "";
      if (start && iso === start) { cls = "cal-end"; style = "border-radius:9999px 0 0 9999px"; }
      if (end && iso === end) { cls = "cal-end"; style = "border-radius:0 9999px 9999px 0"; }
      if (start && end && iso > start && iso < end) cls = "cal-mid";
      if (start && !end && iso === start) { cls = "cal-end"; style = "border-radius:9999px"; }
      if (past) cls = "text-surface-dim pointer-events-none";
      cells += `<button ${past ? "disabled" : ""} data-action="cal-day" data-date="${iso}"
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
    const days = fmt.days(window.STATE.dates);
    const total = days ? days * item.perDay : 0;
    const ready = days > 0;

    const includes = (item.includes || []).map(x =>
      `<li class="flex items-center gap-2 text-body-md text-on-surface-variant"><span class="material-symbols-outlined text-[18px] text-primary">check_circle</span>${x}</li>`).join("");

    const inner = `
      ${topBar({ title: "Select Dates", back: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[120px]">
        <!-- item summary -->
        <section class="mt-md bg-surface-container-lowest rounded-xl shadow-card p-md flex gap-md items-center">
          <div class="w-24 h-24 shrink-0">${gearTile(item, { h: "h-24" })}</div>
          <div class="min-w-0">
            <h2 class="font-heading text-headline-sm text-on-surface">${item.name}</h2>
            <p class="text-body-md text-on-surface-variant line-clamp-2">${item.tagline || item.desc}</p>
            <p class="mt-1 text-label-md text-secondary">${fmt.money(item.perDay)} / day</p>
          </div>
        </section>

        ${includes ? `<section class="mt-md"><p class="text-label-md text-outline uppercase tracking-wider mb-sm">What's included</p><ul class="grid gap-2">${includes}</ul></section>` : ""}

        <section class="mt-md">${calendar()}</section>

        <p class="text-center text-label-sm text-outline mt-sm flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-[16px]">touch_app</span>
          Tap a start day, then an end day
        </p>
      </main>

      <!-- sticky footer total -->
      <div class="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest shadow-float rounded-t-xl safe-bottom">
        <div class="max-w-container-max mx-auto px-md pt-md">
          <div class="flex items-center justify-between mb-sm">
            <div class="text-on-surface-variant text-body-md">
              ${ready ? `Total for ${days} day${days > 1 ? "s" : ""}` : "Select your dates"}
              ${ready ? `<div class="text-label-sm text-outline">${fmt.range(window.STATE.dates)}</div>` : ""}
            </div>
            <div class="font-heading text-headline-md text-primary">${fmt.money(total)}</div>
          </div>
          ${item.deposit ? `<p class="text-label-sm text-outline -mt-1 mb-sm flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[15px] text-on-surface-variant">lock</span>
            + ${fmt.money(item.deposit)} refundable deposit, collected at pickup</p>` : ""}
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
    const dep = window.STATE.draft && window.STATE.draft.deposit;
    const depositNote = dep ? `
      <div class="mt-md rounded-md bg-surface-container p-sm flex gap-2 items-start">
        <span class="material-symbols-outlined text-[18px] text-primary mt-0.5">lock</span>
        <p class="text-label-sm text-on-surface-variant">A <strong>refundable ${fmt.money(dep)} security deposit</strong> is collected in person at pickup and returned when you bring the gear back in good condition. Today you only pay the rental fee online.</p>
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
    const lib = cat === "All Items" ? D.packLibrary : D.packLibrary.filter(x => x.cat === cat);
    const chosen = window.STATE.pack;        // Map id->count
    const totalWeight = D.packLibrary.reduce((s, x) => s + (chosen.get(x.id) || 0) * x.weight, 0)
      + [...window.STATE.packAddons].reduce((s) => s, 0);
    const basePrice = D.packLibrary.reduce((s, x) => s + (chosen.get(x.id) || 0) * x.perDay, 0)
      + [...window.STATE.packAddons].reduce((s, id) => s + (D.addons.find(a => a.id === id)?.price || 0), 0);

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
          <span class="text-secondary font-bold">${fmt.money(x.perDay)}/day</span>
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

    const totalItems = [...chosen.values()].reduce((s, n) => s + n, 0) + window.STATE.packAddons.size;

    const inner = `
      ${topBar({ title: "Build Your Pack", back: true, trailing: `<button data-action="pack-reset" class="text-label-md text-on-surface-variant press px-2">Reset</button>` })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[180px]">
        <!-- pack silhouette -->
        <section class="mt-md flex flex-col items-center text-center">
          <div class="w-40 h-40 rounded-xl bg-surface-container-low flex items-center justify-center relative overflow-hidden">
            <span class="material-symbols-outlined text-[110px] text-outline-variant" style="font-variation-settings:'FILL' 1;">backpack</span>
            ${totalItems ? `<span class="absolute bottom-2 bg-primary text-on-primary text-label-sm px-3 py-1 rounded-full">${totalItems} item${totalItems > 1 ? "s" : ""} packed</span>` : ""}
          </div>
          <p class="font-heading text-headline-sm mt-sm">Osprey Rook 65</p>
          <p class="text-label-sm text-outline">Recommended for 3–5 day treks</p>
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
              <p class="text-label-sm text-outline uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-[16px] text-secondary">scale</span>Total weight</p>
              <p class="font-heading text-headline-sm">${totalWeight.toFixed(1)} lbs</p>
            </div>
            <div class="text-right">
              <p class="text-label-sm text-outline uppercase tracking-wider">Base price</p>
              <p class="font-heading text-headline-sm text-secondary">${fmt.money(basePrice)}<span class="text-outline text-sm font-normal">/day</span></p>
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
          ${b.deposit ? `<div class="flex justify-between py-2.5"><span class="text-on-surface-variant">Refundable deposit</span><span class="font-semibold">${fmt.money(b.deposit)} <span class="text-outline font-normal text-sm">· at pickup</span></span></div>` : ""}
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
        class="flex-1 py-2 rounded-full text-label-md press transition-colors ${on ? "bg-surface-container-lowest shadow-sm text-on-surface" : "text-on-surface-variant"}">${name}${n ? ` (${n})` : ""}</button>`;
    };

    const empty = `
      <div class="mt-lg text-center text-on-surface-variant flex flex-col items-center">
        <div class="w-40 opacity-70">${ART.trailLine()}</div>
        <p class="font-heading text-headline-sm text-on-surface mt-sm">No ${tab.toLowerCase()} rentals yet</p>
        <p class="text-body-md mt-1">Your next adventure is one tap away.</p>
        <button data-action="nav" data-route="#/" class="mt-md bg-secondary text-on-secondary px-md py-2.5 rounded-full text-label-md press">Browse Gear</button>
      </div>`;

    const cards = list.map(b => {
      if (b.past) {
        return `
        <article class="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
          <div class="h-28 gear-tile flex items-center justify-center"><span class="material-symbols-outlined text-[56px]" style="color:${b.tint};font-variation-settings:'FILL' 1,'wght' 300;">${b.icon}</span></div>
          <div class="p-md">
            <p class="text-label-sm text-outline uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">check_circle</span>Completed</p>
            <h3 class="font-heading text-headline-sm mt-1">${b.name}</h3>
            <p class="text-body-md text-on-surface-variant">${b.rangeLabel}</p>
            <button data-action="rent-again" data-id="${b.itemId}" class="mt-sm inline-flex items-center gap-1 border border-outline-variant rounded-full px-md py-2 text-label-md press"><span class="material-symbols-outlined text-[18px]">restart_alt</span>Rent Again</button>
          </div>
        </article>`;
      }
      return `
      <article class="bg-surface-container-lowest rounded-xl shadow-card overflow-hidden">
        <div class="h-32 gear-tile flex items-center justify-center relative">
          <span class="material-symbols-outlined text-[64px]" style="color:${b.tint};font-variation-settings:'FILL' 1,'wght' 300;">${b.icon}</span>
          <span class="absolute top-2 left-2 bg-primary-fixed text-on-primary-fixed text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">verified</span>Confirmed</span>
        </div>
        <div class="p-md">
          <h3 class="font-heading text-headline-sm">${b.name}</h3>
          <div class="mt-2 space-y-1.5 text-body-md text-on-surface-variant">
            <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">calendar_month</span>${b.rangeLabel}</p>
            <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">location_on</span>${D.depot} Depot</p>
          </div>
          <div class="mt-md flex flex-col gap-2">
            <button data-action="nav" data-route="#/confirmation/${b.orderId}" class="w-full rounded-full py-3 bg-secondary text-on-secondary text-label-md press hover:bg-secondary-container">View Details</button>
            <button data-action="directions" class="w-full rounded-full py-3 border-2 border-primary text-primary text-label-md press">Get Directions</button>
          </div>
        </div>
      </article>`;
    }).join("");

    const inner = `
      ${topBar({ title: "Utah Backcountry Rentals", location: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full">
        <div class="mt-md">
          <h2 class="font-heading text-headline-lg text-on-surface">My Bookings</h2>
          <p class="text-body-md text-on-surface-variant mt-1">Manage your upcoming adventures and review past gear rentals.</p>
        </div>
        <div class="mt-md bg-surface-container rounded-full p-1 flex gap-1">${tabBtn("Upcoming", upcoming.length)}${tabBtn("Past", past.length)}</div>
        <section class="mt-md grid grid-cols-1 sm:grid-cols-2 gap-md">
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
    const row = (icon, label, sub = "") => `
      <button class="w-full flex items-center gap-md p-md bg-surface-container-lowest press text-left">
        <span class="material-symbols-outlined text-primary">${icon}</span>
        <span class="flex-1"><span class="block text-label-md">${label}</span>${sub ? `<span class="block text-label-sm text-outline">${sub}</span>` : ""}</span>
        <span class="material-symbols-outlined text-outline">chevron_right</span>
      </button>`;
    const inner = `
      ${topBar({ title: "Profile", location: true })}
      <main class="flex-grow px-md max-w-container-max mx-auto w-full">
        <section class="mt-md flex items-center gap-md">
          <div class="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-heading text-headline-md">BM</div>
          <div>
            <h2 class="font-heading text-headline-sm">Brian M.</h2>
            <p class="text-body-md text-on-surface-variant">${D.depot} explorer</p>
          </div>
        </section>
        <section class="mt-md grid grid-cols-3 gap-sm text-center">
          ${[["Trips", trips], ["Saved", favCount], ["Rank", "Trailblazer"]].map(([k, v]) =>
            `<div class="bg-surface-container rounded-xl py-md"><p class="font-heading text-headline-sm text-primary">${v}</p><p class="text-label-sm text-outline uppercase tracking-wider">${k}</p></div>`).join("")}
        </section>
        <section class="mt-md rounded-xl overflow-hidden divide-y divide-surface-container shadow-card">
          ${row("favorite", "Saved Gear", `${favCount} item${favCount === 1 ? "" : "s"}`)}
          ${row("receipt_long", "Rental History", `${trips} booking${trips === 1 ? "" : "s"}`)}
          ${row("local_shipping", "Pick-up & Returns", D.depot + " Depot")}
          ${row("verified_user", "Safety & Waivers")}
          ${row("help", "Help & Support")}
        </section>
        <button data-action="nav" data-route="#/admin" class="w-full mt-md flex items-center gap-md p-md bg-primary text-on-primary rounded-xl press text-left">
          <span class="material-symbols-outlined">inventory_2</span>
          <span class="flex-1"><span class="block text-label-md">Manage Gear</span><span class="block text-label-sm text-primary-fixed-dim">Owner: add, edit & reorder products</span></span>
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
        <div class="mt-md text-center text-label-sm text-outline">Utah Backcountry Rentals · v1.0</div>
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
        <p class="text-label-sm text-outline truncate">${item.category} · ${fmt.money(item.perDay)}/day · ${item.deposit ? fmt.money(item.deposit) + " hold" : "no hold"}</p>
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
            <label class="block"><span class="text-label-md text-on-surface-variant">Price / day ($)</span>
              <input id="admin-perday" type="number" min="0" value="${item.perDay != null ? item.perDay : ""}" placeholder="12"
                class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" /></label>
            <label class="block"><span class="text-label-md text-on-surface-variant">Deposit hold ($)</span>
              <input id="admin-deposit" type="number" min="0" value="${item.deposit != null ? item.deposit : ""}" placeholder="400"
                class="mt-1 w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2.5" /></label>
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
    const inner = `
      <header class="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-surface-container">
        <div class="flex items-center gap-2 px-md py-sm max-w-container-max mx-auto">
          <button data-action="nav" data-route="#/" class="p-2 -ml-2 rounded-full hover:bg-surface-container press text-on-surface"><span class="material-symbols-outlined">arrow_back</span></button>
          <h1 class="flex-1 font-heading text-headline-md text-primary text-center">Manage Gear</h1>
          <button data-action="admin-logout" class="p-2 -mr-2 rounded-full hover:bg-surface-container press text-on-surface-variant" title="Lock"><span class="material-symbols-outlined">lock</span></button>
        </div>
      </header>
      <main class="flex-grow px-md max-w-container-max mx-auto w-full pb-[100px]">
        <div class="mt-md flex flex-wrap gap-2">
          <button data-action="admin-new" class="bg-secondary text-on-secondary rounded-full px-md py-2.5 text-label-md press flex items-center gap-1 hover:bg-secondary-container"><span class="material-symbols-outlined text-[18px]">add</span>Add product</button>
          <button data-action="admin-export" class="bg-surface-container text-on-surface rounded-full px-md py-2.5 text-label-md press flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">download</span>Export</button>
          <label class="bg-surface-container text-on-surface rounded-full px-md py-2.5 text-label-md press flex items-center gap-1 cursor-pointer"><span class="material-symbols-outlined text-[18px]">upload</span>Import
            <input type="file" accept="application/json" data-action="admin-import" class="hidden" /></label>
          ${customized ? `<button data-action="admin-reset" class="text-on-surface-variant rounded-full px-md py-2.5 text-label-md press flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">restart_alt</span>Reset</button>` : ""}
        </div>

        <p class="text-label-sm text-outline mt-sm flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">drag_indicator</span>
          Drag a product to reorder it. Changes save automatically to this browser.
        </p>

        <div id="admin-list" class="mt-sm space-y-2">
          ${items.length ? items.map(adminProductRow).join("") : `<p class="text-center text-on-surface-variant py-lg">No products yet — tap “Add product”.</p>`}
        </div>

        <div class="mt-md rounded-xl bg-surface-container p-md text-label-sm text-on-surface-variant flex gap-2">
          <span class="material-symbols-outlined text-[18px] text-primary">info</span>
          <p>You're in <strong>demo mode</strong>: edits are saved in this browser so you can design your catalog. Once your database is connected, this same screen will publish to all customers. Use <strong>Export</strong> to back up your catalog.</p>
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
