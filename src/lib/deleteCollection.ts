import { db } from "./firebaseAdmin";

export async function deleteCollection(path: string, batchSize = 200) {
  const firestore = db();
  const colRef = firestore.collection(path);

  while (true) {
    const snap = await colRef.limit(batchSize).get();
    if (snap.empty) break;

    const batch = firestore.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}
