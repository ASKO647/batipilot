"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { FormEvent, useState } from "react";

const businessTypes = [
  "Entreprise générale du bâtiment",
  "Rénovation",
  "Maçonnerie",
  "Plomberie",
  "Électricité",
  "Chauffage / Climatisation",
  "Menuiserie",
  "Peinture",
  "Couverture / Charpente",
  "Isolation",
  "Carrelage / Sols",
  "Paysage / Extérieurs",
  "Autre",
];

const companySizes = [
  "Indépendant",
  "2 à 5 salariés",
  "6 à 10 salariés",
  "11 à 25 salariés",
  "26 à 50 salariés",
  "51 salariés et plus",
];

const needsChoices = [
  {
    value: "Devis & factures",
    description:
      "Créer, envoyer et suivre vos documents commerciaux.",
  },
  {
    value: "Suivi de chantiers",
    description:
      "Centraliser l'avancement, les tâches et les documents.",
  },
  {
    value: "Relances",
    description:
      "Structurer le suivi de vos prospects et devis.",
  },
  {
    value: "Appels d’offres",
    description:
      "Organiser vos opportunités et vos échéances.",
  },
  {
    value: "Dossiers d’aides",
    description:
      "Centraliser les dossiers et les pièces nécessaires.",
  },
  {
    value: "Automatisations",
    description:
      "Automatiser les actions répétitives de votre entreprise.",
  },
  {
    value: "Agents IA",
    description:
      "Assister vos équipes dans les opérations quotidiennes.",
  },
  {
    value: "Téléphone IA",
    description:
      "Préparer l'automatisation de votre accueil téléphonique.",
  },
  {
    value: "Marketing IA",
    description:
      "Créer et organiser plus facilement vos actions marketing.",
  },
  {
    value: "Autre",
    description:
      "Présentez-nous un besoin spécifique à votre entreprise.",
  },
];

type FormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  companySize: string;
  needs: string[];
  message: string;
  privacyAccepted: boolean;

  // Honeypot anti-spam
  websiteCompany: string;
};

const initialForm: FormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  businessType: "",
  companySize: "",
  needs: [],
  message: "",
  privacyAccepted: false,
  websiteCompany: "",
};

export default function DemanderUnDevisPage() {
  const [form, setForm] =
    useState<FormState>(initialForm);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function toggleNeed(value: string) {
    setForm((current) => ({
      ...current,
      needs: current.needs.includes(value)
        ? current.needs.filter(
            (item) => item !== value
          )
        : [...current.needs, value],
    }));

    setError("");
  }

  function validateForm() {
    if (!form.companyName.trim()) {
      return "Renseignez le nom de votre entreprise.";
    }

    if (!form.contactName.trim()) {
      return "Renseignez votre nom.";
    }

    if (!form.email.trim()) {
      return "Renseignez votre adresse email.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return "Renseignez une adresse email valide.";
    }

    if (!form.phone.trim()) {
      return "Renseignez votre numéro de téléphone.";
    }

    if (form.needs.length === 0) {
      return "Sélectionnez au moins un besoin.";
    }

    if (!form.privacyAccepted) {
      return "Vous devez accepter la politique de confidentialité.";
    }

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/demande-devis",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Impossible d'envoyer votre demande."
        );
      }

      setSuccess(true);
      setForm(initialForm);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (submitError: any) {
      console.error(submitError);

      setError(
        submitError?.message ||
          "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#F7F9FC]">
        <PublicHeader />

        <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-16">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/40 sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Demande envoyée
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#172033] sm:text-4xl">
              Merci pour votre demande.
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-500">
              Votre demande a bien été
              enregistrée. Nous pourrons
              maintenant étudier vos besoins
              et revenir vers vous pour vous
              présenter la solution BatiPilot
              adaptée à votre entreprise.
            </p>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-left">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Clock3 size={18} />
                </div>

                <div>
                  <p className="text-sm font-black text-[#172033]">
                    Prochaine étape
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Notre équipe prendra
                    connaissance de votre
                    demande avant de vous
                    recontacter.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/landing"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={17} />
                Retour au site
              </Link>

              <Link
                href="/inscription"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Découvrir BatiPilot
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#172033]">
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 lg:pb-24 lg:pt-16">
          <div className="grid items-start gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
            {/* GAUCHE */}
            <div className="lg:sticky lg:top-28">
              <Link
                href="/landing"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
              >
                <ArrowLeft size={17} />
                Retour au site
              </Link>

              <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-black text-blue-700">
                <Sparkles size={14} />
                BatiPilot pour votre entreprise
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.08] tracking-[-0.045em] sm:text-5xl">
                Voyons comment BatiPilot peut
                <span className="text-blue-600">
                  {" "}
                  simplifier votre quotidien.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-500">
                Présentez-nous votre entreprise
                et vos principaux besoins. Ces
                informations nous permettront de
                mieux comprendre votre activité
                et de préparer une proposition
                adaptée.
              </p>

              <div className="mt-9 space-y-4">
                <Benefit
                  icon={Building2}
                  title="Une approche adaptée au BTP"
                  text="BatiPilot est pensé autour des besoins des entreprises du bâtiment."
                />

                <Benefit
                  icon={Sparkles}
                  title="Des outils selon vos besoins"
                  text="Devis, chantiers, relances, automatisations et IA réunis dans un même espace."
                />

                <Benefit
                  icon={ShieldCheck}
                  title="Vos informations restent protégées"
                  text="Votre demande est transmise de manière sécurisée et n'est pas publiée."
                />
              </div>

              <div className="mt-9 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172033] text-white">
                    <MessageSquareText
                      size={18}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black">
                      Un besoin particulier ?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Utilisez le champ libre du
                      formulaire pour nous
                      expliquer votre fonctionnement
                      ou une problématique précise.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FORMULAIRE */}
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
              <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                  Demande de devis
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">
                  Parlez-nous de votre entreprise
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Les champs marqués d’un * sont
                  nécessaires pour traiter votre
                  demande.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8"
              >
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                {/* Honeypot */}
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
                >
                  <label htmlFor="websiteCompany">
                    Site entreprise
                  </label>

                  <input
                    id="websiteCompany"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={
                      form.websiteCompany
                    }
                    onChange={(event) =>
                      updateField(
                        "websiteCompany",
                        event.target.value
                      )
                    }
                  />
                </div>

                <FormSection
                  number="01"
                  title="Votre entreprise"
                  description="Quelques informations pour comprendre votre structure."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      icon={Building2}
                      label="Nom de l’entreprise"
                      required
                      value={
                        form.companyName
                      }
                      onChange={(value) =>
                        updateField(
                          "companyName",
                          value
                        )
                      }
                      placeholder="Ex. Martin Rénovation"
                    />

                    <SelectField
                      label="Activité principale"
                      value={
                        form.businessType
                      }
                      onChange={(value) =>
                        updateField(
                          "businessType",
                          value
                        )
                      }
                      options={businessTypes}
                      placeholder="Sélectionner"
                    />

                    <SelectField
                      label="Taille de l’entreprise"
                      value={
                        form.companySize
                      }
                      onChange={(value) =>
                        updateField(
                          "companySize",
                          value
                        )
                      }
                      options={companySizes}
                      placeholder="Sélectionner"
                      className="sm:col-span-2"
                    />
                  </div>
                </FormSection>

                <FormSection
                  number="02"
                  title="Vos coordonnées"
                  description="Pour pouvoir revenir vers vous concernant votre demande."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      icon={UserRound}
                      label="Nom complet"
                      required
                      value={
                        form.contactName
                      }
                      onChange={(value) =>
                        updateField(
                          "contactName",
                          value
                        )
                      }
                      placeholder="Jean Dupont"
                    />

                    <InputField
                      icon={Phone}
                      label="Téléphone"
                      required
                      value={form.phone}
                      onChange={(value) =>
                        updateField(
                          "phone",
                          value
                        )
                      }
                      placeholder="06 00 00 00 00"
                      type="tel"
                    />

                    <InputField
                      icon={Mail}
                      label="Email professionnel"
                      required
                      value={form.email}
                      onChange={(value) =>
                        updateField(
                          "email",
                          value
                        )
                      }
                      placeholder="vous@entreprise.fr"
                      type="email"
                      className="sm:col-span-2"
                    />
                  </div>
                </FormSection>

                <FormSection
                  number="03"
                  title="Vos besoins"
                  description="Sélectionnez les sujets qui vous intéressent le plus."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {needsChoices.map(
                      (need) => {
                        const selected =
                          form.needs.includes(
                            need.value
                          );

                        return (
                          <button
                            key={need.value}
                            type="button"
                            onClick={() =>
                              toggleNeed(
                                need.value
                              )
                            }
                            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                              selected
                                ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                                selected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              <Check
                                size={14}
                              />
                            </div>

                            <div>
                              <p className="text-sm font-black text-slate-800">
                                {
                                  need.value
                                }
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {
                                  need.description
                                }
                              </p>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </FormSection>

                <FormSection
                  number="04"
                  title="Votre projet"
                  description="Ajoutez les informations qui nous aideront à préparer l’échange."
                >
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Message
                    </label>

                    <textarea
                      rows={6}
                      maxLength={3000}
                      value={form.message}
                      onChange={(event) =>
                        updateField(
                          "message",
                          event.target.value
                        )
                      }
                      placeholder="Expliquez-nous votre organisation actuelle, vos difficultés ou ce que vous souhaitez améliorer..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <div className="mt-2 text-right text-[11px] font-semibold text-slate-400">
                      {
                        form.message
                          .length
                      }
                      /3000
                    </div>
                  </div>
                </FormSection>

                <div className="mt-8 border-t border-slate-100 pt-7">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={
                        form.privacyAccepted
                      }
                      onChange={(event) =>
                        updateField(
                          "privacyAccepted",
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />

                    <span className="text-xs leading-5 text-slate-500">
                      J’accepte que les
                      informations transmises
                      soient utilisées par
                      BatiPilot afin de traiter
                      ma demande et de me
                      recontacter.{" "}
                      <Link
                        href="/politique-confidentialite"
                        className="font-bold text-blue-600 hover:underline"
                      >
                        Politique de
                        confidentialité
                      </Link>
                      .
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Envoi de la demande...
                      </>
                    ) : (
                      <>
                        Envoyer ma demande
                        <ArrowRight
                          size={18}
                          className="transition group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
                    <LockKeyhole
                      size={13}
                    />
                    Transmission sécurisée
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/landing"
          className="flex items-center gap-3"
        >
          <img
            src="/image/batipilot-logo.png"
            alt="BatiPilot"
            className="h-10 w-10 rounded-xl object-cover"
          />

          <div>
            <p className="text-lg font-black leading-none tracking-[-0.03em] text-[#172033]">
              BatiPilot
            </p>

            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Gestion intelligente du bâtiment
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/connexion"
            className="hidden text-sm font-black text-slate-600 transition hover:text-blue-600 sm:block"
          >
            Se connecter
          </Link>

          <Link
            href="/inscription"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#172033] px-4 text-xs font-black text-white transition hover:bg-slate-800 sm:text-sm"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </header>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-100 py-8 first:pt-0 last:border-b-0">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-black text-blue-600">
          {number}
        </div>

        <div>
          <h3 className="text-base font-black text-[#172033]">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function InputField({
  icon: Icon,
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
        {required && (
          <span className="text-red-500">
            {" "}
            *
          </span>
        )}
      </label>

      <div className="relative">
        <Icon
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        >
          <option value="">
            {placeholder}
          </option>

          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  );
}

function Benefit({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{
    size?: number;
  }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
        <Icon size={18} />
      </div>

      <div>
        <p className="text-sm font-black text-[#172033]">
          {title}
        </p>

        <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}