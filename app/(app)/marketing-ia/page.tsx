"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type MarketingProfile = {
  id?: string;
  company_name: string;
  sector: string;
  services: string;
  location: string;
  tone: string;
  website: string;
  phone: string;
};

type MarketingContent = {
  id: string;
  title: string;
  type: string;
  content: string;
  objective: string | null;
  platform: string | null;
  status: "Brouillon" | "Enregistré";
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  objective: string;
  channel: string;
  estimated_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  status: "Brouillon" | "En préparation" | "Active" | "Terminée";
  created_at: string;
};

type CalendarItem = {
  id: string;
  title: string;
  type: string;
  publication_date: string;
  platform: string;
  status: "Brouillon" | "À valider" | "Planifié" | "Publié";
  created_at: string;
};

const contentTypes = [
  "Publication réseaux sociaux",
  "Email commercial",
  "SMS",
  "Article",
  "Publicité",
  "Présentation entreprise",
];

const platforms = [
  "Facebook",
  "Instagram",
  "LinkedIn",
  "Email",
  "SMS",
  "Google",
  "Site web",
];

const objectives = [
  "Générer des prospects",
  "Présenter un service",
  "Promouvoir une offre",
  "Obtenir des rendez-vous",
  "Fidéliser les clients",
  "Développer la notoriété",
];

export default function MarketingIAPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [profile, setProfile] = useState<MarketingProfile>({
    company_name: "",
    sector: "Bâtiment",
    services: "",
    location: "",
    tone: "Professionnel",
    website: "",
    phone: "",
  });

  const [contents, setContents] = useState<MarketingContent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState(contentTypes[0]);
  const [contentPlatform, setContentPlatform] = useState(platforms[0]);
  const [contentObjective, setContentObjective] = useState(objectives[0]);
  const [contentSubject, setContentSubject] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");

  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState(objectives[0]);
  const [campaignChannel, setCampaignChannel] = useState(platforms[0]);
  const [campaignBudget, setCampaignBudget] = useState("");
  const [campaignStart, setCampaignStart] = useState("");
  const [campaignEnd, setCampaignEnd] = useState("");

  const [calendarTitle, setCalendarTitle] = useState("");
  const [calendarType, setCalendarType] = useState(contentTypes[0]);
  const [calendarPlatform, setCalendarPlatform] = useState(platforms[0]);
  const [calendarDate, setCalendarDate] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function getOrganizationId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: userProfile, error } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (error || !userProfile?.organization_id) {
      console.error(error);
      return null;
    }

    return userProfile.organization_id as string;
  }

  async function loadPage() {
    setLoading(true);

    const orgId = await getOrganizationId();

    if (!orgId) {
      setLoading(false);
      return;
    }

    setOrganizationId(orgId);

    const [profileResult, contentsResult, campaignsResult, calendarResult] =
      await Promise.all([
        supabase
          .from("ai_marketing_profiles")
          .select("*")
          .eq("organization_id", orgId)
          .maybeSingle(),

        supabase
          .from("ai_marketing_contents")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),

        supabase
          .from("ai_marketing_campaigns")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),

        supabase
          .from("ai_marketing_calendar")
          .select("*")
          .eq("organization_id", orgId)
          .order("publication_date", { ascending: true }),
      ]);

    if (profileResult.data) {
      setProfile({
        id: profileResult.data.id,
        company_name: profileResult.data.company_name || "",
        sector: profileResult.data.sector || "",
        services: profileResult.data.services || "",
        location: profileResult.data.location || "",
        tone: profileResult.data.tone || "Professionnel",
        website: profileResult.data.website || "",
        phone: profileResult.data.phone || "",
      });
    }

    setContents((contentsResult.data || []) as MarketingContent[]);
    setCampaigns((campaignsResult.data || []) as Campaign[]);
    setCalendar((calendarResult.data || []) as CalendarItem[]);

    setLoading(false);
  }

  async function saveProfile() {
    if (!organizationId) return;

    setSavingProfile(true);

    const payload = {
      organization_id: organizationId,
      company_name: profile.company_name || null,
      sector: profile.sector || null,
      services: profile.services || null,
      location: profile.location || null,
      tone: profile.tone,
      website: profile.website || null,
      phone: profile.phone || null,
      updated_at: new Date().toISOString(),
    };

    const result = profile.id
      ? await supabase
          .from("ai_marketing_profiles")
          .update(payload)
          .eq("id", profile.id)
      : await supabase.from("ai_marketing_profiles").insert(payload);

    if (result.error) {
      alert(result.error.message);
      setSavingProfile(false);
      return;
    }

    await loadPage();
    setSavingProfile(false);
  }

  function generateContent() {
    const company = profile.company_name || "notre entreprise";
    const location = profile.location ? ` à ${profile.location}` : "";
    const service = contentSubject || profile.services || "nos services";
    const tone = profile.tone;

    let result = "";

    if (contentType === "Publication réseaux sociaux") {
      result =
        `🏗️ ${company}${location}\n\n` +
        `Vous avez un projet de ${service} ?\n\n` +
        `Notre équipe vous accompagne de l’étude jusqu’à la réalisation de vos travaux, avec un suivi clair et professionnel.\n\n` +
        `✅ Étude de votre projet\n` +
        `✅ Devis personnalisé\n` +
        `✅ Suivi du chantier\n` +
        `✅ Accompagnement de proximité\n\n` +
        `Contactez-nous pour échanger sur votre projet${profile.phone ? ` au ${profile.phone}` : ""}.\n\n` +
        `#batiment #travaux #renovation #chantier`;
    } else if (contentType === "Email commercial") {
      result =
        `Objet : Votre projet de ${service}\n\n` +
        `Bonjour,\n\n` +
        `${company} accompagne ses clients${location} dans leurs projets de ${service}.\n\n` +
        `Nous pouvons étudier votre besoin et vous proposer une solution adaptée à votre budget et à vos délais.\n\n` +
        `Si vous le souhaitez, nous pouvons organiser un premier échange afin de parler de votre projet.\n\n` +
        `Bien cordialement,\n${company}`;
    } else if (contentType === "SMS") {
      result =
        `Bonjour, ${company} vous accompagne pour vos projets de ${service}. ` +
        `Vous souhaitez obtenir des informations ou un devis ? ` +
        `${profile.phone ? `Contact : ${profile.phone}` : "Répondez directement à ce message."}`;
    } else if (contentType === "Publicité") {
      result =
        `${service} ${location}\n\n` +
        `Confiez votre projet à ${company}.\n\n` +
        `✔ Devis personnalisé\n` +
        `✔ Accompagnement professionnel\n` +
        `✔ Suivi de chantier\n\n` +
        `Demandez votre étude dès maintenant.`;
    } else if (contentType === "Article") {
      result =
        `Pourquoi bien préparer son projet de ${service} ?\n\n` +
        `Un projet de travaux réussi commence par une bonne préparation. Avant le démarrage du chantier, il est important de définir précisément le besoin, le budget et les délais.\n\n` +
        `${company} accompagne ses clients${location} à chaque étape afin de garantir une organisation claire et un suivi efficace.\n\n` +
        `Une étude préalable permet également d’anticiper les contraintes techniques, de comparer les solutions disponibles et de limiter les imprévus pendant les travaux.\n\n` +
        `Pour votre projet de ${service}, notre équipe peut vous accompagner de la première étude jusqu’à la réception du chantier.`;
    } else {
      result =
        `${company} est spécialisé dans ${service}${location}.\n\n` +
        `Notre objectif est d’accompagner chaque client avec une organisation claire, des solutions adaptées et un suivi professionnel de son projet.\n\n` +
        `Nos équipes interviennent de l’étude du besoin jusqu’à la réalisation des travaux.`;
    }

    if (tone === "Direct") {
      result += "\n\nParlons de votre projet dès maintenant.";
    }

    if (tone === "Chaleureux") {
      result += "\n\nNotre équipe sera ravie d’échanger avec vous sur votre projet.";
    }

    if (tone === "Premium") {
      result +=
        "\n\nBénéficiez d’un accompagnement personnalisé et d’un suivi exigeant à chaque étape.";
    }

    setGeneratedContent(result);

    if (!contentTitle) {
      setContentTitle(`${contentType} · ${service}`);
    }
  }

  async function saveContent() {
    if (!organizationId || !generatedContent.trim()) return;

    const { error } = await supabase.from("ai_marketing_contents").insert({
      organization_id: organizationId,
      title: contentTitle.trim() || "Contenu marketing",
      type: contentType,
      content: generatedContent.trim(),
      objective: contentObjective,
      platform: contentPlatform,
      status: "Enregistré",
    });

    if (error) {
      alert(error.message);
      return;
    }

    setGeneratorOpen(false);
    setContentTitle("");
    setContentSubject("");
    setGeneratedContent("");

    await loadPage();
  }

  async function deleteContent(id: string) {
    if (!confirm("Supprimer ce contenu ?")) return;

    const { error } = await supabase
      .from("ai_marketing_contents")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPage();
  }

  async function copyContent(text: string) {
    await navigator.clipboard.writeText(text);
    alert("Contenu copié.");
  }

  async function createCampaign() {
    if (!organizationId || !campaignName.trim()) {
      alert("Donne un nom à la campagne.");
      return;
    }

    const { error } = await supabase.from("ai_marketing_campaigns").insert({
      organization_id: organizationId,
      name: campaignName.trim(),
      objective: campaignObjective,
      channel: campaignChannel,
      estimated_budget: campaignBudget ? Number(campaignBudget) : null,
      start_date: campaignStart || null,
      end_date: campaignEnd || null,
      status: "Brouillon",
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCampaignOpen(false);
    setCampaignName("");
    setCampaignBudget("");
    setCampaignStart("");
    setCampaignEnd("");

    await loadPage();
  }

  async function updateCampaignStatus(
    id: string,
    status: Campaign["status"]
  ) {
    const { error } = await supabase
      .from("ai_marketing_campaigns")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPage();
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Supprimer cette campagne ?")) return;

    const { error } = await supabase
      .from("ai_marketing_campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPage();
  }

  async function createCalendarItem() {
    if (!organizationId || !calendarTitle.trim() || !calendarDate) {
      alert("Renseigne le titre et la date.");
      return;
    }

    const { error } = await supabase.from("ai_marketing_calendar").insert({
      organization_id: organizationId,
      title: calendarTitle.trim(),
      type: calendarType,
      publication_date: calendarDate,
      platform: calendarPlatform,
      status: "Planifié",
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCalendarOpen(false);
    setCalendarTitle("");
    setCalendarDate("");

    await loadPage();
  }

  async function updateCalendarStatus(
    id: string,
    status: CalendarItem["status"]
  ) {
    const { error } = await supabase
      .from("ai_marketing_calendar")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPage();
  }

  async function deleteCalendarItem(id: string) {
    if (!confirm("Supprimer cette publication planifiée ?")) return;

    const { error } = await supabase
      .from("ai_marketing_calendar")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPage();
  }

  const activeCampaigns = useMemo(
    () => campaigns.filter((item) => item.status === "Active").length,
    [campaigns]
  );

  const plannedPosts = useMemo(
    () =>
      calendar.filter(
        (item) =>
          item.status === "Planifié" || item.status === "À valider"
      ).length,
    [calendar]
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-7 py-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
              Intelligence artificielle
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Marketing IA
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Créez vos contenus, organisez vos campagnes et planifiez votre
            communication depuis BatiPilot.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadPage}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>

          <button
            onClick={() => setGeneratorOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <WandSparkles className="h-4 w-4" />
            Générer un contenu
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Contenus" value={contents.length} icon={<FileText />} />
        <StatCard
          title="Campagnes"
          value={campaigns.length}
          icon={<Megaphone />}
        />
        <StatCard
          title="Campagnes actives"
          value={activeCampaigns}
          icon={<BarChart3 />}
        />
        <StatCard
          title="Publications prévues"
          value={plannedPosts}
          icon={<CalendarDays />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Contenus marketing
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Contenus créés et enregistrés dans BatiPilot.
                </p>
              </div>

              <button
                onClick={() => setGeneratorOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600"
              >
                <Plus className="h-4 w-4" />
                Nouveau contenu
              </button>
            </div>

            {contents.length === 0 ? (
              <EmptyState
                icon={<FileText />}
                title="Aucun contenu"
                text="Générez votre premier contenu marketing."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {contents.map((item) => (
                  <div key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {item.title}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge>{item.type}</Badge>
                          {item.platform && <Badge>{item.platform}</Badge>}
                          {item.objective && <Badge>{item.objective}</Badge>}
                        </div>

                        <p className="mt-3 whitespace-pre-line text-xs leading-5 text-slate-500">
                          {item.content.length > 350
                            ? `${item.content.slice(0, 350)}...`
                            : item.content}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => copyContent(item.content)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-500"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => deleteContent(item.id)}
                          className="rounded-lg border border-red-100 p-2 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Campagnes
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Suivez vos campagnes commerciales et publicitaires.
                </p>
              </div>

              <button
                onClick={() => setCampaignOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600"
              >
                <Plus className="h-4 w-4" />
                Nouvelle campagne
              </button>
            </div>

            {campaigns.length === 0 ? (
              <EmptyState
                icon={<Megaphone />}
                title="Aucune campagne"
                text="Créez votre première campagne."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {campaign.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {campaign.channel} · {campaign.objective}
                        </p>

                        {campaign.estimated_budget !== null && (
                          <p className="mt-1 text-xs text-slate-400">
                            Budget :{" "}
                            {Number(campaign.estimated_budget).toLocaleString(
                              "fr-FR"
                            )}{" "}
                            €
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={campaign.status}
                          onChange={(e) =>
                            updateCampaignStatus(
                              campaign.id,
                              e.target.value as Campaign["status"]
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                        >
                          <option>Brouillon</option>
                          <option>En préparation</option>
                          <option>Active</option>
                          <option>Terminée</option>
                        </select>

                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          className="rounded-lg border border-red-100 p-2 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Profil marketing
                </h2>
              </div>

              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
              >
                {savingProfile ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Enregistrer
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <Input
                label="Entreprise"
                value={profile.company_name}
                onChange={(value) =>
                  setProfile({ ...profile, company_name: value })
                }
              />

              <Input
                label="Secteur"
                value={profile.sector}
                onChange={(value) =>
                  setProfile({ ...profile, sector: value })
                }
              />

              <Input
                label="Services"
                value={profile.services}
                onChange={(value) =>
                  setProfile({ ...profile, services: value })
                }
              />

              <Input
                label="Zone géographique"
                value={profile.location}
                onChange={(value) =>
                  setProfile({ ...profile, location: value })
                }
              />

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Ton
                </label>

                <select
                  value={profile.tone}
                  onChange={(e) =>
                    setProfile({ ...profile, tone: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option>Professionnel</option>
                  <option>Chaleureux</option>
                  <option>Direct</option>
                  <option>Premium</option>
                </select>
              </div>

              <Input
                label="Site web"
                value={profile.website}
                onChange={(value) =>
                  setProfile({ ...profile, website: value })
                }
              />

              <Input
                label="Téléphone"
                value={profile.phone}
                onChange={(value) =>
                  setProfile({ ...profile, phone: value })
                }
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Calendrier marketing
                </h2>
              </div>

              <button
                onClick={() => setCalendarOpen(true)}
                className="rounded-lg border border-blue-200 p-2 text-blue-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {calendar.length === 0 ? (
                <p className="py-5 text-center text-xs text-slate-400">
                  Aucune publication planifiée.
                </p>
              ) : (
                <div className="space-y-4">
                  {calendar.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="border-b border-slate-100 pb-4 last:border-0"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            {item.title}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {new Date(
                              `${item.publication_date}T12:00:00`
                            ).toLocaleDateString("fr-FR")}{" "}
                            · {item.platform}
                          </p>
                        </div>

                        <button
                          onClick={() => deleteCalendarItem(item.id)}
                          className="text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateCalendarStatus(
                            item.id,
                            e.target.value as CalendarItem["status"]
                          )
                        }
                        className="mt-2 rounded-md border border-slate-200 px-2 py-1 text-[10px]"
                      >
                        <option>Brouillon</option>
                        <option>À valider</option>
                        <option>Planifié</option>
                        <option>Publié</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {generatorOpen && (
        <Modal
          title="Générer un contenu"
          onClose={() => setGeneratorOpen(false)}
        >
          <Input
            label="Titre"
            value={contentTitle}
            onChange={setContentTitle}
          />

          <Select
            label="Type de contenu"
            value={contentType}
            options={contentTypes}
            onChange={setContentType}
          />

          <Select
            label="Plateforme"
            value={contentPlatform}
            options={platforms}
            onChange={setContentPlatform}
          />

          <Select
            label="Objectif"
            value={contentObjective}
            options={objectives}
            onChange={setContentObjective}
          />

          <Input
            label="Sujet / service à promouvoir"
            value={contentSubject}
            onChange={setContentSubject}
          />

          <button
            onClick={generateContent}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
          >
            <WandSparkles className="h-4 w-4" />
            Générer
          </button>

          {generatedContent && (
            <>
              <textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={12}
                className="w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none"
              />

              <button
                onClick={saveContent}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                <Save className="h-4 w-4" />
                Enregistrer le contenu
              </button>
            </>
          )}
        </Modal>
      )}

      {campaignOpen && (
        <Modal
          title="Nouvelle campagne"
          onClose={() => setCampaignOpen(false)}
        >
          <Input
            label="Nom"
            value={campaignName}
            onChange={setCampaignName}
          />

          <Select
            label="Objectif"
            value={campaignObjective}
            options={objectives}
            onChange={setCampaignObjective}
          />

          <Select
            label="Canal"
            value={campaignChannel}
            options={platforms}
            onChange={setCampaignChannel}
          />

          <Input
            label="Budget estimé (€)"
            value={campaignBudget}
            onChange={setCampaignBudget}
            type="number"
          />

          <Input
            label="Date de début"
            value={campaignStart}
            onChange={setCampaignStart}
            type="date"
          />

          <Input
            label="Date de fin"
            value={campaignEnd}
            onChange={setCampaignEnd}
            type="date"
          />

          <button
            onClick={createCampaign}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Créer la campagne
          </button>
        </Modal>
      )}

      {calendarOpen && (
        <Modal
          title="Planifier une publication"
          onClose={() => setCalendarOpen(false)}
        >
          <Input
            label="Titre"
            value={calendarTitle}
            onChange={setCalendarTitle}
          />

          <Select
            label="Type"
            value={calendarType}
            options={contentTypes}
            onChange={setCalendarType}
          />

          <Select
            label="Plateforme"
            value={calendarPlatform}
            options={platforms}
            onChange={setCalendarPlatform}
          />

          <Input
            label="Date de publication"
            value={calendarDate}
            onChange={setCalendarDate}
            type="date"
          />

          <button
            onClick={createCalendarItem}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Planifier
          </button>
        </Modal>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-2.5 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">{children}</div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
      {children}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-52 items-center justify-center p-8 text-center">
      <div>
        <div className="mx-auto flex h-10 w-10 items-center justify-center text-slate-300">
          {icon}
        </div>

        <p className="mt-3 text-sm font-bold text-slate-700">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{text}</p>
      </div>
    </div>
  );
}