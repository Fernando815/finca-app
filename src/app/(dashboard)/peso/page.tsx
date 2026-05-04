import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PesoPageClient } from "@/components/peso/PesoPageClient";

export default async function PesoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const finca = await prisma.finca.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!finca) redirect("/setup");

  const animales = await prisma.animal.findMany({
    where: {
      fincaId: finca.id,
      estado: { notIn: ["VENDIDO", "MUERTO"] },
    },
    select: { id: true, codigo: true, nombre: true, tipo: true, pesoEstimado: true },
    orderBy: { codigo: "asc" },
  });

  const serialize = (obj: unknown) => JSON.parse(JSON.stringify(obj));
  return <PesoPageClient animales={serialize(animales)} finca={serialize(finca)} />;
}
