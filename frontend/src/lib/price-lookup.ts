export interface PriceResult {
  estimatedValue: number;
  currency: string;
  source: string;
  fetchedAt: string;
}

/** Fetch price estimate from eBay Finding API (requires EBAY_APP_ID) */
async function fetchEbayPrice(query: string): Promise<PriceResult | null> {
  const appId = process.env.EBAY_APP_ID;
  if (!appId) return null;
  try {
    const encodedQuery = encodeURIComponent(query);
    const url =
      `https://svcs.ebay.com/services/search/FindingService/v1` +
      `?OPERATION-NAME=findCompletedItems` +
      `&SERVICE-VERSION=1.0.0` +
      `&SECURITY-APPNAME=${appId}` +
      `&RESPONSE-DATA-FORMAT=JSON` +
      `&REST-PAYLOAD` +
      `&keywords=${encodedQuery}` +
      `&itemFilter(0).name=SoldItemsOnly&itemFilter(0).value=true` +
      `&sortOrder=EndTimeSoonest` +
      `&paginationInput.entriesPerPage=10`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();
    const items =
      data?.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item ?? [];
    if (!items.length) return null;

    const prices: number[] = items
      .map(
        (it: { sellingStatus?: [{ convertedCurrentPrice?: [{ __value__?: string }] }] }) =>
          parseFloat(
            it.sellingStatus?.[0]?.convertedCurrentPrice?.[0]?.__value__ ?? '0'
          )
      )
      .filter((p: number) => p > 0);

    if (!prices.length) return null;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return {
      estimatedValue: Math.round(avg * 100) / 100,
      currency: 'USD',
      source: 'ebay',
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Main price estimation entry point */
export async function estimatePrice(
  name: string,
  catalogueName?: string
): Promise<PriceResult | null> {
  const query = catalogueName
    ? `${name} ${catalogueName}`
    : name;

  const ebay = await fetchEbayPrice(query);
  if (ebay) return ebay;

  return null;
}
