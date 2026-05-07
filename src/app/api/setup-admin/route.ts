import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hash = "$2a$10$l35s//a4pnADwgUrrrWmgeD5uw.HrQor5vK4BgwPuTj7/bFvs4TiO";
    const user = await prisma.user.upsert({
      where: { email: "admin@fincaapp.com" },
      update: { role: "ADMIN", password: hash, name: "Administrador" },
      create: { email: "admin@fincaapp.com", name: "Administrador", password: hash, role: "ADMIN" },
    });
    return NextResponse.json({ ok: true, email: user.email, role: user.role, msg: "Listo! Elimina este endpoint." });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
