import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? session : null;
}

function generarPasswordTemporal() {
  const nums = Math.floor(1000 + Math.random() * 9000);
  const letras = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `Finca${nums}${letras}!`;
}

// PATCH /api/admin/users — cambiar rol, suscripcion o resetear contraseña
export async function PATCH(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { userId, role, suscripcionEstado, suscripcionPlan, diasExtra, resetPassword } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  // Reset de contraseña
  if (resetPassword) {
    const nuevaPassword = generarPasswordTemporal();
    const hashed = await bcrypt.hash(nuevaPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return NextResponse.json({ success: true, nuevaPassword });
  }

  const updates: any = {};
  if (role) updates.role = role;

  if (role || Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: updates });
  }

  if (suscripcionEstado || suscripcionPlan || diasExtra) {
    const sus = await prisma.suscripcion.findUnique({ where: { userId } });
    if (sus) {
      const data: any = {};
      if (suscripcionEstado) data.estado = suscripcionEstado;
      if (suscripcionPlan)   data.plan   = suscripcionPlan;
      if (diasExtra) {
        const base = sus.fechaVencimiento ? new Date(sus.fechaVencimiento) : new Date();
        base.setDate(base.getDate() + Number(diasExtra));
        data.fechaVencimiento = base;
      }
      await prisma.suscripcion.update({ where: { userId }, data });
    } else {
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + (diasExtra ?? 30));
      await prisma.suscripcion.create({
        data: {
          userId,
          estado: suscripcionEstado ?? "ACTIVA",
          plan:   suscripcionPlan   ?? "BASICO",
          fechaVencimiento,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users?userId=xxx — eliminar usuario
export async function DELETE(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  if (userId === session.user?.id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "ADMIN" ? session : null;
}

// PATCH /api/admin/users — cambiar rol o suscripcion
export async function PATCH(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { userId, role, suscripcionEstado, suscripcionPlan, diasExtra } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  const updates: any = {};
  if (role) updates.role = role;

  if (role || Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: updates });
  }

  if (suscripcionEstado || suscripcionPlan || diasExtra) {
    const sus = await prisma.suscripcion.findUnique({ where: { userId } });
    if (sus) {
      const data: any = {};
      if (suscripcionEstado) data.estado = suscripcionEstado;
      if (suscripcionPlan)   data.plan   = suscripcionPlan;
      if (diasExtra) {
        const base = sus.fechaVencimiento ? new Date(sus.fechaVencimiento) : new Date();
        base.setDate(base.getDate() + Number(diasExtra));
        data.fechaVencimiento = base;
      }
      await prisma.suscripcion.update({ where: { userId }, data });
    } else {
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + (diasExtra ?? 30));
      await prisma.suscripcion.create({
        data: {
          userId,
          estado: suscripcionEstado ?? "ACTIVA",
          plan:   suscripcionPlan   ?? "BASICO",
          fechaVencimiento,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users?userId=xxx — eliminar usuario
export async function DELETE(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  // No permitir que el admin se elimine a sí mismo
  if (userId === session.user?.id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
