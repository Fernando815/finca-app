import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LecheClient } from "@/components/leche/LecheClient";

export default async function LechePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const finca = await prisma.finca.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!finca) redirect("/setup");

  // Cargar animales hembra activos y lotes para los selectores
  const [animales, lotes] = await Promise.all([
    prisma.animal.findMany({
      where: {
        fincaId: finca.id,
        sexo: "HEMBRA",
        estado: { notIn: ["VENDIDO", "MUERTO"] },
      },
      select: { id: true, codigo: true, nombre: true, tipo: true },
      orderBy: { codigo: "asc" },
    }),
    prisma.lote.findMany({
      where: { fincaId: finca.id, activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const serialize = (obj: unknown) => JSON.parse(JSON.stringify(obj));

  return <LecheClient finca={serialize(finca)} animales={serialize(animales)} lotes={serialize(lotes)} />;
}
