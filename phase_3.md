# Phase 3 – Stock-Taking, Reports & Advanced Features

## Goal
Complete the full feature set of Ownventory with stock-taking mode, insurance-ready
reports, user authentication, and advanced search / filtering.

## Features
1. **Stock-taking mode**
   - Select a catalogue or collection and enter scanning mode.
   - Items found during the scan are checked off; items **not** scanned show as
     potentially missing after the session ends.
   - Summary report: items confirmed, items missing, new items found.
2. **Insurance / export reports**
   - Generate a PDF summary of a catalogue / collection with item names, descriptions,
     estimated values and images.
   - CSV export of the full inventory.
3. **User authentication**
   - Next-Auth (credentials + optional OAuth) so multiple household members can share
     one instance.
   - Role-based access: owner vs. viewer.
4. **Advanced search & filtering**
   - Filter by catalogue, collection, status, date added, value range.
   - Full-text search across item names and descriptions.
5. **QR-code label printing**
   - Generate a printable QR-code sticker for any item for physical labelling.
6. **PWA support**
   - Installable Progressive Web App for home-screen access on mobile.

## Schema changes
- `User` model with roles
- `StocktakeSession` and `StocktakeItem` models
- `Report` model (cached export blobs)

## Dependencies added
- `next-auth`
- `pdfkit` or `@react-pdf/renderer`
- `qrcode`
- `next-pwa`
