"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserRoundSearch,
  BellRing,
  FileText,
  ReceiptText,
  Landmark,
  HardHat,
  FolderKanban,
  CalendarDays,
  CalendarRange,
  ListTodo,
  Phone,
  Bot,
  Headphones,
  WandSparkles,
  Zap,
  Megaphone,
  BarChart3,
  FileBarChart,
  Activity,
  ChevronDown,
  Building2,
  Settings,
} from "lucide-react";
import { useState } from "react";

type GroupName =
  | "CRM"
  | "Commercial"
  | "Chantiers"
  | "Organisation"
  | "IA"
  | "Pilotage";

export default function Sidebar() {
  const pathname = usePathname();

  const [openGroup, setOpenGroup] =
    useState<GroupName | null>("CRM");

  const toggleGroup = (group: GroupName) => {
    setOpenGroup((current) =>
      current === group ? null : group
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[230px] flex-col border-r border-slate-200 bg-white">
      
      {/* LOGO */}
      <div className="flex h-16 items-center border-b border-slate-100 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <img
            src="/image/batipilot-logo.png"
            alt="BatiPilot"
            className="h-9 w-9 rounded-xl object-cover"
          />

          <div>
            <p className="text-sm font-black text-[#172033]">
              BatiPilot
            </p>

            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Pilotage BTP
            </p>
          </div>
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">

        <NavItem
          href="/dashboard"
          label="Dashboard"
          icon={LayoutDashboard}
          pathname={pathname}
        />

        <SidebarGroup
          title="CRM"
          open={openGroup === "CRM"}
          onClick={() => toggleGroup("CRM")}
        >
          <NavItem
            href="/clients"
            label="Clients"
            icon={Users}
            pathname={pathname}
          />

          <NavItem
            href="/prospects"
            label="Prospects"
            icon={UserRoundSearch}
            pathname={pathname}
          />

          <NavItem
            href="/relances"
            label="Relances"
            icon={BellRing}
            pathname={pathname}
          />
        </SidebarGroup>

        <SidebarGroup
          title="Commercial"
          open={openGroup === "Commercial"}
          onClick={() => toggleGroup("Commercial")}
        >
          <NavItem
            href="/devis"
            label="Devis"
            icon={FileText}
            pathname={pathname}
          />

          <NavItem
            href="/factures"
            label="Factures"
            icon={ReceiptText}
            pathname={pathname}
          />

          <NavItem
            href="/appels-offres"
            label="Appels d’offres"
            icon={Landmark}
            pathname={pathname}
          />
        </SidebarGroup>

        <SidebarGroup
          title="Chantiers"
          open={openGroup === "Chantiers"}
          onClick={() => toggleGroup("Chantiers")}
        >
          <NavItem
            href="/chantiers"
            label="Chantiers"
            icon={HardHat}
            pathname={pathname}
          />

          <NavItem
            href="/dossiers-aides"
            label="Dossiers d’aides"
            icon={FolderKanban}
            pathname={pathname}
          />
        </SidebarGroup>

        <SidebarGroup
          title="Organisation"
          open={openGroup === "Organisation"}
          onClick={() =>
            toggleGroup("Organisation")
          }
        >
          <NavItem
            href="/rendez-vous"
            label="Rendez-vous"
            icon={CalendarDays}
            pathname={pathname}
          />

          <NavItem
            href="/agenda"
            label="Agenda"
            icon={CalendarRange}
            pathname={pathname}
          />

          <NavItem
            href="/taches"
            label="Tâches"
            icon={ListTodo}
            pathname={pathname}
          />

          <NavItem
            href="/appels"
            label="Appels"
            icon={Phone}
            pathname={pathname}
          />
        </SidebarGroup>

        <SidebarGroup
          title="IA"
          open={openGroup === "IA"}
          onClick={() => toggleGroup("IA")}
        >
          <NavItem
            href="/agents-ia"
            label="Agents IA"
            icon={Bot}
            pathname={pathname}
          />

          <NavItem
            href="/telephone-ia"
            label="Téléphone IA"
            icon={Headphones}
            pathname={pathname}
          />

          <NavItem
            href="/autopilot"
            label="Autopilot"
            icon={WandSparkles}
            pathname={pathname}
          />

          <NavItem
            href="/automatisations"
            label="Automatisations"
            icon={Zap}
            pathname={pathname}
          />

          <NavItem
            href="/marketing"
            label="Marketing IA"
            icon={Megaphone}
            pathname={pathname}
          />
        </SidebarGroup>

        <SidebarGroup
          title="Pilotage"
          open={openGroup === "Pilotage"}
          onClick={() => toggleGroup("Pilotage")}
        >
          <NavItem
            href="/statistiques"
            label="Statistiques"
            icon={BarChart3}
            pathname={pathname}
          />

          <NavItem
            href="/rapports"
            label="Rapports"
            icon={FileBarChart}
            pathname={pathname}
          />

          <NavItem
            href="/activite"
            label="Activité"
            icon={Activity}
            pathname={pathname}
          />
        </SidebarGroup>
      </nav>

      {/* BAS */}
      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Building2 size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-black text-[#172033]">
              Mon entreprise
            </p>

            <p className="truncate text-[10px] text-slate-400">
              Paramètres
            </p>
          </div>

          <Settings
            size={15}
            className="text-slate-400"
          />
        </button>
      </div>
    </aside>
  );
}

function SidebarGroup({
  title,
  open,
  onClick,
  children,
}: {
  title: string;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400"
      >
        {title}

        <ChevronDown
          size={14}
          className={`transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

function NavItem({
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
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-slate-600 hover:bg-slate-50 hover:text-[#172033]"
      }`}
    >
      <Icon size={17} />

      <span>{label}</span>
    </Link>
  );
}