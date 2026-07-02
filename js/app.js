/* App controller: state, formatters, router, event handling, persistence. */
(function () {
  const D = window.DATA;
  const CATALOG = window.CATALOG;

  /* ---------------- formatters ---------------- */
  window.fmt = {
    money: (n) => "$" + Math.round(n).toLocaleString("en-US"),
    midnight: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    iso: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    parse: (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); },
    label: (iso) => fmt.parse(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    days: ({ start, end }) => {
      if (!start) return 0;
      if (!end) return 1;
      return Math.round((fmt.parse(end) - fmt.parse(start)) / 86400000) + 1;
    },
    range: ({ start, end }) => {
      if (!start) return "";
      return end ? `${fmt.label(start)} – ${fmt.label(end)}` : fmt.label(start);
    }
  };

  /* ---------------- state ---------------- */
  const store = {
    load(key, fallback) {
      try { const v = JSON.parse(localStorage.getItem("ubr:" + key)); return v ?? fallback; }
      catch { return fallback; }
    },
    save(key, val) { localStorage.setItem("ubr:" + key, JSON.stringify(val)); }
  };

  const now = fmt.midnight(new Date());
  // Strip any seeded/fake bookings left over from demo mode (real PayPal IDs are long)
  const storedBookings = (store.load("bookings", null) || []).filter(b => !/^UBR-\d{4}$/.test(b.orderId));
  window.STATE = {
    category: "All",
    search: "",
    calMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    dates: { start: null, end: null },
    draft: null,
    qty: 1,
    customPack: null,
    favs: new Set(store.load("favs", [])),
    pack: new Map(),
    packAddons: new Set(),
    packBase: null,
    packSize: null,        // chosen litre size (18/22/28/35/45/55/65/75)
    packCat: "All",
    bookingTab: "Upcoming",
    safetyAccepted: false,
    renterName: "",
    phone: "",
    pickupTime: null,
    orders: [],
    ordersFilter: "upcoming",
    ordersLoading: false,
    adminAuthed: sessionStorage.getItem("ubr:admin") === "1",
    blockedDates: [],   // ISO dates the owner has blocked
    businessInfo: {},   // phone, email, hours, address
    adminEdit: null,
    bookings: storedBookings,
    unavailable: new Set(),   // ISO dates fully booked for the current item
    itemQty: 1,               // units in stock for the current item
    availItem: null,          // which itemId STATE.unavailable was loaded for
    // Cart
    cart: store.load("cart", []),  // [{item, qty}]
    cartDates: { start: null, end: null },
    cartPickupTime: null,
    cartMode: false           // true when safety modal was opened from cart
  };

  const persist = () => {
    store.save("bookings", window.STATE.bookings);
    store.save("favs", [...window.STATE.favs]);
    store.save("cart", window.STATE.cart);
  };

  /* ---------------- image fallback ---------------- */
  // Tries the next candidate extension (png → webp → jpeg); if none load, the
  // icon underneath shows through. Lets the owner drop in any common image type.
  // Photo failed to load → hide it and reveal the icon tile sitting underneath.
  window.imgFallback = function (el) {
    el.style.display = "none";
    const icon = el.parentElement && el.parentElement.querySelector(".gear-fallback-icon");
    if (icon) icon.style.opacity = "1";
  };

  window.tryImg = function (el) {
    const exts = (el.dataset.exts || "").split(",").filter(Boolean);
    if (exts.length) {
      const next = exts.shift();
      el.dataset.exts = exts.join(",");
      el.src = el.dataset.base + "." + next;
    } else {
      el.remove();
    }
  };

  /* ---------------- toast ---------------- */
  function toast(msg, icon = "check_circle") {
    const root = document.getElementById("toast-root");
    const el = document.createElement("div");
    el.className = "toast pointer-events-auto bg-primary text-on-primary px-md py-2.5 rounded-full shadow-lift flex items-center gap-2 text-label-md";
    el.innerHTML = `<span class="material-symbols-outlined text-[18px] text-inverse-primary">${icon}</span>${msg}`;
    root.appendChild(el);
    setTimeout(() => { el.style.transition = "opacity .3s"; el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 2200);
  }

  /* ---------------- live order (PayPal) ---------------- */
  // Turn a server order record into a local booking and remember it.
  function storeServerBooking(d) {
    const ref = window.CATALOG.get(d.itemId) || {};
    const start = d.startDate || null, end = d.endDate || null;
    const booking = {
      orderId: d.orderId,
      ref: "UBR-" + String(d.orderId).slice(-6).toUpperCase(),
      itemId: d.itemId, name: d.name || "Gear rental",
      icon: ref.icon || "backpack", tint: ref.tint || "#1b3022",
      total: Math.round((d.amount || 0) / 100),
      hold: Math.round((d.hold || 0) / 100),
      deposit: Math.round((d.deposit || 0) / 100), past: false,
      renterName: d.renterName || null,
      status: d.status || "confirmed",
      rangeLabel: start ? fmt.range({ start, end }) : "Flexible"
    };
    const existing = STATE.bookings.find(b => b.orderId === d.orderId);
    if (existing) Object.assign(existing, booking);   // refresh authoritative fields
    else STATE.bookings.unshift(booking);
    persist();
    return booking;
  }

  // Refresh this device's bookings from Supabase (source of truth) so they
  // survive returns to the site and stay accurate. Runs once on load.
  async function hydrateBookings() {
    const cfg = window.UBR_CONFIG || {};
    if (!cfg.BACKEND_ENABLED) return;
    const ids = STATE.bookings.map(b => b.orderId).filter(id => id && !String(id).startsWith("UBR-"));
    let changed = false;
    for (const id of ids) {
      try {
        const r = await fetch(cfg.FUNCTIONS_BASE + "/get-booking?order=" + encodeURIComponent(id));
        if (!r.ok) continue;
        const d = await r.json();
        const before = JSON.stringify(STATE.bookings.find(b => b.orderId === id));
        storeServerBooking(d);
        if (JSON.stringify(STATE.bookings.find(b => b.orderId === id)) !== before) changed = true;
      } catch (_) { /* offline → keep cached copy */ }
    }
    if (changed) render();
  }

  // Customer returns from PayPal approval → capture the payment, then confirm.
  async function capturePayPalOrder(orderId) {
    try {
      const cfg = window.UBR_CONFIG || {};
      const res = await fetch(cfg.FUNCTIONS_BASE + "/capture-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const d = await res.json();
      if (!res.ok) { toast(d.error || "Payment could not be completed", "error"); go("#/"); return; }
      storeServerBooking(d);
      STATE.bookingTab = "Upcoming";
      go("#/confirmation/" + d.orderId);
      toast("Reservation confirmed!");
    } catch (e) {
      toast("Network error finishing checkout", "error"); go("#/");
    }
  }

  // Re-load a booking by order id (e.g. confirmation page refresh).
  async function fetchOrder(orderId) {
    try {
      const cfg = window.UBR_CONFIG || {};
      const res = await fetch(cfg.FUNCTIONS_BASE + "/get-booking?order=" + encodeURIComponent(orderId));
      const d = await res.json();
      if (!res.ok) { toast("Order not found", "error"); go("#/bookings"); return; }
      storeServerBooking(d);
      render();
    } catch (e) {
      toast("Couldn't load your order — check My Bookings", "error"); go("#/bookings");
    }
  }

  /* ---------------- availability ---------------- */
  // Inclusive list of ISO days between two ISO dates.
  window.daysBetween = function (startIso, endIso) {
    const out = [];
    if (!startIso) return out;
    let d = fmt.parse(startIso);
    const last = fmt.parse(endIso || startIso);
    let guard = 0;
    while (d <= last && guard++ < 400) { out.push(fmt.iso(d)); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); }
    return out;
  };

  // Pull the fully-booked days for an item so the calendar can grey them out.
  async function loadAvailability(itemId) {
    const cfg = window.UBR_CONFIG || {};
    STATE.availItem = itemId;
    STATE.unavailable = new Set();
    STATE.itemQty = 1;
    if (!cfg.BACKEND_ENABLED || !itemId || itemId === "custom") return;
    try {
      const r = await fetch(cfg.FUNCTIONS_BASE + "/availability?itemId=" + encodeURIComponent(itemId));
      const d = await r.json();
      STATE.unavailable = new Set(d.fullDays || []);
      STATE.itemQty = d.quantity || 1;
      // Re-render only if we're still looking at this item's calendar.
      if (STATE.draft && STATE.draft.id === itemId) render();
    } catch (_) { /* offline → no greying, checkout still re-checks server-side */ }
  }

  /* ---------------- modal ---------------- */
  function openModal(html) { document.getElementById("modal-root").innerHTML = html; }
  function closeModal() { document.getElementById("modal-root").innerHTML = ""; }

  /* ---------------- router ---------------- */
  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, queryStr] = raw.split("?");        // PayPal appends ?token=...&PayerID=...
    const parts = path.split("/").filter(Boolean);  // e.g. ["gear","master-safety-kit"]
    const query = new URLSearchParams(queryStr || "");
    return { parts, query };
  }

  function render() {
    closeModal();
    const { parts, query } = parseHash();
    const root = document.getElementById("app");
    let html;

    if (parts.length === 0) {
      html = window.VIEWS.home();
    } else if (parts[0] === "gear") {
      const id = parts[1];
      if (id !== "custom") {
        const item = window.CATALOG.get(id);
        if (item && (!STATE.draft || STATE.draft.id !== id)) {
          STATE.draft = item; STATE.dates = { start: null, end: null };
        }
        if (!item) { html = window.VIEWS.notFound(); }
        // Load availability if we haven't for this item yet (e.g. page refresh).
        else if (STATE.availItem !== id) loadAvailability(id);
      }
      html = html || window.VIEWS.gear();
    } else if (parts[0] === "product") {
      const item = window.CATALOG.get(parts[1]);
      html = item ? window.VIEWS.productDetail(parts[1]) : window.VIEWS.notFound();
    } else if (parts[0] === "builder") {
      html = window.VIEWS.builder();
    } else if (parts[0] === "bookings") {
      html = window.VIEWS.bookings();
    } else if (parts[0] === "paypal-return") {
      // PayPal sends the customer back here with ?token=<orderId> after approval.
      const orderId = query.get("token");
      if (orderId) { capturePayPalOrder(orderId); html = window.VIEWS.confirmationLoading(); }
      else html = window.VIEWS.notFound();
    } else if (parts[0] === "confirmation") {
      const id = parts[1];
      const cfg = window.UBR_CONFIG || {};
      // A PayPal order id we don't have cached yet → fetch it. (Demo ids start "UBR-".)
      if (id && cfg.BACKEND_ENABLED && !String(id).startsWith("UBR-") && !STATE.bookings.find(b => b.orderId === id)) {
        fetchOrder(id);
        html = window.VIEWS.confirmationLoading();
      } else {
        html = window.VIEWS.confirmation(id);
      }
    } else if (parts[0] === "how") {
      html = window.VIEWS.howItWorks();
    } else if (parts[0] === "pickup") {
      html = window.VIEWS.pickupInfo();
    } else if (parts[0] === "safety") {
      html = window.VIEWS.safetyWaivers();
    } else if (parts[0] === "help") {
      html = window.VIEWS.helpSupport();
    } else if (parts[0] === "profile") {
      // Profile removed — bookings + confirmation email are the customer's record.
      go("#/"); return;
    } else if (parts[0] === "admin") {
      html = STATE.adminAuthed ? window.VIEWS.admin() : window.VIEWS.adminGate();
    } else if (parts[0] === "orders") {
      if (!STATE.adminAuthed) { html = window.VIEWS.adminGate(); }
      else {
        html = window.VIEWS.adminOrders();
        if (!STATE.orders.length && !STATE.ordersLoading) loadOrders();
      }
    } else if (parts[0] === "work-order") {
      html = STATE.adminAuthed ? window.VIEWS.workOrder(parts[1]) : window.VIEWS.adminGate();
    } else if (parts[0] === "cart") {
      html = window.VIEWS.cart();
    } else {
      html = window.VIEWS.notFound();
    }

    root.innerHTML = html;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    setupPackDragDrop();
  }

  function setupPackDragDrop() {
    const zone = document.getElementById("pack-zone");
    if (!zone) return;
    let dragId = null;

    document.querySelectorAll("[data-pack-drag]").forEach(el => {
      el.addEventListener("dragstart", e => {
        dragId = el.dataset.packDrag;
        el.classList.add("pack-dragging");
        e.dataTransfer.effectAllowed = "copy";
      });
      el.addEventListener("dragend", () => { dragId = null; el.classList.remove("pack-dragging"); });
    });

    zone.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; zone.classList.add("pack-drop-active"); });
    zone.addEventListener("dragleave", e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove("pack-drop-active"); });
    zone.addEventListener("drop", e => {
      e.preventDefault();
      zone.classList.remove("pack-drop-active");
      if (!dragId) return;
      const id = dragId; dragId = null;
      STATE.pack.set(id, (STATE.pack.get(id) || 0) + 1);
      zone.classList.add("pack-bounce");
      setTimeout(() => zone.classList.remove("pack-bounce"), 460);
      render();
      const g = window.CATALOG.get(id);
      if (g) toast(g.name + " packed!", "backpack");
    });

    // Touch drag-and-drop
    let ghost = null, touchId = null;
    document.querySelectorAll("[data-pack-drag]").forEach(el => {
      el.addEventListener("touchstart", e => {
        touchId = el.dataset.packDrag;
        const r = el.getBoundingClientRect();
        ghost = el.cloneNode(true);
        Object.assign(ghost.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", opacity: "0.85", pointerEvents: "none", zIndex: "9999", borderRadius: "12px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.25)", transition: "none" });
        document.body.appendChild(ghost);
      }, { passive: true });
      el.addEventListener("touchmove", e => {
        if (!ghost) return;
        const t = e.touches[0], w = parseFloat(ghost.style.width), h = parseFloat(ghost.style.height);
        ghost.style.left = (t.clientX - w / 2) + "px";
        ghost.style.top = (t.clientY - h / 2) + "px";
        const zr = zone.getBoundingClientRect();
        zone.classList.toggle("pack-drop-active", t.clientX >= zr.left && t.clientX <= zr.right && t.clientY >= zr.top && t.clientY <= zr.bottom);
      }, { passive: true });
      el.addEventListener("touchend", e => {
        if (!ghost) return;
        const t = e.changedTouches[0];
        ghost.remove(); ghost = null;
        zone.classList.remove("pack-drop-active");
        const zr = zone.getBoundingClientRect();
        if (touchId && t.clientX >= zr.left && t.clientX <= zr.right && t.clientY >= zr.top && t.clientY <= zr.bottom) {
          const id = touchId;
          STATE.pack.set(id, (STATE.pack.get(id) || 0) + 1);
          zone.classList.add("pack-bounce");
          setTimeout(() => zone.classList.remove("pack-bounce"), 460);
          render();
          const g = window.CATALOG.get(id);
          if (g) toast(g.name + " packed!", "backpack");
        }
        touchId = null;
      }, { passive: true });
    });
  }

  const go = (route) => { if (location.hash === route) render(); else location.hash = route; };

  /* ---------------- actions ---------------- */
  const handlers = {
    nav: (el) => go(el.dataset.route),
    back: () => history.length > 1 ? history.back() : go("#/"),

    category: (el) => { STATE.category = el.dataset.cat; STATE.search = ""; render(); },
    "search-input": (el) => { STATE.search = el.value; render(); document.getElementById("gear-search") && (document.getElementById("gear-search").focus()); },
    "search-clear": () => { STATE.search = ""; render(); },

    "browse-gear": () => {
      STATE.category = "All";
      STATE.search = "";
      render();
      requestAnimationFrame(() => { const el = document.getElementById("gear-feed"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
    },

    view: (el) => go("#/product/" + el.dataset.id),

    fav: (el) => {
      const id = el.dataset.id;
      STATE.favs.has(id) ? STATE.favs.delete(id) : STATE.favs.add(id);
      persist(); render();
      toast(STATE.favs.has(id) ? "Saved to your gear" : "Removed", STATE.favs.has(id) ? "favorite" : "heart_broken");
    },

    book: (el) => {
      const item = window.CATALOG.get(el.dataset.id);
      STATE.draft = item;
      STATE.qty = 1;
      STATE.dates = { start: null, end: null };
      STATE.pickupTime = null;
      STATE.calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      loadAvailability(item.id);
      go("#/gear/" + item.id);
    },

    "pickup-time": (el) => { STATE.pickupTime = el.dataset.time; render(); },

    "rent-again": (el) => handlers.book(el),

    "qty-inc": () => { STATE.qty = (STATE.qty || 1) + 1; render(); },
    "qty-dec": () => { STATE.qty = Math.max(1, (STATE.qty || 1) - 1); render(); },

    /* calendar */
    "cal-prev": () => { const m = STATE.calMonth; STATE.calMonth = new Date(m.getFullYear(), m.getMonth() - 1, 1); render(); },
    "cal-next": () => { const m = STATE.calMonth; STATE.calMonth = new Date(m.getFullYear(), m.getMonth() + 1, 1); render(); },
    "cal-day": (el) => {
      const iso = el.dataset.date;
      const inCart = !!el.closest("[data-cart-cal]");
      if (!inCart && STATE.unavailable.has(iso)) { toast("That day is fully booked", "event_busy"); return; }
      const current = inCart ? STATE.cartDates : STATE.dates;
      const { start, end } = current;
      let next;
      if (!start || (start && end)) next = { start: iso, end: null };
      else if (iso < start) next = { start: iso, end: null };
      else {
        if (!inCart) {
          const blocked = window.daysBetween(start, iso).some(d => STATE.unavailable.has(d));
          if (blocked) { toast("Some days in that range are booked", "event_busy"); return; }
        }
        next = { start, end: iso };
      }
      if (inCart) STATE.cartDates = next; else STATE.dates = next;
      render();
    },

    "confirm-dates": () => { STATE.safetyAccepted = false; openModal(window.VIEWS.safetyModal()); },
    "cancel-modal": () => closeModal(),
    // Toggle the agreement without re-rendering (so the typed name field persists).
    "accept-safety": (el) => {
      STATE.safetyAccepted = el.checked;
      const nameEl = document.getElementById("renter-name");
      if (nameEl) STATE.renterName = nameEl.value;
      const btn = document.getElementById("proceed-btn");
      if (btn) {
        btn.disabled = !el.checked;
        btn.classList.toggle("bg-secondary", el.checked);
        btn.classList.toggle("hover:bg-secondary-container", el.checked);
        btn.classList.toggle("bg-secondary/40", !el.checked);
        btn.classList.toggle("cursor-not-allowed", !el.checked);
      }
    },

    "proceed-checkout": async () => {
      if (!STATE.safetyAccepted) return;
      const nameEl = document.getElementById("renter-name");
      const renterName = ((nameEl && nameEl.value) || STATE.renterName || "").trim();
      if (!renterName) {
        toast("Enter the name on your ID & payment card", "error");
        if (nameEl) nameEl.focus();
        return;
      }
      STATE.renterName = renterName;
      const phoneEl = document.getElementById("renter-phone");
      const phone = ((phoneEl && phoneEl.value) || STATE.phone || "").trim();
      STATE.phone = phone;
      const cfg = window.UBR_CONFIG || {};

      // --- LIVE: hand off to PayPal via our serverless function ---
      if (cfg.BACKEND_ENABLED) {
        closeModal();
        toast("Opening secure checkout…", "lock");
        try {
          let payload;
          if (STATE.cartMode && STATE.cart.length) {
            // Cart checkout — send all items in one order
            payload = {
              items: STATE.cart.map(e => ({ itemId: e.item.id, name: e.item.name, qty: e.qty })),
              startDate: STATE.cartDates.start, endDate: STATE.cartDates.end,
              renterName, agreedTerms: true,
              phone, pickupTime: STATE.cartPickupTime || null
            };
          } else {
            // Single-item checkout (existing flow)
            const item = STATE.draft;
            const qty = STATE.qty || 1;
            payload = {
              itemId: item.id, name: item.name, qty,
              startDate: STATE.dates.start, endDate: STATE.dates.end,
              components: item.components, addons: item.addons,
              renterName, agreedTerms: true,
              phone, pickupTime: STATE.pickupTime || null
            };
          }
          const res = await fetch(cfg.FUNCTIONS_BASE + "/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.url) {
            if (STATE.cartMode) { STATE.cart = []; STATE.cartDates = { start: null, end: null }; STATE.cartPickupTime = null; persist(); }
            STATE.cartMode = false;
            window.location.href = data.url; return;
          }
          toast(data.error || "Checkout couldn't start — try again", "error");
        } catch (e) {
          toast("Network error — please try again", "error");
        }
        STATE.cartMode = false;
        return;
      }

      closeModal();
      toast("Checkout requires backend — set BACKEND_ENABLED: true", "error");
    },

    directions: () => toast("Opening directions to " + D.depot, "near_me"),

    /* bookings tabs */
    "booking-tab": (el) => { STATE.bookingTab = el.dataset.tab; render(); },

    /* pack builder */
    "pack-size": (el) => { STATE.packSize = parseInt(el.dataset.size, 10); render(); },
    "pack-cat": (el) => { STATE.packCat = el.dataset.cat; render(); },
    "pack-base": (el) => { STATE.packBase = el.dataset.id; render(); },
    "pack-add": (el) => { const id = el.dataset.id; STATE.pack.set(id, (STATE.pack.get(id) || 0) + 1); render(); },
    "pack-remove": (el) => {
      const id = el.dataset.id; const n = (STATE.pack.get(id) || 0) - 1;
      if (n <= 0) STATE.pack.delete(id); else STATE.pack.set(id, n);
      render();
    },
    "pack-addon": (el) => {
      const id = el.dataset.id;
      el.checked ? STATE.packAddons.add(id) : STATE.packAddons.delete(id);
      render();
    },
    "pack-remove-all": (el) => { STATE.pack.delete(el.dataset.id); render(); },
    "pack-reset": () => { STATE.pack = new Map(); STATE.packAddons = new Set(); STATE.packSize = null; render(); toast("Pack cleared", "delete"); },

    "load-kit": (el) => {
      const kit = D.kits.find(k => k.id === el.dataset.kit);
      if (!kit) return;
      STATE.pack = new Map();
      kit.items.forEach(id => STATE.pack.set(id, (STATE.pack.get(id) || 0) + 1));
      STATE.pack.delete(window.BASE_PACK_ID); // base pack is implicit, not a selectable item
      STATE.packCat = "All Items";
      render();
      toast(kit.name + " loaded — customize away", "backpack");
    },

    "continue-pack": () => {
      // Build a custom bundle from the SAME catalog the storefront uses, so
      // every component matches its storefront price/image/description.
      const all = window.CATALOG.gear();
      const base = all.find(g => g.id === STATE.packBase && g.category === "Backpacks")
        || all.find(g => g.category === "Backpacks");
      if (!base) { toast("Add a backpack to the catalog first", "error"); return; }

      const items = [], components = [];   // components = flat id list for server-side pricing
      let price = 0, weight = 0, deposit = 0;
      const wt = (g) => Number(g && g.weight) || 0;

      // Base backpack is always included first.
      price += base.price || 0; weight += wt(base); deposit += base.deposit || 0;
      items.push(base.name); components.push(base.id);

      STATE.pack.forEach((count, id) => {
        if (id === base.id) return;        // base already counted
        const g = window.CATALOG.get(id);
        if (!g) return;
        price += (g.price || 0) * count; weight += wt(g) * count; deposit += (g.deposit || 0) * count;
        items.push(count > 1 ? `${g.name} ×${count}` : g.name);
        for (let i = 0; i < count; i++) components.push(id);
      });

      STATE.draft = {
        id: "custom", name: "Your Custom Bundle", icon: base.icon || "backpack", tint: base.tint || "#1b3022",
        price, unit: "rental", deposit,
        tagline: `${items.length} item${items.length !== 1 ? "s" : ""}${weight ? ` · ${weight.toFixed(1)} lbs` : ""}`,
        includes: items, components
      };
      STATE.qty = 1;
      STATE.dates = { start: null, end: null };
      STATE.calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      go("#/gear/custom");
    },

    /* ---- admin: Manage Gear ---- */
    "admin-login": async () => {
      const v = (document.getElementById("admin-pass") || {}).value || "";
      if (!v) return;
      const cfg = window.UBR_CONFIG || {};
      if (cfg.BACKEND_ENABLED) {
        try {
          const r = await fetch(cfg.FUNCTIONS_BASE + "/verify-admin", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ passcode: v })
          });
          if (r.ok) { sessionStorage.setItem("ubr:admin", "1"); sessionStorage.setItem("ubr:admin-pass", v); STATE.adminAuthed = true; render(); }
          else toast("Incorrect passcode", "error");
        } catch { toast("Network error — try again", "error"); }
      } else {
        // Demo mode: accept any non-empty passcode for local preview
        sessionStorage.setItem("ubr:admin", "1"); STATE.adminAuthed = true; render();
      }
    },
    "admin-logout": () => {
      sessionStorage.removeItem("ubr:admin");
      STATE.adminAuthed = false; STATE.adminEdit = null; render();
    },
    "admin-new": () => { STATE.adminEdit = { id: null, icon: "backpack" }; render(); },
    "admin-edit": (el) => { STATE.adminEdit = { id: el.dataset.id }; render(); },
    "admin-cancel": () => { STATE.adminEdit = null; render(); },
    "admin-icon": (el) => {
      if (!STATE.adminEdit) STATE.adminEdit = {};
      STATE.adminEdit.icon = el.dataset.icon;
      document.querySelectorAll(".admin-icon").forEach(b => {
        const on = b.dataset.icon === el.dataset.icon;
        b.classList.toggle("bg-primary", on);
        b.classList.toggle("text-on-primary", on);
        b.classList.toggle("bg-surface-container", !on);
        b.classList.toggle("text-on-surface-variant", !on);
      });
    },
    "admin-image": (el) => {
      const f = el.files && el.files[0];
      if (!f) return;
      toast("Uploading photo…", "cloud_upload");
      downscaleImage(f, 1200, async (dataUrl) => {
        const cfg = window.UBR_CONFIG || {};
        let finalUrl = dataUrl;
        if (cfg.BACKEND_ENABLED) {
          try {
            const r = await fetch(cfg.FUNCTIONS_BASE + "/upload-image", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-admin-passcode": adminPass() },
              body: JSON.stringify({ dataUrl, name: f.name })
            });
            const d = await r.json();
            if (r.ok && d.url) finalUrl = d.url;
          } catch (_) {}
        }
        if (!STATE.adminEdit) STATE.adminEdit = {};
        const e = STATE.adminEdit;
        const current = e.id ? (CATALOG.get(e.id) || {}) : {};
        // First photo becomes the cover; subsequent ones go into imgs[]
        const existingImgs = e.imgs !== undefined ? e.imgs : (current.imgs || []);
        const coverImg = e.img !== undefined ? e.img : (current.img || "");
        if (!coverImg) {
          e.img = finalUrl;
        } else {
          e.imgs = [...existingImgs, finalUrl];
        }
        // Re-render just the photo grid without closing the form
        const grid = document.getElementById("admin-photo-grid");
        if (grid) {
          const allImgs = [e.img !== undefined ? e.img : current.img, ...(e.imgs !== undefined ? e.imgs : (current.imgs || []))].filter(Boolean);
          grid.innerHTML = allImgs.map((src, idx) => `
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
        }
        toast("Photo added", "check_circle");
        // Reset the file input
        if (el.closest) { const lbl = el.closest("label"); if (lbl) { const inp = lbl.querySelector("input[type=file]"); if (inp) inp.value = ""; } }
      });
    },
    "admin-photo-remove": (el) => {
      const idx = parseInt(el.dataset.idx, 10);
      if (!STATE.adminEdit) STATE.adminEdit = {};
      const e = STATE.adminEdit;
      const current = e.id ? (CATALOG.get(e.id) || {}) : {};
      const allImgs = [e.img !== undefined ? e.img : current.img, ...(e.imgs !== undefined ? e.imgs : (current.imgs || []))].filter(Boolean);
      allImgs.splice(idx, 1);
      e.img = allImgs[0] || "";
      e.imgs = allImgs.slice(1);
      const grid = document.getElementById("admin-photo-grid");
      if (grid) {
        grid.innerHTML = allImgs.map((src, i) => `
          <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-outline-variant shrink-0">
            <img src="${src}" class="w-full h-full object-cover" />
            <button type="button" data-action="admin-photo-remove" data-idx="${i}"
              class="absolute top-0.5 right-0.5 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center press">
              <span class="material-symbols-outlined text-white text-[13px]">close</span>
            </button>
          </div>`).join("") +
          `<label class="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center cursor-pointer shrink-0 hover:border-primary press">
            <span class="material-symbols-outlined text-on-surface-variant text-[28px]">add_photo_alternate</span>
            <span class="text-[10px] text-on-surface-variant mt-0.5">Add photo</span>
            <input type="file" accept="image/*" data-action="admin-image" class="hidden" />
          </label>`;
      }
    },
    "admin-include-add": () => {
      const list = document.getElementById("admin-includes-list");
      if (!list) return;
      const idx = list.querySelectorAll(".admin-include-item").length;
      const row = document.createElement("div");
      row.className = "flex gap-1.5 items-center";
      row.innerHTML = `<input type="text" class="admin-include-item flex-1 rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-sm py-2" placeholder="e.g. Stuff sack" />
        <button type="button" data-action="admin-include-remove" data-idx="${idx}" class="p-1.5 rounded-full hover:bg-error-container press shrink-0"><span class="material-symbols-outlined text-[18px] text-error">close</span></button>`;
      list.appendChild(row);
      row.querySelector("input").focus();
    },
    "admin-include-remove": (el) => {
      const row = el.closest(".flex");
      if (row) row.remove();
    },
    "admin-save": () => {
      const val = (id) => (document.getElementById(id) || {}).value;
      const name = (val("admin-name") || "").trim();
      if (!name) { toast("Give the product a name", "error"); return; }
      const e = STATE.adminEdit || {};
      const current = e.id ? (CATALOG.get(e.id) || {}) : {};
      const qRaw = parseInt(val("admin-quantity"), 10);
      const wRaw = parseFloat(val("admin-weight"));
      const includeInputs = document.querySelectorAll(".admin-include-item");
      const includes = Array.from(includeInputs).map(i => i.value.trim()).filter(Boolean);
      const perDayEl = document.getElementById("admin-per-day");
      const descVal = ((document.getElementById("admin-desc") || {}).value || "").trim();
      // Parse bundleItems from textarea (one per line: "id × qty")
      const biRaw = ((document.getElementById("admin-bundle-items") || {}).value || "");
      const bundleItems = biRaw.split("\n").map(l => {
        const m = l.trim().match(/^([^\s×x]+)\s*[×x]\s*(\d+)/i);
        return m ? { id: m[1].trim(), qty: parseInt(m[2], 10) } : null;
      }).filter(Boolean);
      const patch = {
        name,
        category: val("admin-cat") || "Bundles",
        tagline: (val("admin-tagline") || "").trim(),
        desc: descVal || undefined,
        price: parseFloat(val("admin-price")) || 0,
        unit: "rental",
        deposit: parseFloat(val("admin-deposit")) || 0,
        quantity: Number.isFinite(qRaw) ? Math.max(0, qRaw) : 1,
        weight: Number.isFinite(wRaw) ? wRaw : null,
        includes: includes.length ? includes : null,
        bundleItems: bundleItems.length ? bundleItems : undefined,
        icon: e.icon || current.icon || "backpack",
        perDay: perDayEl ? perDayEl.checked : !!(current.perDay)
      };
      // Persist multi-photo array; first entry is also the cover img
      const allImgs = e.imgs !== undefined ? e.imgs : (current.imgs || []);
      if (e.img !== undefined || allImgs.length) {
        const cover = e.img !== undefined ? e.img : (current.img || "");
        const extras = allImgs.filter(s => s && s !== cover);
        patch.img = cover || (allImgs[0] || undefined);
        patch.imgs = extras.length ? extras : undefined;
      }
      if (e.id) { CATALOG.update(e.id, patch); toast("Saved"); }
      else { patch.tint = "#1b3022"; CATALOG.add(patch); toast("Product added"); }
      STATE.adminEdit = null; render();
    },
    "admin-delete": (el) => {
      const item = CATALOG.get(el.dataset.id);
      if (!window.confirm(`Remove “${item ? item.name : "this product"}”?`)) return;
      CATALOG.remove(el.dataset.id); render(); toast("Product removed", "delete");
    },
    "admin-reset": () => {
      if (!window.confirm("Reset to the original built-in products? Your changes will be lost.")) return;
      CATALOG.reset(); render(); toast("Catalog reset", "restart_alt");
    },
    "admin-export": () => {
      const blob = new Blob([CATALOG.exportJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "ubr-catalog.json"; a.click();
      URL.revokeObjectURL(url);
      toast("Catalog exported");
    },
    "admin-import": (el) => {
      const f = el.files && el.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try { CATALOG.importJSON(reader.result); STATE.adminEdit = null; render(); toast("Catalog imported"); }
        catch (err) { toast("Import failed: " + err.message, "error"); }
      };
      reader.readAsText(f);
    },

    "admin-block-date": () => {
      const input = document.getElementById("block-date-input");
      const date = input ? input.value : "";
      if (!date) { toast("Pick a date to block", "error"); return; }
      if (STATE.blockedDates.includes(date)) { toast("Already blocked", "error"); return; }
      STATE.blockedDates = [...STATE.blockedDates, date];
      if (input) input.value = "";
      render();
    },
    "admin-unblock-date": (el) => {
      STATE.blockedDates = STATE.blockedDates.filter(d => d !== el.dataset.date);
      render();
    },
    "admin-save-blocked": async () => {
      const cfg = window.UBR_CONFIG || {};
      const r = await fetch(cfg.FUNCTIONS_BASE + "/save-blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": adminPass() },
        body: JSON.stringify({ dates: STATE.blockedDates })
      });
      const d = await r.json();
      if (!r.ok) { toast(d.error || "Save failed", "error"); return; }
      toast(`${STATE.blockedDates.length} closed date(s) saved`, "cloud_done");
    },
    "admin-save-biz": async () => {
      const cfg = window.UBR_CONFIG || {};
      const info = {
        phone: (document.getElementById("biz-phone") || {}).value || "",
        email: (document.getElementById("biz-email") || {}).value || "",
        address: (document.getElementById("biz-address") || {}).value || "",
        hours: (document.getElementById("biz-hours") || {}).value || ""
      };
      STATE.businessInfo = info;
      localStorage.setItem("ubr:biz", JSON.stringify(info));
      if (cfg.BACKEND_ENABLED) {
        const r = await fetch(cfg.FUNCTIONS_BASE + "/save-catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-passcode": adminPass() },
          body: JSON.stringify({ products: CATALOG.gear(), categories: CATALOG.categories(), businessInfo: info })
        });
        const d = await r.json();
        if (!r.ok) { toast(d.error || "Save failed", "error"); return; }
      }
      toast("Business info saved", "check_circle");
    },

    "admin-cat-add": () => {
      const input = document.getElementById("new-cat-input");
      const name = (input ? input.value : "").trim();
      if (!name) { toast("Enter a category name", "error"); return; }
      if (!CATALOG.addCategory(name)) { toast("Category already exists", "error"); return; }
      if (input) input.value = "";
      render();
      toast(`Category "${name}" added`);
    },
    "admin-cat-delete": (el) => {
      const name = el.dataset.cat;
      if (!CATALOG.removeCategory(name)) {
        toast(`Can't remove "${name}" — products still use it`, "error"); return;
      }
      render();
      toast(`Category "${name}" removed`, "delete");
    },

    "admin-publish": async () => {
      const cfg = window.UBR_CONFIG || {};
      const passcode = sessionStorage.getItem("ubr:admin-pass") || cfg.ADMIN_PASSCODE || "";
      const btn = document.getElementById("publish-btn");
      if (btn) { btn.disabled = true; btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Publishing…`; }
      try {
        const result = await CATALOG.publish(cfg.FUNCTIONS_BASE, passcode);
        toast(`${result.count} products published — live now!`, "cloud_done");
      } catch (err) {
        toast("Publish failed: " + err.message, "error");
      }
      render();
    },

    "admin-load": async () => {
      const cfg = window.UBR_CONFIG || {};
      toast("Loading from database…", "cloud_download");
      const changed = await CATALOG.loadFromBackend(cfg.FUNCTIONS_BASE);
      render();
      toast(changed ? "Catalog refreshed from database" : "Already up to date", "check_circle");
    },

    /* ---- admin: Orders dashboard ---- */
    "orders-filter": (el) => { STATE.ordersFilter = el.dataset.filter; loadOrders(); },
    "orders-refresh": () => { loadOrders(); },

    "order-advance": async (el) => {
      const id = el.dataset.id, status = el.dataset.status;
      const o = STATE.orders.find(x => x.orderId === id);
      if (o) { o.status = status; render(); }
      const r = await updateBooking({ orderId: id, status });
      if (!r.ok) { toast(r.error || "Update failed", "error"); loadOrders(); return; }
      toast("Status updated", "check_circle");
    },

    "order-notify": async (el) => {
      const id = el.dataset.id;
      const o = STATE.orders.find(x => x.orderId === id);
      if (!o) return;
      if (!o.phone && !o.email) { toast("No phone or email on file", "error"); return; }
      toast("Notifying customer…", "send");
      const r = await updateBooking({ orderId: id, status: "ready", notifyCustomer: true });
      if (!r.ok) { toast(r.error || "Notify failed", "error"); return; }
      if (o) { o.status = "ready"; o.notifiedReadyAt = new Date().toISOString(); render(); }
      const sent = r.notify && r.notify.email && !r.notify.email.skipped && !r.notify.email.error;
      toast(sent ? "Ready email sent" : "Marked ready", "mark_chat_read");
    },

    "order-void-hold": async (el) => {
      const id = el.dataset.id;
      if (!window.confirm("Release the authorization hold on this booking? This cannot be undone.")) return;
      const cfg = window.UBR_CONFIG || {};
      toast("Releasing hold…", "lock_open");
      try {
        const r = await fetch(cfg.FUNCTIONS_BASE + "/void-hold", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-passcode": adminPass() },
          body: JSON.stringify({ orderId: id })
        });
        const d = await r.json();
        if (!r.ok) { toast(d.error || "Release failed", "error"); return; }
        const o = STATE.orders.find(x => x.orderId === id);
        if (o) { o.hold = 0; render(); }
        toast("Hold released — card unlocked", "lock_open");
      } catch (e) { toast("Network error", "error"); }
    },

    "order-capture-hold": async (el) => {
      const id = el.dataset.id;
      const o = STATE.orders.find(x => x.orderId === id);
      const holdAmt = o ? fmt.money(Math.round((o.hold || 0) / 100)) : "the hold";
      if (!window.confirm(`Charge ${holdAmt} for damage? This captures the auth hold on the customer's card and cannot be undone.`)) return;
      const cfg = window.UBR_CONFIG || {};
      toast("Capturing damage hold…", "warning");
      try {
        const r = await fetch(cfg.FUNCTIONS_BASE + "/capture-hold", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-passcode": adminPass() },
          body: JSON.stringify({ orderId: id })
        });
        const d = await r.json();
        if (!r.ok) { toast(d.error || "Capture failed", "error"); return; }
        if (o) { o.hold = 0; o.status = "returned"; render(); }
        toast("Hold captured — customer charged for damage", "warning");
      } catch (e) { toast("Network error", "error"); }
    },

    "order-cancel": async (el) => {
      const id = el.dataset.id;
      if (!window.confirm("Cancel this booking and issue a full refund? This cannot be undone.")) return;
      const cfg = window.UBR_CONFIG || {};
      toast("Cancelling and refunding…", "undo");
      try {
        const r = await fetch(cfg.FUNCTIONS_BASE + "/cancel-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-passcode": adminPass() },
          body: JSON.stringify({ orderId: id })
        });
        const d = await r.json();
        if (!r.ok) { toast(d.error || "Cancel failed", "error"); return; }
        const o = STATE.orders.find(x => x.orderId === id);
        if (o) { o.status = "cancelled"; o.hold = 0; render(); }
        toast(d.refunded ? "Cancelled & refunded" : "Cancelled (no refund — no capture on file)", "check_circle");
      } catch (e) { toast("Network error", "error"); }
    },

    "gallery-thumb": (el) => {
      const main = document.getElementById("gallery-main");
      if (!main) return;
      const src = el.querySelector("img") && el.querySelector("img").src;
      if (src) main.src = src;
      document.querySelectorAll(".gallery-thumb").forEach(b => b.classList.replace("border-canyon-clay", "border-transparent"));
      el.classList.replace("border-transparent", "border-canyon-clay");
    },

    // Cart actions
    "cart-add": (el) => {
      const item = window.CATALOG.get(el.dataset.id);
      if (!item) return;
      const existing = STATE.cart.find(e => e.item.id === item.id);
      if (existing) { existing.qty += 1; }
      else { STATE.cart.push({ item, qty: 1 }); }
      persist();
      render();
      toast(`${item.name} added to cart`, "shopping_cart");
    },
    "cart-remove": (el) => {
      STATE.cart = STATE.cart.filter(e => e.item.id !== el.dataset.id);
      persist(); render();
    },
    "cart-qty-inc": (el) => {
      const e = STATE.cart.find(x => x.item.id === el.dataset.id);
      if (e) { e.qty += 1; persist(); render(); }
    },
    "cart-qty-dec": (el) => {
      const e = STATE.cart.find(x => x.item.id === el.dataset.id);
      if (e) {
        e.qty -= 1;
        if (e.qty <= 0) STATE.cart = STATE.cart.filter(x => x.item.id !== el.dataset.id);
        persist(); render();
      }
    },
    "cart-clear": () => {
      if (!window.confirm("Clear your cart?")) return;
      STATE.cart = []; STATE.cartDates = { start: null, end: null }; STATE.cartPickupTime = null;
      persist(); render();
    },
    "cart-checkout": () => {
      if (!STATE.cart.length) { toast("Your cart is empty", "error"); return; }
      if (!STATE.cartDates.start) { toast("Pick your trip dates first", "error"); return; }
      if (!STATE.cartPickupTime) { toast("Choose a pickup window", "error"); return; }
      STATE.cartMode = true;
      STATE.safetyAccepted = false;
      openModal(window.VIEWS.safetyModal());
    },
    "cart-pickup-time": (el) => { STATE.cartPickupTime = el.dataset.time; render(); },

    "work-order": (el) => go("#/work-order/" + el.dataset.id),
    "do-print": () => window.print(),

    // Customer cancels their own booking (only allowed when status is confirmed/prepped)
    "customer-cancel": async (el) => {
      const id = el.dataset.id;
      if (!window.confirm("Cancel this booking? A full refund will be issued to your original payment method. This cannot be undone.")) return;
      const cfg = window.UBR_CONFIG || {};
      toast("Processing cancellation…", "undo");
      try {
        const r = await fetch(cfg.FUNCTIONS_BASE + "/customer-cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id })
        });
        const d = await r.json();
        if (!r.ok) { toast(d.error || "Cancellation failed", "error"); return; }
        const b = STATE.bookings.find(x => x.orderId === id);
        if (b) b.status = "cancelled";
        persist(); render();
        toast(d.refunded ? "Booking cancelled — refund is on its way" : "Booking cancelled", "check_circle");
      } catch (e) { toast("Network error", "error"); }
    },

    // Customer looks up bookings by email
    "lookup-booking": async () => {
      const emailEl = document.getElementById("lookup-email");
      const email = emailEl ? emailEl.value.trim() : "";
      if (!email || !email.includes("@")) { toast("Enter your email address", "error"); return; }
      const cfg = window.UBR_CONFIG || {};
      toast("Looking up bookings…", "search");
      try {
        const r = await fetch(cfg.FUNCTIONS_BASE + "/lookup-booking?email=" + encodeURIComponent(email));
        const d = await r.json();
        if (!r.ok) { toast(d.error || "Lookup failed", "error"); return; }
        const found = d.bookings || [];
        if (!found.length) { toast("No bookings found for that email", "search"); return; }
        found.forEach(b => { storeServerBooking(b); }); // storeServerBooking handles dedup
        persist();
        STATE.bookingTab = "Upcoming"; render();
        toast(`Found ${found.length} booking${found.length > 1 ? "s" : ""}`, "check_circle");
      } catch (e) { toast("Network error", "error"); }
    },

    // Customer joins waitlist for an item+dates
    "waitlist-join": async (el) => {
      const itemId = el.dataset.id;
      const emailEl = document.getElementById("waitlist-email");
      const email = emailEl ? emailEl.value.trim() : "";
      if (!email || !email.includes("@")) { toast("Enter your email to join the waitlist", "error"); if (emailEl) emailEl.focus(); return; }
      const cfg = window.UBR_CONFIG || {};
      toast("Joining waitlist…", "notifications");
      try {
        const r = await fetch(cfg.FUNCTIONS_BASE + "/add-to-waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, itemId, startDate: STATE.dates.start, endDate: STATE.dates.end })
        });
        const d = await r.json();
        if (!r.ok) { toast(d.error || "Could not join waitlist", "error"); return; }
        toast("You're on the waitlist — we'll email you when it opens", "notifications_active");
        closeModal();
      } catch (e) { toast("Network error", "error"); }
    }
  };

  /* ---------------- orders (owner ops) ---------------- */
  function adminPass() { return sessionStorage.getItem("ubr:admin-pass") || ""; }

  async function loadOrders() {
    const cfg = window.UBR_CONFIG || {};
    if (!cfg.BACKEND_ENABLED) return;
    STATE.ordersLoading = true; render();
    try {
      const r = await fetch(cfg.FUNCTIONS_BASE + "/get-bookings?filter=" + encodeURIComponent(STATE.ordersFilter), {
        headers: { "x-admin-pass": adminPass() }
      });
      const d = await r.json();
      if (!r.ok) { toast(d.error || "Couldn't load orders", "error"); STATE.orders = []; }
      else STATE.orders = (d.bookings || []).map(decorateOrder);
    } catch (_) { toast("Network error loading orders", "error"); STATE.orders = []; }
    STATE.ordersLoading = false; render();
  }

  // Attach display ref + catalog includes/images so work orders are complete.
  function decorateOrder(o) {
    o.ref = "UBR-" + String(o.orderId).slice(-6).toUpperCase();
    const cat = window.CATALOG.get(o.itemId);
    if (cat) { o.includes = cat.includes || []; o.icon = cat.icon; o.tint = cat.tint; }
    return o;
  }

  async function updateBooking(payload) {
    const cfg = window.UBR_CONFIG || {};
    try {
      const r = await fetch(cfg.FUNCTIONS_BASE + "/update-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-pass": adminPass() },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      return r.ok ? { ok: true, ...d } : { ok: false, error: d.error };
    } catch (e) { return { ok: false, error: "Network error" }; }
  }

  /* ---------------- image downscale (admin photo upload) ---------------- */
  function downscaleImage(file, maxDim, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const c = document.createElement("canvas");
        c.width = width; c.height = height;
        c.getContext("2d").drawImage(img, 0, 0, width, height);
        cb(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------------- event delegation ---------------- */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (handlers[action]) {
      // checkbox + file inputs are handled on "change", not click
      if (el.tagName === "INPUT" && (el.type === "checkbox" || el.type === "file")) return;
      e.preventDefault();
      handlers[action](el);
    }
  });
  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    if (el.type === "checkbox" || el.type === "file") {
      const action = el.dataset.action;
      if (handlers[action]) handlers[action](el);
    }
  });
  // Submit the admin passcode with Enter.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target && e.target.id === "admin-pass") handlers["admin-login"]();
  });
  // Keep the renter's legal name in state as they type (survives re-renders).
  document.addEventListener("input", (e) => {
    if (!e.target) return;
    if (e.target.id === "renter-name") STATE.renterName = e.target.value;
    if (e.target.id === "gear-search") {
      STATE.search = e.target.value;
      // Debounce re-render so fast typing doesn't flash
      clearTimeout(window._searchTimer);
      window._searchTimer = setTimeout(render, 200);
    }
  });

  /* ---------------- drag-to-reorder (admin) ---------------- */
  let dragId = null;
  document.addEventListener("dragstart", (e) => {
    const c = e.target.closest("[data-drag-id]");
    if (!c) return;
    dragId = c.dataset.dragId;
    c.classList.add("opacity-40");
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  });
  document.addEventListener("dragend", (e) => {
    const c = e.target.closest("[data-drag-id]");
    if (c) c.classList.remove("opacity-40");
    dragId = null;
  });
  document.addEventListener("dragover", (e) => {
    if (dragId && e.target.closest("[data-drag-id]")) e.preventDefault();
  });
  document.addEventListener("drop", (e) => {
    const t = e.target.closest("[data-drag-id]");
    if (!dragId || !t || t.dataset.dragId === dragId) return;
    e.preventDefault();
    const ids = [...document.querySelectorAll("#admin-list [data-drag-id]")].map(x => x.dataset.dragId);
    ids.splice(ids.indexOf(dragId), 1);
    ids.splice(ids.indexOf(t.dataset.dragId), 0, dragId);
    CATALOG.reorder(ids);
    dragId = null;
    render();
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);
  if (document.readyState !== "loading") render();

  // Load persisted business info from localStorage
  try {
    const biz = JSON.parse(localStorage.getItem("ubr:biz"));
    if (biz && typeof biz === "object") STATE.businessInfo = biz;
  } catch (_) {}

  // If backend is enabled, load the live catalog from Supabase and re-render
  // if it differs from the locally cached version.
  const _cfg = window.UBR_CONFIG || {};
  if (_cfg.BACKEND_ENABLED) {
    window.CATALOG.loadFromBackend(_cfg.FUNCTIONS_BASE)
      .then(changed => { if (changed) render(); })
      .catch(() => {});
    hydrateBookings();
  }
})();
