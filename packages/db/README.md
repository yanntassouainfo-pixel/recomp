# @recomp/db

Schéma Supabase (PostgreSQL). Appliquer avec `supabase db push` ou coller `supabase/migrations/0001_init.sql` dans l'éditeur SQL.

- Toutes les tables utilisateur portent `user_id` + RLS « propriétaire uniquement ».
- Bucket `body-photos` privé : accès par URL signée, chemin `{user_id}/{photo_id}.jpg`.
- `export_user_data()` renvoie un JSON complet ; `delete_user_data()` supprime tout (RGPD).
- `consents` : chaque consentement est horodaté et révocable.
- `integrations` + `health_samples` : architecture prête pour Apple Health, Health Connect, Garmin, Fitbit, Oura, Withings.
