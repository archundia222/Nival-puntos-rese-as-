export function googleReviewUrl(value: string): string | null {
  if (!value || value.length > 2000) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null;
    if (url.hostname === 'g.page' && /^\/r\/[\w-]+\/review$/.test(url.pathname) && !url.search) return url.href;
    if (url.hostname === 'maps.app.goo.gl' && /^\/[\w-]+$/.test(url.pathname) && !url.search) return url.href;
    if (url.hostname === 'search.google.com' && url.pathname === '/local/writereview' && /^[\w-]+$/.test(url.searchParams.get('placeid') || '') && [...url.searchParams.keys()].length === 1) return url.href;
    return null;
  } catch { return null; }
}
