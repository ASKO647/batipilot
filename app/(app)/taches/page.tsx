"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type TaskStatus =
  | "À faire"
  | "En cours"
  | "Terminée"
  | "Annulée";

type TaskPriority =
  | "Faible"
  | "Normale"
  | "Haute"
  | "Urgente";

type Chantier = {
  id: string;
  name: string;
  organization_id: string;
};

type Task = {
  id: string;
  organization_id: string;
  chantier_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  responsible: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  chantier?: Chantier | null;
};

type TaskForm = {
  chantierId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  responsible: string;
  dueDate: string;
};

const emptyForm: TaskForm = {
  chantierId: "",
  title: "",
  description: "",
  status: "À faire",
  priority: "Normale",
  responsible: "",
  dueDate: "",
};

export default function TachesPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);

  const [organizationId, setOrganizationId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [form, setForm] =
    useState<TaskForm>(emptyForm);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("Tous");
  const [priorityFilter, setPriorityFilter] =
    useState("Toutes");
  const [chantierFilter, setChantierFilter] =
    useState("Tous");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "Utilisateur introuvable :",
        userError
      );

      setLoading(false);
      return;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile?.organization_id
    ) {
      console.error(
        "Organisation introuvable :",
        profileError
      );

      setLoading(false);
      return;
    }

    const currentOrganizationId =
      profile.organization_id;

    setOrganizationId(
      currentOrganizationId
    );

    const [
      {
        data: tasksData,
        error: tasksError,
      },
      {
        data: chantiersData,
        error: chantiersError,
      },
    ] = await Promise.all([
      supabase
        .from("chantier_taches")
        .select("*")
        .eq(
          "organization_id",
          currentOrganizationId
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("chantiers")
        .select(
          "id, name, organization_id"
        )
        .eq(
          "organization_id",
          currentOrganizationId
        )
        .order("name", {
          ascending: true,
        }),
    ]);

    if (tasksError) {
      console.error(
        "Erreur tâches :",
        tasksError
      );
    }

    if (chantiersError) {
      console.error(
        "Erreur chantiers :",
        chantiersError
      );
    }

    const chantierList =
      (chantiersData || []) as Chantier[];

    setChantiers(chantierList);

    const formattedTasks = (
      (tasksData || []) as Task[]
    ).map((task) => ({
      ...task,
      chantier:
        chantierList.find(
          (chantier) =>
            chantier.id ===
            task.chantier_id
        ) || null,
    }));

    setTasks(formattedTasks);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingTask(null);

    setForm({
      ...emptyForm,
      chantierId:
        chantierFilter !== "Tous"
          ? chantierFilter
          : "",
    });

    setCreateOpen(true);
  }

  function openEditModal(task: Task) {
    setCreateOpen(false);
    setEditingTask(task);

    setForm({
      chantierId: task.chantier_id,
      title: task.title,
      description:
        task.description || "",
      status: task.status,
      priority: task.priority,
      responsible:
        task.responsible || "",
      dueDate: task.due_date || "",
    });
  }

  function closeModal() {
    setCreateOpen(false);
    setEditingTask(null);
    setForm(emptyForm);
  }

  async function createTask() {
    if (!organizationId) {
      alert(
        "Organisation introuvable."
      );
      return;
    }

    if (!form.chantierId) {
      alert(
        "Sélectionne un chantier."
      );
      return;
    }

    if (!form.title.trim()) {
      alert(
        "Le titre de la tâche est obligatoire."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("chantier_taches")
      .insert({
        organization_id:
          organizationId,

        chantier_id:
          form.chantierId,

        title:
          form.title.trim(),

        description:
          form.description.trim() ||
          null,

        status:
          form.status,

        priority:
          form.priority,

        responsible:
          form.responsible.trim() ||
          null,

        due_date:
          form.dueDate || null,

        completed_at:
          form.status === "Terminée"
            ? new Date().toISOString()
            : null,
      });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await loadData();

    setSaving(false);
    closeModal();
  }

  async function saveEdit() {
    if (!editingTask) return;

    if (!form.chantierId) {
      alert(
        "Sélectionne un chantier."
      );
      return;
    }

    if (!form.title.trim()) {
      alert(
        "Le titre est obligatoire."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("chantier_taches")
      .update({
        chantier_id:
          form.chantierId,

        title:
          form.title.trim(),

        description:
          form.description.trim() ||
          null,

        status:
          form.status,

        priority:
          form.priority,

        responsible:
          form.responsible.trim() ||
          null,

        due_date:
          form.dueDate || null,

        completed_at:
          form.status === "Terminée"
            ? editingTask.completed_at ||
              new Date().toISOString()
            : null,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", editingTask.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await loadData();

    setSaving(false);
    closeModal();
  }

  async function updateStatus(
    task: Task,
    status: TaskStatus
  ) {
    const completedAt =
      status === "Terminée"
        ? new Date().toISOString()
        : null;

    const { error } = await supabase
      .from("chantier_taches")
      .update({
        status,
        completed_at: completedAt,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      alert(error.message);
      return;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status,
              completed_at:
                completedAt,
            }
          : item
      )
    );
  }

  async function deleteTask(
    task: Task
  ) {
    const confirmed =
      window.confirm(
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

    setTasks((current) =>
      current.filter(
        (item) =>
          item.id !== task.id
      )
    );
  }

  const filteredTasks =
    useMemo(() => {
      return tasks.filter(
        (task) => {
          const query = search
            .trim()
            .toLowerCase();

          const matchesSearch =
            !query ||
            task.title
              .toLowerCase()
              .includes(query) ||
            task.description
              ?.toLowerCase()
              .includes(query) ||
            task.responsible
              ?.toLowerCase()
              .includes(query) ||
            task.chantier?.name
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "Tous" ||
            task.status ===
              statusFilter;

          const matchesPriority =
            priorityFilter ===
              "Toutes" ||
            task.priority ===
              priorityFilter;

          const matchesChantier =
            chantierFilter ===
              "Tous" ||
            task.chantier_id ===
              chantierFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesChantier
          );
        }
      );
    }, [
      tasks,
      search,
      statusFilter,
      priorityFilter,
      chantierFilter,
    ]);

  const todoCount =
    tasks.filter(
      (task) =>
        task.status === "À faire"
    ).length;

  const inProgressCount =
    tasks.filter(
      (task) =>
        task.status === "En cours"
    ).length;

  const completedCount =
    tasks.filter(
      (task) =>
        task.status === "Terminée"
    ).length;

  const urgentCount =
    tasks.filter(
      (task) =>
        task.priority === "Urgente" &&
        task.status !== "Terminée" &&
        task.status !== "Annulée"
    ).length;

  return (
    <>
      <div className="w-full px-7 py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Tâches
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Centralisez et suivez
              toutes les tâches de vos
              chantiers.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={15} />
            Nouvelle tâche
          </button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="À faire"
            value={todoCount}
          />

          <StatCard
            label="En cours"
            value={
              inProgressCount
            }
          />

          <StatCard
            label="Terminées"
            value={
              completedCount
            }
          />

          <StatCard
            label="Urgentes"
            value={
              urgentCount
            }
          />
        </div>

        <section className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Rechercher une tâche, un chantier ou un responsable..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Filter
                  size={14}
                />
                Filtres
              </div>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
              >
                <option>
                  Tous
                </option>
                <option>
                  À faire
                </option>
                <option>
                  En cours
                </option>
                <option>
                  Terminée
                </option>
                <option>
                  Annulée
                </option>
              </select>

              <select
                value={
                  priorityFilter
                }
                onChange={(
                  event
                ) =>
                  setPriorityFilter(
                    event.target
                      .value
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
              >
                <option>
                  Toutes
                </option>
                <option>
                  Faible
                </option>
                <option>
                  Normale
                </option>
                <option>
                  Haute
                </option>
                <option>
                  Urgente
                </option>
              </select>

              <select
                value={
                  chantierFilter
                }
                onChange={(
                  event
                ) =>
                  setChantierFilter(
                    event.target
                      .value
                  )
                }
                className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
              >
                <option value="Tous">
                  Tous les
                  chantiers
                </option>

                {chantiers.map(
                  (chantier) => (
                    <option
                      key={
                        chantier.id
                      }
                      value={
                        chantier.id
                      }
                    >
                      {
                        chantier.name
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2
                size={18}
                className="animate-spin"
              />

              Chargement des
              tâches...
            </div>
          ) : filteredTasks.length ===
            0 ? (
            <div className="px-6 py-16 text-center">
              <CheckCircle2
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Aucune tâche
                trouvée
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Crée une tâche ou
                modifie tes
                filtres.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTasks.map(
                (task) => (
                  <TaskRow
                    key={
                      task.id
                    }
                    task={task}
                    onStatusChange={(
                      status
                    ) =>
                      updateStatus(
                        task,
                        status
                      )
                    }
                    onEdit={() =>
                      openEditModal(
                        task
                      )
                    }
                    onDelete={() =>
                      deleteTask(
                        task
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>

      {(createOpen ||
        editingTask) && (
        <Modal
          title={
            editingTask
              ? "Modifier la tâche"
              : "Nouvelle tâche"
          }
          onClose={closeModal}
        >
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
              Chantier *
            </label>

            <select
              value={
                form.chantierId
              }
              onChange={(
                event
              ) =>
                setForm({
                  ...form,
                  chantierId:
                    event.target
                      .value,
                })
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">
                Sélectionner un
                chantier
              </option>

              {chantiers.map(
                (chantier) => (
                  <option
                    key={
                      chantier.id
                    }
                    value={
                      chantier.id
                    }
                  >
                    {
                      chantier.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <Input
            label="Titre *"
            value={
              form.title
            }
            placeholder="Ex. Commander les fenêtres"
            onChange={(
              value
            ) =>
              setForm({
                ...form,
                title: value,
              })
            }
          />

          <TextArea
            label="Description"
            value={
              form.description
            }
            placeholder="Ajouter des détails sur la tâche..."
            onChange={(
              value
            ) =>
              setForm({
                ...form,
                description:
                  value,
              })
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Statut
              </label>

              <select
                value={
                  form.status
                }
                onChange={(
                  event
                ) =>
                  setForm({
                    ...form,
                    status:
                      event
                        .target
                        .value as TaskStatus,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option>
                  À faire
                </option>
                <option>
                  En cours
                </option>
                <option>
                  Terminée
                </option>
                <option>
                  Annulée
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Priorité
              </label>

              <select
                value={
                  form.priority
                }
                onChange={(
                  event
                ) =>
                  setForm({
                    ...form,
                    priority:
                      event
                        .target
                        .value as TaskPriority,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option>
                  Faible
                </option>
                <option>
                  Normale
                </option>
                <option>
                  Haute
                </option>
                <option>
                  Urgente
                </option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Responsable"
              value={
                form.responsible
              }
              placeholder="Ex. Julien Martin"
              onChange={(
                value
              ) =>
                setForm({
                  ...form,
                  responsible:
                    value,
                })
              }
            />

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Échéance
              </label>

              <input
                type="date"
                value={
                  form.dueDate
                }
                onChange={(
                  event
                ) =>
                  setForm({
                    ...form,
                    dueDate:
                      event
                        .target
                        .value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={
                closeModal
              }
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                editingTask
                  ? saveEdit
                  : createTask
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Enregistrement..."
                : editingTask
                ? "Enregistrer"
                : "Créer la tâche"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function TaskRow({
  task,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  task: Task;
  onStatusChange: (
    status: TaskStatus
  ) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70">
      <button
        type="button"
        onClick={() =>
          onStatusChange(
            task.status ===
              "Terminée"
              ? "À faire"
              : "Terminée"
          )
        }
        className="shrink-0"
        title={
          task.status ===
          "Terminée"
            ? "Rouvrir la tâche"
            : "Marquer comme terminée"
        }
      >
        {task.status ===
        "Terminée" ? (
          <CheckCircle2
            size={20}
            className="text-emerald-600"
          />
        ) : (
          <Circle
            size={20}
            className="text-slate-300"
          />
        )}
      </button>

      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-semibold ${
              task.status ===
              "Terminée"
                ? "text-slate-400 line-through"
                : task.status ===
                  "Annulée"
                ? "text-slate-400"
                : "text-slate-800"
            }`}
          >
            {task.title}
          </p>

          <PriorityBadge
            priority={
              task.priority
            }
          />

          <StatusBadge
            status={
              task.status
            }
          />
        </div>

        {task.description && (
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {
              task.description
            }
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
          {task.chantier && (
            <Link
              href={`/chantiers/${task.chantier.id}`}
              className="font-semibold text-blue-600 hover:underline"
            >
              {
                task.chantier
                  .name
              }
            </Link>
          )}

          {task.responsible && (
            <span>
              Responsable :{" "}
              {
                task.responsible
              }
            </span>
          )}

          {task.due_date && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays
                size={12}
              />

              {formatDate(
                task.due_date
              )}
            </span>
          )}
        </div>
      </div>

      <select
        value={task.status}
        onChange={(event) =>
          onStatusChange(
            event.target
              .value as TaskStatus
          )
        }
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none"
      >
        <option>
          À faire
        </option>
        <option>
          En cours
        </option>
        <option>
          Terminée
        </option>
        <option>
          Annulée
        </option>
      </select>

      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
        title="Modifier"
      >
        <Pencil
          size={15}
        />
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        title="Supprimer"
      >
        <Trash2
          size={15}
        />
      </button>
    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: TaskPriority;
}) {
  const style =
    priority === "Urgente"
      ? "bg-red-50 text-red-700"
      : priority === "Haute"
      ? "bg-orange-50 text-orange-700"
      : priority === "Faible"
      ? "bg-slate-100 text-slate-600"
      : "bg-blue-50 text-blue-700";

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${style}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: TaskStatus;
}) {
  const style =
    status === "Terminée"
      ? "bg-emerald-50 text-emerald-700"
      : status === "En cours"
      ? "bg-blue-50 text-blue-700"
      : status === "Annulée"
      ? "bg-slate-100 text-slate-500"
      : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${style}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children:
    React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 px-4 py-8 backdrop-blur-[1px]"
      onMouseDown={
        onClose
      }
    >
      <div
        className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
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
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        rows={4}
        value={value}
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
      />
    </div>
  );
}

function formatDate(
  value: string
) {
  return new Date(
    `${value}T12:00:00`
  ).toLocaleDateString(
    "fr-FR"
  );
}