import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, PLANES } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { plan } = await req.json();
  const planData = PLANES[plan as keyof typeof PLANES];
  if (!planData) return NextResponse.json({ error: "Plan inválido" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { suscripcion: true },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  let customerId = user.suscripcion?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name:  user.name  ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.suscripcion.update({
      where: { userId: user.id },
      data:  { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: planData.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/configuracion?success=true`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/configuracion?canceled=true`,
    metadata: { userId: user.id, plan },
    locale: "es",
  });

  return NextResponse.json({ url: checkoutSession.url });
}
