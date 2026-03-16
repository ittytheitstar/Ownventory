import { defineConfig } from 'prisma';

export default defineConfig({
  // Migrate and other Prisma tooling will read the datasource URL from here.
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
