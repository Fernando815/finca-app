import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinanzasClient } from "@/components/finanzas/FinanzasClient";

export const dynamic = "force-dynamic";

export default async function FinanzasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const finca = await prisma.finca.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!finca) redirect("/setup");

  // Solo animales activos (no vendidos, no muertos) para el selector de venta
  const animales = await prisma.animal.findMany({
    where: {
      fincaId: finca.id,
      estado: { notIn: ["VENDIDO", "MUERTO"] },
    },
    select: { id: true, codigo: true, nombre: true },
    orderBy: { codigo: "asc" },
  });

  const serialize = (obj: unknown) => JSON.parse(JSON.stringify(obj));

  return <FinanzasClient finca={serialize(finca)} animales={serialize(animales)} />;
}
