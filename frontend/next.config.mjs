/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'books.google.com' },
      { protocol: 'https', hostname: 'images.barcodelookup.com' },
      { protocol: 'https', hostname: 'static.openfoodfacts.org' },
      { protocol: 'https', hostname: 'www.googleapis.com' },
    ],
  },
};

export default nextConfig;
