"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Clock3,
  FileBarChart,
  FileText,
  FolderOpen,
  HandCoins,
  HardHat,
  Headphones,
  LayoutDashboard,
  ListTodo,
  Loader2,
  LogOut,
  Megaphone,
  Phone,
  Receipt,
  Search,
  Settings,
  Sparkles,
  User,
  UserPlus,
  Users,
  WalletCards,
  Workflow,
  X,
} from "lucide-react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type UserInfo = {
  firstName: string;
  lastName: string;
  email: string;
};

type OrganizationInfo = {
  id: string;
  name: string;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  type: "relance" | "rendez-vous";
};

type GlobalSearchItem = {
  id: string;
  type:
    | "Client"
    | "Prospect"
    | "Devis"
    | "Facture"
    | "Chantier"
    | "Rendez-vous"
    | "Relance";
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
};

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserInfo>({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [organization, setOrganization] =
    useState<OrganizationInfo | null>(null);

  const [loadingUser, setLoadingUser] = useState(true);

  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [sidebarUserMenuOpen, setSidebarUserMenuOpen] = useState(false);
  const [topUserMenuOpen, setTopUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchItems, setSearchItems] = useState<GlobalSearchItem[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        closeAllMenus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        openGlobalSearch();
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        closeAllMenus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  async function loadUserData() {
    setLoadingUser(true);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.replace("/connexion");
      return;
    }

    const firstName =
      authUser.user_metadata?.first_name ||
      authUser.user_metadata?.given_name ||
      "";

    const lastName =
      authUser.user_metadata?.last_name ||
      authUser.user_metadata?.family_name ||
      "";

    setUser({
      firstName,
      lastName,
      email: authUser.email || "",
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      setLoadingUser(false);
      return;
    }

    const organizationId = profile.organization_id;

    const [{ data: organizationData }, relancesResult, rendezVousResult] =
      await Promise.all([
        supabase
          .from("organizations")
          .select("id,name")
          .eq("id", organizationId)
          .maybeSingle(),

        supabase
          .from("relances")
          .select("id,title,status,scheduled_at")
          .eq("organization_id", organizationId)
          .neq("status", "Terminée")
          .neq("status", "Annulée"),

        supabase
          .from("rendez_vous")
          .select("id,title,status,start_at")
          .eq("organization_id", organizationId)
          .neq("status", "Terminé")
          .neq("status", "Annulé"),
      ]);

    if (organizationData) {
      setOrganization({
        id: organizationData.id,
        name: organizationData.name || "Mon entreprise",
      });
    }

    const now = new Date();
    const generatedNotifications: NotificationItem[] = [];

    for (const relance of relancesResult.data || []) {
      if (!relance.scheduled_at) continue;

      const scheduledAt = new Date(relance.scheduled_at);

      if (scheduledAt < now) {
        generatedNotifications.push({
          id: `relance-${relance.id}`,
          title: "Relance en retard",
          description:
            relance.title || "Une relance nécessite votre attention.",
          href: "/relances",
          type: "relance",
        });
      }
    }

    const next24Hours = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    for (const rendezVous of rendezVousResult.data || []) {
      if (!rendezVous.start_at) continue;

      const startAt = new Date(rendezVous.start_at);

      if (startAt >= now && startAt <= next24Hours) {
        generatedNotifications.push({
          id: `rdv-${rendezVous.id}`,
          title: "Rendez-vous à venir",
          description:
            rendezVous.title ||
            "Un rendez-vous est prévu dans les prochaines 24 heures.",
          href: "/rendez-vous",
          type: "rendez-vous",
        });
      }
    }

    setNotifications(generatedNotifications);
    setLoadingUser(false);
  }

  async function loadGlobalSearchData() {
    if (!organization?.id) return;

    setSearchLoading(true);
    setSearchError("");

    const organizationId = organization.id;

    const [
      clientsResult,
      devisResult,
      facturesResult,
      chantiersResult,
      rendezVousResult,
      relancesResult,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select(
          "id,name,company,email,phone,city,status"
        )
        .eq("organization_id", organizationId),

      supabase
        .from("devis")
        .select(
          "id,number,project,description,status,amount"
        )
        .eq("organization_id", organizationId),

      supabase
        .from("factures")
        .select(
          "id,number,title,description,status,amount"
        )
        .eq("organization_id", organizationId),

      supabase
        .from("chantiers")
        .select(
          "id,name,description,address,city,status"
        )
        .eq("organization_id", organizationId),

      supabase
        .from("rendez_vous")
        .select(
          "id,title,description,address,status,start_at"
        )
        .eq("organization_id", organizationId),

      supabase
        .from("relances")
        .select(
          "id,title,description,channel,status"
        )
        .eq("organization_id", organizationId),
    ]);

    const firstError =
      clientsResult.error ||
      devisResult.error ||
      facturesResult.error ||
      chantiersResult.error ||
      rendezVousResult.error ||
      relancesResult.error;

    if (firstError) {
      console.error(firstError);
      setSearchError(firstError.message);
      setSearchLoading(false);
      return;
    }

    const results: GlobalSearchItem[] = [];

    for (const client of clientsResult.data || []) {
      const isClient =
        client.status?.toLowerCase() === "client";

      results.push({
        id: `client-${client.id}`,
        type: isClient ? "Client" : "Prospect",
        title:
          client.company ||
          client.name ||
          "Contact sans nom",
        subtitle: [
          client.name,
          client.email,
          client.phone,
          client.city,
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/clients/${client.id}`,
        keywords: [
          client.name,
          client.company,
          client.email,
          client.phone,
          client.city,
          client.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    }

    for (const devis of devisResult.data || []) {
      results.push({
        id: `devis-${devis.id}`,
        type: "Devis",
        title:
          devis.number
            ? `Devis ${devis.number}`
            : devis.project || "Devis",
        subtitle: [
          devis.project,
          devis.status,
          `${Number(devis.amount || 0).toLocaleString("fr-FR")} €`,
        ]
          .filter(Boolean)
          .join(" · "),
        href: "/devis",
        keywords: [
          devis.number,
          devis.project,
          devis.description,
          devis.status,
          String(devis.amount || ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    }

    for (const facture of facturesResult.data || []) {
      results.push({
        id: `facture-${facture.id}`,
        type: "Facture",
        title:
          facture.number
            ? `Facture ${facture.number}`
            : facture.title || "Facture",
        subtitle: [
          facture.title,
          facture.status,
          `${Number(facture.amount || 0).toLocaleString("fr-FR")} €`,
        ]
          .filter(Boolean)
          .join(" · "),
        href: "/factures",
        keywords: [
          facture.number,
          facture.title,
          facture.description,
          facture.status,
          String(facture.amount || ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    }

    for (const chantier of chantiersResult.data || []) {
      results.push({
        id: `chantier-${chantier.id}`,
        type: "Chantier",
        title: chantier.name || "Chantier",
        subtitle: [
          chantier.city,
          chantier.address,
          chantier.status,
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/chantiers/${chantier.id}`,
        keywords: [
          chantier.name,
          chantier.description,
          chantier.address,
          chantier.city,
          chantier.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    }

    for (const rdv of rendezVousResult.data || []) {
      results.push({
        id: `rdv-${rdv.id}`,
        type: "Rendez-vous",
        title: rdv.title || "Rendez-vous",
        subtitle: [
          rdv.address,
          rdv.status,
          rdv.start_at
            ? new Date(rdv.start_at).toLocaleDateString("fr-FR")
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
        href: "/rendez-vous",
        keywords: [
          rdv.title,
          rdv.description,
          rdv.address,
          rdv.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    }

    for (const relance of relancesResult.data || []) {
      results.push({
        id: `relance-${relance.id}`,
        type: "Relance",
        title: relance.title || "Relance",
        subtitle: [
          relance.channel,
          relance.status,
        ]
          .filter(Boolean)
          .join(" · "),
        href: "/relances",
        keywords: [
          relance.title,
          relance.description,
          relance.channel,
          relance.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      });
    }

    setSearchItems(results);
    setSearchLoading(false);
  }

  async function openGlobalSearch() {
    closeAllMenus();
    setSearchOpen(true);
    setSearchQuery("");

    if (searchItems.length === 0) {
      await loadGlobalSearchData();
    }
  }

  function closeGlobalSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  function goToSearchResult(item: GlobalSearchItem) {
    closeGlobalSearch();
    router.push(item.href);
  }

  function closeAllMenus() {
    setCompanyMenuOpen(false);
    setSidebarUserMenuOpen(false);
    setTopUserMenuOpen(false);
    setNotificationsOpen(false);
  }

  function toggleCompanyMenu() {
    setCompanyMenuOpen((value) => !value);
    setSidebarUserMenuOpen(false);
    setTopUserMenuOpen(false);
    setNotificationsOpen(false);
  }

  function toggleSidebarUserMenu() {
    setSidebarUserMenuOpen((value) => !value);
    setCompanyMenuOpen(false);
    setTopUserMenuOpen(false);
    setNotificationsOpen(false);
  }

  function toggleTopUserMenu() {
    setTopUserMenuOpen((value) => !value);
    setCompanyMenuOpen(false);
    setSidebarUserMenuOpen(false);
    setNotificationsOpen(false);
  }

  function toggleNotifications() {
    setNotificationsOpen((value) => !value);
    setCompanyMenuOpen(false);
    setSidebarUserMenuOpen(false);
    setTopUserMenuOpen(false);
  }

  async function logout() {
    closeAllMenus();

    await supabase.auth.signOut();

    router.replace("/connexion");
    router.refresh();
  }

  const displayName = useMemo(() => {
    const fullName = `${user.firstName} ${user.lastName}`.trim();

    if (fullName) return fullName;

    if (user.email) {
      return user.email.split("@")[0];
    }

    return "Utilisateur";
  }, [user]);

  const initials = useMemo(() => {
    const first =
      user.firstName?.trim()?.charAt(0)?.toUpperCase() || "";

    const last =
      user.lastName?.trim()?.charAt(0)?.toUpperCase() || "";

    if (first || last) {
      return `${first}${last}`;
    }

    return user.email?.charAt(0)?.toUpperCase() || "U";
  }, [user]);

  const filteredSearchItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return searchItems.slice(0, 12);
    }

    return searchItems
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(query) ||
          item.subtitle.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.keywords.includes(query)
        );
      })
      .slice(0, 30);
  }, [searchItems, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div ref={dropdownRef}>
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-slate-200 bg-white">
          <div className="flex h-16 items-center border-b border-slate-100 px-5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              onClick={closeAllMenus}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <HardHat className="h-4 w-4 text-white" />
              </div>

              <span className="text-base font-bold tracking-tight text-slate-900">
                BatiPilot
              </span>
            </Link>
          </div>

          <div className="relative px-3 py-3">
            <button
              onClick={toggleCompanyMenu}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                companyMenuOpen
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Building2 className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {loadingUser
                      ? "Chargement..."
                      : organization?.name || "Mon entreprise"}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Espace principal
                  </p>
                </div>
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                  companyMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {companyMenuOpen && (
              <div className="absolute left-3 right-3 top-[68px] z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Espace actif
                </p>

                <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Building2 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {organization?.name || "Mon entreprise"}
                    </p>

                    <p className="mt-0.5 text-[10px] text-blue-600">
                      Espace principal
                    </p>
                  </div>
                </div>

                <div className="my-2 h-px bg-slate-100" />

                <Link
                  href="/parametres"
                  onClick={closeAllMenus}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres de l’entreprise
                </Link>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-5">
            <SidebarSection label="PRINCIPAL">
              <SidebarItem
                href="/dashboard"
                label="Vue d’ensemble"
                icon={LayoutDashboard}
                pathname={pathname}
              />

              <SidebarItem
                href="/clients"
                label="Clients"
                icon={Users}
                pathname={pathname}
              />

              <SidebarItem
                href="/prospects"
                label="Prospects"
                icon={UserPlus}
                pathname={pathname}
              />

              <SidebarItem
                href="/relances"
                label="Relances"
                icon={Clock3}
                pathname={pathname}
              />
            </SidebarSection>

            <SidebarSection label="GESTION">
              <SidebarItem
                href="/devis"
                label="Devis"
                icon={FileText}
                pathname={pathname}
              />

              <SidebarItem
                href="/factures"
                label="Factures"
                icon={Receipt}
                pathname={pathname}
              />

              <SidebarItem
                href="/appels-offres"
                label="Appels d’offres"
                icon={BriefcaseBusiness}
                pathname={pathname}
              />

              <SidebarItem
                href="/chantiers"
                label="Chantiers"
                icon={HardHat}
                pathname={pathname}
              />

              <SidebarItem
                href="/dossiers-aides"
                label="Dossiers d’aides"
                icon={HandCoins}
                pathname={pathname}
              />

              <SidebarItem
                href="/documents"
                label="Documents"
                icon={FolderOpen}
                pathname={pathname}
              />

              <SidebarItem
                href="/rendez-vous"
                label="Rendez-vous"
                icon={CalendarDays}
                pathname={pathname}
              />

              <SidebarItem
                href="/agenda"
                label="Agenda"
                icon={CalendarRange}
                pathname={pathname}
              />

              <SidebarItem
                href="/taches"
                label="Tâches"
                icon={ListTodo}
                pathname={pathname}
              />

              <SidebarItem
                href="/appels"
                label="Appels"
                icon={Phone}
                pathname={pathname}
              />
            </SidebarSection>

            <SidebarSection label="INTELLIGENCE ARTIFICIELLE">
              <SidebarItem
                href="/agents-ia"
                label="Agents IA"
                icon={Bot}
                pathname={pathname}
              />

              <SidebarItem
                href="/telephone-ia"
                label="Téléphone IA"
                icon={Headphones}
                pathname={pathname}
              />

              <SidebarItem
                href="/autopilot"
                label="Autopilot"
                icon={Sparkles}
                pathname={pathname}
              />

              <SidebarItem
                href="/automatisations"
                label="Automatisations"
                icon={Workflow}
                pathname={pathname}
              />

              <SidebarItem
                href="/marketing-ia"
                label="Marketing IA"
                icon={Megaphone}
                pathname={pathname}
              />
            </SidebarSection>

            <SidebarSection label="PILOTAGE">
              <SidebarItem
                href="/statistiques"
                label="Statistiques"
                icon={BarChart3}
                pathname={pathname}
              />

              <SidebarItem
                href="/rapports"
                label="Rapports"
                icon={FileBarChart}
                pathname={pathname}
              />

              <SidebarItem
                href="/activite"
                label="Activité"
                icon={Activity}
                pathname={pathname}
              />
            </SidebarSection>
          </nav>

          <div className="relative border-t border-slate-100 p-3">
            {sidebarUserMenuOpen && (
              <UserDropdown
                className="bottom-[70px] left-3 right-3"
                displayName={displayName}
                email={user.email}
                onClose={closeAllMenus}
                onLogout={logout}
              />
            )}

            <button
              onClick={toggleSidebarUserMenu}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50"
            >
              <Avatar initials={initials} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">
                  {displayName}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Administrateur
                </p>
              </div>

              <span className="text-lg leading-none text-slate-400">
                •••
              </span>
            </button>

            <Link
              href="/parametres"
              className={`mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                pathname.startsWith("/parametres")
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </Link>
          </div>
        </aside>

        <header className="fixed left-[240px] right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <h1 className="text-sm font-bold text-slate-900">
              {getPageName(pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openGlobalSearch}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              title="Recherche globale — Ctrl + K"
            >
              <Search className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                className={`relative flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                  notificationsOpen
                    ? "border-blue-200 bg-blue-50 text-blue-600"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
                title="Notifications"
              >
                <Bell className="h-4 w-4" />

                {notifications.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Notifications
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {notifications.length} notification(s)
                      </p>
                    </div>

                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <Bell className="mx-auto h-6 w-6 text-slate-300" />

                      <p className="mt-3 text-xs font-semibold text-slate-600">
                        Aucune notification
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Tout est à jour pour le moment.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[360px] overflow-y-auto p-2">
                      {notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.href}
                          onClick={closeAllMenus}
                          className="block rounded-lg px-3 py-3 transition hover:bg-slate-50"
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                notification.type === "relance"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {notification.type === "relance" ? (
                                <Clock3 className="h-4 w-4" />
                              ) : (
                                <CalendarDays className="h-4 w-4" />
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {notification.title}
                              </p>

                              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                                {notification.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative ml-1">
              <button
                onClick={toggleTopUserMenu}
                className={`flex items-center gap-3 rounded-xl px-2 py-1.5 transition ${
                  topUserMenuOpen
                    ? "bg-slate-100"
                    : "hover:bg-slate-50"
                }`}
              >
                <Avatar initials={initials} />

                <div className="hidden text-left md:block">
                  <p className="max-w-[130px] truncate text-xs font-bold text-slate-900">
                    {displayName}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Administrateur
                  </p>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition ${
                    topUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {topUserMenuOpen && (
                <UserDropdown
                  className="right-0 top-12 w-[250px]"
                  displayName={displayName}
                  email={user.email}
                  onClose={closeAllMenus}
                  onLogout={logout}
                />
              )}
            </div>
          </div>
        </header>
      </div>

      <main className="min-h-screen pl-[240px] pt-16">
        {children}
      </main>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-center bg-slate-950/30 px-4 pt-[10vh] backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeGlobalSearch();
            }
          }}
        >
          <div className="h-fit w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center border-b border-slate-100 px-4">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />

              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un client, devis, chantier..."
                className="h-14 min-w-0 flex-1 border-none bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              <button
                type="button"
                onClick={closeGlobalSearch}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2">
              <p className="text-[11px] text-slate-400">
                Recherche globale BatiPilot
              </p>

              <p className="text-[10px] font-medium text-slate-400">
                ESC pour fermer
              </p>
            </div>

            <div className="max-h-[520px] overflow-y-auto p-2">
              {searchLoading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />

                    <p className="mt-3 text-xs text-slate-500">
                      Recherche dans BatiPilot...
                    </p>
                  </div>
                </div>
              ) : searchError ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-semibold text-red-600">
                    Impossible de charger la recherche
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {searchError}
                  </p>

                  <button
                    onClick={loadGlobalSearchData}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Réessayer
                  </button>
                </div>
              ) : filteredSearchItems.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center px-6 text-center">
                  <div>
                    <Search className="mx-auto h-7 w-7 text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Aucun résultat
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Essaie avec un nom de client, un numéro de devis ou le nom d’un chantier.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {!searchQuery.trim() && (
                    <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Éléments récents
                    </p>
                  )}

                  <div className="space-y-1">
                    {filteredSearchItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => goToSearchResult(item)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                      >
                        <SearchResultIcon type={item.type} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {item.title}
                            </p>

                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                              {item.type}
                            </span>
                          </div>

                          {item.subtitle && (
                            <p className="mt-1 truncate text-[11px] text-slate-400">
                              {item.subtitle}
                            </p>
                          )}
                        </div>

                        <span className="text-xs text-slate-300">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5">
              <p className="text-[10px] text-slate-400">
                {filteredSearchItems.length} résultat(s)
              </p>

              <p className="text-[10px] text-slate-400">
                Raccourci : Ctrl + K
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
}) {
  const active =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-semibold transition ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      <Icon
        className={`h-[17px] w-[17px] ${
          active ? "text-blue-600" : "text-slate-400"
        }`}
      />

      <span>{label}</span>
    </Link>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
      {initials}
    </div>
  );
}

function UserDropdown({
  className,
  displayName,
  email,
  onClose,
  onLogout,
}: {
  className: string;
  displayName: string;
  email: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <div
      className={`absolute z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl ${className}`}
    >
      <div className="px-3 py-2">
        <p className="truncate text-xs font-bold text-slate-900">
          {displayName}
        </p>

        <p className="mt-1 truncate text-[10px] text-slate-400">
          {email}
        </p>
      </div>

      <div className="my-1 h-px bg-slate-100" />

      <Link
        href="/parametres"
        onClick={onClose}
        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
      >
        <User className="h-4 w-4" />
        Mon profil
      </Link>

      <Link
        href="/parametres"
        onClick={onClose}
        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
      >
        <Settings className="h-4 w-4" />
        Paramètres
      </Link>

      <div className="my-1 h-px bg-slate-100" />

      <button
        onClick={onLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </div>
  );
}

function SearchResultIcon({
  type,
}: {
  type: GlobalSearchItem["type"];
}) {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg";

  if (type === "Client") {
    return (
      <div className={`${base} bg-blue-50 text-blue-600`}>
        <Users className="h-4 w-4" />
      </div>
    );
  }

  if (type === "Prospect") {
    return (
      <div className={`${base} bg-indigo-50 text-indigo-600`}>
        <UserPlus className="h-4 w-4" />
      </div>
    );
  }

  if (type === "Devis") {
    return (
      <div className={`${base} bg-violet-50 text-violet-600`}>
        <FileText className="h-4 w-4" />
      </div>
    );
  }

  if (type === "Facture") {
    return (
      <div className={`${base} bg-emerald-50 text-emerald-600`}>
        <WalletCards className="h-4 w-4" />
      </div>
    );
  }

  if (type === "Chantier") {
    return (
      <div className={`${base} bg-orange-50 text-orange-600`}>
        <HardHat className="h-4 w-4" />
      </div>
    );
  }

  if (type === "Rendez-vous") {
    return (
      <div className={`${base} bg-cyan-50 text-cyan-600`}>
        <CalendarDays className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className={`${base} bg-amber-50 text-amber-600`}>
      <Clock3 className="h-4 w-4" />
    </div>
  );
}

function getPageName(pathname: string) {
  const pages: Record<string, string> = {
    "/dashboard": "Vue d’ensemble",
    "/clients": "Clients",
    "/prospects": "Prospects",
    "/relances": "Relances",
    "/devis": "Devis",
    "/factures": "Factures",
    "/appels-offres": "Appels d’offres",
    "/chantiers": "Chantiers",
    "/dossiers-aides": "Dossiers d’aides",
    "/documents": "Documents",
    "/rendez-vous": "Rendez-vous",
    "/agenda": "Agenda",
    "/taches": "Tâches",
    "/appels": "Appels",
    "/agents-ia": "Agents IA",
    "/telephone-ia": "Téléphone IA",
    "/autopilot": "Autopilot",
    "/automatisations": "Automatisations",
    "/marketing-ia": "Marketing IA",
    "/statistiques": "Statistiques",
    "/rapports": "Rapports",
    "/activite": "Activité",
    "/parametres": "Paramètres",
  };

  const exact = pages[pathname];

  if (exact) return exact;

  const route = Object.keys(pages)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(`${key}/`));

  return route ? pages[route] : "BatiPilot";
}