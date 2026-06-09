import { buildCollection } from "firecms";

export type VideoDoc = {
  id?: string;
  titre?: string;
  expert?: string;
  sousTitre?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt?: Date;
};

/**
 * Collection "Vidéos" (path: videos) -> écran EQUI TV de l'app.
 * - Déposer un fichier MP4 -> uploadé dans Storage, l'URL est stockée dans
 *   `videoUrl` (lu et joué in-app).
 * - Miniature optionnelle (image) -> `thumbnailUrl`.
 * - `createdAt` est rempli automatiquement à la création (tri du plus récent).
 */
export const videosCollection = buildCollection<VideoDoc>({
  name: "Vidéos",
  singularName: "Vidéo",
  path: "videos",
  icon: "Videocam",
  group: "Contenu",
  permissions: () => ({ read: true, edit: true, create: true, delete: true }),
  callbacks: {
    onPreSave: ({ values }) => {
      if (!values.createdAt) {
        values.createdAt = new Date();
      }
      return values;
    },
  },
  properties: {
    titre: {
      name: "Titre",
      dataType: "string",
      validation: { required: true },
    },
    expert: {
      name: "Expert",
      description: "Nom de l'expert (ex. « Mathilde Level »).",
      dataType: "string",
      validation: { required: true },
    },
    sousTitre: {
      name: "Sous-titre",
      description: "Optionnel — discipline / écurie (ex. « Level Jump »).",
      dataType: "string",
    },
    description: {
      name: "Description",
      dataType: "string",
      multiline: true,
    },
    videoUrl: {
      name: "Fichier vidéo",
      description: "Déposer un MP4. Uploadé dans Storage, joué dans l'app.",
      dataType: "string",
      validation: { required: true },
      storage: {
        storagePath: "videos",
        acceptedFiles: ["video/*"],
        storeUrl: true,
      },
    },
    thumbnailUrl: {
      name: "Miniature",
      description: "Image d'aperçu (optionnel).",
      dataType: "string",
      storage: {
        storagePath: "videos/thumbnails",
        acceptedFiles: ["image/*"],
        storeUrl: true,
      },
    },
    createdAt: {
      name: "Ajoutée le",
      dataType: "date",
      readOnly: true,
    },
  },
});
