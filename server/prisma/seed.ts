/**
 * بذرة قاعدة البيانات.
 *
 * البيانات منقولة من src/data/menu.js في الواجهة — الملف الذي كان
 * يمثّل "قاعدة البيانات" قبل وجود خادم. بعد تشغيل هذه البذرة يصبح
 * مصدر القائمة هو قاعدة البيانات، وتُدار من لوحة الإدارة.
 *
 * التشغيل:  npm run seed
 * آمنة للتكرار: تستخدم upsert ولا تُنشئ نسخًا مكرّرة.
 */
import { PrismaClient, Prisma } from '@prisma/client';

import { hashPassword } from '../src/lib/password.js';

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CATEGORIES = [
  'Pizza',
  'Grill',
  'Pasta',
  'Burgers',
  'Seafood',
  'Bowls',
  'Desserts',
  'Drinks',
];

const DISHES: Array<{
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
}> = [
  {
    name: 'Truffle Burrata Pizza',
    category: 'Pizza',
    price: 58,
    image:
      'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85',
    description: 'San Marzano tomato, burrata, truffle cream, basil and extra virgin olive oil.',
  },
  {
    name: 'Spicy Pepperoni',
    category: 'Pizza',
    price: 52,
    image:
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=85',
    description: 'Mozzarella, beef pepperoni, chilli honey and roasted tomato sauce.',
  },
  {
    name: 'Garden Verde Pizza',
    category: 'Pizza',
    price: 47,
    image:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85',
    description: 'Grilled vegetables, olives, mushrooms, mozzarella and basil pesto.',
  },
  {
    name: 'Fire-Roasted Steak',
    category: 'Grill',
    price: 89,
    image:
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=85',
    description: 'Chargrilled beef, rosemary jus, roasted garlic and crispy potatoes.',
  },
  {
    name: 'Wild Mushroom Pasta',
    category: 'Pasta',
    price: 54,
    image:
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=85',
    description: 'Fresh tagliatelle, wild mushrooms, parmesan and truffle butter.',
  },
  {
    name: 'Ember House Burger',
    category: 'Burgers',
    price: 49,
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    description: 'Angus beef, smoked cheddar, caramelised onion and house sauce.',
  },
  {
    name: 'Mediterranean Salmon',
    category: 'Seafood',
    price: 76,
    image:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=85',
    description: 'Pan-seared salmon, herb couscous, lemon butter and seasonal greens.',
  },
  {
    name: 'Crispy Chicken Bowl',
    category: 'Bowls',
    price: 45,
    image:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
    description: 'Crispy chicken, fragrant rice, avocado, pickled vegetables and sesame.',
  },
  {
    name: 'Classic Tiramisu',
    category: 'Desserts',
    price: 29,
    image:
      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=85',
    description: 'Espresso-soaked sponge, mascarpone cream and dark cocoa.',
  },
  {
    name: 'Basque Cheesecake',
    category: 'Desserts',
    price: 32,
    image:
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85',
    description: 'Caramelised cheesecake with vanilla cream and seasonal berries.',
  },
  {
    name: 'Citrus Mint Cooler',
    category: 'Drinks',
    price: 22,
    image:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=85',
    description: 'Fresh lime, lemon, mint, crushed ice and sparkling water.',
  },
  {
    name: 'Berry Sunset',
    category: 'Drinks',
    price: 25,
    image:
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85',
    description: 'Mixed berries, passion fruit, citrus and soda.',
  },
];

async function main() {
  // ----------------------------- الإعدادات -----------------------------
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, deliveryFee: new Prisma.Decimal(10) },
  });
  console.log('  settings ready');

  // ---------------------------- التصنيفات ----------------------------
  const categoryIds = new Map<string, number>();

  for (const [index, name] of CATEGORIES.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { displayOrder: index },
      create: { name, slug: slugify(name), displayOrder: index },
    });

    categoryIds.set(name, category.id);
  }
  console.log(`  ${CATEGORIES.length} categories ready`);

  // ------------------------------ الأطباق ------------------------------
  for (const dish of DISHES) {
    const categoryId = categoryIds.get(dish.category);
    if (!categoryId) throw new Error(`Unknown category: ${dish.category}`);

    await prisma.menuItem.upsert({
      where: { slug: slugify(dish.name) },
      update: {
        name: dish.name,
        categoryId,
        price: new Prisma.Decimal(dish.price),
        description: dish.description,
        imageUrl: dish.image,
      },
      create: {
        name: dish.name,
        slug: slugify(dish.name),
        categoryId,
        price: new Prisma.Decimal(dish.price),
        description: dish.description,
        imageUrl: dish.image,
      },
    });
  }
  console.log(`  ${DISHES.length} dishes ready`);

  // ------------------------- حساب إدارة للتطوير -------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@syrup.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`  admin already exists: ${adminEmail}`);
  } else {
    await prisma.user.create({
      data: {
        fullName: 'Syrup Admin',
        email: adminEmail,
        phone: '+971501234567',
        passwordHash: await hashPassword(adminPassword),
        role: 'admin',
      },
    });

    console.log(`\n  admin created`);
    console.log(`     email    : ${adminEmail}`);
    console.log(`     password : ${adminPassword}`);
    console.log(`     >>> غيّر كلمة المرور هذه قبل أي استخدام حقيقي. <<<\n`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
