import Stripe from "stripe";

let _stripe: Stripe | undefined;

function getStripeInstance(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia", typescript: true });
  }
  return _stripe;
}

// Lazy proxy — Stripe is NOT initialized at module load time
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripeInstance();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const PLANES = {
  BASICO: {
    name: "FincaApp Básico",
    priceId: process.env.STRIPE_PRICE_BASICO!,
    precio: 9.99,
    moneda: "USD",
    descripcion: "Hasta 3 fincas, 200 animales, todas las funcionalidades",
    features: [
      "Hasta 3 fincas",
      "200 animales por finca",
      "Gestión de potreros",
      "Croquis de finca",
      "Notificaciones push",
      "Soporte por email",
    ],
  },
  PRO: {
    name: "FincaApp Pro",
    priceId: process.env.STRIPE_PRICE_PRO!,
    precio: 19.99,
    moneda: "USD",
    descripcion: "Fincas y animales ilimitados, panel multi-finca, reportes",
    features: [
      "Fincas ilimitadas",
      "Animales ilimitados",
      "Reportes avanzados",
      "Multi-usuario por finca",
      "Exportación de datos",
      "Soporte prioritario",
    ],
  },
} as const;
