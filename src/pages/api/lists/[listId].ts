import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebaseAdmin";
import { requireUser } from "@/lib/requireUser";
import { deleteCollection } from "@/lib/deleteCollection";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { listId } = req.query;
  if (typeof listId !== "string" || !listId.trim()) {
    return res.status(400).json({ ok: false, error: "Invalid listId" });
  }

  try {
    const { uid } = await requireUser(req);

    const listRef = db().collection("lists").doc(listId);
    const listSnap = await listRef.get();

    if (!listSnap.exists) {
      return res.status(404).json({ ok: false, error: "List not found" });
    }

    const data = listSnap.data() || {};
    const admins = Array.isArray(data.admins) ? data.admins.map(String) : [];

    const isAdmin = admins.includes(uid);
    if (!isAdmin) {
      return res.status(403).json({ ok: false, error: "Not allowed" });
    }

    // 1) borrar subcolecciones conocidas
    await deleteCollection(`lists/${listId}/members`);
    await deleteCollection(`lists/${listId}/requests`);
    await deleteCollection(`lists/${listId}/preview_access`);

    // 2) borrar join code si existe
    const joinCodeHash = data.joinCodeHash ? String(data.joinCodeHash) : "";
    if (joinCodeHash) {
      await db()
          .collection("list_codes")
          .doc(joinCodeHash)
          .delete()
          .catch(() => {});
    }

    // 3) borrar doc principal
    await listRef.delete();

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    const status = e?.status || 500;
    return res.status(status).json({ ok: false, error: e?.message || "Server error" });
  }
}