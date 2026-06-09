# EquiMood — CMS (FireCMS)

CMS d'administration des audios, basé sur **FireCMS v2** (React + Vite + MUI),
sur le même modèle que `remplapro_cms`. Gère la collection Firestore `audios`
+ l'upload des fichiers dans Storage.

- Connexion réservée à `emiliecolli@orange.fr`, `dahmoun.jason@gmail.com`,
  `contact@depanncar.com` et `enzo41350@gmail.com`
  (whitelist dans `src/App.tsx`, `signInOptions = password + google`).
- Collection **Audios** : titre, **catégorie** (3 « À la maison » + 3 « En
  concours »), type (Audio / Mantra), **fichier audio** (optionnel → upload
  Storage, URL stockée dans `url`). `section`, `categorie` et `disponible` sont
  remplis automatiquement à la sauvegarde.
- On peut créer un nouvel audio, ou éditer un audio « à venir » existant pour
  lui ajouter son fichier.

## Développer

```bash
cd CMS
npm install
npm run dev      # http://localhost:5173
```

## Déployer (Firebase Hosting → equimood-c96f1.web.app)

```bash
cd CMS
npm run deploy   # = tsc && vite build && firebase deploy --only hosting
```

(Le projet par défaut `equimood-c96f1` est défini dans `.firebaserc`.)

## ⚠️ Règles de sécurité (à publier une fois dans la console)

Sans ces règles, le CMS aura `permission-denied`.

**Firestore** (dans `match /databases/{database}/documents`) :

```
match /audios/{id} {
  allow read: if true;
  allow write: if request.auth != null
    && request.auth.token.email in ['emiliecolli@orange.fr', 'dahmoun.jason@gmail.com', 'contact@depanncar.com', 'enzo41350@gmail.com'];
}
```

**Storage** (dans `match /b/{bucket}/o`) :

```
match /audios/{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null
    && request.auth.token.email in ['emiliecolli@orange.fr', 'dahmoun.jason@gmail.com', 'contact@depanncar.com', 'enzo41350@gmail.com'];
}
```

## Comptes

Créés via `../scripts/create_cms_users.js` (admin SDK). « Mot de passe oublié »
disponible sur l'écran de login FireCMS. Pour ajouter un admin : l'ajouter à
`ADMIN_EMAILS` dans `src/App.tsx` **et** aux règles ci-dessus.

## Config

- App Web Firebase « EquiMood CMS » : `1:917568691822:web:7a51600eff2854ffa1507f`
  (config dans `src/firebase-config.ts`, clé `apiKey` publique par nature).
# equimood_cms
