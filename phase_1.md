# Phase 1 – Foundation & Core Functionality

## Goal
Stand up a fully working Ownventory application running in Docker with a database, core
pages, item-lookup via free public APIs, and a mobile-friendly UI.

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend / API | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS (mobile-first) |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Container runtime | Docker Compose v2 |

## Features delivered
1. **Home / Scan page** – search bar that accepts an item name or barcode; optional
   collection pre-selection before scanning.
2. **Item lookup** – queries Open Library (books), Open Food Facts (food), and a generic
   UPC/barcode endpoint to auto-populate item details and suggest a catalogue category.
3. **Library page** – browse all catalogues and the items within each one.
4. **Collections page** – create/select user-defined collections (sub-groups inside a
   catalogue, e.g. "Carl's Books").
5. **Item detail page** – view full item info; mark as lost / stolen / damaged / destroyed.
6. **CRUD API routes** – `/api/items`, `/api/collections`, `/api/catalogues`,
   `/api/lookup`.

## Database schema (Prisma)
```
Catalogue  →  many Collections
Catalogue  →  many Items
Collection →  many Items (via CollectionItem join table)
Item       →  status enum (OWNED | LOST | STOLEN | DAMAGED | DESTROYED)
```

## How to run
```bash
cp .env.example .env
docker compose up --build
```
The app will be available at **http://localhost:3000**.

## Out of scope (deferred to later phases)
- Camera barcode scanning (Phase 2)
- Image upload / capture (Phase 2)
- Price estimation via external APIs (Phase 2)
- Stock-taking / re-scan mode (Phase 3)
- Export / insurance reports (Phase 3)
