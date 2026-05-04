"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al registrarse");
      toast({ title: "¡Cuenta creada!", description: "Bienvenido a FincaApp. Inicie sesión para continuar." });
      router.push("/login");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Crear cuenta gratis</h1>
        <p className="text-gray-500 text-sm mt-1">Comience a organizar su finca hoy</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" placeholder="Juan Pérez" className="h-11" {...register("name")} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" placeholder="productor@correo.com" className="h-11" {...register("email")} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input id="password" type={showPass ? "text" : "password"} placeholder="••••••••" className="h-11 pr-10" {...register("password")} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" className="h-11" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full h-11 bg-finca-green-600 hover:bg-finca-green-700 text-base font-medium" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear cuenta gratis"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        ¿Ya tiene cuenta?{" "}
        <Link href="/login" className="text-finca-green-700 font-medium hover:underline">Iniciar sesión</Link>
      </div>
    </div>
  );
}
