let isLoaded = false;
export const loadMatomo = (matomoUrl: string, siteId: number) => {
  if (isLoaded) return;
  isLoaded = true;

  const _paq = ((window as any)._paq = (window as any)._paq || []);
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function () {
    const u = `//${matomoUrl}/`;
    _paq.push(['setTrackerUrl', `${u}matomo.php`]);
    _paq.push(['setSiteId', siteId]);
    const d = document;
    const g = d.createElement('script');
    const s = d.getElementsByTagName('script')[0];
    g.async = true;
    g.src = `${u}matomo.js`;
    s.parentNode?.insertBefore(g, s);
  })();
};
