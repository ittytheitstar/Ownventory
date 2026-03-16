# Ownventory

A mobile-friendly home inventory management app. Track everything you own — books, games, electronics, and more — for insurance valuation and personal recall.

## Features (Phase 1)
- 🔍 **Search & Lookup** – enter an item name or barcode to auto-populate details from free public APIs (Open Library, Open Food Facts)
- 📚 **Catalogues** – items are auto-categorised into Books, Video Games, Music, Movies & TV, Electronics, Tools, Toys, Jewellery, Food & Drink, General
- 📁 **Collections** – create custom sub-groups (e.g. "Carl's Books") within a catalogue
- 🏷️ **Status tracking** – mark items as Owned, Lost, Stolen, Damaged, or Destroyed
- 📱 **Mobile-first** – designed for use on a phone

## Getting Started

```bash
cp .env.example .env
docker compose up --build
```

App available at **http://localhost:3000**

## Roadmap
- **[Phase 2](phase_2.md)** – Camera barcode scanning, image upload, price estimation
- **[Phase 3](phase_3.md)** – Stock-taking mode, insurance reports, user authentication
