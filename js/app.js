/* App controller: state, formatters, router, event handling, persistence. */
(function () {
  const D = window.DATA;
  const CATALOG = window.CATALOG;

  /* ---------------- formatters ---------------- */
  window.fmt = {
    money: (n) => "$" + Math.round(n),
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

  function seedBookings() {
    const today = new Date();
    const fut = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt.iso(d); };
    const pst = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt.iso(d); };
    return [
      {
        orderId: "UBR-8842", itemId: "master-safety-kit", name: "The Master Safety Kit",
        icon: "backpack", tint: "#1b3022", total: 65, past: false,
        rangeLabel: `${fmt.label(fut(12))} – ${fmt.label(fut(14))}`
      },
      {
        orderId: "UBR-7310", itemId: "garmin-inreach", name: "Garmin inReach Mini 2",
        icon: "satellite_alt", tint: "#ab3500", total: 24, past: true,
        rangeLabel: `${fmt.label(pst(20))} – ${fmt.label(pst(18))}`
      }
    ];
  }

  const now = fmt.midnight(new Date());
  window.STATE = {
    category: "Bundles",
    calMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    dates: { start: null, end: null },
    draft: null,
    customPack: null,
    favs: new Set(store.load("favs", ["garmin-inreach"])),
    pack: new Map(),
    packAddons: new Set(),
    packCat: "All Items",
    bookingTab: "Upcoming",
    safetyAccepted: false,
    adminAuthed: sessionStorage.getItem("ubr:admin") === "1",
    adminEdit: null,
    bookings: store.load("bookings", null) || seedBookings()
  };
  if (!store.load("bookings", null)) store.save("bookings", window.STATE.bookings);

  const persist = () => {
    store.save("bookings", window.STATE.bookings);
    store.save("favs", [...window.STATE.favs]);
  };

  /* ---------------- image fallback ---------------- */
  // Tries the next candidate extension (png → webp → jpeg); if none load, the
  // icon underneath shows through. Lets the owner drop in any common image type.
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
      deposit: Math.round((d.deposit || 0) / 100), past: false,
      rangeLabel: start ? fmt.range({ start, end }) : "Flexible"
    };
    if (!STATE.bookings.find(b => b.orderId === d.orderId)) {
      STATE.bookings.unshift(booking);
      persist();
    }
    return booking;
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
      }
      html = html || window.VIEWS.gear();
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
    } else if (parts[0] === "profile") {
      html = window.VIEWS.profile();
    } else if (parts[0] === "admin") {
      html = STATE.adminAuthed ? window.VIEWS.admin() : window.VIEWS.adminGate();
    } else {
      html = window.VIEWS.notFound();
    }

    root.innerHTML = html;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  const go = (route) => { if (location.hash === route) render(); else location.hash = route; };

  /* ---------------- actions ---------------- */
  const handlers = {
    nav: (el) => go(el.dataset.route),
    back: () => history.length > 1 ? history.back() : go("#/"),

    category: (el) => { STATE.category = el.dataset.cat; render(); },

    fav: (el) => {
      const id = el.dataset.id;
      STATE.favs.has(id) ? STATE.favs.delete(id) : STATE.favs.add(id);
      persist(); render();
      toast(STATE.favs.has(id) ? "Saved to your gear" : "Removed", STATE.favs.has(id) ? "favorite" : "heart_broken");
    },

    book: (el) => {
      const item = window.CATALOG.get(el.dataset.id);
      STATE.draft = item;
      STATE.dates = { start: null, end: null };
      STATE.calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      go("#/gear/" + item.id);
    },

    "rent-again": (el) => handlers.book(el),

    /* calendar */
    "cal-prev": () => { const m = STATE.calMonth; STATE.calMonth = new Date(m.getFullYear(), m.getMonth() - 1, 1); render(); },
    "cal-next": () => { const m = STATE.calMonth; STATE.calMonth = new Date(m.getFullYear(), m.getMonth() + 1, 1); render(); },
    "cal-day": (el) => {
      const iso = el.dataset.date;
      const { start, end } = STATE.dates;
      if (!start || (start && end)) STATE.dates = { start: iso, end: null };
      else if (iso < start) STATE.dates = { start: iso, end: null };
      else STATE.dates = { start, end: iso };
      render();
    },

    "confirm-dates": () => { STATE.safetyAccepted = false; openModal(window.VIEWS.safetyModal()); },
    "cancel-modal": () => closeModal(),
    "accept-safety": (el) => { STATE.safetyAccepted = el.checked; openModal(window.VIEWS.safetyModal()); },

    "proceed-checkout": async () => {
      if (!STATE.safetyAccepted) return;
      const item = STATE.draft;
      const days = fmt.days(STATE.dates);
      const cfg = window.UBR_CONFIG || {};

      // --- LIVE: hand off to Stripe Checkout via our serverless function ---
      if (cfg.BACKEND_ENABLED) {
        closeModal();
        toast("Opening secure checkout…", "lock");
        try {
          const payload = {
            itemId: item.id, name: item.name, days,
            startDate: STATE.dates.start, endDate: STATE.dates.end,
            components: item.components, addons: item.addons
          };
          const res = await fetch(cfg.FUNCTIONS_BASE + "/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok && data.url) { window.location.href = data.url; return; }
          toast(data.error || "Checkout couldn't start — try again", "error");
        } catch (e) {
          toast("Network error — please try again", "error");
        }
        return;
      }

      // --- DEMO: no backend configured yet, show a sample confirmation ---
      const total = days * item.perDay;
      const orderId = "UBR-" + Math.floor(1000 + Math.random() * 9000);
      const booking = {
        orderId, itemId: item.id, name: item.name,
        icon: item.icon, tint: item.tint, total, deposit: item.deposit || 0, past: false,
        rangeLabel: fmt.range(STATE.dates) || "Flexible"
      };
      STATE.bookings.unshift(booking);
      persist();
      closeModal();
      STATE.bookingTab = "Upcoming";
      go("#/confirmation/" + orderId);
      toast("Reservation confirmed!");
    },

    directions: () => toast("Opening directions to " + D.depot, "near_me"),

    /* bookings tabs */
    "booking-tab": (el) => { STATE.bookingTab = el.dataset.tab; render(); },

    /* pack builder */
    "pack-cat": (el) => { STATE.packCat = el.dataset.cat; render(); },
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
    "pack-reset": () => { STATE.pack = new Map(); STATE.packAddons = new Set(); render(); toast("Pack cleared", "delete"); },

    "load-kit": (el) => {
      const kit = D.kits.find(k => k.id === el.dataset.kit);
      if (!kit) return;
      STATE.pack = new Map();
      kit.items.forEach(id => STATE.pack.set(id, (STATE.pack.get(id) || 0) + 1));
      STATE.packCat = "All Items";
      render();
      toast(kit.name + " loaded — customize away", "backpack");
    },

    "continue-pack": () => {
      const items = [];
      const components = [];           // flat id list (repeated per qty) for server-side pricing
      let perDay = 0, weight = 0, deposit = 0;
      STATE.pack.forEach((count, id) => {
        const g = D.packLibrary.find(x => x.id === id);
        if (!g) return;
        perDay += g.perDay * count; weight += g.weight * count; deposit += (g.deposit || 0) * count;
        items.push(count > 1 ? `${g.name} ×${count}` : g.name);
        for (let i = 0; i < count; i++) components.push(id);
      });
      const addons = [...STATE.packAddons];
      addons.forEach(id => {
        const a = D.addons.find(x => x.id === id);
        if (a) { perDay += a.price; items.push(a.name); }
      });
      if (!items.length) return;
      STATE.draft = {
        id: "custom", name: "Your Custom Pack", icon: "backpack", tint: "#1b3022",
        perDay, unit: "day", deposit, tagline: `${weight.toFixed(1)} lbs · ${items.length} items`,
        includes: items, components, addons
      };
      STATE.dates = { start: null, end: null };
      STATE.calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      go("#/gear/custom");
    },

    /* ---- admin: Manage Gear ---- */
    "admin-login": () => {
      const v = (document.getElementById("admin-pass") || {}).value || "";
      const pass = (window.UBR_CONFIG && window.UBR_CONFIG.ADMIN_PASSCODE) || "";
      if (v && v === pass) {
        sessionStorage.setItem("ubr:admin", "1");
        STATE.adminAuthed = true; render();
      } else { toast("Incorrect passcode", "error"); }
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
      downscaleImage(f, 1000, (dataUrl) => {
        if (!STATE.adminEdit) STATE.adminEdit = {};
        STATE.adminEdit.img = dataUrl;
        const p = document.getElementById("admin-img-preview");
        const empty = document.getElementById("admin-img-empty");
        if (p) { p.src = dataUrl; p.classList.remove("hidden"); }
        if (empty) empty.classList.add("hidden");
      });
    },
    "admin-image-clear": (el) => {
      if (STATE.adminEdit) STATE.adminEdit.img = "";
      const p = document.getElementById("admin-img-preview");
      const empty = document.getElementById("admin-img-empty");
      if (p) { p.src = ""; p.classList.add("hidden"); }
      if (empty) empty.classList.remove("hidden");
      el.classList.add("hidden");
    },
    "admin-save": () => {
      const val = (id) => (document.getElementById(id) || {}).value;
      const name = (val("admin-name") || "").trim();
      if (!name) { toast("Give the product a name", "error"); return; }
      const e = STATE.adminEdit || {};
      const current = e.id ? (CATALOG.get(e.id) || {}) : {};
      const patch = {
        name,
        category: val("admin-cat") || "Bundles",
        tagline: (val("admin-tagline") || "").trim(),
        perDay: parseFloat(val("admin-perday")) || 0,
        unit: "day",
        deposit: parseFloat(val("admin-deposit")) || 0,
        icon: e.icon || current.icon || "backpack"
      };
      if (e.img !== undefined) patch.img = e.img || undefined;
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
    }
  };

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
})();
