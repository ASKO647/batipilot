"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email || !password) {
      setError(
        "Renseignez votre adresse email et votre mot de passe."
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.session) {
        setError(
          "Connexion réussie mais aucune session n'a été créée."
        );
        return;
      }

      const redirectTo =
        searchParams.get("redirectTo");

      if (
        redirectTo &&
        redirectTo.startsWith("/")
      ) {
        router.replace(redirectTo);
      } else {
        router.replace("/dashboard");
      }

      router.refresh();
    } catch (err: any) {
      console.error(err);

      if (
        err?.message ===
        "Invalid login credentials"
      ) {
        setError(
          "Adresse email ou mot de passe incorrect."
        );
      } else {
        setError(
          err?.message ||
            "Impossible de vous connecter."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Entrez d'abord votre adresse email."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/connexion`,
          }
        );

      if (error) {
        throw error;
      }

      setMessage(
        "Un email de réinitialisation vient de vous être envoyé."
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Impossible d'envoyer l'email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* GAUCHE */}
        <section className="relative hidden overflow-hidden bg-[#172033] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=90"
              alt="Chantier BatiPilot"
              className="h-full w-full object-cover opacity-35"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-[#172033]/70 via-[#172033]/70 to-[#172033]" />
          </div>

          <div className="relative z-10 p-10">
            <Link
              href="/landing"
              className="inline-flex items-center gap-3"
            >
              <img
                src="/image/batipilot-logo.png"
                alt="BatiPilot"
                className="h-11 w-11 rounded-xl object-cover"
              />

              <div>
                <p className="text-lg font-black text-white">
                  BatiPilot
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Gestion intelligente du bâtiment
                </p>
              </div>
            </Link>
          </div>

          <div className="relative z-10 max-w-xl p-10 pb-14">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-400">
              Votre espace de pilotage
            </p>

            <h1 className="mt-5 text-5xl font-black leading-tight tracking-[-0.04em] text-white">
              Retrouvez toute votre entreprise au même endroit.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Clients, devis, chantiers,
              rendez-vous, automatisations et
              agents IA accessibles depuis votre
              espace BatiPilot.
            </p>

            <div className="mt-9 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-white">
                  24/7
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Accessible
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-white">
                  IA
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Intégrée
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-white">
                  1
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Plateforme
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DROITE */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <Link
              href="/landing"
              className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600 lg:hidden"
            >
              <ArrowLeft size={17} />
              Retour
            </Link>

            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <img
                src="/image/batipilot-logo.png"
                alt="BatiPilot"
                className="h-11 w-11 rounded-xl object-cover"
              />

              <p className="text-xl font-black">
                BatiPilot
              </p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
                Connexion
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#172033]">
                Bon retour sur BatiPilot.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Connectez-vous pour accéder à
                votre espace de travail.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="mt-8 space-y-5"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {message}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-[#172033]">
                  Adresse email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="vous@entreprise.fr"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-[#172033]">
                    Mot de passe
                  </label>

                  <button
                    type="button"
                    onClick={
                      handleForgotPassword
                    }
                    className="text-xs font-bold text-blue-600 transition hover:text-blue-700"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    aria-label="Afficher le mot de passe"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Connexion..."
                  : "Se connecter"}

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs font-semibold text-slate-400">
                Nouveau sur BatiPilot ?
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              href="/inscription"
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-[#172033] transition hover:border-blue-200 hover:bg-blue-50"
            >
              Créer un compte
            </Link>

            <p className="mt-7 text-center text-xs leading-5 text-slate-400">
              En vous connectant, vous acceptez
              les conditions d&apos;utilisation de
              BatiPilot.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <p className="text-sm font-semibold text-slate-500">
            Chargement...
          </p>
        </main>
      }
    >
      <ConnexionContent />
    </Suspense>
  );
}
