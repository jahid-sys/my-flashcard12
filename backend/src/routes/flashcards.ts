import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface CreateFlashcardBody {
  question: string;
  answer: string;
}

interface UpdateFlashcardBody {
  question?: string;
  answer?: string;
}

export function registerFlashcardsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // POST /api/decks/:deckId/cards - Create a flashcard
  app.fastify.post('/api/decks/:deckId/cards', {
    schema: {
      description: 'Create a flashcard in a deck',
      tags: ['flashcards'],
      params: {
        type: 'object',
        required: ['deckId'],
        properties: {
          deckId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['question', 'answer'],
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            deckId: { type: 'string', format: 'uuid' },
            question: { type: 'string' },
            answer: { type: 'string' },
            position: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        403: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { deckId: string }; Body: CreateFlashcardBody }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { deckId } = request.params;
    const { question, answer } = request.body;
    app.logger.info({ userId: session.user.id, deckId, question }, 'Creating flashcard');

    if (!question || !answer) {
      app.logger.warn({ userId: session.user.id, deckId }, 'Missing question or answer');
      reply.status(400);
      return { error: 'Question and answer are required' };
    }

    // Verify deck belongs to user
    const deck = await app.db.query.decks.findFirst({
      where: eq(schema.decks.id, deckId),
    });

    if (!deck) {
      app.logger.warn({ userId: session.user.id, deckId }, 'Deck not found');
      reply.status(404);
      return { error: 'Deck not found' };
    }

    if (deck.userId !== session.user.id) {
      app.logger.warn({ userId: session.user.id, deckId }, 'Unauthorized access to deck');
      reply.status(403);
      return { error: 'Forbidden' };
    }

    // Get current max position
    const maxCard = await app.db.query.flashcards.findFirst({
      where: eq(schema.flashcards.deckId, deckId),
      orderBy: desc(schema.flashcards.position),
    });

    const position = (maxCard?.position ?? 0) + 1;

    const newCard = await app.db.insert(schema.flashcards).values({
      deckId,
      question,
      answer,
      position,
    }).returning();

    // Increment deck card count and update updatedAt
    await app.db.update(schema.decks)
      .set({
        cardCount: deck.cardCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.decks.id, deckId));

    app.logger.info({ userId: session.user.id, deckId, cardId: newCard[0].id }, 'Flashcard created');
    reply.status(201);
    return newCard[0];
  });

  // PUT /api/cards/:id - Update a flashcard
  app.fastify.put('/api/cards/:id', {
    schema: {
      description: 'Update a flashcard',
      tags: ['flashcards'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            deckId: { type: 'string', format: 'uuid' },
            question: { type: 'string' },
            answer: { type: 'string' },
            position: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        403: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateFlashcardBody }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;
    app.logger.info({ userId: session.user.id, cardId: id, body: request.body }, 'Updating flashcard');

    const card = await app.db.query.flashcards.findFirst({
      where: eq(schema.flashcards.id, id),
    });

    if (!card) {
      app.logger.warn({ userId: session.user.id, cardId: id }, 'Flashcard not found');
      reply.status(404);
      return { error: 'Flashcard not found' };
    }

    // Verify deck belongs to user
    const deck = await app.db.query.decks.findFirst({
      where: eq(schema.decks.id, card.deckId),
    });

    if (!deck || deck.userId !== session.user.id) {
      app.logger.warn({ userId: session.user.id, cardId: id }, 'Unauthorized access to flashcard');
      reply.status(403);
      return { error: 'Forbidden' };
    }

    const updated = await app.db.update(schema.flashcards)
      .set({
        question: request.body.question || card.question,
        answer: request.body.answer || card.answer,
      })
      .where(eq(schema.flashcards.id, id))
      .returning();

    app.logger.info({ userId: session.user.id, cardId: id }, 'Flashcard updated');
    return updated[0];
  });

  // DELETE /api/cards/:id - Delete a flashcard
  app.fastify.delete('/api/cards/:id', {
    schema: {
      description: 'Delete a flashcard',
      tags: ['flashcards'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        403: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;
    app.logger.info({ userId: session.user.id, cardId: id }, 'Deleting flashcard');

    const card = await app.db.query.flashcards.findFirst({
      where: eq(schema.flashcards.id, id),
    });

    if (!card) {
      app.logger.warn({ userId: session.user.id, cardId: id }, 'Flashcard not found');
      reply.status(404);
      return { error: 'Flashcard not found' };
    }

    // Verify deck belongs to user
    const deck = await app.db.query.decks.findFirst({
      where: eq(schema.decks.id, card.deckId),
    });

    if (!deck || deck.userId !== session.user.id) {
      app.logger.warn({ userId: session.user.id, cardId: id }, 'Unauthorized access to flashcard');
      reply.status(403);
      return { error: 'Forbidden' };
    }

    await app.db.delete(schema.flashcards).where(eq(schema.flashcards.id, id));

    // Decrement deck card count and update updatedAt
    await app.db.update(schema.decks)
      .set({
        cardCount: deck.cardCount - 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.decks.id, card.deckId));

    app.logger.info({ userId: session.user.id, cardId: id }, 'Flashcard deleted');
    return { message: 'Card deleted' };
  });
}
