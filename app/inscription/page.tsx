"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function InscriptionPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.name ||
      !form.company ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError(
        "Veuillez remplir tous les champs."
      );
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Les deux mots de passe ne correspondent pas."
      );
      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            name: form.name.trim(),
            company: form.company.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      /*
       * Si Supabase crée directement
       * une session, on envoie
       * l'utilisateur vers le nouveau
       * dashboard.
       */
      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      /*
       * Si la confirmation email est
       * activée dans Supabase, aucune
       * session n'est créée immédiatement.
       */
      setSuccess(
        "Compte créé. Vérifiez votre boîte email pour confirmer votre inscription, puis connectez-vous."
      );
    } catch (err: any) {
      console.error(err);

      if (
        err?.message
          ?.toLowerCase()
          .includes(
            "already registered"
          )
      ) {
        setError(
          "Un compte existe déjà avec cette adresse email."
        );
      } else {
        setError(
          err?.message ||
            "Impossible de créer votre compte."
        );
      }
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
              src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=90"
              alt="Professionnel du bâtiment"
              className="h-full w-full object-cover opacity-30"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-[#172033]/60 via-[#172033]/75 to-[#172033]" />
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
              Votre nouvel espace de travail
            </p>

            <h1 className="mt-5 text-5xl font-black leading-tight tracking-[-0.04em] text-white">
              Passez moins de temps à gérer.
              <span className="block text-blue-400">
                Passez plus de temps à construire.
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Créez votre espace BatiPilot et
              centralisez votre activité dans une
              plateforme conçue pour le bâtiment.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Clients et prospects centralisés",
                "Devis et chantiers suivis",
                "Automatisations intelligentes",
                "Agents IA intégrés",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-semibold text-slate-200"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                    <Check size={14} />
                  </div>

                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DROITE */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <Link
              href="/landing"
              className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600 lg:hidden"
            >
              <ArrowLeft size={17} />
              Retour
            </Link>

            <div className="mb-8 flex items-center gap-3 lg:hidden">
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
                Inscription
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#172033]">
                Créez votre espace.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Quelques informations suffisent
                pour créer votre compte BatiPilot.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-4"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {success}
                </div>
              )}

              {/* NOM */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#172033]">
                  Nom complet
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Jean Dupont"
                    autoComplete="name"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* ENTREPRISE */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#172033]">
                  Entreprise
                </label>

                <div className="relative">
                  <Building2
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={form.company}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        company:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Dupont Rénovation"
                    autoComplete="organization"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* EMAIL */}
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
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email:
                          event.target
                            .value,
                      })
                    }
                    placeholder="vous@entreprise.fr"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* MOT DE PASSE */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#172033]">
                  Mot de passe
                </label>

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
                    value={form.password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        password:
                          event.target
                            .value,
                      })
                    }
                    placeholder="6 caractères minimum"
                    autoComplete="new-password"
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

              {/* CONFIRMATION */}
              <div>
                <label className="mb-2 block text-sm font-bold text-[#172033]">
                  Confirmer le mot de passe
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      form.confirmPassword
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        confirmPassword:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Répétez le mot de passe"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    aria-label="Afficher la confirmation du mot de passe"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? (
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
                  ? "Création..."
                  : "Créer mon compte"}

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="mt-7 text-center">
              <p className="text-sm text-slate-500">
                Vous avez déjà un compte ?{" "}
                <Link
                  href="/connexion"
                  className="font-black text-blue-600 hover:text-blue-700"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}