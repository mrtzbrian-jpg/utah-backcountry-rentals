/* Google Analytics 4 loader — used by the app and all SEO landing pages.
 *
 * TO ENABLE: create a GA4 property at analytics.google.com, then replace
 * the placeholder below with your Measurement ID (looks like "G-ABC123XYZ").
 * Until a real ID is set, this file does nothing (no tracking, no errors). */
(function () {
  var GA_ID = "G-XXXXXXXXXX"; // <-- replace with your GA4 Measurement ID

  if (!GA_ID || GA_ID.indexOf("XXXX") !== -1) return; // not configured yet

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
})();
