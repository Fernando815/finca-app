import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  return getMessaging();
}

export async function enviarNotificacionPush(
  userId: string,
  titulo: string,
  mensaje: string,
  data?: Record<string, string>
) {
  try {
    const tokens = await prisma.pushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    const messaging = getFirebaseAdmin();
    const mensajes = tokens.map((t) => ({
      token: t.token,
      notification: { title: titulo, body: mensaje },
      data: data ?? {},
      android: { priority: "high" as const },
      apns: { payload: { aps: { sound: "default" } } },
      webpush: { notification: { icon: "/icons/icon-192x192.png" } },
    }));

    const result = await messaging.sendEach(mensajes);
    // Limpiar tokens inválidos
    const invalidos = result.responses
      .map((r, i) => (!r.success ? tokens[i].token : null))
      .filter(Boolean) as string[];
    if (invalidos.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: invalidos } } });
    }
  } catch (error) {
    console.error("Error enviando notificación push:", error);
  }
}

export async function crearNotificacionDB(
  userId: string,
  titulo: string,
  mensaje: string,
  tipo: string,
  accion?: string
) {
  await prisma.notificacion.create({
    data: {
      userId,
      titulo,
      mensaje,
      tipo: tipo as any,
      accion,
    },
  });
}
