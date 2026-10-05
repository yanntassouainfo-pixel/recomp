# @recomp/mobile — scaffold Expo

Cinq onglets (Home, Train, Food, Body, Coach) branchés sur `@recomp/engine`. Non installé ni lancé dans l'environnement de génération.

```bash
cd apps/mobile
npm install
npx expo start
```

- Stockage local AsyncStorage (write-through) ; la synchro Supabase se branche dans `src/store.ts`.
- Le coach utilise le coach à règles hors-ligne ; avec un backend, appeler `POST /api/coach` (même contrat que le web).
- Les versions de dépendances correspondent à Expo SDK 53 ; ajuster avec `npx expo install --fix` si besoin.
