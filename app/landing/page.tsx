"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Hammer,
  Menu,
  Phone,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
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

/* ============================================================
   PHOTOS — Unsplash (usage commercial libre, sans attribution
   obligatoire). Un commentaire au-dessus de chaque <img> indique
   la source pour vérification ultérieure.
   ============================================================ */

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

type Module = {
  title: string;
  text: string;
  icon: typeof Building2;
  image: string;
};

type FAQ = {
  question: string;
  answer: string;
};

const modules: Module[] = [
  {
    icon: Hammer,
    title: "Chantiers",
    text: "Pilotez l'avancement, les priorités et les prochaines étapes de chaque chantier.",
    // Photo Unsplash — chantier / gros œuvre, aerial crane
    image:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: FileText,
    title: "Devis & Factures",
    text: "Créez, envoyez et relancez vos devis et factures depuis un espace unique.",
    // Photo Unsplash — artisan consultant un plan / devis sur site
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Bot,
    title: "Agents IA",
    text: "Des agents spécialisés traitent les tâches répétitives de votre entreprise.",
    // Photo Unsplash — ingénieur / chef de chantier avec tablette
    image:
      "https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Phone,
    title: "Téléphone IA",
    text: "Votre assistant répond, qualifie les prospects et transmet les demandes.",
    // Photo Unsplash — artisan / ouvrier portrait, casque et gilet
    image:
      "https://images.unsplash.com/photo-1541976590-713941681591?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Zap,
    title: "Automatisations",
    text: "Déclenchez relances, rendez-vous et actions selon les événements réels.",
    // Photo Unsplash — grues de chantier au crépuscule
    image:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: WandSparkles,
    title: "Marketing IA",
    text: "Générez du contenu et gardez le contact avec vos prospects sans y penser.",
    // Photo Unsplash — façade de bâtiment moderne
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
];

const secteurs = [
  "Rénovation",
  "Gros œuvre",
  "Second œuvre",
  "Génie civil",
  "Électricité",
  "Plomberie",
  "Toiture",
  "Charpente",
];

const faq: FAQ[] = [
  {
    question:
      "BatiPilot est-il uniquement destiné aux entreprises du bâtiment ?",
    answer:
      "BatiPilot est conçu en priorité pour les artisans, TPE et PME du bâtiment afin d'adapter l'expérience aux contraintes réelles du terrain.",
  },
  {
    question: "Est-ce que BatiPilot remplace mon CRM actuel ?",
    answer:
      "BatiPilot centralise la relation client, les devis, les rendez-vous et le suivi opérationnel dans un seul espace.",
  },
  {
    question: "Les automatisations peuvent-elles fonctionner seules ?",
    answer:
      "Oui. Certaines actions peuvent être automatisées totalement, tandis que d'autres peuvent demander une validation humaine.",
  },
  {
    question: "Le téléphone IA peut-il qualifier les prospects ?",
    answer:
      "Oui. Il peut recueillir les informations essentielles, identifier le besoin et préparer la suite du parcours commercial.",
  },
  {
    question: "Puis-je utiliser BatiPilot sur mobile ?",
    answer:
      "L'interface est responsive afin de rester accessible depuis un ordinateur, une tablette ou un smartphone.",
  },
];

function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
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
  light = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-400">
        {eyebrow}
      </p>

      <h2
        className={`mt-3 text-3xl font-black leading-[1.05] tracking-[-0.03em] md:text-5xl ${
          light ? "text-white" : "text-white"
        }`}
      >
        {title}
      </h2>

      {text && (
        <p className="mt-4 text-base leading-7 text-slate-400 md:text-lg">
          {text}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMobileOpen(false);

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      {/* NAVBAR */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-black/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-8">
          <Link
            href="/landing"
            className="flex items-center gap-3"
            onClick={closeMenu}
          >
            <img
              src="/image/batipilot-logo.png"
              alt="BatiPilot"
              className="h-9 w-9 rounded-lg object-cover"
            />
            <p className="text-[17px] font-black tracking-tight">
              BatiPilot
            </p>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            <a
              href="#plateforme"
              className="text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Plateforme
            </a>
            <a
              href="#fonctionnalites"
              className="text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Fonctionnalités
            </a>
            <a
              href="#ia"
              className="text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Intelligence IA
            </a>
            <a
              href="#tarifs"
              className="text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Tarifs
            </a>
            <a
              href="#faq"
              className="text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              FAQ
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/connexion"
              className="rounded-full px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-400"
            >
              Inscription
              <ArrowRight size={15} />
            </Link>
          </div>

          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMobileOpen((c) => !c)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="mx-4 mb-3 rounded-2xl border border-white/10 bg-black/95 p-5 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-4 text-slate-200">
              <a href="#plateforme" onClick={closeMenu}>
                Plateforme
              </a>
              <a href="#fonctionnalites" onClick={closeMenu}>
                Fonctionnalités
              </a>
              <a href="#ia" onClick={closeMenu}>
                Intelligence IA
              </a>
              <a href="#tarifs" onClick={closeMenu}>
                Tarifs
              </a>
              <a href="#faq" onClick={closeMenu}>
                FAQ
              </a>
              <Link
                href="/connexion"
                onClick={closeMenu}
                className="rounded-xl border border-white/15 px-4 py-3 text-center font-bold"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                onClick={closeMenu}
                className="rounded-xl bg-blue-500 px-4 py-3 text-center font-bold text-white"
              >
                Inscription
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* Photo Unsplash — chantier de gros œuvre, ouvrier au travail */}
          <img
            src="https://images.unsplash.com/photo-1541976590-713941681591?auto=format&fit=crop&w=2400&q=85"
            alt="Chantier de construction"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="mx-auto max-w-5xl px-5 pt-20 text-center md:px-8">
          <Reveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black text-white backdrop-blur">
              <Sparkles size={14} className="text-blue-400" />
              Le copilote IA du bâtiment
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.04em] md:text-7xl">
              Pilotez votre entreprise.
              <span className="block text-blue-400">
                BatiPilot travaille avec vous.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Clients, devis, chantiers, rendez-vous, appels, automatisations
              et agents IA dans un seul espace pensé pour les professionnels
              du bâtiment.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="group flex items-center justify-center gap-3 rounded-full bg-blue-500 px-8 py-4 font-black text-white shadow-xl shadow-blue-500/25 transition hover:-translate-y-1 hover:bg-blue-400"
              >
                Commencer
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/demander-un-devis"
                className="flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-8 py-4 font-black text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/15"
              >
                Voir une démo
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Scroll to explore
            <ChevronDown size={16} />
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="border-y border-white/10 bg-black px-5 py-10 md:px-8">
        <Reveal>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Chiffres illustratifs — objectifs de la plateforme
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {[
                ["24/7", "activité suivie"],
                ["1", "plateforme unique"],
                ["10h+", "de temps récupéré / semaine*"],
                ["100%", "pensé bâtiment"],
              ].map(([value, label]) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mx-auto mt-4 max-w-6xl text-center text-[11px] text-slate-600 md:text-left">
            *Estimation cible, non contractuelle, basée sur l'automatisation
            des tâches répétitives.
          </p>
        </Reveal>
      </section>

      {/* PLATEFORME */}
      <section
        id="plateforme"
        className="border-b border-white/10 bg-[#0a0a0a] px-5 py-24 md:px-8"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div>
              <SectionTitle
                eyebrow="Une seule plateforme"
                title="Toute votre activité, enfin réunie."
                text="BatiPilot devient le point central entre votre activité commerciale, vos opérations et l'intelligence artificielle."
              />

              <div className="mt-8 space-y-4">
                {[
                  "Clients et prospects",
                  "Devis et relances",
                  "Chantiers et rendez-vous",
                  "Agents IA et automatisations",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 size={19} className="text-blue-400" />
                    <span className="font-semibold text-slate-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="relative overflow-hidden rounded-[28px] border border-white/10">
              {/* Photo Unsplash — façade de bâtiment moderne */}
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1500&q=85"
                alt="Bâtiment professionnel"
                className="h-[420px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FONCTIONNALITES — GRILLE MODULES */}
      <section
        id="fonctionnalites"
        className="bg-black px-5 py-24 md:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Applications"
              title="Les outils dont votre entreprise a réellement besoin."
              text="Chaque module répond à une étape concrète de votre activité, du premier contact au chantier terminé."
              center
            />
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod, index) => {
              const Icon = mod.icon;

              return (
                <Reveal key={mod.title} delay={(index % 3) * 80}>
                  <div className="group relative h-[320px] overflow-hidden rounded-3xl border border-white/10">
                    <img
                      src={mod.image}
                      alt={mod.title}
                      className="absolute inset-0 h-full w-full object-cover grayscale contrast-125 brightness-[0.55] transition-all duration-700 ease-out group-hover:scale-110 group-hover:grayscale-0 group-hover:brightness-75"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 transition group-hover:from-black/90" />

                    <div className="relative flex h-full flex-col justify-end p-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur transition group-hover:bg-blue-500">
                        <Icon size={20} />
                      </div>

                      <h3 className="mt-5 text-xl font-black text-white">
                        {mod.title}
                      </h3>

                      <p className="mt-2 max-h-0 overflow-hidden text-sm leading-6 text-slate-300 opacity-0 transition-all duration-500 ease-out group-hover:mt-2 group-hover:max-h-20 group-hover:opacity-100">
                        {mod.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTEURS — DEFILEMENT */}
      <section className="overflow-hidden border-y border-white/10 bg-[#0a0a0a] py-16">
        <Reveal>
          <p className="mx-auto max-w-3xl px-5 text-center text-xs font-black uppercase tracking-[0.22em] text-blue-400">
            Secteurs couverts
          </p>
        </Reveal>

        <div className="relative mt-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent" />

          <div className="marquee flex w-max items-center gap-6">
            {[...secteurs, ...secteurs].map((secteur, index) => (
              <span
                key={`${secteur}-${index}`}
                className="shrink-0 rounded-full border border-white/10 px-8 py-4 text-2xl font-black tracking-tight text-slate-500 transition hover:border-blue-400/40 hover:text-white md:text-4xl"
              >
                {secteur}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTATS / IMPACT */}
      <section className="bg-black px-5 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Impact"
              title="Moins d'administratif. Plus de contrôle."
              center
            />
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Clock3,
                value: "Temps",
                text: "Réduisez les tâches répétitives grâce aux automatisations et aux agents IA.",
              },
              {
                icon: TrendingUp,
                value: "Ventes",
                text: "Suivez chaque opportunité, du premier contact au devis signé.",
              },
              {
                icon: Wallet,
                value: "Trésorerie",
                text: "Relancez automatiquement vos devis et factures pour être payé plus vite.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.value} delay={index * 100}>
                  <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-8">
                    <Icon size={24} className="text-blue-400" />
                    <p className="mt-6 text-3xl font-black text-white">
                      {item.value}
                    </p>
                    <p className="mt-3 leading-7 text-slate-400">
                      {item.text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section
        id="tarifs"
        className="border-t border-white/10 bg-[#0a0a0a] px-5 py-24 md:px-8"
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

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {[
              {
                name: "Assist",
                price: "199 €",
                description:
                  "Pour centraliser l'activité et profiter des premières fonctions IA.",
                popular: false,
                features: [
                  "CRM clients",
                  "Gestion des devis",
                  "Suivi chantier",
                  "Dossiers d'aides",
                  "IA assistée",
                ],
              },
              {
                name: "Autopilot",
                price: "499 €",
                description:
                  "Pour automatiser réellement le parcours commercial.",
                popular: true,
                features: [
                  "Tout Assist",
                  "Téléphone IA",
                  "Agents IA",
                  "Relances automatiques",
                  "Automatisations avancées",
                ],
              },
              {
                name: "Custom",
                price: "Sur devis",
                description:
                  "Pour construire une configuration adaptée à votre organisation.",
                popular: false,
                features: [
                  "Tout Autopilot",
                  "Agents personnalisés",
                  "Process sur mesure",
                  "Accompagnement dédié",
                  "Configuration avancée",
                ],
              },
            ].map((plan, index) => (
              <Reveal key={plan.name} delay={index * 90}>
                <div
                  className={`relative flex h-full flex-col rounded-[28px] border p-8 ${
                    plan.popular
                      ? "border-blue-400/50 bg-gradient-to-b from-blue-500/10 to-transparent shadow-[0_0_60px_rgba(59,130,246,0.15)]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute right-6 top-6 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                      Recommandé
                    </span>
                  )}

                  <p className="text-xs font-black uppercase tracking-widest text-blue-400">
                    BatiPilot
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-white">
                    {plan.name}
                  </h3>

                  <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-400">
                    {plan.description}
                  </p>

                  <div className="mt-5">
                    <span className="text-4xl font-black text-white">
                      {plan.price}
                    </span>
                    {plan.name !== "Custom" && (
                      <span className="ml-2 text-sm text-slate-400">
                        / mois HT
                      </span>
                    )}
                  </div>

                  <Link
                    href={
                      plan.name === "Custom"
                        ? "/demander-un-devis"
                        : "/inscription"
                    }
                    className={`mt-7 flex items-center justify-center gap-2 rounded-full px-5 py-3.5 font-black transition ${
                      plan.popular
                        ? "bg-blue-500 text-white hover:bg-blue-400"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {plan.name === "Custom"
                      ? "Demander un devis"
                      : `Choisir ${plan.name}`}
                    <ChevronRight size={17} />
                  </Link>

                  <div className="mt-7 space-y-3">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-3 text-sm text-slate-300"
                      >
                        <Check size={15} className="text-blue-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* INTELLIGENCE IA */}
      <section id="ia" className="bg-black px-5 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionTitle
              eyebrow="Intelligence artificielle"
              title="L'IA ne remplace pas votre entreprise. Elle lui enlève les tâches inutiles."
              text="BatiPilot utilise l'intelligence artificielle pour assister votre équipe là où elle perd habituellement du temps."
              center
            />
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Phone,
                title: "Téléphone IA",
                text: "Répond aux demandes et qualifie les prospects.",
              },
              {
                icon: Bot,
                title: "Agents spécialisés",
                text: "Analysent les données et proposent les prochaines actions.",
              },
              {
                icon: WandSparkles,
                title: "Autopilot",
                text: "Orchestre les étapes répétitives du parcours client.",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 100}>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-blue-400/30 hover:bg-white/[0.05]">
                    <Icon size={24} className="text-blue-400" />
                    <h3 className="mt-6 text-xl font-black text-white">
                      {item.title}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-400">
                      {item.text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="border-t border-white/10 bg-[#0a0a0a] px-5 py-24 md:px-8"
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <SectionTitle eyebrow="FAQ" title="Les questions fréquentes." center />
          </Reveal>

          <div className="mt-10 space-y-3">
            {faq.map((item, index) => {
              const isOpen = openFAQ === index;
              return (
                <div
                  key={item.question}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFAQ(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 p-5 text-left font-black text-white"
                  >
                    {item.question}
                    <ChevronDown
                      size={19}
                      className={`shrink-0 text-slate-400 transition ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 px-5 py-5 text-sm leading-7 text-slate-400">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden px-5 py-28 md:px-8">
        <div className="absolute inset-0 -z-10">
          {/* Photo Unsplash — chantier au crépuscule */}
          <img
            src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=2400&q=85"
            alt="Chantier BatiPilot"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/85" />
        </div>

        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <img
              src="/image/batipilot-logo.png"
              alt="BatiPilot"
              className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-xl"
            />

            <h2 className="mt-8 text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
              Votre entreprise mérite un meilleur copilote.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Découvrez BatiPilot et construisez une organisation plus
              simple, plus rapide et mieux automatisée.
            </p>

            <div className="mt-10 flex justify-center">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-blue-500 px-9 py-4 font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-400"
              >
                Commencer
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black px-5 pb-10 pt-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link href="/landing" className="flex items-center gap-3">
                <img
                  src="/image/batipilot-logo.png"
                  alt="BatiPilot"
                  className="h-10 w-10 rounded-xl object-cover"
                />
                <p className="text-lg font-black text-white">BatiPilot</p>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
                Le copilote IA des entreprises du bâtiment. Clients, devis,
                chantiers et automatisations, dans un seul espace.
              </p>

              <div className="mt-6 flex gap-3">
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-400 transition hover:border-blue-400/40 hover:text-white"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5.001ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H17v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-400 transition hover:border-blue-400/40 hover:text-white"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-400 transition hover:border-blue-400/40 hover:text-white"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.36 4.24 14.34 4.24c-2.13 0-3.59 1.3-3.59 3.68v2.28H8.3v3h2.45V21z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Produit
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <a href="#plateforme" className="transition hover:text-white">
                  Plateforme
                </a>
                <a
                  href="#fonctionnalites"
                  className="transition hover:text-white"
                >
                  Fonctionnalités
                </a>
                <a href="#ia" className="transition hover:text-white">
                  Intelligence IA
                </a>
                <a href="#tarifs" className="transition hover:text-white">
                  Tarifs
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Entreprise
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link
                  href="/demander-un-devis"
                  className="transition hover:text-white"
                >
                  Nous contacter
                </Link>
                <Link
                  href="/inscription"
                  className="transition hover:text-white"
                >
                  Inscription
                </Link>
                <Link
                  href="/connexion"
                  className="transition hover:text-white"
                >
                  Se connecter
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Ressources
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <a href="#faq" className="transition hover:text-white">
                  FAQ
                </a>
                <Link
                  href="/demander-un-devis"
                  className="transition hover:text-white"
                >
                  Demander une démo
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 md:flex-row">
            <p>© 2026 BatiPilot. Tous droits réservés.</p>
            <div className="flex gap-6">
              <a href="#" className="transition hover:text-white">
                Mentions légales
              </a>
              <a href="#" className="transition hover:text-white">
                Confidentialité
              </a>
              <a href="#" className="transition hover:text-white">
                CGU
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        section[id] {
          scroll-margin-top: 90px;
        }

        @keyframes marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .marquee {
          animation: marquee-scroll 32s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .marquee {
            animation: none;
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
