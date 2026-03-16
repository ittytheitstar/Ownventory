export interface LookupResult {
  name: string;
  description?: string;
  author?: string;
  publisher?: string;
  year?: number;
  imageUrl?: string;
  catalogueName: string;
  manufacturer?: string;
  metadata?: Record<string, unknown>;
}

/** Detect if a string looks like a barcode (all digits, 8-14 chars) */
export function isBarcode(query: string): boolean {
  return /^\d{8,14}$/.test(query.trim());
}

/** Look up a book by ISBN via Open Library */
async function lookupOpenLibrary(isbn: string): Promise<LookupResult | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    const key = `ISBN:${isbn}`;
    if (!data[key]) return null;
    const details = data[key].details;
    const title: string = details.title ?? 'Unknown Title';
    const authors: string[] = (details.authors ?? []).map((a: { name: string }) => a.name);
    const publishers: string[] = details.publishers ?? [];
    const year: number | undefined = details.publish_date
      ? parseInt(details.publish_date.slice(-4))
      : undefined;
    return {
      name: title,
      author: authors.join(', '),
      publisher: publishers.join(', '),
      year: year !== undefined && !isNaN(year) ? year : undefined,
      imageUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      catalogueName: 'Books',
      metadata: { source: 'openlibrary', isbn },
    };
  } catch {
    return null;
  }
}

/** Search Open Library by title/author */
async function searchOpenLibrary(query: string): Promise<LookupResult | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (!data.docs?.length) return null;
    const doc = data.docs[0];
    const isbn = doc.isbn?.[0];
    return {
      name: doc.title ?? query,
      author: doc.author_name?.join(', '),
      publisher: doc.publisher?.[0],
      year: doc.first_publish_year,
      imageUrl: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : undefined,
      catalogueName: 'Books',
      metadata: { source: 'openlibrary', isbn },
    };
  } catch {
    return null;
  }
}

/** Look up a food product via Open Food Facts */
async function lookupOpenFoodFacts(barcode: string): Promise<LookupResult | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data.status !== 1) return null;
    const product = data.product;
    return {
      name: product.product_name ?? 'Unknown Product',
      description: product.generic_name,
      manufacturer: product.brands,
      imageUrl: product.image_url,
      catalogueName: 'Food & Drink',
      metadata: { source: 'openfoodfacts', barcode },
    };
  } catch {
    return null;
  }
}

/** Look up a book via Google Books API */
async function lookupGoogleBooks(query: string): Promise<LookupResult | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (!data.items?.length) return null;
    const vol = data.items[0].volumeInfo;
    const isbn = vol.industryIdentifiers?.find(
      (id: { type: string; identifier: string }) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier;
    return {
      name: vol.title ?? query,
      author: vol.authors?.join(', '),
      publisher: vol.publisher,
      year: vol.publishedDate ? parseInt(vol.publishedDate.slice(0, 4)) : undefined,
      imageUrl: vol.imageLinks?.thumbnail?.replace('http:', 'https:'),
      catalogueName: 'Books',
      metadata: { source: 'googlebooks', isbn },
    };
  } catch {
    return null;
  }
}


function guessCatalogue(query: string): string {
  const q = query.toLowerCase();
  if (/\b(game|xbox|playstation|nintendo|ps[2345]|switch)\b/.test(q)) return 'Video Games';
  if (/\b(cd|album|vinyl|record|music)\b/.test(q)) return 'Music';
  if (/\b(dvd|blu.?ray|movie|film|series|episode)\b/.test(q)) return 'Movies & TV';
  if (/\b(phone|laptop|tablet|computer|camera|console|tv|television)\b/.test(q))
    return 'Electronics';
  if (/\b(tool|drill|hammer|saw|wrench)\b/.test(q)) return 'Tools';
  if (/\b(toy|lego|action figure|puzzle|doll)\b/.test(q)) return 'Toys';
  if (/\b(watch|jewel|ring|necklace)\b/.test(q)) return 'Jewellery';
  if (/\b(book|novel|fiction|nonfiction|biography)\b/.test(q)) return 'Books';
  return 'General';
}

/** Main lookup entry point */
export async function lookupItem(query: string): Promise<LookupResult | null> {
  const trimmed = query.trim();

  if (isBarcode(trimmed)) {
    // Try Open Food Facts first (covers most consumer barcodes)
    const food = await lookupOpenFoodFacts(trimmed);
    if (food) return food;

    // Try Open Library (ISBN-13 starts with 978/979)
    if (/^97[89]/.test(trimmed)) {
      const book = await lookupOpenLibrary(trimmed);
      if (book) return book;
    }

    // Return minimal result so user can fill in details
    return {
      name: '',
      catalogueName: 'General',
      metadata: { source: 'manual', barcode: trimmed },
    };
  }

  // Text search – try Open Library, then Google Books, then guess catalogue
  const bookResult = await searchOpenLibrary(trimmed);
  if (bookResult) return bookResult;

  const googleResult = await lookupGoogleBooks(trimmed);
  if (googleResult) return googleResult;

  return {
    name: trimmed,
    catalogueName: guessCatalogue(trimmed),
    metadata: { source: 'manual' },
  };
}
