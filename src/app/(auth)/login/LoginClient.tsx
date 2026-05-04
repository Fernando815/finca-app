"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast({ title: "Error al iniciar sesión", description: "Correo o contraseña incorrectos.", variant: "destructive" });
      return;
    }
    router.push(params.get("callbackUrl") ?? "/dashboard");
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-7">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-900">Bienvenido de vuelta</h1>
        <p className="text-stone-500 text-sm mt-1">Ingrese a su cuenta de FincaApp</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-stone-600">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="productor@correo.com"
            className="h-10 rounded-xl border-stone-200 text-sm focus:border-finca-green-500 focus:ring-finca-green-200"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium text-stone-600">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              className="h-10 rounded-xl border-stone-200 text-sm pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-10 text-sm font-semibold mt-2"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar sesión"}
        </Button>
      </form>

      {/* Demo hint */}
      <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-500">
        <p className="font-medium text-stone-600 mb-1">Cuenta demo:</p>
        <p>📧 demo@fincaapp.cr · 🔑 demo1234</p>
      </div>

      <div className="mt-5 text-center text-sm text-stone-500">
        ¿No tiene cuenta?{" "}
        <Link href="/register" className="text-finca-green-700 font-semibold hover:underline">
          Regístrese gratis
        </Link>
      </div>
    </div>
  );
}
