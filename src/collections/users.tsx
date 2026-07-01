import { AdditionalFieldDelegate, buildCollection } from "firecms";
import { GeoPoint } from "firebase/firestore";

export type LikeDoc = {
  id?: string;
  audioId?: string;
  createdAt?: Date;
};

export type UserDoc = {
  id?: string;
  uid?: string;
  firstname?: string;
  discipline?: string;
  email?: string;
  premium?: boolean;
  // Origine du premium. "manual" = offert par un admin depuis le CMS.
  // Les vrais abonnés payants n'ont pas ce champ mais ont productId/subscriptionStatus.
  premiumSource?: string | null;
  premiumGrantedBy?: string | null;
  premiumGrantedAt?: Date | null;
  // Champs écrits par le webhook RevenueCat (présents => abonné payant).
  subscriptionStatus?: string;
  productId?: string;
  expireAt?: number;
  subscriptionUpdatedAt?: Date;
  userProfileImage?: {
    url?: string;
    compressedUrl?: string;
  };
  location?: GeoPoint;
  locationUpdatedAt?: Date;
  createdAt?: Date;
};

/**
 * Sous-collection "Likes" (path: users/{uid}/likes).
 * Un document par audio liké, identifié par l'audioId.
 */
const likesCollection = buildCollection<LikeDoc>({
  name: "Likes",
  singularName: "Like",
  path: "likes",
  icon: "Favorite",
  permissions: () => ({ read: true, edit: false, create: false, delete: true }),
  properties: {
    audioId: { name: "Audio ID", dataType: "string", readOnly: true },
    createdAt: { name: "Liké le", dataType: "date", readOnly: true },
  },
});

/**
 * Colonne calculée "Statut premium" : distingue d'un coup d'œil un abonné payant
 * (souscrit lui-même via le store) d'un premium offert manuellement par un admin.
 */
const statutPremiumField: AdditionalFieldDelegate<UserDoc> = {
  id: "statutPremium",
  name: "Statut premium",
  Builder: ({ entity }) => {
    const d = entity.values;
    if (d.productId || d.subscriptionStatus) return "🟢 Abonné payant";
    if (d.premium && d.premiumSource === "manual") return "🎁 Premium manuel";
    return "⚪️ Aucun";
  },
};

/**
 * Collection "Utilisateurs" (path: users).
 * Le document est identifié par l'UID Firebase Auth.
 *
 * Seul le champ "Premium" est modifiable : le cocher OFFRE gratuitement l'accès
 * premium à un utilisateur NON-abonné (ami, testeur, cadeau). Un garde-fou empêche
 * de modifier le premium d'un abonné payant. Tous les autres champs sont en lecture
 * seule (écrits par l'app et le webhook RevenueCat).
 */
export const usersCollection = buildCollection<UserDoc>({
  name: "Utilisateurs",
  singularName: "Utilisateur",
  path: "users",
  icon: "Person",
  group: "Utilisateurs",
  description:
    "Comptes utilisateurs (UID Firebase Auth). Coche « Premium » pour OFFRIR gratuitement l'accès à un utilisateur non-abonné. Ne modifie pas un abonné payant (colonne « Statut premium »).",
  permissions: () => ({ read: true, edit: true, create: false, delete: false }),
  subcollections: [likesCollection],
  additionalFields: [statutPremiumField],
  callbacks: {
    onPreSave: ({ values, previousValues, context }) => {
      const prev = previousValues ?? {};
      const isRealSubscriber = Boolean(prev.productId || prev.subscriptionStatus);
      const premiumChanged = values.premium !== prev.premium;

      // Garde-fou : on ne touche jamais au premium d'un abonné payant.
      if (isRealSubscriber && premiumChanged) {
        throw new Error(
          "Impossible de modifier le premium d'un abonné payant depuis le CMS."
        );
      }

      if (values.premium && !prev.premium) {
        // Don manuel : on trace l'origine, l'admin et la date.
        values.premiumSource = "manual";
        values.premiumGrantedBy = context.authController.user?.email ?? "inconnu";
        values.premiumGrantedAt = new Date();
      } else if (!values.premium && prev.premium) {
        // Retrait d'un don manuel : on nettoie les métadonnées.
        values.premiumSource = null;
        values.premiumGrantedBy = null;
        values.premiumGrantedAt = null;
      }

      return values;
    },
  },
  properties: {
    uid: {
      name: "UID",
      description: "Identifiant Firebase Auth (= ID du document).",
      dataType: "string",
      readOnly: true,
    },
    firstname: {
      name: "Prénom",
      dataType: "string",
      readOnly: true,
    },
    email: {
      name: "Email",
      dataType: "string",
      readOnly: true,
    },
    discipline: {
      name: "Discipline",
      dataType: "string",
      readOnly: true,
      enumValues: {
        cso: "CSO",
        dressage: "Dressage",
        cce: "CCE",
        loisir: "Loisir",
      },
    },
    premium: {
      name: "Premium",
      description:
        "Cocher pour OFFRIR le premium gratuitement (utilisateur non-abonné). Ne pas modifier un abonné payant.",
      dataType: "boolean",
    },
    premiumSource: {
      name: "Origine du premium",
      description: "« Offert (manuel) » = accordé par un admin. Vide = abonné payant ou aucun.",
      dataType: "string",
      readOnly: true,
      enumValues: {
        manual: "Offert (manuel)",
      },
    },
    productId: {
      name: "Produit d'abonnement",
      description: "Renseigné pour un abonné payant (webhook RevenueCat).",
      dataType: "string",
      readOnly: true,
    },
    subscriptionStatus: {
      name: "Statut abonnement (RevenueCat)",
      dataType: "string",
      readOnly: true,
    },
    expireAt: {
      name: "Abonnement expire le (ms)",
      dataType: "number",
      readOnly: true,
    },
    subscriptionUpdatedAt: {
      name: "Abonnement mis à jour le",
      dataType: "date",
      readOnly: true,
    },
    premiumGrantedBy: {
      name: "Premium offert par",
      dataType: "string",
      readOnly: true,
    },
    premiumGrantedAt: {
      name: "Premium offert le",
      dataType: "date",
      readOnly: true,
    },
    userProfileImage: {
      name: "Photo de profil",
      dataType: "map",
      properties: {
        url: {
          name: "Image",
          dataType: "string",
          url: "image",
          readOnly: true,
        },
        compressedUrl: {
          name: "Image compressée",
          dataType: "string",
          url: "image",
          readOnly: true,
        },
      },
    },
    location: {
      name: "Localisation",
      description: "Dernière géolocalisation connue.",
      dataType: "geopoint",
      readOnly: true,
    },
    locationUpdatedAt: {
      name: "Localisation mise à jour le",
      dataType: "date",
      readOnly: true,
    },
    createdAt: {
      name: "Compte créé le",
      dataType: "date",
      readOnly: true,
    },
  },
});
