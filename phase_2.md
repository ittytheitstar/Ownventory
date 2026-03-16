# Phase 2 – Barcode Scanning, Images & Price Estimation

## Goal
Enhance Ownventory with camera-based barcode scanning, automatic image retrieval /
user photo capture, and price-estimation from free public data sources.

## Features
1. **Camera barcode scanner** – use the `zxing` / `html5-qrcode` browser library to
   scan barcodes via the device camera (mobile-optimised).
2. **Image handling**
   - Fetch cover images from Open Library Covers API, Google Books thumbnails, or
     OpenDB.
   - Fall-back prompt: ask the user to take a photo; store it in the `public/uploads`
     Docker volume.
3. **Price estimation**
   - Query eBay Finding API (free, no key required for basic search) or PriceCharting
     for video games / media.
   - Store an estimated value and the date it was fetched.
4. **Bulk import** – CSV upload so users can import existing spreadsheets.
5. **Notifications** – browser push notification when a scan is completed.

## Dependencies added
- `html5-qrcode` (browser barcode scanning)
- `sharp` (server-side image processing)
- Multer / Next.js upload handler for user photos

## Schema changes
- `Item.imageUrl` (stored URL or local path)
- `Item.estimatedValue` (Decimal)
- `Item.valueFetchedAt` (DateTime)

## How to run
Same as Phase 1 – no additional environment variables required for basic usage;
optional `EBAY_APP_ID` for richer price data.
