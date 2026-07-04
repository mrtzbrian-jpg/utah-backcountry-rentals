/* Small vector "infographic" icons for the Build-Your-Pack drag tiles and the
 * admin's gear-graphic picker. Flat, single-tone dark forest green shapes —
 * fast to render, no photos needed. Pick one per product in Manage Gear;
 * falls back to a generic pack icon if unset. */
window.GEAR_ICONS = (function () {
  const C = "#1b3022";   // dark forest green (primary shape)
  const C2 = "#3a5842";  // lighter forest green (detail/shading)

  function svg(inner) {
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">${inner}</svg>`;
  }

  const ICONS = {
    "tent-small": svg(`<path d="M32 12 L52 46 H12 Z" fill="${C}"/><path d="M32 12 L32 46" stroke="${C2}" stroke-width="1.6"/><path d="M25 46 L32 30 L39 46 Z" fill="${C2}"/><rect x="10" y="46" width="44" height="3" rx="1.5" fill="${C}"/>`),
    "tent-large": svg(`<path d="M8 46 L32 14 L56 46 Z" fill="${C}"/><path d="M20 46 L32 24 L44 46 Z" fill="${C2}"/><rect x="6" y="46" width="52" height="3.5" rx="1.5" fill="${C}"/><path d="M32 14 L32 46" stroke="${C2}" stroke-width="1.2" opacity=".6"/>`),
    "backpack": svg(`<path d="M22 26 Q16 18 20 10 Q23 5 32 5 Q41 5 44 10 Q48 18 42 26" fill="none" stroke="${C}" stroke-width="5" stroke-linecap="round"/><rect x="14" y="24" width="36" height="34" rx="8" fill="${C}"/><rect x="18" y="34" width="28" height="16" rx="5" fill="${C2}"/><rect x="6" y="30" width="6" height="16" rx="3" fill="${C}"/><rect x="52" y="30" width="6" height="16" rx="3" fill="${C}"/>`),
    "cooler-small": svg(`<rect x="12" y="22" width="40" height="30" rx="5" fill="${C}"/><rect x="12" y="22" width="40" height="9" rx="4" fill="${C2}"/><path d="M22 22 V14 Q22 10 26 10 H38 Q42 10 42 14 V22" fill="none" stroke="${C}" stroke-width="4" stroke-linecap="round"/>`),
    "cooler-large": svg(`<rect x="8" y="20" width="48" height="32" rx="5" fill="${C}"/><rect x="8" y="20" width="48" height="9" rx="4" fill="${C2}"/><circle cx="18" cy="57" r="4" fill="${C}"/><circle cx="46" cy="57" r="4" fill="${C}"/><rect x="14" y="34" width="36" height="4" rx="2" fill="${C2}"/>`),
    "sleeping-bag": svg(`<path d="M26 8 H38 Q46 8 46 18 V46 Q46 58 32 58 Q18 58 18 46 V18 Q18 8 26 8 Z" fill="${C}"/><path d="M22 20 H42 M22 30 H42 M22 40 H42" stroke="${C2}" stroke-width="2"/>`),
    "sleeping-pad": svg(`<rect x="8" y="24" width="48" height="16" rx="8" fill="${C}"/><path d="M14 24 Q10 24 10 32 Q10 40 14 40" fill="none" stroke="${C2}" stroke-width="2.5"/><path d="M22 27 V37 M32 27 V37 M42 27 V37" stroke="${C2}" stroke-width="2"/>`),
    "camp-stove": svg(`<rect x="8" y="30" width="48" height="20" rx="4" fill="${C}"/><circle cx="22" cy="40" r="9" fill="${C2}"/><circle cx="42" cy="40" r="9" fill="${C2}"/><circle cx="22" cy="40" r="3" fill="${C}"/><circle cx="42" cy="40" r="3" fill="${C}"/><rect x="14" y="22" width="8" height="8" rx="2" fill="${C}"/>`),
    "pot": svg(`<path d="M14 26 H50 L46 52 Q45 56 41 56 H23 Q19 56 18 52 Z" fill="${C}"/><rect x="10" y="22" width="44" height="6" rx="3" fill="${C2}"/><path d="M6 25 H12 M52 25 H58" stroke="${C}" stroke-width="4" stroke-linecap="round"/>`),
    "pan": svg(`<circle cx="28" cy="36" r="18" fill="${C}"/><circle cx="28" cy="36" r="12" fill="${C2}"/><path d="M44 30 L60 22" stroke="${C}" stroke-width="5" stroke-linecap="round"/>`),
    "cookset": svg(`<rect x="12" y="34" width="34" height="20" rx="4" fill="${C}"/><rect x="18" y="24" width="26" height="14" rx="4" fill="${C2}"/><rect x="24" y="16" width="18" height="12" rx="4" fill="${C}"/><path d="M46 40 L56 36" stroke="${C}" stroke-width="4" stroke-linecap="round"/>`),
    "lantern": svg(`<rect x="22" y="20" width="20" height="28" rx="4" fill="${C}"/><path d="M26 20 V14 H38 V20 M22 48 H42 L38 56 H26 Z" fill="${C2}"/><path d="M18 14 Q32 6 46 14" fill="none" stroke="${C}" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="34" r="6" fill="${C2}"/>`),
    "headlamp": svg(`<circle cx="32" cy="26" r="12" fill="${C}"/><circle cx="32" cy="26" r="5" fill="${C2}"/><path d="M20 30 Q10 40 14 54 M44 30 Q54 40 50 54" fill="none" stroke="${C}" stroke-width="4" stroke-linecap="round"/>`),
    "camp-chair": svg(`<path d="M16 20 L20 54 M48 20 L44 54 M16 20 H48 M20 54 H44" stroke="${C}" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="17" y="26" width="30" height="16" rx="3" fill="${C2}"/><path d="M14 54 L24 44 M50 54 L40 44" stroke="${C}" stroke-width="4" stroke-linecap="round"/>`),
    "camp-table": svg(`<rect x="8" y="20" width="48" height="8" rx="3" fill="${C}"/><path d="M14 28 L10 54 M50 28 L54 54 M22 28 L20 54 M42 28 L44 54" stroke="${C2}" stroke-width="3.5" stroke-linecap="round"/>`),
    "power-bank": svg(`<rect x="18" y="12" width="28" height="40" rx="6" fill="${C}"/><path d="M34 20 L26 34 H32 L30 44 L40 28 H34 Z" fill="${C2}"/>`),
    "power-station": svg(`<rect x="8" y="16" width="48" height="32" rx="5" fill="${C}"/><rect x="14" y="22" width="14" height="10" rx="2" fill="${C2}"/><circle cx="42" cy="27" r="5" fill="${C2}"/><path d="M20 40 H44" stroke="${C2}" stroke-width="3" stroke-linecap="round"/>`),
    "bear-canister": svg(`<rect x="16" y="14" width="32" height="42" rx="10" fill="${C}"/><ellipse cx="32" cy="14" rx="16" ry="5" fill="${C2}"/><rect x="24" y="8" width="16" height="7" rx="3" fill="${C}"/>`),
    "satellite-comm": svg(`<rect x="20" y="18" width="24" height="34" rx="6" fill="${C}"/><circle cx="32" cy="30" r="6" fill="${C2}"/><path d="M24 44 H40 M24 48 H34" stroke="${C2}" stroke-width="2.5" stroke-linecap="round"/><path d="M32 18 V8 M26 12 Q32 4 38 12" fill="none" stroke="${C}" stroke-width="3" stroke-linecap="round"/>`),
    "water-filter": svg(`<rect x="24" y="10" width="16" height="34" rx="8" fill="${C}"/><path d="M18 44 Q32 60 46 44 Q46 38 32 38 Q18 38 18 44 Z" fill="${C2}"/><circle cx="32" cy="24" r="4" fill="${C2}"/>`),
    "hiking-poles": svg(`<path d="M16 8 L48 56" stroke="${C}" stroke-width="4.5" stroke-linecap="round"/><path d="M48 8 L16 56" stroke="${C2}" stroke-width="4.5" stroke-linecap="round"/><circle cx="16" cy="8" r="5" fill="${C}"/><circle cx="48" cy="8" r="5" fill="${C2}"/>`),
    "snowshoes": svg(`<ellipse cx="22" cy="32" rx="13" ry="24" fill="none" stroke="${C}" stroke-width="4"/><ellipse cx="42" cy="32" rx="13" ry="24" fill="none" stroke="${C2}" stroke-width="4"/><path d="M12 26 H32 M12 38 H32 M32 26 H52 M32 38 H52" stroke="${C}" stroke-width="1.6" opacity=".7"/>`),
    "traction-cleats": svg(`<ellipse cx="32" cy="34" rx="20" ry="14" fill="${C}"/><circle cx="20" cy="30" r="2.4" fill="${C2}"/><circle cx="28" cy="26" r="2.4" fill="${C2}"/><circle cx="36" cy="26" r="2.4" fill="${C2}"/><circle cx="44" cy="30" r="2.4" fill="${C2}"/><circle cx="24" cy="38" r="2.4" fill="${C2}"/><circle cx="40" cy="38" r="2.4" fill="${C2}"/>`),
    "first-aid": svg(`<rect x="10" y="18" width="44" height="34" rx="6" fill="${C}"/><path d="M22 18 V12 Q22 8 26 8 H38 Q42 8 42 12 V18" fill="none" stroke="${C}" stroke-width="4"/><rect x="27" y="26" width="10" height="20" fill="${C2}"/><rect x="19" y="34" width="26" height="10" fill="${C2}"/>`),
    "hammock": svg(`<path d="M10 16 V48 M54 16 V48" stroke="${C}" stroke-width="4.5" stroke-linecap="round"/><path d="M10 22 Q32 46 54 22" fill="none" stroke="${C2}" stroke-width="4.5" stroke-linecap="round"/>`),
    "rope": svg(`<circle cx="32" cy="32" r="20" fill="none" stroke="${C}" stroke-width="6"/><circle cx="32" cy="32" r="11" fill="none" stroke="${C2}" stroke-width="5"/>`),
    "hatchet": svg(`<path d="M28 8 L28 52" stroke="${C2}" stroke-width="5" stroke-linecap="round"/><path d="M28 8 Q48 6 50 22 Q48 30 28 28 Z" fill="${C}"/>`),
    "gloves": svg(`<path d="M18 30 Q12 30 12 38 Q12 46 20 48 L20 56 H36 V32 Q36 22 27 22 Q18 22 18 30 Z" fill="${C}"/><rect x="21" y="10" width="7" height="16" rx="3.5" fill="${C2}"/><rect x="30" y="8" width="7" height="18" rx="3.5" fill="${C2}"/>`),
    "goggles": svg(`<rect x="8" y="24" width="20" height="18" rx="9" fill="${C}"/><rect x="36" y="24" width="20" height="18" rx="9" fill="${C}"/><rect x="26" y="30" width="12" height="6" rx="3" fill="${C}"/><path d="M8 26 Q4 33 8 40 M56 26 Q60 33 56 40" fill="none" stroke="${C2}" stroke-width="3" stroke-linecap="round"/>`),
    "helmet": svg(`<path d="M12 40 Q12 14 32 14 Q52 14 52 40 Z" fill="${C}"/><rect x="10" y="38" width="44" height="7" rx="3.5" fill="${C2}"/>`),
    "map-compass": svg(`<path d="M12 14 L28 22 L44 14 L52 20 L52 50 L36 42 L20 50 L12 44 Z" fill="${C}"/><circle cx="32" cy="34" r="8" fill="${C2}"/><path d="M32 29 L35 34 L32 39 L29 34 Z" fill="${C}"/>`),
    "water-bottle": svg(`<rect x="22" y="6" width="20" height="10" rx="3" fill="${C2}"/><path d="M18 18 Q18 14 24 14 H40 Q46 14 46 18 V50 Q46 58 32 58 Q18 58 18 50 Z" fill="${C}"/>`),
    "dry-bag": svg(`<path d="M16 26 Q16 52 32 56 Q48 52 48 26 Z" fill="${C}"/><rect x="14" y="14" width="36" height="14" rx="3" fill="${C2}"/><rect x="28" y="8" width="8" height="10" rx="2" fill="${C}"/>`),
    "generic": svg(`<rect x="14" y="22" width="36" height="30" rx="8" fill="${C}"/><path d="M22 22 Q22 10 32 10 Q42 10 42 22" fill="none" stroke="${C}" stroke-width="5"/><rect x="20" y="32" width="24" height="12" rx="4" fill="${C2}"/>`)
  };

  const LIST = [
    { key: "backpack", label: "Backpack" },
    { key: "tent-small", label: "Tent — small (1–4 person)" },
    { key: "tent-large", label: "Tent — large (6+ person)" },
    { key: "sleeping-bag", label: "Sleeping bag" },
    { key: "sleeping-pad", label: "Sleeping pad" },
    { key: "hammock", label: "Hammock" },
    { key: "cooler-small", label: "Cooler — small" },
    { key: "cooler-large", label: "Cooler — large/wheeled" },
    { key: "camp-stove", label: "Camp stove" },
    { key: "pot", label: "Pot" },
    { key: "pan", label: "Pan" },
    { key: "cookset", label: "Cookware set" },
    { key: "water-bottle", label: "Water bottle" },
    { key: "water-filter", label: "Water filter" },
    { key: "lantern", label: "Lantern" },
    { key: "headlamp", label: "Headlamp" },
    { key: "camp-chair", label: "Camp chair" },
    { key: "camp-table", label: "Camp table" },
    { key: "power-bank", label: "Power bank" },
    { key: "power-station", label: "Power station" },
    { key: "bear-canister", label: "Bear canister" },
    { key: "satellite-comm", label: "Satellite communicator" },
    { key: "hiking-poles", label: "Hiking poles" },
    { key: "snowshoes", label: "Snowshoes" },
    { key: "traction-cleats", label: "Traction cleats" },
    { key: "first-aid", label: "First-aid kit" },
    { key: "rope", label: "Rope / cordage" },
    { key: "hatchet", label: "Hatchet / axe" },
    { key: "gloves", label: "Gloves" },
    { key: "goggles", label: "Goggles" },
    { key: "helmet", label: "Helmet" },
    { key: "map-compass", label: "Map & compass" },
    { key: "dry-bag", label: "Dry bag" },
    { key: "generic", label: "Generic gear" }
  ];

  return {
    icons: ICONS,
    list: LIST,
    get(key) { return ICONS[key] || ICONS.generic; }
  };
})();
