import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId  = session.metadata?.userId;
      const plan    = session.metadata?.plan;
      if (userId && plan && session.subscription) {
        await prisma.suscripcion.update({
          where: { userId },
          data: {
            plan:    plan as any,
            estado:  "ACTIVA",
            stripeSubId: session.subscription as string,
            fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        await prisma.pago.create({
          data: {
            monto:  (session.amount_total ?? 0) / 100,
            estado: "COMPLETADO",
            stripePaymentId: session.payment_intent as string,
            descripcion: `Suscripción plan ${plan}`,
            suscripcion: { connect: { userId } },
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.suscripcion.updateMany({
        where: { stripeSubId: sub.id },
        data:  { estado: "CANCELADA", plan: "GRATUITO" },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await prisma.suscripcion.updateMany({
          where: { stripeSubId: invoice.subscription as string },
          data:  { estado: "VENCIDA" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
