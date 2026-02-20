import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/requireUser";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { uid } = await requireUser(req);
    return res.status(200).json({ ok: true, uid });
  } catch (e: any) {
    return res.status(e?.status || 500).json({ ok: false, error: e?.message || "Server error" });
  }
}
