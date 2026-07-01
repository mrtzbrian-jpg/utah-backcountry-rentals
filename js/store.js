/* Editable product catalog.
 *
 * The site reads gear through CATALOG instead of straight from data.js, so the
 * owner's edits in the Manage Gear admin take effect immediately. In demo mode
 * the catalog is saved to this browser's localStorage (your design sandbox).
 * When Supabase is connected later, the same admin will publish to the database
 * for all visitors. data.js stays as the built-in default / starting point. */
window.CATALOG = (function () {
  const KEY = "ubr:catalog";
  const CAT_KEY = "ubr:categories";
  let list = null; // null = "use the built-in defaults from data.js"
  let cats = null; // null = "use the built-in defaults from data.js"

  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) list = saved;
  } catch (e) { /* ignore */ }

  try {
    const savedCats = JSON.parse(localStorage.getItem(CAT_KEY));
    if (Array.isArray(savedCats)) cats = savedCats;
  } catch (e) { /* ignore */ }

  const defaults = () => JSON.parse(JSON.stringify(window.DATA.gear));
  const defaultCats = () => JSON.parse(JSON.stringify(window.DATA.categories));
  const gear = () => list || window.DATA.gear;
  const categories = () => cats || window.DATA.categories;
  const get = (id) => gear().find((g) => g.id === id);

  function save() { if (list) localStorage.setItem(KEY, JSON.stringify(list)); }
  function saveCats() { localStorage.setItem(CAT_KEY, JSON.stringify(cats || defaultCats())); }
  function ensure() { if (!list) list = defaults(); }
  function ensureCats() { if (!cats) cats = defaultCats(); }

  function slugify(name, existingId) {
    if (existingId) return existingId;
    let base = (name || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
    let id = base, n = 2;
    while (gear().some((g) => g.id === id)) id = `${base}-${n++}`;
    return id;
  }

  return {
    gear, get, categories,
    isCustomized: () => !!list,

    addCategory(name) {
      ensureCats();
      const trimmed = name.trim();
      if (!trimmed || cats.includes(trimmed)) return false;
      cats.push(trimmed);
      saveCats();
      return true;
    },
    removeCategory(name) {
      ensureCats();
      const inUse = gear().some(g => g.category === name);
      if (inUse) return false;
      cats = cats.filter(c => c !== name);
      saveCats();
      return true;
    },
    reorderCategories(ordered) {
      ensureCats();
      cats = ordered;
      saveCats();
    },

    add(obj) {
      ensure();
      obj.id = slugify(obj.name, obj.id);
      list.unshift(obj);
      save();
      return obj.id;
    },
    update(id, patch) {
      ensure();
      const g = list.find((x) => x.id === id);
      if (g) Object.assign(g, patch);
      save();
    },
    remove(id) {
      ensure();
      list = list.filter((x) => x.id !== id);
      save();
    },
    reorder(orderedIds) {
      ensure();
      list.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));
      save();
    },
    reset() { list = null; cats = null; localStorage.removeItem(KEY); localStorage.removeItem(CAT_KEY); },

    exportJSON() { return JSON.stringify(gear(), null, 2); },
    importJSON(text) {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("File must be a list of products");
      list = arr;
      save();
    },

    /* Fetch the published catalog (and categories) from Supabase. Returns true
     * if anything changed. Silent on network errors. */
    loadFromBackend(baseUrl) {
      return fetch(baseUrl + "/get-catalog")
        .then(r => r.ok ? r.json() : Promise.reject("HTTP " + r.status))
        .then(data => {
          const payload = Array.isArray(data) ? { products: data } : data;
          const products = payload.products || payload;
          if (!Array.isArray(products) || !products.length) return false;
          const before = JSON.stringify(list) + JSON.stringify(cats);
          list = products;
          save();
          if (Array.isArray(payload.categories) && payload.categories.length) {
            cats = payload.categories;
            saveCats();
          }
          if (payload.businessInfo && window.STATE) {
            window.STATE.businessInfo = payload.businessInfo;
            localStorage.setItem("ubr:biz", JSON.stringify(payload.businessInfo));
          }
          if (Array.isArray(payload.blockedDates) && window.STATE) {
            window.STATE.blockedDates = payload.blockedDates;
          }
          return JSON.stringify(list) + JSON.stringify(cats) !== before;
        })
        .catch(() => false);
    },

    /* Push the current catalog + categories to Supabase (admin-only). */
    publish(baseUrl, passcode) {
      return fetch(baseUrl + "/save-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ products: gear(), categories: categories() })
      })
        .then(r => r.json().then(d => ({ d, ok: r.ok })))
        .then(({ d, ok }) => {
          if (!ok) throw new Error(d.error || "Publish failed");
          return d;
        });
    }
  };
})();
