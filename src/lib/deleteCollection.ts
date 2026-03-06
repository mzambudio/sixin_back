import { db } from "./firebaseAdmin";
import { FieldPath } from "firebase-admin/firestore";

export async function deleteCollection(path: string, batchSize = 200) {
  const firestore = db();
  const colRef = firestore.collection(path);

  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let q = colRef.orderBy(FieldPath.documentId()).limit(batchSize);
    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    const batch = firestore.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    lastDoc = snap.docs[snap.docs.length - 1];
  }
}