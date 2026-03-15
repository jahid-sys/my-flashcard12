import { createApplication } from '@specific-dev/framework';
import * as appSchema from './src/db/schema/schema.js';
import * as authSchema from './src/db/schema/auth-schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const schema = { ...appSchema, ...authSchema };
const app = await createApplication(schema);

// Find or create demo user
const existingUser = await app.db.query.user.findFirst({
  where: eq(schema.user.email, 'demo@example.com'),
});

let demoUserId: string;

if (existingUser) {
  demoUserId = existingUser.id;
  console.log('Using existing demo user:', demoUserId);
} else {
  // For seeding, we'll create the user entry directly
  // In production, users are created through auth endpoints
  demoUserId = randomUUID();
  const users = await app.db.insert(schema.user).values({
    id: demoUserId,
    email: 'demo@example.com',
    name: 'Demo Student',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
  }).returning();
  demoUserId = users[0].id;
  console.log('Created demo user:', demoUserId);
}

// Create Deck 1: Biology
const deck1 = await app.db.insert(schema.decks).values({
  userId: demoUserId,
  title: 'Biology Chapter 5',
  subject: 'Biology',
  description: 'Cell division and mitosis',
  cardCount: 5,
}).returning();

const deck1Id = deck1[0].id;
console.log('Created deck 1:', deck1Id);

const cards1 = [
  {
    deckId: deck1Id,
    question: 'What is mitosis?',
    answer: 'Cell division producing two genetically identical daughter cells',
    position: 1,
  },
  {
    deckId: deck1Id,
    question: 'What are the phases of mitosis?',
    answer: 'Prophase, Metaphase, Anaphase, Telophase',
    position: 2,
  },
  {
    deckId: deck1Id,
    question: 'What is a chromosome?',
    answer: 'A thread-like structure of DNA and protein that carries genetic information',
    position: 3,
  },
  {
    deckId: deck1Id,
    question: 'What is cytokinesis?',
    answer: 'The division of the cytoplasm following nuclear division',
    position: 4,
  },
  {
    deckId: deck1Id,
    question: 'What is the difference between mitosis and meiosis?',
    answer: 'Mitosis produces 2 identical diploid cells; meiosis produces 4 genetically diverse haploid cells',
    position: 5,
  },
];

await app.db.insert(schema.flashcards).values(cards1);
console.log('Created 5 flashcards for deck 1');

// Create Deck 2: History
const deck2 = await app.db.insert(schema.decks).values({
  userId: demoUserId,
  title: 'History: World War II',
  subject: 'History',
  description: 'Key events and figures of WWII',
  cardCount: 5,
}).returning();

const deck2Id = deck2[0].id;
console.log('Created deck 2:', deck2Id);

const cards2 = [
  {
    deckId: deck2Id,
    question: 'When did World War II begin?',
    answer: 'September 1, 1939, when Germany invaded Poland',
    position: 1,
  },
  {
    deckId: deck2Id,
    question: 'What was D-Day?',
    answer: 'The Allied invasion of Normandy, France on June 6, 1944',
    position: 2,
  },
  {
    deckId: deck2Id,
    question: 'Who was the Prime Minister of the UK during WWII?',
    answer: 'Winston Churchill',
    position: 3,
  },
  {
    deckId: deck2Id,
    question: 'What was the Manhattan Project?',
    answer: 'The US-led research project that developed the first nuclear weapons',
    position: 4,
  },
  {
    deckId: deck2Id,
    question: 'When did WWII end?',
    answer: 'September 2, 1945, with Japan\'s formal surrender',
    position: 5,
  },
];

await app.db.insert(schema.flashcards).values(cards2);
console.log('Created 5 flashcards for deck 2');

console.log('Seed data created successfully!');
process.exit(0);
