import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus } from "./helpers";

describe("API Integration Tests", () => {
  // Shared state for chaining tests
  let authToken: string;
  let userId: string;
  let deckId: string;
  let cardId1: string;
  let cardId2: string;

  // Authentication setup
  test("Sign up test user", async () => {
    const { token, user } = await signUpTestUser();
    authToken = token;
    userId = user.id;
    expect(authToken).toBeDefined();
    expect(userId).toBeDefined();
  });

  // Deck CRUD: Create
  test("Create a deck", async () => {
    const res = await authenticatedApi("/api/decks", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Biology Basics",
        subject: "Biology",
        description: "Introduction to cell biology",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    deckId = data.id;
    expect(data.id).toBeDefined();
    expect(data.title).toBe("Biology Basics");
    expect(data.subject).toBe("Biology");
  });

  // Deck CRUD: Get all
  test("Get all decks for authenticated user", async () => {
    const res = await authenticatedApi("/api/decks", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  // Deck CRUD: Get by ID
  test("Get a specific deck with flashcards", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}`, authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(deckId);
    expect(data.title).toBe("Biology Basics");
    expect(Array.isArray(data.flashcards)).toBe(true);
  });

  // Deck CRUD: Update
  test("Update a deck", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}`, authToken, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Advanced Biology",
        description: "Advanced cell biology topics",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.title).toBe("Advanced Biology");
  });

  // Flashcard CRUD: Create first card
  test("Create first flashcard", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}/cards`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What is a mitochondrion?",
        answer: "The powerhouse of the cell",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    cardId1 = data.id;
    expect(data.id).toBeDefined();
    expect(data.question).toBe("What is a mitochondrion?");
    expect(data.deckId).toBe(deckId);
  });

  // Flashcard CRUD: Create second card
  test("Create second flashcard", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}/cards`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What is photosynthesis?",
        answer: "Process by which plants convert light to chemical energy",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    cardId2 = data.id;
    expect(data.id).toBeDefined();
  });

  // Flashcard CRUD: Update
  test("Update a flashcard", async () => {
    const res = await authenticatedApi(`/api/cards/${cardId1}`, authToken, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer: "The organelle responsible for cellular energy production",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(cardId1);
    expect(data.answer).toBe("The organelle responsible for cellular energy production");
  });

  // Quiz: Get attempts (before submission)
  test("Get quiz attempts for deck (empty)", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}/attempts`, authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  // Quiz: Generate quiz
  test("Generate a quiz for the deck", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}/quiz`, authToken, {
      method: "POST",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.quiz_id).toBeDefined();
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBeGreaterThan(0);
  });

  // Quiz: Submit answers
  test("Submit quiz answers", async () => {
    const res = await authenticatedApi("/api/quiz-attempts", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deck_id: deckId,
        answers: [
          {
            flashcard_id: cardId1,
            selected_answer: "The organelle responsible for cellular energy production",
          },
          {
            flashcard_id: cardId2,
            selected_answer: "Process by which plants convert light to chemical energy",
          },
        ],
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.deckId).toBe(deckId);
    expect(data.userId).toBe(userId);
    expect(data.score).toBeDefined();
    expect(data.total).toBeDefined();
    expect(data.percentage).toBeDefined();
  });

  // Quiz: Get attempts (after submission)
  test("Get quiz attempts for deck (with submission)", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}/attempts`, authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  // AI Generation: Generate flashcards from notes
  test("Generate flashcards from notes", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}/generate`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: "DNA is a double helix molecule that stores genetic information. It is composed of nucleotides containing a sugar, phosphate, and nitrogenous base.",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(Array.isArray(data.flashcards)).toBe(true);
  });

  // Flashcard CRUD: Delete
  test("Delete first flashcard", async () => {
    const res = await authenticatedApi(`/api/cards/${cardId1}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.message).toBeDefined();
  });

  test("Delete second flashcard", async () => {
    const res = await authenticatedApi(`/api/cards/${cardId2}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
  });

  // Deck CRUD: Delete
  test("Delete the deck", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.message).toBeDefined();
  });

  // Verify deletion: 404
  test("Verify deck is deleted (404)", async () => {
    const res = await authenticatedApi(`/api/decks/${deckId}`, authToken);
    await expectStatus(res, 404);
  });

  // Error cases: Authentication
  test("Unauthenticated request to GET /api/decks returns 401", async () => {
    const res = await api("/api/decks");
    await expectStatus(res, 401);
  });

  test("Unauthenticated POST to /api/decks returns 401", async () => {
    const res = await api("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", subject: "Test" }),
    });
    await expectStatus(res, 401);
  });

  // Error cases: Missing required fields
  test("Create deck without subject field (400)", async () => {
    const res = await authenticatedApi("/api/decks", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Incomplete Deck" }),
    });
    await expectStatus(res, 400);
  });

  test("Create flashcard without answer field (400)", async () => {
    // Create a temporary deck for this test
    const deckRes = await authenticatedApi("/api/decks", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Temp Test Deck",
        subject: "Temp",
      }),
    });
    const tempDeckData = await deckRes.json();
    const tempDeckId = tempDeckData.id;

    const res = await authenticatedApi(`/api/decks/${tempDeckId}/cards`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Missing answer?" }),
    });
    await expectStatus(res, 400);

    // Cleanup
    await authenticatedApi(`/api/decks/${tempDeckId}`, authToken, {
      method: "DELETE",
    });
  });

  test("Generate from notes without notes field (400)", async () => {
    // Create a temporary deck
    const deckRes = await authenticatedApi("/api/decks", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Temp Deck 2",
        subject: "Temp",
      }),
    });
    const tempDeckData = await deckRes.json();
    const tempDeckId = tempDeckData.id;

    const res = await authenticatedApi(`/api/decks/${tempDeckId}/generate`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await expectStatus(res, 400);

    // Cleanup
    await authenticatedApi(`/api/decks/${tempDeckId}`, authToken, {
      method: "DELETE",
    });
  });

  // Error cases: Non-existent resources (404)
  test("Get non-existent deck (404)", async () => {
    const res = await authenticatedApi(
      "/api/decks/00000000-0000-0000-0000-000000000000",
      authToken
    );
    await expectStatus(res, 404);
  });

  test("Update non-existent deck (404)", async () => {
    const res = await authenticatedApi(
      "/api/decks/00000000-0000-0000-0000-000000000000",
      authToken,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      }
    );
    await expectStatus(res, 404);
  });

  test("Delete non-existent deck (404)", async () => {
    const res = await authenticatedApi(
      "/api/decks/00000000-0000-0000-0000-000000000000",
      authToken,
      {
        method: "DELETE",
      }
    );
    await expectStatus(res, 404);
  });

  test("Create flashcard in non-existent deck (404)", async () => {
    const res = await authenticatedApi(
      "/api/decks/00000000-0000-0000-0000-000000000000/cards",
      authToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Test?",
          answer: "Test",
        }),
      }
    );
    await expectStatus(res, 404);
  });

  test("Update non-existent flashcard (404)", async () => {
    const res = await authenticatedApi(
      "/api/cards/00000000-0000-0000-0000-000000000000",
      authToken,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: "Updated" }),
      }
    );
    await expectStatus(res, 404);
  });

  test("Delete non-existent flashcard (404)", async () => {
    const res = await authenticatedApi(
      "/api/cards/00000000-0000-0000-0000-000000000000",
      authToken,
      {
        method: "DELETE",
      }
    );
    await expectStatus(res, 404);
  });

  test("Generate quiz for non-existent deck (404)", async () => {
    const res = await authenticatedApi(
      "/api/decks/00000000-0000-0000-0000-000000000000/quiz",
      authToken,
      {
        method: "POST",
      }
    );
    await expectStatus(res, 404);
  });

  test("Generate flashcards from notes for non-existent deck (404)", async () => {
    const res = await authenticatedApi(
      "/api/decks/00000000-0000-0000-0000-000000000000/generate",
      authToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Some notes" }),
      }
    );
    await expectStatus(res, 404);
  });

  test("Submit quiz for non-existent deck (404)", async () => {
    const res = await authenticatedApi("/api/quiz-attempts", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deck_id: "00000000-0000-0000-0000-000000000000",
        answers: [],
      }),
    });
    await expectStatus(res, 404);
  });

  test("Get attempts for non-existent deck (404)", async () => {
    const res = await authenticatedApi(
      "/api/decks/00000000-0000-0000-0000-000000000000/attempts",
      authToken
    );
    await expectStatus(res, 404);
  });
});
