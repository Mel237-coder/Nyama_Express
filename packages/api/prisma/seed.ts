import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test users first
  const users = await prisma.user.createMany({
    data: [
      { id: 'test-owner-1', phone: '+237699999990', role: UserRole.RESTAURANT_OWNER, status: UserStatus.ACTIVE, firstName: 'Jean', lastName: 'Dupont' },
      { id: 'test-owner-2', phone: '+237699999991', role: UserRole.RESTAURANT_OWNER, status: UserStatus.ACTIVE, firstName: 'Marie', lastName: 'Kouam' },
      { id: 'test-owner-3', phone: '+237699999992', role: UserRole.RESTAURANT_OWNER, status: UserStatus.ACTIVE, firstName: 'Paul', lastName: 'Essomba' },
      { id: 'test-owner-4', phone: '+237699999993', role: UserRole.RESTAURANT_OWNER, status: UserStatus.ACTIVE, firstName: 'Grace', lastName: 'Ngo' },
      { id: 'test-owner-5', phone: '+237699999994', role: UserRole.RESTAURANT_OWNER, status: UserStatus.ACTIVE, firstName: 'Alain', lastName: 'Mballa' },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ${users.count} users`);

  // Create test restaurants
  const restaurants = await prisma.restaurant.createMany({
    data: [
      {
        name: 'Le Poulet Braisé',
        description: 'Spécialité de poulet braisé au feu de bois avec alloco et attiéké',
        phone: '+237699999999',
        email: 'contact@pouletbraise.cm',
        address: 'Bonapriso, Douala',
        latitude: 4.05,
        longitude: 9.7,
        cuisineTypes: ['africaine', 'grillades'],
        isActive: true,
        ownerId: 'test-owner-1',
      },
      {
        name: 'Chez Kwanga',
        description: 'Cuisine traditionnelle camerounaise : ndolé, eru, kwem, achu',
        phone: '+237699999998',
        email: 'info@chezkwanga.cm',
        address: 'Yaoundé, Essos',
        latitude: 3.85,
        longitude: 11.52,
        cuisineTypes: ['africaine', 'traditionnelle'],
        isActive: true,
        ownerId: 'test-owner-2',
      },
      {
        name: 'Burger King Douala',
        description: 'Burgers gourmet, frites maison et milkshakes',
        phone: '+237699999997',
        email: 'burger@bk.cm',
        address: 'Akwa, Douala',
        latitude: 4.05,
        longitude: 9.71,
        cuisineTypes: ['fast-food', 'burgers'],
        isActive: true,
        ownerId: 'test-owner-3',
      },
      {
        name: 'Sushi Yaoundé',
        description: 'Sushi frais, sashimi et cuisine japonaise authentique',
        phone: '+237699999996',
        email: 'sushi@yaounde.cm',
        address: 'Bastos, Yaoundé',
        latitude: 3.86,
        longitude: 11.51,
        cuisineTypes: ['asiatique', 'sushi'],
        isActive: true,
        ownerId: 'test-owner-4',
      },
      {
        name: 'Maquis le Coin',
        description: 'Maquis authentique : poisson braisé, viande de brousse, plantain',
        phone: '+237699999995',
        email: 'maquis@coin.cm',
        address: 'Kotto, Douala',
        latitude: 4.04,
        longitude: 9.72,
        cuisineTypes: ['maquis', 'grillades'],
        isActive: true,
        ownerId: 'test-owner-5',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ${restaurants.count} restaurants`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
