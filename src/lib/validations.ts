import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Finca
export const fincaSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  descripcion: z.string().optional(),
  provincia: z.string().optional(),
  canton: z.string().optional(),
  distrito: z.string().optional(),
  areaTotal: z.coerce.number().positive().optional(),
  enfoque: z.enum(["ENGORDE","CRIA","LECHE","AGRICULTURA","MIXTA"]).default("MIXTA"),
});

// Animal
export const animalSchema = z.object({
  codigo: z.string().min(1, "Código requerido"),
  nombre: z.string().optional(),
  tipo: z.enum(["VACA","TORO","TERNERO","TERNERA","CABALLO","YEGUA","OVEJA","CABRA","CERDO","OTRO"]),
  raza: z.string().optional(),
  sexo: z.enum(["MACHO","HEMBRA"]),
  edadMeses: z.coerce.number().int().min(0).optional(),
  pesoEstimado: z.coerce.number().positive().optional(),
  color: z.string().optional(),
  estado: z.enum(["ACTIVO","VENDIDO","ENFERMO","MUERTO","EN_TRATAMIENTO","PRENADA","EN_CELO","SECO"]).default("ACTIVO"),
  enfoque: z.enum(["LECHE","CARNE","CRIA","DOBLE_PROPOSITO"]).optional(),
  loteId: z.string().optional(),
  notas: z.string().optional(),
  fincaId: z.string().min(1, "Finca requerida"),
});

// Historial Médico
export const historialMedicoSchema = z.object({
  fecha: z.coerce.date(),
  tipo: z.enum(["VACUNA","VITAMINA","DESPARASITANTE","MEDICAMENTO","CIRUGIA","DIAGNOSTICO","OTRO"]),
  producto: z.string().min(1, "Producto requerido"),
  dosis: z.string().optional(),
  viaAdministracion: z.string().optional(),
  veterinario: z.string().optional(),
  costo: z.coerce.number().min(0).optional(),
  proximaFecha: z.coerce.date().optional(),
  notas: z.string().optional(),
  animalId: z.string().min(1),
});

// Potrero
export const potreroSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  numero: z.coerce.number().int().optional(),
  areHectareas: z.coerce.number().positive().optional(),
  capacidadAnimales: z.coerce.number().int().positive().optional(),
  tipoUso: z.enum(["ENGORDE","CRIA","LECHE","MIXTO"]).default("MIXTO"),
  diasDescansoMinimo: z.coerce.number().int().default(21),
  diasOcupacionMaximo: z.coerce.number().int().default(7),
  estadoPasto: z.enum(["EXCELENTE","BUENO","REGULAR","MALO","DESCANSANDO"]).default("BUENO"),
  notas: z.string().optional(),
  fincaId: z.string().min(1),
});

// Lote
export const loteSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  color: z.string().optional(),
  fincaId: z.string().min(1),
});

// Movimiento Potrero
export const movimientoSchema = z.object({
  loteId: z.string().min(1),
  potreroId: z.string().min(1),
  fechaEntrada: z.coerce.date().default(() => new Date()),
  motivo: z.string().optional(),
  notas: z.string().optional(),
});

// Cultivo
export const cultivoSchema = z.object({
  tipo: z.enum(["CAFE","PLATANO","YUCA","MAIZ","PASTO","CANA","FRIJOL","TOMATE","PIPA","OTRO"]),
  variedad: z.string().optional(),
  fechaSiembra: z.coerce.date().optional(),
  etapa: z.enum(["PREPARACION","SIEMBRA","GERMINACION","CRECIMIENTO","FLORACION","FRUCTIFICACION","COSECHA","POST_COSECHA"]).default("PREPARACION"),
  areaHectareas: z.coerce.number().positive().optional(),
  notas: z.string().optional(),
  parcelaId: z.string().min(1),
});

// Tarea
export const tareaSchema = z.object({
  titulo: z.string().min(2, "Título requerido"),
  descripcion: z.string().optional(),
  prioridad: z.enum(["BAJA","MEDIA","ALTA","URGENTE"]).default("MEDIA"),
  fechaLimite: z.coerce.date().optional(),
  categoria: z.enum(["GENERAL","ANIMAL","POTRERO","CULTIVO","INFRAESTRUCTURA","VETERINARIA","ADMINISTRATIVA"]).default("GENERAL"),
  recordatorio: z.boolean().default(true),
  frecuencia: z.enum(["DIARIA","SEMANAL","QUINCENAL","MENSUAL","TRIMESTRAL","ANUAL"]).optional(),
  fincaId: z.string().min(1),
  peonId: z.string().optional(),
  estado: z.enum(["PENDIENTE","EN_PROCESO","COMPLETADA","VENCIDA","CANCELADA"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type FincaInput = z.infer<typeof fincaSchema>;
export type AnimalInput = z.infer<typeof animalSchema>;
export type HistorialMedicoInput = z.infer<typeof historialMedicoSchema>;
export type PotreroInput = z.infer<typeof potreroSchema>;
export type LoteInput = z.infer<typeof loteSchema>;
export type MovimientoInput = z.infer<typeof movimientoSchema>;
export type CultivoInput = z.infer<typeof cultivoSchema>;
export type TareaInput = z.infer<typeof tareaSchema>;
