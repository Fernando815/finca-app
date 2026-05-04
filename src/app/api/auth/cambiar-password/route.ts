import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  actual: z.string().min(1),
  nueva:  z.string().min(6),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return NextResponse.json({ error: "No tiene contraseña configurada (login social)" }, { status: 400 });
  const valid = await bcrypt.compare(parsed.data.actual, user.password);
  if (!valid) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
  const hashed = await bcrypt.hash(parsed.data.nueva, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
  return NextResponse.json({ ok: true });
}
