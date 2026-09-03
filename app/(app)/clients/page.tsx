"use client";
import { useRouter } from "next/navigation";

import {
  Building2,
  ChevronDown,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../../../lib/supabase";

type ClientStatus = "Client" | "Prospect" | "Qualifié";

type Client = {
  id: string;
  organizationId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ClientStatus;
  city: string;
  lastActivity: string;
};

type SupabaseClient = {
  id: string;
  organization_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string | null;
  created_at: string;
};

export default function ClientsPage() {
      const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<"Tous" | ClientStatus>("Tous");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [organizationId, setOrganizationId] = useState("");

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    city: "",
    status: "Client" as ClientStatus,
  });

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage("Utilisateur non connecté.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (profileError || !profile?.organization_id) {
      console.error(profileError);
      setErrorMessage(
        "Impossible de récupérer votre entreprise."
      );
      setLoading(false);
      return;
    }

    const currentOrganizationId =
      profile.organization_id as string;

    setOrganizationId(currentOrganizationId);

    const { data, error } = await supabase
      .from("clients")
      .select(
        `
        id,
        organization_id,
        name,
        company,
        email,
        phone,
        city,
        status,
        created_at
      `
      )
      .eq("organization_id", currentOrganizationId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setErrorMessage(
        "Impossible de charger les clients."
      );
      setLoading(false);
      return;
    }

    const formattedClients = (
      (data ?? []) as SupabaseClient[]
    ).map(formatClient);

    setClients(formattedClients);
    setLoading(false);
  }

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        client.name.toLowerCase().includes(query) ||
        client.company.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.city.toLowerCase().includes(query);

      const matchesFilter =
        filter === "Tous" ||
        client.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [clients, search, filter]);

  const clientCount = clients.filter(
    (client) => client.status === "Client"
  ).length;

  const prospectCount = clients.filter(
    (client) => client.status === "Prospect"
  ).length;

  const companyCount = clients.filter(
    (client) => client.company.trim() !== ""
  ).length;

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setErrorMessage("");

    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      city: "",
      status: "Client",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) return;

    if (!organizationId) {
      setErrorMessage(
        "Organisation introuvable."
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const databaseStatus =
      form.status === "Qualifié"
        ? "qualified"
        : form.status === "Prospect"
          ? "prospect"
          : "client";

    const { data, error } = await supabase
      .from("clients")
      .insert({
        organization_id: organizationId,
        name: form.name.trim(),
        company:
          form.company.trim() || null,
        email:
          form.email.trim() || null,
        phone:
          form.phone.trim() || null,
        city:
          form.city.trim() || null,
        type: "particulier",
        status: databaseStatus,
        source: "batipilot",
        pipeline_stage:
          form.status === "Prospect"
            ? "Nouveau"
            : form.status === "Qualifié"
              ? "Contacté"
              : "Client",
      })
      .select(
        `
        id,
        organization_id,
        name,
        company,
        email,
        phone,
        city,
        status,
        created_at
      `
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMessage(
        "Impossible d'ajouter le client."
      );
      setSaving(false);
      return;
    }

    const newClient = formatClient(
      data as SupabaseClient
    );

    setClients((current) => [
      newClient,
      ...current,
    ]);

    setSaving(false);
    closeModal();
  }

  return (
    <>
      <div className="w-full px-7 py-7">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.035em] text-[#172033]">
              Clients
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Gérez vos clients, prospects et contacts depuis un seul espace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={15} />
            Nouveau client
          </button>
        </div>

        {/* STATS */}
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={Users}
            label="Clients"
            value={String(clientCount)}
            description="Clients actifs"
          />

          <StatCard
            icon={UserRound}
            label="Prospects"
            value={String(prospectCount)}
            description="À convertir"
          />

          <StatCard
            icon={Building2}
            label="Entreprises"
            value={String(companyCount)}
            description="Dans votre CRM"
          />
        </div>

        {errorMessage && !modalOpen && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
            {errorMessage}
          </div>
        )}

        {/* TABLE */}
        <section className="mt-4 overflow-hidden rounded-xl border border-[#E7E9EE] bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[340px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher un client..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  "Tous",
                  "Client",
                  "Prospect",
                  "Qualifié",
                ] as const
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setFilter(status)
                  }
                  className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
                    filter === status
                      ? "bg-[#172033] text-white"
                      : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {status}
                </button>
              ))}

              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Plus de filtres
                <ChevronDown size={13} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <p className="mt-3 text-xs text-slate-400">
                  Chargement des clients...
                </p>
              </div>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#FBFCFD]">
                    <TableHead>Client</TableHead>
                    <TableHead>
                      Coordonnées
                    </TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>
                      Dernière activité
                    </TableHead>
                    <TableHead />
                  </tr>
                </thead>

                <tbody>
                  {filteredClients.map(
                    (client) => (
                     <tr
  key={client.id}
  onClick={() => router.push(`/clients/${client.id}`)}
  className="cursor-pointer border-b border-slate-100 transition last:border-none hover:bg-[#FBFCFD]"
>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FF] text-[11px] font-bold text-blue-700">
                              {getInitials(
                                client.name
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800">
                                {client.name}
                              </p>

                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                {client.company ||
                                  "Particulier"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[11px] text-slate-600">
                              <Mail
                                size={12}
                                className="text-slate-400"
                              />

                              {client.email ||
                                "—"}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <Phone
                                size={12}
                                className="text-slate-400"
                              />

                              {client.phone ||
                                "—"}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[11px] font-medium text-slate-600">
                          {client.city || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              client.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4 text-[11px] text-slate-500">
                          {
                            client.lastActivity
                          }
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreHorizontal
                              size={16}
                            />
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Users size={19} />
              </div>

              <p className="mt-4 text-sm font-bold text-slate-700">
                Aucun client trouvé
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Modifiez votre recherche ou ajoutez un nouveau client.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-[10px] text-slate-400">
              {filteredClients.length} résultat
              {filteredClients.length > 1
                ? "s"
                : ""}
            </p>
          </div>
        </section>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            onClick={closeModal}
            className="absolute inset-0 bg-[#0F172A]/35 backdrop-blur-[2px]"
          />

          <div className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <UserRound size={16} />
                </div>

                <h2 className="mt-4 text-lg font-bold tracking-[-0.02em] text-[#172033]">
                  Nouveau client
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Ajoutez un nouveau contact à votre CRM.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
                {errorMessage && (
                  <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[11px] font-medium text-red-600">
                    {errorMessage}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FormLabel required>
                      Nom du client
                    </FormLabel>

                    <div className="relative mt-1.5">
                      <UserRound
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        required
                        autoFocus
                        value={form.name}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            name: event.target.value,
                          })
                        }
                        placeholder="Ex. Jean Dupont"
                        className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <FormLabel>
                      Entreprise
                    </FormLabel>

                    <div className="relative mt-1.5">
                      <Building2
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        value={form.company}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            company:
                              event.target.value,
                          })
                        }
                        placeholder="Ex. Dupont Rénovation"
                        className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel>Email</FormLabel>

                    <div className="relative mt-1.5">
                      <Mail
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            email:
                              event.target.value,
                          })
                        }
                        placeholder="client@email.fr"
                        className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel>
                      Téléphone
                    </FormLabel>

                    <div className="relative mt-1.5">
                      <Phone
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            phone:
                              event.target.value,
                          })
                        }
                        placeholder="06 12 34 56 78"
                        className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel>Ville</FormLabel>

                    <div className="relative mt-1.5">
                      <MapPin
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        value={form.city}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            city:
                              event.target.value,
                          })
                        }
                        placeholder="Ex. Dijon"
                        className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel>Statut</FormLabel>

                    <div className="relative mt-1.5">
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            status:
                              event.target
                                .value as ClientStatus,
                          })
                        }
                        className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="Client">
                          Client
                        </option>

                        <option value="Prospect">
                          Prospect
                        </option>

                        <option value="Qualifié">
                          Qualifié
                        </option>
                      </select>

                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-[#FBFCFD] px-6 py-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Ajouter le client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function formatClient(
  client: SupabaseClient
): Client {
  return {
    id: client.id,
    organizationId:
      client.organization_id,
    name: client.name,
    company: client.company ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    city: client.city ?? "",
    status: mapDatabaseStatus(
      client.status
    ),
    lastActivity: formatDate(
      client.created_at
    ),
  };
}

function mapDatabaseStatus(
  status: string | null
): ClientStatus {
  if (status === "qualified") {
    return "Qualifié";
  }

  if (status === "prospect") {
    return "Prospect";
  }

  return "Client";
}

function formatDate(date: string) {
  const createdDate = new Date(date);
  const now = new Date();

  const difference =
    now.getTime() - createdDate.getTime();

  const minutes = Math.floor(
    difference / 60000
  );

  const hours = Math.floor(
    difference / 3600000
  );

  const days = Math.floor(
    difference / 86400000
  );

  if (minutes < 1) {
    return "À l'instant";
  }

  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  }

  if (hours < 24) {
    return `Il y a ${hours} h`;
  }

  if (days === 1) {
    return "Hier";
  }

  if (days < 7) {
    return `Il y a ${days} jours`;
  }

  return createdDate.toLocaleDateString(
    "fr-FR"
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[#E7E9EE] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F6F9] text-slate-500">
          <Icon size={16} />
        </div>

        <div>
          <p className="text-[10px] font-medium text-slate-400">
            {label}
          </p>

          <div className="mt-0.5 flex items-baseline gap-2">
            <p className="text-lg font-bold text-slate-800">
              {value}
            </p>

            <p className="text-[9px] text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableHead({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
      {children}
    </th>
  );
}

function StatusBadge({
  status,
}: {
  status: ClientStatus;
}) {
  const styles: Record<
    ClientStatus,
    string
  > = {
    Client:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
    Prospect:
      "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
    Qualifié:
      "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[9px] font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function FormLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-[10px] font-bold text-slate-600">
      {children}

      {required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
    </label>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}