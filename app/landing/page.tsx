"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Euro,
  FileCheck2,
  FileText,
  Hammer,
  Headphones,
  MapPin,
  Menu,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

type Feature = {
  title: string;
  text: string;
  icon: typeof Building2;
};

type FAQ = {
  question: string;
  answer: string;
};

const features: Feature[] = [
  {
    icon: Users,
    title: "CRM bâtiment",
    text: "Centralisez prospects, clients, coordonnées, projets et historique commercial.",
  },
  {
    icon: FileText,
    title: "Devis intelligents",
    text: "Créez, suivez et relancez vos devis depuis le même espace.",
  },
  {
    icon: Hammer,
    title: "Suivi de chantier",
    text: "Pilotez chaque chantier, son avancement, ses priorités et ses prochaines étapes.",
  },
  {
    icon: CalendarDays,
    title: "Rendez-vous",
    text: "Organisez vos rendez-vous commerciaux et visites chantier sans perdre d'information.",
  },
  {
    icon: Phone,
    title: "Téléphone IA",
    text: "Votre assistant répond, qualifie les prospects et transmet les demandes.",
  },
  {
    icon: Bot,
    title: "Agents IA",
    text: "Des agents spécialisés travaillent sur les tâches répétitives de votre entreprise.",
  },
  {
    icon: Zap,
    title: "Automatisations",
    text: "Déclenchez automatiquement relances, rendez-vous et actions selon vos règles.",
  },
  {
    icon: FileCheck2,
    title: "Dossiers d'aides",
    text: "Suivez les dossiers administratifs, documents et étapes importantes.",
  },
];

const faq: FAQ[] = [
  {
    question:
      "BatiPilot est-il uniquement destiné aux entreprises du bâtiment ?",
    answer:
      "BatiPilot est conçu en priorité pour les artisans, TPE et PME du bâtiment afin d'adapter l'expérience aux contraintes réelles du terrain.",
  },
  {
    question:
      "Est-ce que BatiPilot remplace mon CRM actuel ?",
    answer:
      "BatiPilot centralise la relation client, les devis, les rendez-vous et le suivi opérationnel dans un seul espace.",
  },
  {
    question:
      "Les automatisations peuvent-elles fonctionner seules ?",
    answer:
      "Oui. Certaines actions peuvent être automatisées totalement, tandis que d'autres peuvent demander une validation humaine.",
  },
  {
    question:
      "Le téléphone IA peut-il qualifier les prospects ?",
    answer:
      "Oui. Il peut recueillir les informations essentielles, identifier le besoin et préparer la suite du parcours commercial.",
  },
  {
    question:
      "Puis-je utiliser BatiPilot sur mobile ?",
    answer:
      "L'interface est responsive afin de rester accessible depuis un ordinateur, une tablette ou un smartphone.",
  },
];

function Reveal({
  children,
  delay = 0,
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] =
    useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(
              entry.target
            );
          }
        },
        {
          threshold: 0.12,
          rootMargin:
            "0px 0px -40px 0px",
        }
      );

    observer.observe(node);

    return () =>
      observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`${className} transition-all duration-700 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-10 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  text,
  center = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  center?: boolean;
}) {
  return (
    <div
      className={
        center
          ? "mx-auto max-w-3xl text-center"
          : "max-w-3xl"
      }
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#172033] md:text-5xl">
        {title}
      </h2>

      {text && (
        <p className="mt-4 text-base leading-7 text-slate-500 md:text-lg">
          {text}
        </p>
      )}
    </div>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="px-5 py-6 text-center">
      <p className="text-3xl font-black tracking-tight text-[#172033]">
        {value}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [openFAQ, setOpenFAQ] =
    useState<number | null>(0);

  const [
    scrollProgress,
    setScrollProgress,
  ] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const max =
        document.documentElement
          .scrollHeight -
        window.innerHeight;

      setScrollProgress(
        max <= 0
          ? 0
          : window.scrollY / max
      );
    };

    window.addEventListener(
      "scroll",
      updateScroll,
      {
        passive: true,
      }
    );

    updateScroll();

    return () => {
      window.removeEventListener(
        "scroll",
        updateScroll
      );
    };
  }, []);

  const closeMenu = () => {
    setMobileOpen(false);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC] text-[#172033]">
      {/* PROGRESSION */}
      <div
        className="fixed left-0 top-0 z-[100] h-[3px] bg-blue-600 transition-all"
        style={{
          width: `${
            scrollProgress * 100
          }%`,
        }}
      />

      {/* 1 - NAVBAR */}
      <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-3">
        <nav className="mx-auto flex h-[66px] max-w-7xl items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 px-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl md:px-6">
          <Link
            href="/landing"
            className="flex items-center gap-3"
            onClick={closeMenu}
          >
            <img
              src="/image/batipilot-logo.png"
              alt="BatiPilot"
              className="h-10 w-10 rounded-xl object-cover"
            />

            <div>
              <p className="text-[17px] font-black tracking-tight">
                BatiPilot
              </p>

              <p className="hidden text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">
                Gestion intelligente du
                bâtiment
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            <a
              href="#plateforme"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              Plateforme
            </a>

            <a
              href="#fonctionnalites"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              Fonctionnalités
            </a>

            <a
              href="#ia"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              Intelligence IA
            </a>

            <a
              href="#tarifs"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              Tarifs
            </a>

            <a
              href="#faq"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              FAQ
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/connexion"
              className="rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
            >
              Se connecter
            </Link>

            <Link
              href="/demander-un-devis"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Commencer
              <ArrowRight
                size={16}
              />
            </Link>
          </div>

          <button
            type="button"
            aria-label="Menu"
            onClick={() =>
              setMobileOpen(
                (current) =>
                  !current
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 md:hidden"
          >
            {mobileOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </nav>

        {mobileOpen && (
          <div className="mx-auto mt-2 max-w-7xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl md:hidden">
            <div className="flex flex-col gap-4">
              <a
                href="#plateforme"
                onClick={
                  closeMenu
                }
              >
                Plateforme
              </a>

              <a
                href="#fonctionnalites"
                onClick={
                  closeMenu
                }
              >
                Fonctionnalités
              </a>

              <a
                href="#ia"
                onClick={
                  closeMenu
                }
              >
                Intelligence IA
              </a>

              <a
                href="#tarifs"
                onClick={
                  closeMenu
                }
              >
                Tarifs
              </a>

              <a
                href="#faq"
                onClick={
                  closeMenu
                }
              >
                FAQ
              </a>

              <Link
                href="/connexion"
                onClick={
                  closeMenu
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-center font-bold"
              >
                Se connecter
              </Link>

              <Link
                href="/demander-un-devis"
                onClick={
                  closeMenu
                }
                className="rounded-xl bg-blue-600 px-4 py-3 text-center font-bold text-white"
              >
                Commencer
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2 - HERO */}
      <section className="relative px-5 pb-16 pt-36 md:px-8 md:pb-20 md:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 top-20 h-[430px] w-[430px] rounded-full bg-blue-200/40 blur-[100px]" />

          <div className="absolute right-0 top-10 h-[480px] w-[480px] rounded-full bg-sky-100 blur-[110px]" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 shadow-sm">
                <Sparkles
                  size={15}
                />
                Le copilote IA du
                bâtiment
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] md:text-7xl">
                Pilotez votre
                entreprise.
                <span className="block text-blue-600">
                  BatiPilot travaille
                  avec vous.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
                Clients, devis,
                chantiers,
                rendez-vous,
                appels,
                automatisations et
                agents IA dans un
                seul espace pensé
                pour les
                professionnels du
                bâtiment.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/demander-un-devis"
                  className="group flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-4 font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-700"
                >
                  Découvrir
                  BatiPilot

                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                </Link>

                <a
                  href="#plateforme"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-4 font-black text-slate-700 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  Voir la
                  plateforme
                  <ChevronRight
                    size={17}
                  />
                </a>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-2">
                  <Check
                    size={15}
                    className="text-green-500"
                  />
                  Sans engagement
                </span>

                <span className="flex items-center gap-2">
                  <Check
                    size={15}
                    className="text-green-500"
                  />
                  Configuration
                  rapide
                </span>

                <span className="flex items-center gap-2">
                  <Check
                    size={15}
                    className="text-green-500"
                  />
                  Assistance IA
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative">
              <div className="absolute -inset-8 rounded-[40px] bg-blue-400/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.15)]">
                <img
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=90"
                  alt="Professionnels du bâtiment"
                  className="h-[520px] w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-white/95 p-5 shadow-xl backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Activité
                        BatiPilot
                      </p>

                      <p className="mt-1 text-lg font-black">
                        Votre journée
                        est sous
                        contrôle
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <TrendingUp
                        size={
                          20
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[82%] rounded-full bg-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3 - STATS */}
      <Reveal>
        <section className="px-5 pb-14 md:px-8">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-4">
            <Stat
              value="24/7"
              label="activité suivie"
            />
            <Stat
              value="1"
              label="plateforme unique"
            />
            <Stat
              value="10h+"
              label="de temps récupéré"
            />
            <Stat
              value="100%"
              label="pensé bâtiment"
            />
          </div>
        </section>
      </Reveal>

      {/* 4 - PROBLÈMES */}
      <section className="bg-white px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Le problème"
              title="Votre entreprise ne devrait pas être pilotée depuis 10 outils différents."
              text="Appels, messages, devis, fichiers, agenda et suivi chantier finissent souvent dispersés. BatiPilot rassemble l'essentiel."
            />
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              "Informations éparpillées",
              "Relances oubliées",
              "Temps administratif perdu",
            ].map(
              (item, index) => (
                <Reveal
                  key={item}
                  delay={
                    index * 80
                  }
                >
                  <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6">
                    <X
                      className="text-red-500"
                      size={21}
                    />

                    <h3 className="mt-4 text-lg font-black">
                      {item}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Moins de
                      visibilité
                      signifie plus
                      de temps perdu
                      et plus de
                      risques
                      d'oublier une
                      action
                      importante.
                    </p>
                  </div>
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* 5 - PLATEFORME */}
      <section
        id="plateforme"
        className="px-5 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <SectionTitle
                eyebrow="Une seule plateforme"
                title="Toute votre activité, enfin réunie."
                text="BatiPilot devient le point central entre votre activité commerciale, vos opérations et l'intelligence artificielle."
              />

              <div className="mt-7 space-y-3">
                {[
                  "Clients et prospects",
                  "Devis et relances",
                  "Chantiers et rendez-vous",
                  "Agents IA et automatisations",
                ].map(
                  (item) => (
                    <div
                      key={
                        item
                      }
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2
                        size={
                          19
                        }
                        className="text-blue-600"
                      />
                      <span className="font-semibold">
                        {
                          item
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1500&q=90"
              alt="Bâtiment professionnel"
              className="h-[420px] w-full rounded-[28px] object-cover shadow-2xl"
            />
          </Reveal>
        </div>
      </section>

      {/* 6 - DASHBOARD */}
      <section className="bg-[#172033] px-5 py-16 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-400">
                Vue d'ensemble
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                Commencez chaque
                journée avec les
                bonnes informations.
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-10 grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:grid-cols-4 md:p-7">
              {[
                [
                  "12",
                  "Contacts",
                  Users,
                ],
                [
                  "8",
                  "Devis actifs",
                  FileText,
                ],
                [
                  "5",
                  "Chantiers",
                  Hammer,
                ],
                [
                  "4",
                  "Actions IA",
                  Bot,
                ],
              ].map(
                ([
                  value,
                  title,
                  Icon,
                ]: any) => (
                  <div
                    key={
                      title
                    }
                    className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
                  >
                    <Icon
                      size={
                        20
                      }
                      className="text-blue-400"
                    />

                    <p className="mt-5 text-3xl font-black">
                      {
                        value
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {
                        title
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7 - FEATURES */}
      <section
        id="fonctionnalites"
        className="px-5 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Fonctionnalités"
              title="Les outils dont votre entreprise a réellement besoin."
              text="Pas une accumulation de fonctionnalités inutiles. Chaque module répond à une étape concrète de votre activité."
              center
            />
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map(
              (
                feature,
                index
              ) => {
                const Icon =
                  feature.icon;

                return (
                  <Reveal
                    key={
                      feature.title
                    }
                    delay={
                      (index %
                        4) *
                      70
                    }
                  >
                    <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                        <Icon
                          size={
                            20
                          }
                        />
                      </div>

                      <h3 className="mt-5 text-lg font-black">
                        {
                          feature.title
                        }
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {
                          feature.text
                        }
                      </p>
                    </div>
                  </Reveal>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* 8 - CLIENTS */}
      <section className="bg-white px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1500&q=90"
              alt="Relation client"
              className="h-[400px] w-full rounded-[28px] object-cover"
            />
          </Reveal>

          <Reveal delay={80}>
            <SectionTitle
              eyebrow="CRM"
              title="Chaque prospect mérite un vrai suivi."
              text="Retrouvez immédiatement ses coordonnées, son statut, son entreprise et les prochaines actions à effectuer."
            />
          </Reveal>
        </div>
      </section>

      {/* 9 - DEVIS */}
      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionTitle
              eyebrow="Devis"
              title="Du devis envoyé au chantier signé."
              text="BatiPilot vous aide à suivre vos propositions commerciales et à déclencher les bonnes relances au bon moment."
            />
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400">
                    DEVIS
                    #BP-0042
                  </p>

                  <p className="mt-1 text-xl font-black">
                    Rénovation
                    énergétique
                  </p>
                </div>

                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                  Envoyé
                </span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex justify-between border-b border-slate-100 pb-4">
                  <span className="text-slate-500">
                    Montant
                  </span>
                  <strong>
                    18 450 €
                  </strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-4">
                  <span className="text-slate-500">
                    Client
                  </span>
                  <strong>
                    Martin
                    Habitat
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Prochaine
                    action
                  </span>
                  <strong className="text-blue-600">
                    Relance
                    automatique
                  </strong>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10 - CHANTIERS */}
      <section className="bg-[#172033] px-5 py-16 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[30px]">
              <img
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=90"
                alt="Chantier"
                className="h-[520px] w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent" />

              <div className="absolute inset-0 flex items-center">
                <div className="max-w-2xl p-8 md:p-14">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-300">
                    Chantiers
                  </p>

                  <h2 className="mt-4 text-4xl font-black md:text-6xl">
                    Le bureau vous
                    suit sur le
                    terrain.
                  </h2>

                  <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
                    Consultez
                    l'avancement,
                    les informations
                    du client et les
                    prochaines
                    étapes depuis
                    n'importe où.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 11 - IA */}
      <section
        id="ia"
        className="px-5 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Intelligence artificielle"
              title="L'IA ne remplace pas votre entreprise. Elle lui enlève les tâches inutiles."
              text="BatiPilot utilise l'intelligence artificielle pour assister votre équipe là où elle perd habituellement du temps."
              center
            />
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Phone,
                title:
                  "Téléphone IA",
                text:
                  "Répond aux demandes et qualifie les prospects.",
              },
              {
                icon: Bot,
                title:
                  "Agents spécialisés",
                text:
                  "Analysent les données et proposent les prochaines actions.",
              },
              {
                icon: WandSparkles,
                title:
                  "Autopilot",
                text:
                  "Orchestre les étapes répétitives du parcours client.",
              },
            ].map(
              (
                item,
                index
              ) => {
                const Icon =
                  item.icon;

                return (
                  <Reveal
                    key={
                      item.title
                    }
                    delay={
                      index *
                      100
                    }
                  >
                    <div className="rounded-[24px] border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-7">
                      <Icon
                        size={
                          25
                        }
                        className="text-blue-600"
                      />

                      <h3 className="mt-6 text-xl font-black">
                        {
                          item.title
                        }
                      </h3>

                      <p className="mt-3 leading-7 text-slate-500">
                        {
                          item.text
                        }
                      </p>
                    </div>
                  </Reveal>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* 12 - AUTOMATISATIONS */}
      <section className="bg-white px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionTitle
              eyebrow="Automatisations"
              title="Quand une action doit être faite, BatiPilot peut la déclencher."
              text="Créez des scénarios automatiques basés sur les événements réels de votre activité."
            />
          </Reveal>

          <Reveal delay={100}>
            <div className="space-y-3">
              {[
                "Nouveau prospect → qualification",
                "Devis envoyé → création d'une relance",
                "Devis accepté → préparation du chantier",
                "Rendez-vous terminé → prochaine action",
              ].map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      item
                    }
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-black text-white">
                      {index +
                        1}
                    </div>

                    <span className="font-bold">
                      {
                        item
                      }
                    </span>
                  </div>
                )
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 13 - PROCESS */}
      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Mise en place"
              title="De votre organisation actuelle à BatiPilot en trois étapes."
              center
            />
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              [
                "01",
                "Configuration",
                "Nous adaptons l'espace à votre entreprise.",
              ],
              [
                "02",
                "Centralisation",
                "Vos données importantes sont regroupées.",
              ],
              [
                "03",
                "Automatisation",
                "Vous activez progressivement les fonctions IA.",
              ],
            ].map(
              (
                [
                  number,
                  title,
                  text,
                ],
                index
              ) => (
                <Reveal
                  key={
                    number
                  }
                  delay={
                    index *
                    100
                  }
                >
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 font-black text-white shadow-lg shadow-blue-600/20">
                      {
                        number
                      }
                    </div>

                    <h3 className="mt-5 text-xl font-black">
                      {
                        title
                      }
                    </h3>

                    <p className="mt-2 leading-7 text-slate-500">
                      {
                        text
                      }
                    </p>
                  </div>
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* 14 - BÉNÉFICES */}
      <section className="bg-blue-600 px-5 py-16 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Résultat"
              title="Moins d'administratif. Plus de contrôle."
              center
            />
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              [
                Clock3,
                "Temps",
                "Réduisez les tâches répétitives.",
              ],
              [
                TrendingUp,
                "Ventes",
                "Suivez mieux chaque opportunité.",
              ],
              [
                ShieldCheck,
                "Contrôle",
                "Gardez une vision claire.",
              ],
              [
                Rocket,
                "Croissance",
                "Structurez votre activité.",
              ],
            ].map(
              ([
                Icon,
                title,
                text,
              ]: any,
              index) => (
                <Reveal
                  key={
                    title
                  }
                  delay={
                    index *
                    70
                  }
                >
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                    <Icon
                      size={
                        22
                      }
                    />

                    <h3 className="mt-5 text-lg font-black">
                      {
                        title
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-blue-100">
                      {
                        text
                      }
                    </p>
                  </div>
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* 15 - POUR QUI */}
      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Pour qui ?"
              title="Conçu pour les entreprises qui vivent réellement le terrain."
              center
            />
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Hammer,
                title:
                  "Artisans",
                text:
                  "Centralisez vos demandes et votre suivi sans ajouter de complexité.",
              },
              {
                icon: Building2,
                title:
                  "TPE du bâtiment",
                text:
                  "Structurez l'activité commerciale et opérationnelle.",
              },
              {
                icon: Users,
                title: "PME",
                text:
                  "Donnez à vos équipes un outil commun et des processus cohérents.",
              },
            ].map(
              (
                item,
                index
              ) => {
                const Icon =
                  item.icon;

                return (
                  <Reveal
                    key={
                      item.title
                    }
                    delay={
                      index *
                      90
                    }
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white p-7">
                      <Icon
                        className="text-blue-600"
                        size={
                          24
                        }
                      />

                      <h3 className="mt-5 text-xl font-black">
                        {
                          item.title
                        }
                      </h3>

                      <p className="mt-3 leading-7 text-slate-500">
                        {
                          item.text
                        }
                      </p>
                    </div>
                  </Reveal>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* 16 - TARIFS */}
      <section
        id="tarifs"
        className="bg-[#F1F5F9] px-5 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Tarifs"
              title="Choisissez votre niveau d'automatisation."
              text="Des offres conçues pour évoluer avec votre entreprise."
              center
            />
          </Reveal>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              {
                name:
                  "Assist",
                price:
                  "199 €",
                description:
                  "Pour centraliser l'activité et profiter des premières fonctions IA.",
                popular:
                  false,
                features: [
                  "CRM clients",
                  "Gestion des devis",
                  "Suivi chantier",
                  "Dossiers d'aides",
                  "IA assistée",
                ],
              },
              {
                name:
                  "Autopilot",
                price:
                  "499 €",
                description:
                  "Pour automatiser réellement le parcours commercial.",
                popular:
                  true,
                features: [
                  "Tout Assist",
                  "Téléphone IA",
                  "Agents IA",
                  "Relances automatiques",
                  "Automatisations avancées",
                ],
              },
              {
                name:
                  "Custom",
                price:
                  "999 €",
                description:
                  "Pour construire une configuration adaptée à votre organisation.",
                popular:
                  false,
                features: [
                  "Tout Autopilot",
                  "Agents personnalisés",
                  "Process sur mesure",
                  "Accompagnement dédié",
                  "Configuration avancée",
                ],
              },
            ].map(
              (
                plan,
                index
              ) => (
                <Reveal
                  key={
                    plan.name
                  }
                  delay={
                    index *
                    90
                  }
                >
                  <div
                    className={`relative h-full rounded-[26px] border p-7 ${
                      plan.popular
                        ? "border-blue-600 bg-[#172033] text-white shadow-2xl"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                        Recommandé
                      </span>
                    )}

                    <p className="text-xs font-black uppercase tracking-widest text-blue-500">
                      BatiPilot
                    </p>

                    <h3 className="mt-2 text-2xl font-black">
                      {
                        plan.name
                      }
                    </h3>

                    <p
                      className={`mt-4 min-h-[72px] text-sm leading-6 ${
                        plan.popular
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {
                        plan.description
                      }
                    </p>

                    <div className="mt-5">
                      <span className="text-4xl font-black">
                        {
                          plan.price
                        }
                      </span>

                      <span
                        className={`ml-2 text-sm ${
                          plan.popular
                            ? "text-slate-400"
                            : "text-slate-500"
                        }`}
                      >
                        / mois HT
                      </span>
                    </div>

                    <Link
                      href="/demander-un-devis"
                      className={`mt-7 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-black transition ${
                        plan.popular
                          ? "bg-blue-600 text-white hover:bg-blue-500"
                          : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                      }`}
                    >
                      Choisir{" "}
                      {
                        plan.name
                      }
                      <ChevronRight
                        size={
                          17
                        }
                      />
                    </Link>

                    <div className="mt-7 space-y-3">
                      {plan.features.map(
                        (
                          feature
                        ) => (
                          <div
                            key={
                              feature
                            }
                            className="flex items-center gap-3 text-sm"
                          >
                            <Check
                              size={
                                15
                              }
                              className="text-green-500"
                            />
                            {
                              feature
                            }
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </Reveal>
              )
            )}
          </div>
        </div>
      </section>

      {/* 17 - FAQ */}
      <section
        id="faq"
        className="px-5 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <SectionTitle
              eyebrow="FAQ"
              title="Les questions fréquentes."
              center
            />
          </Reveal>

          <div className="mt-9 space-y-3">
            {faq.map(
              (
                item,
                index
              ) => {
                const isOpen =
                  openFAQ ===
                  index;

                return (
                  <div
                    key={
                      item.question
                    }
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFAQ(
                          isOpen
                            ? null
                            : index
                        )
                      }
                      className="flex w-full items-center justify-between gap-6 p-5 text-left font-black"
                    >
                      {
                        item.question
                      }

                      <ChevronDown
                        size={
                          19
                        }
                        className={`shrink-0 transition ${
                          isOpen
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 px-5 py-5 text-sm leading-7 text-slate-500">
                        {
                          item.answer
                        }
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* 18 - CTA / CONTACT */}
      <section
        id="contact"
        className="px-5 pb-16 pt-4 md:px-8 md:pb-20"
      >
        <Reveal>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-blue-600 px-7 py-16 text-center text-white md:px-16 md:py-20">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="relative mx-auto max-w-3xl">
              <img
                src="/image/batipilot-logo.png"
                alt="BatiPilot"
                className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-xl"
              />

              <h2 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
                Votre entreprise
                mérite un meilleur
                copilote.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-blue-100">
                Découvrez BatiPilot
                et construisez une
                organisation plus
                simple, plus rapide
                et mieux
                automatisée.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/demander-un-devis"
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-7 py-4 font-black text-blue-600 shadow-xl transition hover:-translate-y-1"
                >
                  Demander une
                  démonstration
                  <ArrowRight
                    size={18}
                  />
                </Link>

                <Link
                  href="/connexion"
                  className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/10 px-7 py-4 font-black text-white backdrop-blur transition hover:bg-white/20"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white px-5 py-9 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
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
              <p className="font-black">
                BatiPilot
              </p>

              <p className="text-[10px] text-slate-400">
                Gestion intelligente
                du bâtiment
              </p>
            </div>
          </Link>

          <p className="text-xs text-slate-400">
            © 2026 BatiPilot. Tous
            droits réservés.
          </p>

          <div className="flex flex-wrap gap-5 text-xs font-semibold text-slate-500">
            <a
              href="#plateforme"
              className="transition hover:text-blue-600"
            >
              Plateforme
            </a>

            <a
              href="#tarifs"
              className="transition hover:text-blue-600"
            >
              Tarifs
            </a>

            <a
              href="#faq"
              className="transition hover:text-blue-600"
            >
              FAQ
            </a>

            <Link
              href="/demander-un-devis"
              className="transition hover:text-blue-600"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        section[id] {
          scroll-margin-top: 95px;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}