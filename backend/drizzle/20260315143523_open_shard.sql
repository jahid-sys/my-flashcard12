ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_deck_id_decks_id_fk";
--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;