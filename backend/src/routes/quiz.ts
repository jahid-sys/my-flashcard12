import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { gateway } from '@specific-dev/framework';
import { generateText } from 'ai';
import { randomUUID } from 'crypto';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface GenerateCardsBody {
  notes: string;
}

interface QuizQuestion {
  flashcard_id: string;
  question: string;
  correct_answer: string;
  options: string[];
}

interface QuizAttemptBody {
  deck_id: string;
  answers: Array<{
    flashcard_id: string;
    selected_answer: string;
  }>;
}

interface QuizAnswer {
  flashcard_id: string;
  question: string;
  correct_answer: string;
  selected_answer: string;
  is_correct: boolean;
}

export function registerQuizRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // POST /api/decks/:deckId/generate - Generate flashcards from notes
  app.fastify.post('/api/decks/:deckId/generate', {
    schema: {
      description: 'Generate flashcards from student notes',
      tags: ['ai-generation'],
      params: {
        type: 'object',
        required: ['deckId'],
        properties: {
          deckId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['notes'],
        properties: {
          notes: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
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
  }, async (request: FastifyRequest<{ Params: { deckId: string }; Body: GenerateCardsBody }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { deckId } = request.params;
    const { notes } = request.body;
    app.logger.info({ userId: session.user.id, deckId }, 'Generating flashcards from notes');

    if (!notes || !notes.trim()) {
      app.logger.warn({ userId: session.user.id, deckId }, 'Notes are empty');
      reply.status(400);
      return { error: 'Notes cannot be empty' };
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

    try {
      app.logger.info({ userId: session.user.id, deckId }, 'Calling AI to generate flashcards');
      const { text } = await generateText({
        model: gateway('openai/gpt-4o-mini'),
        system: 'You are an expert study assistant. Given student notes, generate clear, concise flashcard question-answer pairs. Each question should test a single concept. Answers should be brief but complete. Return ONLY a valid JSON array of objects with "question" and "answer" string fields, no markdown, no explanation.',
        prompt: `Generate between 5 and 15 flashcard pairs based on the length and complexity of these notes:\n\n${notes}`,
      });

      const pairs = JSON.parse(text) as Array<{ question: string; answer: string }>;

      // Get current max position
      const maxCard = await app.db.query.flashcards.findFirst({
        where: eq(schema.flashcards.deckId, deckId),
        orderBy: desc(schema.flashcards.position),
      });

      const startPosition = (maxCard?.position ?? 0) + 1;

      // Insert all generated flashcards
      const newCards = await app.db.insert(schema.flashcards).values(
        pairs.map((pair, index) => ({
          deckId,
          question: pair.question,
          answer: pair.answer,
          position: startPosition + index,
        }))
      ).returning();

      // Update deck card count and updatedAt
      await app.db.update(schema.decks)
        .set({
          cardCount: deck.cardCount + newCards.length,
          updatedAt: new Date(),
        })
        .where(eq(schema.decks.id, deckId));

      app.logger.info({ userId: session.user.id, deckId, count: newCards.length }, 'Flashcards generated successfully');
      reply.status(201);
      return { flashcards: newCards };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, deckId }, 'Failed to generate flashcards');
      reply.status(500);
      return { error: 'Failed to generate flashcards' };
    }
  });

  // POST /api/decks/:deckId/quiz - Generate quiz with AI-generated distractors
  app.fastify.post('/api/decks/:deckId/quiz', {
    schema: {
      description: 'Generate a quiz for a deck',
      tags: ['quiz'],
      params: {
        type: 'object',
        required: ['deckId'],
        properties: {
          deckId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            quiz_id: { type: 'string' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  flashcard_id: { type: 'string', format: 'uuid' },
                  question: { type: 'string' },
                  correct_answer: { type: 'string' },
                  options: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
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
  }, async (request: FastifyRequest<{ Params: { deckId: string } }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { deckId } = request.params;
    app.logger.info({ userId: session.user.id, deckId }, 'Generating quiz');

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

    // Fetch all flashcards
    const flashcards = await app.db.query.flashcards.findMany({
      where: eq(schema.flashcards.deckId, deckId),
    });

    if (flashcards.length < 2) {
      app.logger.warn({ userId: session.user.id, deckId }, 'Deck has fewer than 2 cards');
      reply.status(400);
      return { error: 'Deck needs at least 2 cards to generate a quiz' };
    }

    try {
      app.logger.info({ userId: session.user.id, deckId, cardCount: flashcards.length }, 'Calling AI to generate distractors');

      const { text } = await generateText({
        model: gateway('openai/gpt-4o-mini'),
        system: 'You are a quiz generator. For each flashcard, generate exactly 3 plausible but incorrect answer options (distractors). Return ONLY a valid JSON array where each element has "flashcard_id" (string) and "distractors" (array of 3 strings). No markdown, no explanation.',
        prompt: `Generate distractors for these flashcards:\n\n${JSON.stringify(
          flashcards.map(f => ({ id: f.id, question: f.question, answer: f.answer }))
        )}`,
      });

      const distractor_map = JSON.parse(text) as Array<{
        flashcard_id: string;
        distractors: string[];
      }>;

      const distractor_lookup = new Map(
        distractor_map.map(d => [d.flashcard_id, d.distractors])
      );

      // Build questions with shuffled options
      const questions = flashcards.map(card => {
        const distractors = distractor_lookup.get(card.id) || ['', '', ''];
        const options = [card.answer, ...distractors].sort(() => Math.random() - 0.5);
        return {
          flashcard_id: card.id,
          question: card.question,
          correct_answer: card.answer,
          options,
        };
      });

      const quiz_id = randomUUID();
      app.logger.info({ userId: session.user.id, deckId, quizId: quiz_id }, 'Quiz generated successfully');
      return { quiz_id, questions };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, deckId }, 'Failed to generate quiz');
      reply.status(500);
      return { error: 'Failed to generate quiz' };
    }
  });

  // POST /api/quiz-attempts - Submit quiz answers and record attempt
  app.fastify.post('/api/quiz-attempts', {
    schema: {
      description: 'Submit quiz answers',
      tags: ['quiz'],
      body: {
        type: 'object',
        required: ['deck_id', 'answers'],
        properties: {
          deck_id: { type: 'string', format: 'uuid' },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              required: ['flashcard_id', 'selected_answer'],
              properties: {
                flashcard_id: { type: 'string', format: 'uuid' },
                selected_answer: { type: 'string' },
              },
            },
          },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            deckId: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            score: { type: 'integer' },
            total: { type: 'integer' },
            percentage: { type: 'string' },
            answers: { type: 'object' },
            completedAt: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest<{ Body: QuizAttemptBody }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { deck_id, answers } = request.body;
    app.logger.info({ userId: session.user.id, deckId: deck_id, answerCount: answers.length }, 'Submitting quiz attempt');

    if (!deck_id || !answers) {
      app.logger.warn({ userId: session.user.id }, 'Missing deck_id or answers');
      reply.status(400);
      return { error: 'deck_id and answers are required' };
    }

    // Verify deck belongs to user
    const deck = await app.db.query.decks.findFirst({
      where: eq(schema.decks.id, deck_id),
    });

    if (!deck) {
      app.logger.warn({ userId: session.user.id, deckId: deck_id }, 'Deck not found');
      reply.status(404);
      return { error: 'Deck not found' };
    }

    if (deck.userId !== session.user.id) {
      app.logger.warn({ userId: session.user.id, deckId: deck_id }, 'Unauthorized access to deck');
      reply.status(403);
      return { error: 'Forbidden' };
    }

    // Fetch all flashcards for the deck
    const flashcards = await app.db.query.flashcards.findMany({
      where: eq(schema.flashcards.deckId, deck_id),
    });

    // Build flashcard lookup
    const cardLookup = new Map(flashcards.map(f => [f.id, f]));

    // Process answers
    const results: QuizAnswer[] = [];
    let score = 0;

    for (const answer of answers) {
      const card = cardLookup.get(answer.flashcard_id);
      if (!card) continue;

      const isCorrect = answer.selected_answer === card.answer;
      if (isCorrect) score++;

      results.push({
        flashcard_id: answer.flashcard_id,
        question: card.question,
        correct_answer: card.answer,
        selected_answer: answer.selected_answer,
        is_correct: isCorrect,
      });
    }

    const total = results.length;
    const percentage = ((score / total) * 100).toFixed(2);

    // Insert quiz attempt
    const attempt = await app.db.insert(schema.quizAttempts).values({
      deckId: deck_id,
      userId: session.user.id,
      score,
      total,
      percentage,
      answers: results,
    }).returning();

    app.logger.info({ userId: session.user.id, deckId: deck_id, score, total }, 'Quiz attempt recorded');
    reply.status(201);
    return attempt[0];
  });

  // GET /api/decks/:deckId/attempts - Get quiz attempts for a deck
  app.fastify.get('/api/decks/:deckId/attempts', {
    schema: {
      description: 'Get quiz attempts for a deck',
      tags: ['quiz'],
      params: {
        type: 'object',
        required: ['deckId'],
        properties: {
          deckId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              deckId: { type: 'string', format: 'uuid' },
              userId: { type: 'string' },
              score: { type: 'integer' },
              total: { type: 'integer' },
              percentage: { type: 'string' },
              answers: { type: 'object' },
              completedAt: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest<{ Params: { deckId: string } }>, reply: FastifyReply) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { deckId } = request.params;
    app.logger.info({ userId: session.user.id, deckId }, 'Fetching quiz attempts');

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

    const attempts = await app.db.query.quizAttempts.findMany({
      where: eq(schema.quizAttempts.deckId, deckId),
      orderBy: desc(schema.quizAttempts.completedAt),
      limit: 10,
    });

    app.logger.info({ userId: session.user.id, deckId, count: attempts.length }, 'Quiz attempts fetched');
    return attempts;
  });
}
