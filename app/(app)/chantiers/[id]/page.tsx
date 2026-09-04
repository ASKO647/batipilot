

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Circle,
  Download,
  Euro,
  ExternalLink,
  File,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
  Upload,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "../../../../lib/supabase";

type ChantierRow = {
  id: string;
  organization_id: string;
  client_id: string | null;
  devis_id: string | null;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  status: string;
  progress: number;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  ai_summary: string | null;
  ai_generated: boolean | null;
  created_at: string;
  updated_at: string | null;
};

type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
};

type ChantierPhoto = {
  id: string;
  organization_id: string;
  chantier_id: string;
  file_name: string;
  file_path: string;
  caption: string | null;
  created_at: string;
  publicUrl: string;
};

type ChantierDocument = {
  id: string;
  organization_id: string;
  chantier_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  note: string | null;
  created_at: string;
  publicUrl: string;
};

type ChantierIntervention = {
  id: string;
  organization_id: string;
  chantier_id: string;
  type:
    | "Note"
    | "Intervention"
    | "Incident"
    | "Livraison"
    | "Réunion"
    | "Avancement";
  title: string;
  content: string | null;
  intervention_date: string;
  author_name: string | null;
  created_at: string;
  updated_at: string;
};

type ChantierTache = {
  id: string;
  organization_id: string;
  chantier_id: string;
  title: string;
  description: string | null;
  status: "À faire" | "En cours" | "Terminée" | "Annulée";
  priority: "Faible" | "Normale" | "Haute" | "Urgente";
  responsible: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function ChantierDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const [chantier, setChantier] =
    useState<ChantierRow | null>(null);

  const [client, setClient] =
    useState<ClientRow | null>(null);

  const [photos, setPhotos] =
    useState<ChantierPhoto[]>([]);

  const [documents, setDocuments] =
    useState<ChantierDocument[]>([]);

  const [interventions, setInterventions] =
    useState<ChantierIntervention[]>([]);

  const [taches, setTaches] =
    useState<ChantierTache[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);
  const [uploadingDocument, setUploadingDocument] =
    useState(false);
  const [addingIntervention, setAddingIntervention] =
    useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [generatingSummary, setGeneratingSummary] =
    useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [interventionOpen, setInterventionOpen] =
    useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const [photoOpen, setPhotoOpen] =
    useState<ChantierPhoto | null>(null);

  const [photoCaption, setPhotoCaption] = useState("");
  const [documentCategory, setDocumentCategory] =
    useState("Autre");
  const [documentNote, setDocumentNote] = useState("");

  const [interventionForm, setInterventionForm] =
    useState({
      type: "Note",
      title: "",
      content: "",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
    });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Normale",
    responsible: "",
    dueDate: "",
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    postalCode: "",
    status: "À venir",
    progress: "0",
    budget: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadChantier();
  }, [id]);

  async function loadChantier() {
    setLoading(true);

    const { data, error } = await supabase
      .from("chantiers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Erreur chantier :", error);
      setLoading(false);
      return;
    }

    const chantierData = data as ChantierRow;

    setChantier(chantierData);

    setForm({
      name: chantierData.name || "",
      description: chantierData.description || "",
      address: chantierData.address || "",
      city: chantierData.city || "",
      postalCode: chantierData.postal_code || "",
      status: chantierData.status || "À venir",
      progress: String(chantierData.progress || 0),
      budget:
        chantierData.budget !== null
          ? String(chantierData.budget)
          : "",
      startDate: chantierData.start_date || "",
      endDate: chantierData.end_date || "",
    });

    if (chantierData.client_id) {
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, name, company, email, phone")
        .eq("id", chantierData.client_id)
        .single();

      if (clientData) {
        setClient(clientData as ClientRow);
      }
    } else {
      setClient(null);
    }

    await Promise.all([
      loadPhotos(chantierData.id),
      loadDocuments(chantierData.id),
      loadInterventions(chantierData.id),
      loadTasks(chantierData.id),
    ]);

    setLoading(false);
  }

  async function loadPhotos(chantierId: string) {
    const { data, error } = await supabase
      .from("chantier_photos")
      .select("*")
      .eq("chantier_id", chantierId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const items = await Promise.all(
      (data || []).map(async (photo) => {
        const { data: urlData, error: signedUrlError } =
          await supabase.storage
            .from("chantier-photos")
            .createSignedUrl(photo.file_path, 60 * 60);

        if (signedUrlError) {
          console.error(
            "Erreur URL signée photo :",
            signedUrlError
          );
        }

        return {
          ...photo,
          publicUrl: urlData?.signedUrl || "",
        } as ChantierPhoto;
      })
    );

    setPhotos(items);
  }

  async function loadDocuments(chantierId: string) {
    const { data, error } = await supabase
      .from("chantier_documents")
      .select("*")
      .eq("chantier_id", chantierId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const items = await Promise.all(
      (data || []).map(async (document) => {
        const { data: urlData, error: signedUrlError } =
          await supabase.storage
            .from("chantier-documents")
            .createSignedUrl(document.file_path, 60 * 60);

        if (signedUrlError) {
          console.error(
            "Erreur URL signée document :",
            signedUrlError
          );
        }

        return {
          ...document,
          publicUrl: urlData?.signedUrl || "",
        } as ChantierDocument;
      })
    );

    setDocuments(items);
  }

  async function loadInterventions(chantierId: string) {
    const { data, error } = await supabase
      .from("chantier_interventions")
      .select("*")
      .eq("chantier_id", chantierId)
      .order("intervention_date", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setInterventions(
      (data || []) as ChantierIntervention[]
    );
  }

  async function loadTasks(chantierId: string) {
    const { data, error } = await supabase
      .from("chantier_taches")
      .select("*")
      .eq("chantier_id", chantierId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur tâches :", error);
      return;
    }

    setTaches((data || []) as ChantierTache[]);
  }

  async function addTask() {
    if (!chantier) return;

    if (!taskForm.title.trim()) {
      alert("Le titre de la tâche est obligatoire.");
      return;
    }

    setAddingTask(true);

    const { error } = await supabase
      .from("chantier_taches")
      .insert({
        organization_id: chantier.organization_id,
        chantier_id: chantier.id,
        title: taskForm.title.trim(),
        description:
          taskForm.description.trim() || null,
        status: "À faire",
        priority: taskForm.priority,
        responsible:
          taskForm.responsible.trim() || null,
        due_date: taskForm.dueDate || null,
      });

    if (error) {
      alert(error.message);
      setAddingTask(false);
      return;
    }

    setTaskForm({
      title: "",
      description: "",
      priority: "Normale",
      responsible: "",
      dueDate: "",
    });

    await loadTasks(chantier.id);

    setAddingTask(false);
    setTaskOpen(false);
  }

  async function updateTaskStatus(
    task: ChantierTache,
    status: ChantierTache["status"]
  ) {
    if (!chantier) return;

    const { error } = await supabase
      .from("chantier_taches")
      .update({
        status,
        completed_at:
          status === "Terminée"
            ? new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTasks(chantier.id);
  }

  async function deleteTask(task: ChantierTache) {
    if (!chantier) return;

    const confirmed = window.confirm(
      `Supprimer la tâche "${task.title}" ?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("chantier_taches")
      .delete()
      .eq("id", task.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTasks(chantier.id);
  }

  async function generateAiSummary() {
    if (!chantier) return;

    setGeneratingSummary(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Tu n'es plus connecté."
        );
      }

      const response = await fetch(
        `/api/chantiers/${chantier.id}/compte-rendu`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Impossible de générer le compte-rendu."
        );
      }

      setChantier((current) =>
        current
          ? {
              ...current,
              ai_summary: result.summary,
              ai_generated: true,
            }
          : current
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erreur IA."
      );
    } finally {
      setGeneratingSummary(false);
    }
  }

  async function addIntervention() {
    if (!chantier) return;

    if (!interventionForm.title.trim()) {
      alert("Le titre est obligatoire.");
      return;
    }

    setAddingIntervention(true);

    const interventionDate = new Date(
      `${interventionForm.date}T${
        interventionForm.time || "09:00"
      }:00`
    ).toISOString();

    const { error } = await supabase
      .from("chantier_interventions")
      .insert({
        organization_id:
          chantier.organization_id,
        chantier_id: chantier.id,
        type: interventionForm.type,
        title: interventionForm.title.trim(),
        content:
          interventionForm.content.trim() || null,
        intervention_date: interventionDate,
        author_name: null,
      });

    if (error) {
      alert(error.message);
      setAddingIntervention(false);
      return;
    }

    setInterventionForm({
      type: "Note",
      title: "",
      content: "",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
    });

    await loadInterventions(chantier.id);

    setAddingIntervention(false);
    setInterventionOpen(false);
  }

  async function deleteIntervention(
    intervention: ChantierIntervention
  ) {
    if (!chantier) return;

    if (
      !window.confirm(
        `Supprimer "${intervention.title}" ?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("chantier_interventions")
      .delete()
      .eq("id", intervention.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadInterventions(chantier.id);
  }

  async function uploadPhoto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (!chantier || selectedFiles.length === 0) {
      return;
    }

    const validFiles = selectedFiles.filter(
      (file) => file.type.startsWith("image/")
    );

    if (validFiles.length === 0) {
      alert("Sélectionne uniquement des images.");
      return;
    }

    setUploadingPhoto(true);

    try {
      for (const file of validFiles) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(
            `${file.name} dépasse 10 Mo.`
          );
        }

        const extension =
          file.name.split(".").pop()?.toLowerCase() ||
          "jpg";

        const safeName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9-_]/g, "-")
          .slice(0, 60);

        const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`;

        const filePath = `${chantier.organization_id}/${chantier.id}/${uniqueName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("chantier-photos")
            .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { error: dbError } = await supabase
          .from("chantier_photos")
          .insert({
            organization_id:
              chantier.organization_id,
            chantier_id: chantier.id,
            file_name: file.name,
            file_path: filePath,
            caption:
              photoCaption.trim() || null,
          });

        if (dbError) {
          throw dbError;
        }
      }

      setPhotoCaption("");
      await loadPhotos(chantier.id);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erreur upload photo."
      );
    } finally {
      event.target.value = "";
      setUploadingPhoto(false);
    }
  }

  async function uploadDocument(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (!chantier || selectedFiles.length === 0) {
      return;
    }

    setUploadingDocument(true);

    try {
      for (const file of selectedFiles) {
        if (file.size > 25 * 1024 * 1024) {
          throw new Error(
            `${file.name} dépasse 25 Mo.`
          );
        }

        const extension =
          file.name.split(".").pop()?.toLowerCase() ||
          "file";

        const safeName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9-_]/g, "-")
          .slice(0, 60);

        const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`;

        const filePath = `${chantier.organization_id}/${chantier.id}/${uniqueName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("chantier-documents")
            .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { error: dbError } = await supabase
          .from("chantier_documents")
          .insert({
            organization_id:
              chantier.organization_id,
            chantier_id: chantier.id,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type || null,
            file_size: file.size,
            category: documentCategory,
            note: documentNote.trim() || null,
          });

        if (dbError) {
          throw dbError;
        }
      }

      setDocumentNote("");
      await loadDocuments(chantier.id);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erreur upload document."
      );
    } finally {
      event.target.value = "";
      setUploadingDocument(false);
    }
  }

  async function deletePhoto(photo: ChantierPhoto) {
    if (!chantier) return;

    if (!window.confirm("Supprimer cette photo ?")) {
      return;
    }

    await supabase.storage
      .from("chantier-photos")
      .remove([photo.file_path]);

    await supabase
      .from("chantier_photos")
      .delete()
      .eq("id", photo.id);

    setPhotoOpen(null);
    await loadPhotos(chantier.id);
  }

  async function deleteDocument(
    document: ChantierDocument
  ) {
    if (!chantier) return;

    if (!window.confirm("Supprimer ce document ?")) {
      return;
    }

    await supabase.storage
      .from("chantier-documents")
      .remove([document.file_path]);

    await supabase
      .from("chantier_documents")
      .delete()
      .eq("id", document.id);

    await loadDocuments(chantier.id);
  }

  async function saveChanges() {
    if (!chantier) return;

    const progressValue = Number(form.progress);

    if (!form.name.trim()) {
      alert("Le nom est obligatoire.");
      return;
    }

    if (
      progressValue < 0 ||
      progressValue > 100
    ) {
      alert(
        "La progression doit être entre 0 et 100."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("chantiers")
      .update({
        name: form.name.trim(),
        description:
          form.description.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        postal_code:
          form.postalCode.trim() || null,
        status: form.status,
        progress: progressValue,
        budget: form.budget
          ? Number(form.budget)
          : 0,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chantier.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await loadChantier();
    setEditOpen(false);
    setSaving(false);
  }

  async function deleteChantier() {
    if (!chantier) return;

    if (
      !window.confirm(
        `Supprimer définitivement "${chantier.name}" ?`
      )
    ) {
      return;
    }

    setDeleting(true);

    const { error } = await supabase
      .from("chantiers")
      .delete()
      .eq("id", chantier.id);

    if (error) {
      alert(error.message);
      setDeleting(false);
      return;
    }

    router.push("/chantiers");
  }

  function formatDate(value: string | null) {
    if (!value) return "Non renseignée";

    return new Date(
      `${value}T12:00:00`
    ).toLocaleDateString("fr-FR");
  }

  function formatMoney(value: number | null) {
    return Number(value || 0).toLocaleString(
      "fr-FR",
      {
        style: "currency",
        currency: "EUR",
      }
    );
  }

  function formatFileSize(size: number | null) {
    if (!size) return "Taille inconnue";

    if (size < 1024) return `${size} o`;

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} Ko`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} Mo`;
  }

  if (loading) {
    return (
      <div className="px-7 py-7 text-sm text-slate-500">
        Chargement du chantier...
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="px-7 py-7">
        Chantier introuvable.
      </div>
    );
  }

  const completedTasks = taches.filter(
    (task) => task.status === "Terminée"
  ).length;

  return (
    <>
      <div className="w-full px-7 py-7">
        <Link
          href="/chantiers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={15} />
          Retour aux chantiers
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {chantier.name}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {client
                ? `Chantier de ${client.name}`
                : "Aucun client associé"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold"
            >
              <Pencil size={14} />
              Modifier
            </button>

            <button
              onClick={deleteChantier}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-4 py-2.5 text-xs font-semibold text-red-600"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="rounded-xl border bg-white p-6">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-sm font-bold">
                    Avancement
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Progression actuelle
                  </p>
                </div>

                <p className="text-2xl font-bold">
                  {chantier.progress}%
                </p>
              </div>

              <div className="mt-5 h-3 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${chantier.progress}%`,
                  }}
                />
              </div>
            </section>

            <section className="rounded-xl border bg-white p-6">
              <h2 className="text-sm font-bold">
                Informations du chantier
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={Euro}
                  label="Budget"
                  value={formatMoney(
                    chantier.budget
                  )}
                />

                <InfoCard
                  icon={CalendarDays}
                  label="Début"
                  value={formatDate(
                    chantier.start_date
                  )}
                />

                <InfoCard
                  icon={CalendarDays}
                  label="Fin"
                  value={formatDate(
                    chantier.end_date
                  )}
                />

                <InfoCard
                  icon={MapPin}
                  label="Adresse"
                  value={
                    [
                      chantier.address,
                      chantier.postal_code,
                      chantier.city,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                    "Non renseignée"
                  }
                />
              </div>
            </section>

            <section className="rounded-xl border bg-white p-6">
              <h2 className="text-sm font-bold">
                Description
              </h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {chantier.description ||
                  "Aucune description."}
              </p>
            </section>

            {/* TACHES */}

            <section className="rounded-xl border bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={17}
                      className="text-blue-600"
                    />

                    <h2 className="text-sm font-bold">
                      Tâches du chantier
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {completedTasks} terminée(s) sur{" "}
                    {taches.length}
                  </p>
                </div>

                <button
                  onClick={() => setTaskOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white"
                >
                  <Plus size={14} />
                  Nouvelle tâche
                </button>
              </div>

              {taches.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                  <CheckCircle2
                    size={22}
                    className="mx-auto text-slate-400"
                  />

                  <p className="mt-3 text-sm font-semibold">
                    Aucune tâche
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {taches.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={(status) =>
                        updateTaskStatus(
                          task,
                          status
                        )
                      }
                      onDelete={() =>
                        deleteTask(task)
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            {/* INTERVENTIONS */}

            <section className="rounded-xl border bg-white p-6">
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold">
                    Notes & interventions
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setInterventionOpen(true)
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Ajouter
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {interventions.map(
                  (intervention) => (
                    <InterventionCard
                      key={intervention.id}
                      intervention={intervention}
                      onDelete={() =>
                        deleteIntervention(
                          intervention
                        )
                      }
                    />
                  )
                )}
              </div>
            </section>

            {/* PHOTOS */}

            <section className="rounded-xl border bg-white p-6">
              <div className="flex justify-between gap-4">
                <h2 className="text-sm font-bold">
                  Photos du chantier
                </h2>

                <button
                  onClick={() =>
                    photoInputRef.current?.click()
                  }
                  disabled={uploadingPhoto}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Ajouter des photos
                </button>

                <input
                  ref={photoInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={uploadPhoto}
                  className="hidden"
                />
              </div>

              <input
                value={photoCaption}
                onChange={(e) =>
                  setPhotoCaption(e.target.value)
                }
                placeholder="Légende"
                className="mt-4 w-full rounded-lg border px-3 py-2 text-sm"
              />

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() =>
                      setPhotoOpen(photo)
                    }
                    className="overflow-hidden rounded-xl border"
                  >
                    <img
                      src={photo.publicUrl}
                      alt={photo.file_name}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </section>

            {/* DOCUMENTS */}

            <section className="rounded-xl border bg-white p-6">
              <div className="flex justify-between gap-4">
                <h2 className="text-sm font-bold">
                  Documents du chantier
                </h2>

                <button
                  onClick={() =>
                    documentInputRef.current?.click()
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Ajouter un document
                </button>

                <input
                  ref={documentInputRef}
                  type="file"
                  multiple
                  onChange={uploadDocument}
                  className="hidden"
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <select
                  value={documentCategory}
                  onChange={(e) =>
                    setDocumentCategory(
                      e.target.value
                    )
                  }
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  <option>Plan</option>
                  <option>Devis</option>
                  <option>Facture</option>
                  <option>Attestation</option>
                  <option>Contrat</option>
                  <option>Compte-rendu</option>
                  <option>Autre</option>
                </select>

                <input
                  value={documentNote}
                  onChange={(e) =>
                    setDocumentNote(e.target.value)
                  }
                  placeholder="Note"
                  className="rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="mt-5 space-y-2">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center gap-4 rounded-xl border p-4"
                  >
                    <FileText size={18} />

                    <div className="flex-1">
                      <p className="text-xs font-bold">
                        {document.file_name}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {document.category} •{" "}
                        {formatFileSize(
                          document.file_size
                        )}
                      </p>
                    </div>

                    <a
                      href={document.publicUrl}
                      target="_blank"
                    >
                      <ExternalLink size={15} />
                    </a>

                    <a
                      href={document.publicUrl}
                      download
                    >
                      <Download size={15} />
                    </a>

                    <button
                      onClick={() =>
                        deleteDocument(document)
                      }
                    >
                      <Trash2
                        size={15}
                        className="text-red-600"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* IA */}

            <section className="rounded-xl border border-blue-100 bg-white p-6">
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold">
                    Compte-rendu IA
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Synthèse automatique du chantier
                  </p>
                </div>

                <button
                  onClick={generateAiSummary}
                  disabled={generatingSummary}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  {generatingSummary
                    ? "Génération..."
                    : "Générer"}
                </button>
              </div>

              {chantier.ai_summary && (
                <p className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-sm leading-7">
                  {chantier.ai_summary}
                </p>
              )}
            </section>
          </div>

          {/* SIDEBAR */}

          <div className="space-y-6">
            <section className="rounded-xl border bg-white p-5">
              <h2 className="text-sm font-bold">
                Client
              </h2>

              {client && (
                <>
                  <p className="mt-4 text-sm font-bold">
                    {client.name}
                  </p>

                  <Link
                    href={`/clients/${client.id}`}
                    className="mt-3 inline-block text-xs font-semibold text-blue-600"
                  >
                    Voir la fiche client →
                  </Link>
                </>
              )}
            </section>

            <section className="rounded-xl border bg-white p-5">
              <h2 className="text-sm font-bold">
                Informations
              </h2>

              <div className="mt-4 space-y-3 text-xs">
                <InfoLine
                  label="Statut"
                  value={chantier.status}
                />

                <InfoLine
                  label="Progression"
                  value={`${chantier.progress}%`}
                />

                <InfoLine
                  label="Tâches"
                  value={String(taches.length)}
                />

                <InfoLine
                  label="Interventions"
                  value={String(
                    interventions.length
                  )}
                />

                <InfoLine
                  label="Photos"
                  value={String(photos.length)}
                />

                <InfoLine
                  label="Documents"
                  value={String(
                    documents.length
                  )}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* MODAL TACHE */}

      {taskOpen && (
        <Modal
          title="Nouvelle tâche"
          onClose={() => setTaskOpen(false)}
        >
          <Input
            label="Titre"
            value={taskForm.title}
            onChange={(value) =>
              setTaskForm({
                ...taskForm,
                title: value,
              })
            }
          />

          <TextArea
            label="Description"
            value={taskForm.description}
            onChange={(value) =>
              setTaskForm({
                ...taskForm,
                description: value,
              })
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold">
                Priorité
              </label>

              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({
                    ...taskForm,
                    priority: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
              >
                <option>Faible</option>
                <option>Normale</option>
                <option>Haute</option>
                <option>Urgente</option>
              </select>
            </div>

            <Input
              label="Responsable"
              value={taskForm.responsible}
              onChange={(value) =>
                setTaskForm({
                  ...taskForm,
                  responsible: value,
                })
              }
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs font-semibold">
              Échéance
            </label>

            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  dueDate: e.target.value,
                })
              }
              className="w-full rounded-lg border px-3 py-2.5 text-sm"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={addTask}
              disabled={addingTask}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white"
            >
              {addingTask
                ? "Création..."
                : "Créer la tâche"}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL INTERVENTION */}

      {interventionOpen && (
        <Modal
          title="Ajouter au suivi"
          onClose={() =>
            setInterventionOpen(false)
          }
        >
          <select
            value={interventionForm.type}
            onChange={(e) =>
              setInterventionForm({
                ...interventionForm,
                type: e.target.value,
              })
            }
            className="w-full rounded-lg border px-3 py-2.5 text-sm"
          >
            <option>Note</option>
            <option>Intervention</option>
            <option>Avancement</option>
            <option>Livraison</option>
            <option>Réunion</option>
            <option>Incident</option>
          </select>

          <Input
            label="Titre"
            value={interventionForm.title}
            onChange={(value) =>
              setInterventionForm({
                ...interventionForm,
                title: value,
              })
            }
          />

          <TextArea
            label="Détails"
            value={interventionForm.content}
            onChange={(value) =>
              setInterventionForm({
                ...interventionForm,
                content: value,
              })
            }
          />

          <button
            onClick={addIntervention}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white"
          >
            {addingIntervention
              ? "Ajout..."
              : "Ajouter"}
          </button>
        </Modal>
      )}

      {/* MODAL EDIT */}

      {editOpen && (
        <Modal
          title="Modifier le chantier"
          onClose={() => setEditOpen(false)}
        >
          <Input
            label="Nom"
            value={form.name}
            onChange={(value) =>
              setForm({
                ...form,
                name: value,
              })
            }
          />

          <TextArea
            label="Description"
            value={form.description}
            onChange={(value) =>
              setForm({
                ...form,
                description: value,
              })
            }
          />

          <Input
            label="Adresse"
            value={form.address}
            onChange={(value) =>
              setForm({
                ...form,
                address: value,
              })
            }
          />

          <Input
            label="Ville"
            value={form.city}
            onChange={(value) =>
              setForm({
                ...form,
                city: value,
              })
            }
          />

          <Input
            label="Code postal"
            value={form.postalCode}
            onChange={(value) =>
              setForm({
                ...form,
                postalCode: value,
              })
            }
          />

          <Input
            label="Budget"
            value={form.budget}
            onChange={(value) =>
              setForm({
                ...form,
                budget: value,
              })
            }
          />

          <Input
            label="Progression"
            value={form.progress}
            onChange={(value) =>
              setForm({
                ...form,
                progress: value,
              })
            }
          />

          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
              })
            }
            className="mt-4 w-full rounded-lg border px-3 py-2.5 text-sm"
          >
            <option>À venir</option>
            <option>En cours</option>
            <option>En attente</option>
            <option>Terminé</option>
            <option>Annulé</option>
          </select>

          <button
            onClick={saveChanges}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white"
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer"}
          </button>
        </Modal>
      )}

      {/* PHOTO */}

      {photoOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6">
          <button
            onClick={() => setPhotoOpen(null)}
            className="absolute right-6 top-6 text-white"
          >
            <X />
          </button>

          <div>
            <img
              src={photoOpen.publicUrl}
              alt={photoOpen.file_name}
              className="max-h-[80vh] rounded-xl"
            />

            <button
              onClick={() =>
                deletePhoto(photoOpen)
              }
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: ChantierTache;
  onStatusChange: (
    status: ChantierTache["status"]
  ) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={() =>
            onStatusChange(
              task.status === "Terminée"
                ? "À faire"
                : "Terminée"
            )
          }
          className="mt-0.5"
        >
          {task.status === "Terminée" ? (
            <CheckCircle2 className="text-emerald-600" />
          ) : (
            <Circle className="text-slate-400" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            <p
              className={`text-sm font-bold ${
                task.status === "Terminée"
                  ? "text-slate-400 line-through"
                  : "text-slate-800"
              }`}
            >
              {task.title}
            </p>

            <PriorityBadge
              priority={task.priority}
            />
          </div>

          {task.description && (
            <p className="mt-2 text-xs text-slate-500">
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-400">
            {task.responsible && (
              <span>
                Responsable : {task.responsible}
              </span>
            )}

            {task.due_date && (
              <span>
                Échéance :{" "}
                {new Date(
                  `${task.due_date}T12:00:00`
                ).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>

          <select
            value={task.status}
            onChange={(e) =>
              onStatusChange(
                e.target.value as ChantierTache["status"]
              )
            }
            className="mt-3 rounded-lg border px-2 py-1.5 text-[11px]"
          >
            <option>À faire</option>
            <option>En cours</option>
            <option>Terminée</option>
            <option>Annulée</option>
          </select>
        </div>

        <button onClick={onDelete}>
          <Trash2
            size={15}
            className="text-slate-400 hover:text-red-600"
          />
        </button>
      </div>
    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: ChantierTache["priority"];
}) {
  const classes =
    priority === "Urgente"
      ? "bg-red-50 text-red-700"
      : priority === "Haute"
      ? "bg-orange-50 text-orange-700"
      : priority === "Faible"
      ? "bg-slate-100 text-slate-600"
      : "bg-blue-50 text-blue-700";

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${classes}`}
    >
      {priority}
    </span>
  );
}

function InterventionCard({
  intervention,
  onDelete,
}: {
  intervention: ChantierIntervention;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-between rounded-xl border p-4">
      <div>
        <p className="text-sm font-bold">
          {intervention.title}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          {intervention.type}
        </p>

        {intervention.content && (
          <p className="mt-2 text-xs text-slate-600">
            {intervention.content}
          </p>
        )}
      </div>

      <button onClick={onDelete}>
        <Trash2
          size={15}
          className="text-red-600"
        />
      </button>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <Icon size={16} />

      <p className="mt-3 text-[11px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/30 px-4 py-6">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex justify-between">
          <h2 className="text-lg font-bold">
            {title}
          </h2>

          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border px-3 py-2.5 text-sm"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold">
        {label}
      </label>

      <textarea
        rows={4}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm"
      />
    </div>
  );
}