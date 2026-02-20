// src/lib/requireUser.ts
import { auth } from "./firebaseAdmin";

export async function requireUser(req: any) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    const err: any = new Error("Missing Authorization Bearer token");
    err.status = 401;
    throw err;
  }

  const token = match[1];

  try {
    const decoded = await auth().verifyIdToken(token);
    return { uid: decoded.uid, decoded };
  } catch {
    const err: any = new Error("Invalid token");
    err.status = 401;
    throw err;
  }
}
