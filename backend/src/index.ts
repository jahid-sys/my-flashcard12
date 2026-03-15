import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema/schema.js';
import * as authSchema from './db/schema/auth-schema.js';
import { registerDecksRoutes } from './routes/decks.js';
import { registerFlashcardsRoutes } from './routes/flashcards.js';
import { registerQuizRoutes } from './routes/quiz.js';

const schema = { ...appSchema, ...authSchema };

export const app = await createApplication(schema);

export type App = typeof app;

app.withAuth();

// Register routes
registerDecksRoutes(app);
registerFlashcardsRoutes(app);
registerQuizRoutes(app);

await app.run();
app.logger.info('Application running');
