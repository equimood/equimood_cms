# CMS — Premium manuel + distinction abonné payant / premium offert

Date : 2026-07-01
Statut : validé (design)

## Objectif

Permettre à un administrateur, depuis le CMS (FireCMS), d'**offrir gratuitement**
le premium à un utilisateur via une **case à cocher**, et de **distinguer visuellement**
dans le CMS les utilisateurs qui ont souscrit un abonnement payant eux-mêmes de ceux
à qui le premium a été accordé manuellement.

Contrainte forte : **on ne touche jamais aux vrais abonnés payants** — la case à cocher
sert uniquement à accorder/retirer un premium offert à des non-abonnés (amis, testeurs,
cadeaux, influenceurs). Pas d'alerte email : indicateur visuel uniquement.

## Contexte existant

- `equimood_cms/src/collections/users.tsx` : collection « Utilisateurs » entièrement en
  lecture seule (`edit: false`), champ `premium` en `readOnly`.
- `equimood_cloud/firestore.rules` : `users/{uid}` autorise l'écriture **uniquement par
  l'utilisateur lui-même** et **interdit** les champs d'abonnement (`noSubFields()`).
  Aucune règle n'autorise l'admin à écrire → à modifier.
- `equimood_cloud/functions/src/webhook/payment.ts` : le webhook RevenueCat écrit, pour un
  vrai abonné, `premium`, `subscriptionStatus`, `subscriptionUpdatedAt`, `productId`,
  `expireAt`. **Un vrai abonné est donc identifiable par la présence de `productId` /
  `subscriptionStatus`.**
- App Flutter : `premiumProvider` lit le champ `premium` du doc Firestore → un premium
  manuel débloque déjà l'app, **aucun changement côté Flutter**.

## Approche retenue

**Écriture directe FireCMS (client SDK) + règles Firestore ajustées.** Natif FireCMS,
minimal, pas de backend ajouté. (Alternative écartée : Cloud Function admin SDK — overkill.)

**Le webhook RevenueCat n'est pas modifié** (scope minimal).

## Modèle de données (Firestore `users/{uid}`)

Champs ajoutés (écrits uniquement par le CMS pour un don manuel) :

- `premiumSource: "manual"` — marque un premium accordé à la main. (Les vrais abonnés
  restent identifiés par `productId` / `subscriptionStatus`, pas par ce champ.)
- `premiumGrantedBy: string` — email de l'admin ayant accordé le premium (audit).
- `premiumGrantedAt: timestamp` — date du don (audit).

Quand l'admin retire le premium manuel : `premium = false`, et `premiumSource`,
`premiumGrantedBy`, `premiumGrantedAt` remis à `null`.

## Comportement CMS (`users.tsx`)

1. **Indicateur « Statut premium »** (lecture seule), calculé :
   - 🟢 **Abonné payant** : `productId` ou `subscriptionStatus` présent.
   - 🎁 **Premium manuel** : `premium == true` && `premiumSource == "manual"`.
   - ⚪️ **Aucun** : sinon.
2. Affichage lecture seule de `productId`, `subscriptionStatus`, `expireAt`,
   `premiumSource`, `premiumGrantedBy`, `premiumGrantedAt` pour le détail.
3. **Case à cocher `premium` éditable** : collection en `edit: true`, mais **seul
   `premium` est éditable** (tous les autres champs restent `readOnly`).
4. **`callbacks.onPreSave`** :
   - Si `premium` passe à `true` : injecte `premiumSource: "manual"`,
     `premiumGrantedBy` (email de l'admin courant via le contexte FireCMS),
     `premiumGrantedAt` (date du jour).
   - Si `premium` passe à `false` : remet `premiumSource` / `premiumGrantedBy` /
     `premiumGrantedAt` à `null`.
   - 🛡️ **Garde-fou** : si le doc est un **vrai abonné** (`productId` présent), le
     `onPreSave` **rejette** la modification avec un message clair
     (« Impossible de modifier un abonné payant depuis le CMS »).

## Règles Firestore (`equimood_cloud/firestore.rules`)

Autorisation d'écriture admin **strictement limitée** aux champs de premium manuel :

```
function isManualPremiumWrite() {
  return request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['premium','premiumSource','premiumGrantedBy','premiumGrantedAt']);
}

match /users/{uid} {
  ...
  allow update: if (request.auth != null && request.auth.uid == uid && noSubFields())
    || (isAdmin() && isManualPremiumWrite());
}
```

→ un admin ne peut modifier **que** ces 4 champs, jamais le reste du profil.
Le garde-fou « ne pas toucher aux abonnés payants » est appliqué côté `onPreSave`.

## Impacts

- **equimood_cms** : `src/collections/users.tsx` (champs, indicateur, edit, onPreSave).
- **equimood_cloud** : `firestore.rules` (règle admin scoping) + déploiement CLI.
- **equimood_flutter** : aucun changement.

## Hors périmètre (YAGNI)

- Pas d'alerte email / notification push.
- Pas de modification du webhook RevenueCat.
- Pas d'expiration automatique d'un premium manuel (permanent jusqu'à retrait admin).
