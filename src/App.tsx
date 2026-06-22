import { useCallback } from "react";
import { Authenticator, FirebaseCMSApp } from "firecms";
import { User as FirebaseUser } from "firebase/auth";
import { firebaseConfig } from "./firebase-config";
import { audiosCollection } from "./collections/audios";
import { videosCollection } from "./collections/videos";
import { notificationsCollection } from "./collections/notifications";
import { usersCollection } from "./collections/users";

// ⚠️ Whitelist d'emails autorisés à accéder au CMS.
const ADMIN_EMAILS = [
  "equimood.app@gmail.com",
  "dahmoun.jason@gmail.com",
  "contact@depanncar.com",
  "enzo41350@gmail.com",
];

export default function App() {
  const myAuthenticator: Authenticator<FirebaseUser> = useCallback(async ({ user }) => {
    if (!user?.email) {
      throw new Error("Aucun email associé à ce compte.");
    }
    if (!ADMIN_EMAILS.includes(user.email)) {
      throw new Error(
        "Accès refusé : votre email n'est pas autorisé à accéder à ce CMS."
      );
    }
    return true;
  }, []);

  return (
    <FirebaseCMSApp
      name="EquiMood — CMS"
      authentication={myAuthenticator}
      collections={[audiosCollection, videosCollection, notificationsCollection, usersCollection]}
      firebaseConfig={firebaseConfig}
      signInOptions={["password", "google.com"]}
    />
  );
}
