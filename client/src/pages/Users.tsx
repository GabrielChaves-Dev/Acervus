import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Users as UsersIcon, X, Mail, Phone, Hash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { LibraryMember } from "../../../drizzle/schema";

const memberSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  matricula: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});
type MemberForm = z.infer<typeof memberSchema>;

function MemberFormModal({ open, onClose, member }: { open: boolean; onClose: () => void; member?: LibraryMember }) {
  const utils = trpc.useUtils();
  const isEdit = !!member;

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<MemberForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(memberSchema) as any,
    defaultValues: member ? {
      name: member.name,
      matricula: member.matricula ?? "",
      email: member.email ?? "",
      phone: member.phone ?? "",
      status: member.status,
    } : { status: "active" },
  });

  const createMutation = trpc.members.create.useMutation({
    onSuccess: () => { utils.members.list.invalidate(); toast.success("Usuário cadastrado!"); onClose(); reset(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.members.update.useMutation({
    onSuccess: () => { utils.members.list.invalidate(); toast.success("Usuário atualizado!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    const payload = { ...data, email: data.email === "" ? undefined : data.email };
    if (isEdit) updateMutation.mutate({ id: member.id, ...payload });
    else createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md glass-card-lg border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-blue flex items-center justify-center">
              <UsersIcon className="w-3.5 h-3.5 text-white" />
            </div>
            {isEdit ? "Editar Usuário" : "Cadastrar Usuário"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input id="name" {...register("name")} placeholder="Ex: João da Silva" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input id="matricula" {...register("matricula")} placeholder="Ex: 2024001" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} placeholder="Ex: (85) 99999-0000" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email")} placeholder="Ex: joao@email.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select onValueChange={(v) => setValue("status", v as "active" | "inactive")} defaultValue={member?.status ?? "active"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending} className="gradient-blue text-white border-0">
              {isPending ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirm({ open, onClose, onConfirm, name }: { open: boolean; onClose: () => void; onConfirm: () => void; name: string }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm glass-card-lg border-0">
        <DialogHeader><DialogTitle>Excluir Usuário</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir <strong>"{name}"</strong>?</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Excluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Users() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<LibraryMember | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<LibraryMember | undefined>();

  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.members.list.useQuery({ search: search || undefined });
  const deleteMutation = trpc.members.delete.useMutation({
    onSuccess: () => { utils.members.list.invalidate(); toast.success("Usuário excluído!"); setDeleteTarget(undefined); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = members?.filter(m => filterStatus === "all" || m.status === filterStatus) ?? [];

  return (
    <DashboardLayout title="Usuários">
      <div className="p-4 lg:p-6 pb-20 lg:pb-6 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Usuários</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie os membros da biblioteca</p>
          </div>
          <Button onClick={() => { setEditMember(undefined); setShowModal(true); }} className="gradient-blue text-white border-0 gap-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Cadastrar Usuário
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/70"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40 bg-white/70">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtered.length} usuário{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Usuário</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Matrícula</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Contato</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton className="h-10 w-full" /></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-6 w-16 mx-auto" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-8 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <UsersIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                        <Button variant="link" className="mt-2 text-primary text-sm" onClick={() => { setSearch(""); setFilterStatus("all"); }}>
                          Limpar filtros
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {filtered.map((m, i) => (
                        <motion.tr
                          key={m.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03, ease: "easeOut" }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full gradient-blue flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{m.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate max-w-[160px]">{m.name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[160px] flex items-center gap-1">
                                  <Mail className="w-3 h-3 flex-shrink-0" />{m.email ?? "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                              <Hash className="w-3 h-3" />{m.matricula ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />{m.phone ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.status === "active" ? "badge-active" : "badge-inactive"}`}>
                              {m.status === "active" ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditMember(m); setShowModal(true); }}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(m)}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>

      <MemberFormModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditMember(undefined); }}
        member={editMember}
      />
      {deleteTarget && (
        <DeleteConfirm
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={() => deleteMutation.mutate({ id: deleteTarget.id })}
          name={deleteTarget.name}
        />
      )}
    </DashboardLayout>
  );
}
