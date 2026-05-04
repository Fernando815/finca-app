# 🌿 FincaApp

**Organizador integral de fincas para productores agropecuarios de Costa Rica.**

App web progresiva (PWA) + móvil nativa (iOS/Android via Capacitor), construida con Next.js 14, Prisma y PostgreSQL.

---

## 🚀 Requisitos previos

- **Node.js** 20+ → https://nodejs.org
- **PostgreSQL** 15+ (local o Supabase) → https://supabase.com
- **Git**

---

## ⚙️ Instalación paso a paso

### 1. Instalar Node.js
Descargue e instale desde https://nodejs.org/en/download

### 2. Instalar dependencias
```bash
cd finca-app
npm install
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con sus credenciales:
# - DATABASE_URL: cadena de conexión PostgreSQL
# - NEXTAUTH_SECRET: cadena aleatoria segura
# - STRIPE_SECRET_KEY: clave de Stripe (opcional para pruebas)
# - Firebase keys (opcional para notificaciones push)
```

**Obtener DATABASE_URL gratis con Supabase:**
1. Cree cuenta en https://supabase.com
2. Cree un proyecto nuevo
3. Vaya a Settings → Database → Connection string
4. Copie la cadena URI

### 4. Configurar base de datos
```bash
# Crear todas las tablas
npm run db:push

# Poblar datos de prueba (usuarios demo incluidos)
npm run db:seed
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

Abra http://localhost:3000

---

## 👤 Usuarios de prueba

| Rol       | Email                  | Contraseña |
|-----------|------------------------|------------|
| Admin     | admin@fincaapp.cr      | admin123   |
| Productor | demo@fincaapp.cr       | demo1234   |

---

## 📱 Convertir a app móvil (Android / iOS)

### Android
```bash
# Instalar Capacitor CLI
npm install -g @capacitor/cli

# Construir la app web
npm run build

# Agregar plataforma Android
npx cap add android

# Sincronizar
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

### iOS (requiere Mac + Xcode)
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

---

## 🏗️ Estructura del proyecto

```
finca-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, Register
│   │   ├── (dashboard)/        # Toda la app
│   │   │   ├── dashboard/      # Panel principal
│   │   │   ├── animales/       # Gestión de animales
│   │   │   ├── potreros/       # Potreros y rotación
│   │   │   ├── cultivos/       # Cultivos
│   │   │   ├── tareas/         # Tareas
│   │   │   └── croquis/        # Mapa de finca
│   │   └── api/                # API REST
│   ├── components/             # Componentes React
│   ├── lib/                    # Utilidades y configuración
│   └── types/                  # TypeScript types
├── prisma/
│   ├── schema.prisma           # Modelo de base de datos
│   └── seed.ts                 # Datos iniciales
└── public/
    └── manifest.json           # Config PWA
```

---

## 🗄️ Comandos de base de datos

```bash
npm run db:generate    # Regenerar tipos Prisma
npm run db:push        # Aplicar schema a DB (dev)
npm run db:migrate     # Crear migración (prod)
npm run db:studio      # Abrir Prisma Studio (GUI)
npm run db:seed        # Poblar datos demo
```

---

## 🔧 Variables de entorno importantes

| Variable | Descripción |
|----------|------------|
| `DATABASE_URL` | Conexión PostgreSQL |
| `NEXTAUTH_SECRET` | Secret para JWT (generar con `openssl rand -base64 32`) |
| `STRIPE_SECRET_KEY` | Para suscripciones (sk_test_... en dev) |
| `STRIPE_WEBHOOK_SECRET` | Webhook de Stripe |
| `FIREBASE_*` | Para notificaciones push |

---

## 🌐 Deploy en producción (Vercel + Supabase)

### Vercel
```bash
npm install -g vercel
vercel --prod
```

Configure las variables de entorno en el dashboard de Vercel.

### Base de datos
Use Supabase (gratuito hasta 500MB):
1. Cree proyecto en supabase.com
2. Copie la DATABASE_URL
3. Ejecute `npm run db:migrate` en producción

---

## 💳 Configurar Stripe (pagos)

1. Cree cuenta en https://stripe.com
2. Obtenga las claves de API (modo test)
3. Cree 2 productos con precios mensuales:
   - FincaApp Básico: $9.99/mes
   - FincaApp Pro: $19.99/mes
4. Copie los `price_id` al `.env.local`
5. Configure el webhook: `https://su-dominio.com/api/stripe/webhook`

---

## 🔔 Configurar Firebase (notificaciones push)

1. Cree proyecto en https://console.firebase.google.com
2. Habilite Cloud Messaging
3. Descargue el service account JSON
4. Configure las variables `FIREBASE_*` en `.env.local`

---

## 📋 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| GET/POST | `/api/fincas` | Listar/crear fincas |
| GET/POST | `/api/animales` | Listar/crear animales |
| GET/PUT/DELETE | `/api/animales/[id]` | Gestionar animal |
| GET/POST | `/api/potreros` | Listar/crear potreros |
| GET/POST | `/api/movimientos` | Historial/mover lotes |
| GET/POST | `/api/historial-medico` | Registros médicos |
| GET/POST | `/api/cultivos` | Cultivos |
| GET/POST | `/api/tareas` | Tareas |
| PATCH/DELETE | `/api/tareas/[id]` | Actualizar/eliminar tarea |
| GET/POST | `/api/croquis` | Guardar croquis |
| POST | `/api/stripe/checkout` | Crear sesión de pago |
| POST | `/api/stripe/webhook` | Webhook Stripe |

---

## 🛡️ Roles

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Panel admin completo, gestión de usuarios y pagos |
| `PRODUCTOR` | Sus propias fincas, animales, potreros, etc. |

---

## 🔮 Funcionalidades futuras (roadmap)

- [ ] GPS y mapas satelitales de potreros
- [ ] Reportes PDF exportables
- [ ] Multi-usuario por finca (empleados)
- [ ] Control de producción de leche diario
- [ ] Peso en báscula por fechas
- [ ] Integración con SENASA (Costa Rica)
- [ ] Estadísticas y gráficos avanzados
- [ ] App widget para acceso rápido

---

## 🧑‍💻 Tecnologías

| Tecnología | Uso |
|-----------|-----|
| Next.js 14 | Framework full-stack |
| TypeScript | Lenguaje |
| Prisma | ORM |
| PostgreSQL | Base de datos |
| NextAuth.js v5 | Autenticación |
| Tailwind CSS | Estilos |
| Konva.js | Canvas croquis |
| Stripe | Pagos |
| Firebase FCM | Notificaciones push |
| Capacitor | App nativa iOS/Android |
| TanStack Query | Data fetching |
| Zustand | Estado global |
| Zod | Validación |
