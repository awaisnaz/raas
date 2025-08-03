import { PrismaClient, EventStatus } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create 2 users
  const user1Password = await hash('password123', 10);
  const user2Password = await hash('password456', 10);

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: user1Password,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: user2Password,
    },
  });

  // Create user with specified email
  const user3Password = await hash('Password123$', 10);
  const user3 = await prisma.user.create({
    data: {
      name: 'Awais Nazir',
      email: 'awais.nazir.ch@gmail.com',
      password: user3Password,
    },
  });

  // Helper function to create a date in the future
  const futureDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  // Create 10 events for user1
  for (let i = 1; i <= 10; i++) {
    const status = i % 3 === 0 ? EventStatus.DRAFT : 
                  i % 3 === 1 ? EventStatus.PUBLISHED : 
                  EventStatus.CANCELED;
    
    await prisma.event.create({
      data: {
        title: `User1 Event ${i}`,
        description: `Description for event ${i} created by user 1`,
        date: futureDate(i),
        location: `US-NY: New York Location ${i}`,
        status,
        userId: user1.id,
      },
    });
  }

  // Create 10 events for user2
  for (let i = 1; i <= 10; i++) {
    const status = i % 3 === 0 ? EventStatus.DRAFT : 
                  i % 3 === 1 ? EventStatus.PUBLISHED : 
                  EventStatus.CANCELED;
    
    await prisma.event.create({
      data: {
        title: `User2 Event ${i}`,
        description: `Description for event ${i} created by user 2`,
        date: futureDate(i + 10),
        location: `UK-LDN: London Location ${i}`,
        status,
        userId: user2.id,
      },
    });
  }

  // Create 8 events for user3 (Awais Nazir)
  for (let i = 1; i <= 8; i++) {
    const status = i % 4 === 0 ? EventStatus.DRAFT : 
                  i % 4 === 1 ? EventStatus.PUBLISHED : 
                  i % 4 === 2 ? EventStatus.PUBLISHED :
                  EventStatus.CANCELED;
    
    await prisma.event.create({
      data: {
        title: `Tech Conference ${i}`,
        description: `Professional development event ${i} - ${i % 2 === 0 ? 'Workshop on modern web technologies' : 'Networking session with industry experts'}`,
        date: futureDate(i + 20),
        location: `PK-KHI: Karachi Tech Hub ${i}`,
        status,
        userId: user3.id,
      },
    });
  }

  // Get some events to add reminders
  const user1Events = await prisma.event.findMany({
    where: { userId: user1.id },
    take: 3,
  });

  const user2Events = await prisma.event.findMany({
    where: { userId: user2.id },
    take: 2,
  });

  const user3Events = await prisma.event.findMany({
    where: { userId: user3.id },
    take: 4,
  });

  // Create 3 reminders for user1
  for (let i = 0; i < user1Events.length; i++) {
    const event = user1Events[i];
    const reminderTime = new Date(event.date);
    // Set reminder between 15 minutes to 7 days before the event
    const hoursBeforeEvent = i === 0 ? 0.25 : i === 1 ? 24 : 168; // 15 min, 1 day, 7 days
    reminderTime.setHours(reminderTime.getHours() - hoursBeforeEvent);

    await prisma.reminder.create({
      data: {
        reminderTime,
        eventId: event.id,
        userId: user1.id,
      },
    });
  }

  // Create 2 reminders for user2
  for (let i = 0; i < user2Events.length; i++) {
    const event = user2Events[i];
    const reminderTime = new Date(event.date);
    // Set reminder between 15 minutes to 7 days before the event
    const hoursBeforeEvent = i === 0 ? 2 : 48; // 2 hours, 2 days
    reminderTime.setHours(reminderTime.getHours() - hoursBeforeEvent);

    await prisma.reminder.create({
      data: {
        reminderTime,
        eventId: event.id,
        userId: user2.id,
      },
    });
  }

  // Create 4 reminders for user3 (Awais Nazir)
  for (let i = 0; i < user3Events.length; i++) {
    const event = user3Events[i];
    const reminderTime = new Date(event.date);
    // Set reminder between 15 minutes to 7 days before the event
    const hoursBeforeEvent = i === 0 ? 0.5 : i === 1 ? 4 : i === 2 ? 24 : 72; // 30 min, 4 hours, 1 day, 3 days
    reminderTime.setHours(reminderTime.getHours() - hoursBeforeEvent);

    await prisma.reminder.create({
      data: {
        reminderTime,
        eventId: event.id,
        userId: user3.id,
      },
    });
  }

  console.log('Database has been seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });