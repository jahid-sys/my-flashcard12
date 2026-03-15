import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface CreateDeckBody {
  title: string;
  subject: string;
  description?: string;
}

interface UpdateDeckBody {
  title?: string;
  subject?: string;
  description?: string;
}

export function registerDecksRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // GET /api/decks - List all decks for authenticated user
  app.fastify.get('/api/decks', {
    schema: {
      description: 'Get all decks for the authenticated user',
      tags: ['decks'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string' },
              title: { type: 'string' },
              subject: { type: 'string' },
              description: { type: ['string', 'null'] },
              cardCount: { type: 'integer' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Fetching decks');
    const decks = await app.db.query.decks.findMany({
      where: eq(schema.decks.userId, session.user.id),
      orderBy: desc(schema.decks.createdAt),
    });
    app.logger.info({ userId: session.user.id, count: decks.length }, 'Decks fetched');
    return decks;
  });

  // POST /api/decks - Create a new deck
  app.fastify.post('/api/decks', {
    schema: {
      description: 'Create a new deck',
      tags: ['decks'],
      body: {
        type: 'object',
        required: ['title', 'subject'],
        properties: {
          title: { type: 'string' },
          subject: { type: 'string' },
          description: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            title: { type: 'string' },
            subject: { type: 'string' },
            description: { type: ['string', 'null'] },
            cardCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
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
      },
    },
  }, async (request: FastifyRequest<{ Body: CreateDeckBody }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { title, subject, description } = request.body;
    app.logger.info({ userId: session.user.id, title, subject }, 'Creating deck');

    if (!title || !subject) {
      app.logger.warn({ userId: session.user.id, body: request.body }, 'Missing required fields');
      reply.status(400);
      return { error: 'Title and subject are required' };
    }

    const newDeck = await app.db.insert(schema.decks).values({
      userId: session.user.id,
      title,
      subject,
      description: description || null,
      cardCount: 0,
    }).returning();

    app.logger.info({ userId: session.user.id, deckId: newDeck[0].id }, 'Deck created');
    reply.status(201);
    return newDeck[0];
  });

  // GET /api/decks/:id - Get a specific deck with flashcards
  app.fastify.get('/api/decks/:id', {
    schema: {
      description: 'Get a deck with all its flashcards',
      tags: ['decks'],
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
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            title: { type: 'string' },
            subject: { type: 'string' },
            description: { type: ['string', 'null'] },
            cardCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            flashcards: {
              type: 'array',
              items: {
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
            },
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
    app.logger.info({ userId: session.user.id, deckId: id }, 'Fetching deck');

    const deck = await app.db.query.decks.findFirst({
      where: eq(schema.decks.id, id),
    });

    if (!deck) {
      app.logger.warn({ userId: session.user.id, deckId: id }, 'Deck not found');
      reply.status(404);
      return { error: 'Deck not found' };
    }

    if (deck.userId !== session.user.id) {
      app.logger.warn({ userId: session.user.id, deckId: id }, 'Unauthorized access to deck');
      reply.status(403);
      return { error: 'Forbidden' };
    }

    const flashcards = await app.db.query.flashcards.findMany({
      where: eq(schema.flashcards.deckId, id),
      orderBy: schema.flashcards.position,
    });

    app.logger.info({ userId: session.user.id, deckId: id, cardCount: flashcards.length }, 'Deck fetched');
    return { ...deck, flashcards };
  });

  // PUT /api/decks/:id - Update a deck
  app.fastify.put('/api/decks/:id', {
    schema: {
      description: 'Update a deck',
      tags: ['decks'],
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
          title: { type: 'string' },
          subject: { type: 'string' },
          description: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            title: { type: 'string' },
            subject: { type: 'string' },
            description: { type: ['string', 'null'] },
            cardCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateDeckBody }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;
    app.logger.info({ userId: session.user.id, deckId: id, body: request.body }, 'Updating deck');

    const deck = await app.db.query.decks.findFirst({
      where: eq(schema.decks.id, id),
    });

    if (!deck) {
      app.logger.warn({ userId: session.user.id, deckId: id }, 'Deck not found');
      reply.status(404);
      return { error: 'Deck not found' };
    }

    if (deck.userId !== session.user.id) {
      app.logger.warn({ userId: session.user.id, deckId: id }, 'Unauthorized access to deck');
      reply.status(403);
      return { error: 'Forbidden' };
    }

    const updated = await app.db.update(schema.decks)
      .set({
        title: request.body.title || deck.title,
        subject: request.body.subject || deck.subject,
        description: request.body.description !== undefined ? request.body.description : deck.description,
        updatedAt: new Date(),
      })
      .where(eq(schema.decks.id, id))
      .returning();

    app.logger.info({ userId: session.user.id, deckId: id }, 'Deck updated');
    return updated[0];
  });

  // DELETE /api/decks/:id - Delete a deck
  app.fastify.delete('/api/decks/:id', {
    schema: {
      description: 'Delete a deck',
      tags: ['decks'],
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
    app.logger.info({ userId: session.user.id, deckId: id }, 'Deleting deck');

    const deck = await app.db.query.decks.findFirst({
      where: eq(schema.decks.id, id),
    });

    if (!deck) {
      app.logger.warn({ userId: session.user.id, deckId: id }, 'Deck not found');
      reply.status(404);
      return { error: 'Deck not found' };
    }

    if (deck.userId !== session.user.id) {
      app.logger.warn({ userId: session.user.id, deckId: id }, 'Unauthorized access to deck');
      reply.status(403);
      return { error: 'Forbidden' };
    }

    await app.db.delete(schema.decks).where(eq(schema.decks.id, id));
    app.logger.info({ userId: session.user.id, deckId: id }, 'Deck deleted');
    return { message: 'Deck deleted' };
  });
}
