import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve la finca activa del usuario.
 * Lee la cookie "finca-id" y verifica que pertenezca al usuario.
 * Si no hay cookie o es inválida, usa la primera finca.
 */
export async function getActiveFincaId(userId: string): Promise<string | null> {
  const cookieStore = cookies();
  const cookieFincaId = cookieStore.get("finca-id")?.value;

  if (cookieFincaId) {
    const valida = await prisma.finca.findFirst({
      where: { id: cookieFincaId, userId },
      select: { id: true },
    });
    if (valida) return valida.id;
  }

  // Fallback: primera finca del usuario
  const primera = await prisma.finca.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return primera?.id ?? null;
}
