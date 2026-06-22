import { buildCollection } from "firecms";
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
 * Collection "Utilisateurs" (path: users).
 * Consultation des comptes utilisateurs et de TOUS leurs champs.
 * Le document est identifié par l'UID Firebase Auth.
 * Lecture seule : les données sont écrites par l'app et les webhooks (RevenueCat).
 */
export const usersCollection = buildCollection<UserDoc>({
  name: "Utilisateurs",
  singularName: "Utilisateur",
  path: "users",
  icon: "Person",
  group: "Utilisateurs",
  description:
    "Comptes utilisateurs (identifiés par l'UID Firebase Auth) et tous leurs champs. Lecture seule.",
  permissions: () => ({ read: true, edit: false, create: false, delete: false }),
  subcollections: [likesCollection],
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
      description: "Statut d'abonnement (géré par le webhook RevenueCat).",
      dataType: "boolean",
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
