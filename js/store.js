/* Editable product catalog.
 *
 * The site reads gear through CATALOG instead of straight from data.js, so the
 * owner's edits in the Manage Gear admin take effect immediately. In demo mode
 * the catalog is saved to this browser's localStorage (your design sandbox).
 * When Supabase is connected later, the same admin will publish to the database
 * for all visitors. data.js stays as the built-in default / starting point. */
window.CATALOG = (function () {
  const KEY = "ubr:catalog";
  let list = null; // null = "use the built-in defaults from data.js"

  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) list = saved;
  } catch (e) { /* ignore */ }

  const defaults = () => JSON.parse(JSON.stringify(window.DATA.gear));
  const gear = () => list || window.DATA.gear;
  const get = (id) => gear().find((g) => g.id === id);

  function save() { if (list) localStorage.setItem(KEY, JSON.stringify(list)); }
  function ensure() { if (!list) list = defaults(); }

  function slugify(name, existingId) {
    if (existingId) return existingId;
    let base = (name || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
    let id = base, n = 2;
    while (gear().some((g) => g.id === id)) id = `${base}-${n++}`;
    return id;
  }

  return {
    gear, get,
    isCustomized: () => !!list,

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
    reset() { list = null; localStorage.removeItem(KEY); },

    exportJSON() { return JSON.stringify(gear(), null, 2); },
    importJSON(text) {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("File must be a list of products");
      list = arr;
      save();
    },

    /* Fetch the published catalog from Supabase. Returns true if the list
     * changed (so the caller knows to re-render). Silent on network errors. */
    loadFromBackend(baseUrl) {
      return fetch(baseUrl + "/get-catalog")
        .then(r => r.ok ? r.json() : Promise.reject("HTTP " + r.status))
        .then(data => {
          if (!Array.isArray(data) || !data.length) return false;
          const before = JSON.stringify(list);
          list = data;
          save();
          return JSON.stringify(list) !== before;
        })
        .catch(() => false);
    },

    /* Push the current catalog to Supabase (admin-only). Resolves with
     * { ok, count } or rejects with an Error. */
    publish(baseUrl, passcode) {
      return fetch(baseUrl + "/save-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify(gear())
      })
        .then(r => r.json().then(d => ({ d, ok: r.ok })))
        .then(({ d, ok }) => {
          if (!ok) throw new Error(d.error || "Publish failed");
          return d;
        });
    }
  };
})();
