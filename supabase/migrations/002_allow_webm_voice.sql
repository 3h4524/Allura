-- Run this only if 001_initial_schema.sql was already executed before
-- browser MediaRecorder support was added.
alter table public.voice_files drop constraint if exists voice_file_type_check;
alter table public.voice_files add constraint voice_file_type_check
  check (mime_type in ('audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav'));
