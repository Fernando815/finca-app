import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
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
