-- The follow-up step (op "next") is tracked as its own learning event.
alter table public.lookers_engine_events drop constraint lookers_engine_events_event_check;
alter table public.lookers_engine_events add constraint lookers_engine_events_event_check check (event = any (array['intake','question_shown','answered','skipped','suggestion_used','brief_shown','brief_edited','brief_confirmed','composed','copied','tool_opened','feedback','followed_up']));
