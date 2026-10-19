export function getFirstImage(urls: string) {
  if (!urls) return null;
  const splitUrls = urls.split(',').map(url => url.trim()).filter(url => url !== '');
  return splitUrls.length > 0 ? splitUrls[0] : null;
}