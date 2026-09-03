"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit3,
  FileText,
  HardHat,
  Mail,
  MapPin,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  type: string | null;
  status: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  ai_summary: string | null;
  pipeline_stage: string | null;
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [client, setClient] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

const [editForm, setEditForm] = useState({
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postal_code: "",
  status: "",
  notes: "",
});

  useEffect(() => {
    loadClient();
  }, [id]);

  async function loadClient() {
    setLoading(true);

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      setClient(null);
      setLoading(false);
      return;
    }

    setClient(data as ClientRow);
    setEditForm({
  name: data.name ?? "",
  company: data.company ?? "",
  email: data.email ?? "",
  phone: data.phone ?? "",
  address: data.address ?? "",
  city: data.city ?? "",
  postal_code: data.postal_code ?? "",
  status: data.status ?? "",
  notes: data.notes ?? "",
});
    setLoading(false);
  }

  async function saveClientChanges() {
  if (!client) return;

  setSaving(true);

  const { error } = await supabase
    .from("clients")
    .update({
      name: editForm.name.trim(),
      company: editForm.company.trim() || null,
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
      address: editForm.address.trim() || null,
      city: editForm.city.trim() || null,
      postal_code: editForm.postal_code.trim() || null,
      status: editForm.status || null,
      notes: editForm.notes.trim() || null,
    })
    .eq("id", client.id);

  if (error) {
    console.error(error);
    alert("Impossible de modifier ce client.");
    setSaving(false);
    return;
  }

  await loadClient();

  setSaving(false);
  setEditOpen(false);
}
  async function deleteClient() {
    if (!client) return;

    const confirmed = window.confirm(
      `Supprimer définitivement ${client.name} ?`
    );

    if (!confirmed) return;

    setDeleting(true);

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id);

    if (error) {
      console.error(error);
      alert("Impossible de supprimer ce client.");
      setDeleting(false);
      return;
    }

    router.push("/clients");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

          <p className="mt-3 text-xs text-slate-400">
            Chargement du client...
          </p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="px-7 py-7">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-bold text-slate-700">
            Client introuvable
          </p>

          <Link
            href="/clients"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-600"
          >
            <ArrowLeft size={14} />
            Retour aux clients
          </Link>
        </div>
      </div>
    );
  }

  return (
  <>
    <div className="w-full px-7 py-7">
      {/* RETOUR */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft size={14} />
        Retour aux clients
      </Link>

      {/* HEADER */}
      <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FF] text-base font-bold text-blue-700">
            {getInitials(client.name)}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] font-bold tracking-[-0.035em] text-[#172033]">
                {client.name}
              </h1>

              <StatusBadge status={client.status} />
            </div>

            <p className="mt-1.5 text-sm text-slate-500">
              {client.company || "Particulier"}
            </p>

            {client.pipeline_stage && (
              <p className="mt-2 text-[11px] font-semibold text-blue-600">
                Pipeline : {client.pipeline_stage}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Edit3 size={14} />
            Modifier
          </button>

          <button
            type="button"
            onClick={deleteClient}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg border border-red-100 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={14} />
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-7 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* INFORMATIONS */}
          <section className="rounded-xl border border-[#E7E9EE] bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-800">
                Informations
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Coordonnées et informations générales
              </p>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <InfoRow
                icon={UserRound}
                label="Nom"
                value={client.name}
              />

              <InfoRow
                icon={Building2}
                label="Entreprise"
                value={client.company}
              />

              <InfoRow
                icon={Mail}
                label="Email"
                value={client.email}
              />

              <InfoRow
                icon={Phone}
                label="Téléphone"
                value={client.phone}
              />

              <InfoRow
                icon={MapPin}
                label="Adresse"
                value={[
                  client.address,
                  client.postal_code,
                  client.city,
                ]
                  .filter(Boolean)
                  .join(" ")}
              />

              <InfoRow
                icon={CalendarDays}
                label="Créé le"
                value={new Date(client.created_at).toLocaleDateString(
                  "fr-FR"
                )}
              />
            </div>
          </section>

          {/* IA */}
          <section className="rounded-xl border border-[#E7E9EE] bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-800">
                Analyse BatiPilot IA
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Résumé automatique du contact
              </p>
            </div>

            <div className="p-5">
              {client.ai_summary ? (
                <p className="text-xs leading-6 text-slate-600">
                  {client.ai_summary}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Aucune analyse IA disponible pour ce client.
                </p>
              )}
            </div>
          </section>

          {/* NOTES */}
          <section className="rounded-xl border border-[#E7E9EE] bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-800">
                Notes
              </h2>
            </div>

            <div className="p-5">
              <p className="whitespace-pre-wrap text-xs leading-6 text-slate-600">
                {client.notes || "Aucune note pour le moment."}
              </p>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          <section className="rounded-xl border border-[#E7E9EE] bg-white p-5">
            <h2 className="text-sm font-bold text-slate-800">
              Actions rapides
            </h2>

            <div className="mt-4 space-y-2">
              <QuickAction
  icon={CalendarDays}
  label="Créer un rendez-vous"
  onClick={() =>
    router.push(`/rendez-vous?clientId=${client.id}`)
  }
/>

              <QuickAction
  icon={FileText}
  label="Créer un devis"
  onClick={() =>
    router.push(`/devis?clientId=${client.id}`)
  }
/>

              <QuickAction
  icon={HardHat}
  label="Créer un chantier"
  onClick={() =>
    router.push(`/chantiers?clientId=${client.id}`)
  }
/>

</div>

</section>

          <section className="rounded-xl border border-[#E7E9EE] bg-white p-5">
            <h2 className="text-sm font-bold text-slate-800">
              Informations CRM
            </h2>

            <div className="mt-4 space-y-4">
              <SmallInfo
                label="Statut"
                value={mapStatus(client.status)}
              />

              <SmallInfo
                label="Type"
                value={client.type || "Non renseigné"}
              />

              <SmallInfo
                label="Source"
                value={client.source || "Non renseignée"}
              />

              <SmallInfo
                label="Étape pipeline"
                value={client.pipeline_stage || "Non renseignée"}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
    {editOpen && (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 px-4 py-6">
    <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Modifier le client
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Modifie les informations puis enregistre.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditOpen(false)}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          Fermer
        </button>
      </div>
      <div className="mt-6">
  <label className="mb-2 block text-xs font-semibold text-slate-600">
    Nom du client
  </label>

  <input
    type="text"
    value={editForm.name}
    onChange={(e) =>
      setEditForm({ ...editForm, name: e.target.value })
    }
    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
  />
</div>
<div className="mt-4">
  <label className="mb-2 block text-xs font-semibold text-slate-600">
    Entreprise
  </label>

  <input
    type="text"
    value={editForm.company}
    onChange={(e) =>
      setEditForm({ ...editForm, company: e.target.value })
    }
    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
  />
</div>
<div className="mt-4 grid grid-cols-2 gap-4">
  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-600">
      Email
    </label>

    <input
      type="email"
      value={editForm.email}
      onChange={(e) =>
        setEditForm({ ...editForm, email: e.target.value })
      }
      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
    />
  </div>

  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-600">
      Téléphone
    </label>

    <input
      type="tel"
      value={editForm.phone}
      onChange={(e) =>
        setEditForm({ ...editForm, phone: e.target.value })
      }
      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
    />
  </div>
</div>
<div className="mt-4">
  <label className="mb-2 block text-xs font-semibold text-slate-600">
    Adresse
  </label>

  <input
    type="text"
    value={editForm.address}
    onChange={(e) =>
      setEditForm({ ...editForm, address: e.target.value })
    }
    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
  />
</div>
<div className="mt-4 grid grid-cols-2 gap-4">
  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-600">
      Ville
    </label>

    <input
      type="text"
      value={editForm.city}
      onChange={(e) =>
        setEditForm({ ...editForm, city: e.target.value })
      }
      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
    />
  </div>

  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-600">
      Code postal
    </label>

    <input
      type="text"
      value={editForm.postal_code}
      onChange={(e) =>
        setEditForm({ ...editForm, postal_code: e.target.value })
      }
      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
    />
  </div>
</div>
<div className="mt-4">
  <label className="mb-2 block text-xs font-semibold text-slate-600">
    Statut
  </label>

  <select
    value={editForm.status}
    onChange={(e) =>
      setEditForm({ ...editForm, status: e.target.value })
    }
    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
  >
    <option value="prospect">Prospect</option>
    <option value="qualified">Qualifié</option>
    <option value="client">Client</option>
  </select>
</div>
<div className="mt-4">
  <label className="mb-2 block text-xs font-semibold text-slate-600">
    Notes
  </label>

  <textarea
    value={editForm.notes}
    onChange={(e) =>
      setEditForm({ ...editForm, notes: e.target.value })
    }
    rows={4}
    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
  />
</div>
<div className="mt-6 flex justify-end gap-3">
  <button
    type="button"
    onClick={() => setEditOpen(false)}
    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
  >
    Annuler
  </button>

  <button
    type="button"
    onClick={saveClientChanges}
    disabled={saving}
    className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
  >
    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
  </button>
</div>
    </div>
  </div>
)}
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F6F9] text-slate-500">
        <Icon size={14} />
      </div>

      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-xs font-medium text-slate-700">
          {value || "Non renseigné"}
        </p>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-100 px-3 py-3 text-left transition hover:bg-slate-50"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF3FF] text-blue-600">
        <Icon size={14} />
      </div>

      <span className="flex-1 text-[11px] font-semibold text-slate-700">
        {label}
      </span>
    </button>
  );
}

function SmallInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  const label = mapStatus(status);

  const styles =
    status === "qualified"
      ? "bg-blue-50 text-blue-700"
      : status === "prospect"
        ? "bg-slate-100 text-slate-600"
        : "bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`rounded-md px-2 py-1 text-[9px] font-bold ${styles}`}
    >
      {label}
    </span>
  );
}

function mapStatus(status: string | null) {
  if (status === "qualified") return "Qualifié";
  if (status === "prospect") return "Prospect";
  if (status === "client") return "Client";

  return status || "Non renseigné";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}