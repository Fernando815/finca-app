import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ConfiguracionClient from "./ConfiguracionClient";

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, fincas] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, image: true, role: true, createdAt: true },
    }),
    prisma.finca.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { animales: true, potreros: true, parcelas: true } } },
    }),
  ]);

  return <ConfiguracionClient user={user} fincas={fincas} />;
}
