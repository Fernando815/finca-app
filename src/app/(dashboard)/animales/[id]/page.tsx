import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnimalDetalle } from "@/components/animales/AnimalDetalle";

export default async function AnimalPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const animal = await prisma.animal.findFirst({
    where: { id: params.id, finca: { userId: session.user.id } },
    include: {
      lote:    true,
      finca:   { select: { id: true, nombre: true } },
      historialMedico: { orderBy: { fecha: "desc" } },
      celos:   { orderBy: { fecha: "desc" } },
      partos:  { orderBy: { fecha: "desc" } },
    },
  });

  if (!animal) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/animales" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {animal.nombre ?? `Animal #${animal.codigo}`}
          </h2>
          <p className="text-gray-500 text-sm">Código: {animal.codigo} · {animal.finca.nombre}</p>
        </div>
      </div>
      <AnimalDetalle animal={animal as any} />
    </div>
  );
}
