import { Film } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function AuthPanel({
  mode,
  action,
  error,
}: {
  mode: "login" | "register";
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
}) {
  const isLogin = mode === "login";

  return (
    <main className="cinema-bg grid min-h-screen place-items-center px-5 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-cinema-cyan/12 blur-3xl" />
        <div className="absolute bottom-[12%] right-[14%] h-80 w-80 rounded-full bg-cinema-amber/10 blur-3xl" />
      </div>
      <section className="glass relative z-10 grid w-full max-w-5xl overflow-hidden rounded-xl md:grid-cols-[1fr_420px]">
        <div className="hidden min-h-[620px] flex-col justify-between bg-[linear-gradient(145deg,rgba(19,200,255,.2),rgba(0,0,0,.35)),url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85')] bg-cover bg-center p-10 md:flex">
          <Link href="/" className="text-3xl font-semibold text-white">
            MaxCinema
          </Link>
          <div>
            <div className="mb-5 grid size-14 place-items-center rounded-full bg-cinema-cyan text-slate-950">
              <Film size={25} />
            </div>
            <h1 className="max-w-md text-5xl font-semibold leading-tight text-white">Cinema OS para uma nova era de streaming.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/72">
              Entre em uma plataforma preparada para catalogo, progresso, favoritos, assinatura e streaming HLS.
            </p>
          </div>
        </div>

        <div className="p-7 md:p-10">
          <Link href="/" className="mb-10 block text-2xl font-semibold text-white md:hidden">
            MaxCinema
          </Link>
          <h2 className="text-3xl font-semibold text-white">{isLogin ? "Entrar" : "Criar conta"}</h2>
          <p className="mt-2 text-sm text-cinema-muted">
            {isLogin ? "Acesse sua sala premium." : "Comece seu perfil no MaxCinema."}
          </p>
          {error ? (
            <div className="mt-6 rounded-md border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
          <form action={action} className="mt-8 space-y-5">
            {!isLogin ? (
              <label className="block">
                <span className="text-xs font-semibold uppercase text-white/60">Nome</span>
                <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" name="fullName" placeholder="Seu nome" required />
              </label>
            ) : null}
            <label className="block">
              <span className="text-xs font-semibold uppercase text-white/60">Email</span>
              <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" name="email" placeholder="voce@email.com" required type="email" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-white/60">Senha</span>
              <input className="mt-2 h-12 w-full rounded-md border border-white/12 bg-white/6 px-4 text-sm text-white outline-none focus:border-cinema-cyan/70" minLength={6} name="password" placeholder="senha segura" required type="password" />
            </label>
            <Button className="w-full" type="submit">
              {isLogin ? "Entrar no MaxCinema" : "Criar acesso"}
            </Button>
          </form>
          <p className="mt-7 text-center text-sm text-cinema-muted">
            {isLogin ? "Ainda nao tem conta?" : "Ja tem conta?"}{" "}
            <Link className="font-semibold text-cinema-cyan" href={isLogin ? "/register" : "/login"}>
              {isLogin ? "Cadastre-se" : "Entrar"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
