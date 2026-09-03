"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  HardHat,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#F6F8FB]">
      <div className="w-full px-[20px] pt-[20px] pb-[20px]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Mercredi 2 Septembre 2026
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#172033]">
              Bienvenue sur votre pilotage 👋
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Suivez les performances de votre activité à partir des données
              réelles de votre entreprise.
            </p>
          </div>

          <Link
            href="/clients"
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] xl:self-auto"
          >
            <Plus size={18} />
            Ajouter un contact
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Chiffre d'affaires"
            value="0 €"
            detail="0 devis acceptés"
            icon={<ArrowUpRight size={18} />}
          />

          <StatCard
            title="Contacts"
            value="0"
            detail="0 prospects"
            icon={<Users size={18} />}
          />

          <StatCard
            title="Devis"
            value="0"
            detail="0 en attente"
            icon={<FileText size={18} />}
          />

          <StatCard
            title="Chantiers actifs"
            value="0"
            detail="0 terminés"
            icon={<HardHat size={18} />}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="min-h-[320px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#172033]">
                  Activité récente
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Les dernières mises à jour de votre activité
                </p>
              </div>

              <Link
                href="/activite"
                className="text-sm font-semibold text-[#2563EB]"
              >
                Voir tout
              </Link>
            </div>

            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={21} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-[#172033]">
                Aucune activité récente
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Les actions réalisées dans votre espace apparaîtront ici.
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-[#172033] p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Sparkles size={20} />
              </div>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                IA active
              </span>
            </div>

            <h2 className="mt-8 text-xl font-bold">
              Pilotage opérationnel IA
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              BatiPilot analysera vos clients, devis, chantiers et relances
              pour vous aider à piloter votre activité.
            </p>

            <div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    Relances à traiter
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Suivi automatique des actions commerciales
                  </p>
                </div>

                <span className="text-sm font-semibold text-amber-400">
                  0
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
          LIVE
        </span>
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {title}
      </p>

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <p className="text-2xl font-bold text-[#172033]">
          {value}
        </p>

        <p className="pb-1 text-xs text-slate-500">
          {detail}
        </p>
      </div>
    </div>
  );
}