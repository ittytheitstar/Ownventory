import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ adapter: { url: process.env.DATABASE_URL } });

const CATALOGUES = [
  { name: 'Books', description: 'Books, novels, textbooks and magazines', icon: '📚' },
  { name: 'Video Games', description: 'Video games and gaming accessories', icon: '🎮' },
  { name: 'Music', description: 'CDs, vinyl records and cassettes', icon: '🎵' },
  { name: 'Movies & TV', description: 'DVDs, Blu-rays and streaming collections', icon: '🎬' },
  { name: 'Electronics', description: 'Phones, computers, cameras and gadgets', icon: '💻' },
  { name: 'Tools', description: 'Hand tools, power tools and equipment', icon: '🔧' },
  { name: 'Toys', description: 'Toys, games and collectibles', icon: '🧸' },
  { name: 'Jewellery', description: 'Watches, rings, necklaces and accessories', icon: '💍' },
  { name: 'Food & Drink', description: 'Pantry items and beverages', icon: '🍷' },
  { name: 'General', description: 'Miscellaneous household items', icon: '📦' },
];

async function main() {
  console.log('Seeding catalogues...');
  for (const cat of CATALOGUES) {
    await prisma.catalogue.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
