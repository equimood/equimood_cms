import { buildCollection } from "firecms";

export type NotifDoc = {
  title?: string;
  body?: string;
  topic?: string;
  toTopic?: boolean;
  type?: string;
  sendingStatus?: string;
};

/**
 * Collection "Notifications" (path: notifications).
 * Créer un document = **envoyer une notification push à tous les utilisateurs**
 * (le Cloud trigger `onNotificationCreated` l'envoie au topic "all").
 */
export const notificationsCollection = buildCollection<NotifDoc>({
  name: "Notifications",
  singularName: "Notification",
  path: "notifications",
  icon: "Notifications",
  group: "Contenu",
  description:
    "Crée une notification = envoi push immédiat à TOUS les utilisateurs.",
  // Pas d'édition : une notif est envoyée une fois à la création.
  permissions: () => ({ read: true, edit: false, create: true, delete: true }),
  callbacks: {
    onPreSave: ({ values, status }) => {
      if (status === "new") {
        values.toTopic = true;
        values.topic = "all";
        values.type = "broadcast";
        values.sendingStatus = "pending";
      }
      return values;
    },
  },
  properties: {
    title: {
      name: "Titre",
      dataType: "string",
      validation: { required: true },
    },
    body: {
      name: "Message",
      dataType: "string",
      multiline: true,
      validation: { required: true },
    },
    sendingStatus: {
      name: "Statut d'envoi",
      dataType: "string",
      readOnly: true,
      description: "Rempli automatiquement : pending → success / error.",
    },
  },
});
