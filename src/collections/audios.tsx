import { buildCollection } from "firecms";

export type AudioDoc = {
  id?: string;
  titre?: string;
  section?: string;
  sousCategorie?: string;
  categorie?: string;
  type?: string;
  disponible?: boolean;
  url?: string;
  assetPath?: string;
};

// sousCategorie -> { section, categorie } (dérivés automatiquement à la sauvegarde)
const GROUPES: Record<string, { section: string; categorie: string }> = {
  confiance: { section: "quotidien", categorie: "Confiance" },
  stress: { section: "quotidien", categorie: "Stress & Blocages" },
  concentration: { section: "quotidien", categorie: "Concentration" },
  avant: { section: "moments", categorie: "Avant" },
  pendant: { section: "moments", categorie: "Pendant" },
  apres: { section: "moments", categorie: "Après" },
};

/**
 * Collection "Audios" (path: audios).
 * - Choisir une catégorie parmi les 6 (3 « À la maison » + 3 « En concours »).
 * - Déposer un fichier audio (optionnel) -> uploadé dans Storage, l'URL est
 *   stockée dans `url`. Laisser vide = audio « à venir ».
 * - `section`, `categorie` et `disponible` sont remplis automatiquement.
 */
export const audiosCollection = buildCollection<AudioDoc>({
  name: "Audios",
  singularName: "Audio",
  path: "audios",
  icon: "Headphones",
  group: "Contenu",
  permissions: () => ({ read: true, edit: true, create: true, delete: true }),
  callbacks: {
    onPreSave: ({ values }) => {
      const g = values.sousCategorie ? GROUPES[values.sousCategorie] : undefined;
      if (g) {
        values.section = g.section;
        values.categorie = g.categorie;
      }
      values.disponible = !!values.url;
      return values;
    },
  },
  properties: {
    titre: {
      name: "Titre",
      dataType: "string",
      validation: { required: true },
    },
    sousCategorie: {
      name: "Catégorie",
      dataType: "string",
      validation: { required: true },
      enumValues: {
        confiance: "À la maison · Confiance",
        stress: "À la maison · Stress & Blocages",
        concentration: "À la maison · Concentration",
        avant: "En concours · Avant",
        pendant: "En concours · Pendant",
        apres: "En concours · Après",
      },
    },
    type: {
      name: "Type",
      dataType: "string",
      defaultValue: "audio",
      enumValues: { audio: "Audio", mantra: "Mantra" },
    },
    url: {
      name: "Fichier audio",
      description: "Déposer un MP3. Laisser vide pour un audio « à venir ».",
      dataType: "string",
      storage: {
        storagePath: "audios",
        acceptedFiles: ["audio/*"],
        storeUrl: true,
      },
    },
    disponible: {
      name: "Disponible",
      dataType: "boolean",
      readOnly: true,
      description: "Automatique : vrai si un fichier audio est présent.",
    },
    section: { name: "Section", dataType: "string", readOnly: true },
    categorie: { name: "Libellé catégorie", dataType: "string", readOnly: true },
    assetPath: { name: "Asset local (RN)", dataType: "string", readOnly: true },
  },
});
