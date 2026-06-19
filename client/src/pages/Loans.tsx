import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, BookMarked, CheckCircle, AlertTriangle, Clock, X, CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const loanSchema = z.object({
  memberId: z.coerce.number().int().min(1, "Selecione um usuário"),
  bookId: z.coerce.number().int().min(1, "Selecione um livro"),
  dueDate: z.string().min(1, "Data de devolução obrigatória"),
  notes: z.string().optional(),
});
type LoanForm = z.infer<typeof loanSchema>;

type LoanRow = {
  id: number;
  memberId: number;
  bookId: number;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "active" | "returned" | "overdue";
  notes: string | null;
  memberName: string | null;
  memberMatricula: string | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  bookIsbn: string | null;
};

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    active: { cls: "badge-active", label: "Ativo", icon: <Clock className="w-3 h-3" /> },
    returned: { cls: "badge-returned", label: "Devolvido", icon: <CheckCircle className="w-3 h-3" /> },
    overdue: { cls: "badge-overdue", label: "Atrasado", icon: <AlertTriangle className="w-3 h-3" /> },
  };
  const c = cfg[status] ?? cfg.active;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
}

function CreateLoanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: members } = trpc.members.list.useQuery({ search: undefined });
  const { data: books } = trpc.books.list.useQuery({ search: undefined });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<LoanForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loanSchema) as any,
    defaultValues: { dueDate: format(addDays(new Date(), 14), "yyyy-MM-dd") },
  });

  const createMutation = trpc.loans.create.useMutation({
    onSuccess: () => {
      utils.loans.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Empréstimo registrado!");
      onClose();
      reset();
    },
    onError: (e) => toast.error(e.message),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    createMutation.mutate({
      memberId: Number(data.memberId),
      bookId: Number(data.bookId),
      dueDate: new Date(data.dueDate + "T23:59:59"),
      notes: data.notes || undefined,
    });
  };

  const availableBooks = books?.filter(b => b.availableCopies > 0) ?? [];
  const activeMembers = members?.filter(m => m.status === "active") ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md glass-card-lg border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-green flex items-center justify-center">
              <BookMarked className="w-3.5 h-3.5 text-white" />
            </div>
            Registrar Empréstimo
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Usuário *</Label>
            <Select onValueChange={(v) => setValue("memberId", Number(v) as any)}>
              <SelectTrigger className={errors.memberId ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione o usuário..." />
              </SelectTrigger>
              <SelectContent>
                {activeMembers.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}{m.matricula ? ` — ${m.matricula}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.memberId && <p className="text-xs text-destructive">{String(errors.memberId.message)}</p>}
          </div>
          <div className="space-y-1">
            <Label>Livro *</Label>
            <Select onValueChange={(v) => setValue("bookId", Number(v) as any)}>
              <SelectTrigger className={errors.bookId ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione o livro..." />
              </SelectTrigger>
              <SelectContent>
                {availableBooks.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.title} <span className="text-muted-foreground">({b.availableCopies} disp.)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bookId && <p className="text-xs text-destructive">{String(errors.bookId.message)}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="dueDate">Data Prevista de Devolução *</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="dueDate" type="date" {...register("dueDate")} className="pl-9" />
            </div>
            {errors.dueDate && <p className="text-xs text-destructive">{String(errors.dueDate.message)}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Observações opcionais..." rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createMutation.isPending} className="gradient-green text-white border-0">
              {createMutation.isPending ? "Registrando..." : "Registrar Empréstimo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReturnConfirm({ open, onClose, loan }: { open: boolean; onClose: () => void; loan: LoanRow }) {
  const utils = trpc.useUtils();
  const returnMutation = trpc.loans.registerReturn.useMutation({
    onSuccess: () => {
      utils.loans.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Devolução registrada!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm glass-card-lg border-0">
        <DialogHeader><DialogTitle>Registrar Devolução</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Confirmar devolução de <strong>"{loan.bookTitle}"</strong> por <strong>{loan.memberName}</strong>?
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={returnMutation.isPending}
            onClick={() => returnMutation.mutate({ id: loan.id })}
            className="gradient-blue text-white border-0"
          >
            {returnMutation.isPending ? "Registrando..." : "Confirmar Devolução"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirm({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm glass-card-lg border-0">
        <DialogHeader><DialogTitle>Excluir Empréstimo</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este empréstimo?</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Excluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoanTable({ loans, isLoading, onReturn, onDelete }: {
  loans: LoanRow[];
  isLoading: boolean;
  onReturn: (l: LoanRow) => void;
  onDelete: (l: LoanRow) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }
  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookMarked className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum empréstimo encontrado</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full data-table">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Usuário / Livro</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Empréstimo</th>
            <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Devolução Prev.</th>
            <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
            <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {loans.map((loan, i) => (
              <motion.tr
                key={loan.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03, ease: "easeOut" }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      loan.status === "overdue" ? "gradient-red" : loan.status === "returned" ? "gradient-blue" : "gradient-green"
                    }`}>
                      <BookMarked className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate max-w-[160px]">{loan.memberName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{loan.bookTitle ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(loan.loanDate), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`text-xs font-medium ${
                    loan.status === "overdue" ? "text-red-600" : "text-muted-foreground"
                  }`}>
                    {format(new Date(loan.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={loan.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {loan.status !== "returned" && (
                      <button
                        onClick={() => onReturn(loan)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="Registrar devolução"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(loan)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

export default function Loans() {
  const [showCreate, setShowCreate] = useState(false);
  const [returnTarget, setReturnTarget] = useState<LoanRow | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<LoanRow | undefined>();
  const [activeTab, setActiveTab] = useState("all");

  const utils = trpc.useUtils();
  const { data: allLoans, isLoading } = trpc.loans.list.useQuery({});
  const deleteMutation = trpc.loans.delete.useMutation({
    onSuccess: () => {
      utils.loans.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Empréstimo excluído!");
      setDeleteTarget(undefined);
    },
    onError: (e) => toast.error(e.message),
  });

  const loans = (allLoans ?? []) as LoanRow[];
  const byStatus = {
    all: loans,
    active: loans.filter(l => l.status === "active"),
    overdue: loans.filter(l => l.status === "overdue"),
    returned: loans.filter(l => l.status === "returned"),
  };

  const tabCounts = {
    all: loans.length,
    active: byStatus.active.length,
    overdue: byStatus.overdue.length,
    returned: byStatus.returned.length,
  };

  return (
    <DashboardLayout title="Empréstimos">
      <div className="p-4 lg:p-6 pb-20 lg:pb-6 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Empréstimos</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Controle de empréstimos e devoluções</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gradient-green text-white border-0 gap-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Novo Empréstimo
          </Button>
        </motion.div>

        {/* Summary mini-cards */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "all", label: "Total", icon: BookMarked, color: "text-foreground", bg: "bg-muted/60" },
            { key: "active", label: "Ativos", icon: Clock, color: "text-green-700", bg: "bg-green-50" },
            { key: "overdue", label: "Atrasados", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
            { key: "returned", label: "Devolvidos", icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
          ].map(({ key, label, icon: Icon, color, bg }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`glass-card p-3 flex items-center gap-3 text-left transition-all hover:shadow-md ${activeTab === key ? "ring-2 ring-primary/30" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{tabCounts[key as keyof typeof tabCounts]}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </button>
          ))}
        </motion.div>

        {/* Tabs + Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/70 mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="active">Ativos</TabsTrigger>
              <TabsTrigger value="overdue" className="data-[state=active]:text-red-600">Atrasados</TabsTrigger>
              <TabsTrigger value="returned">Devolvidos</TabsTrigger>
            </TabsList>
            {["all", "active", "overdue", "returned"].map(tab => (
              <TabsContent key={tab} value={tab}>
                <div className="glass-card overflow-hidden">
                  <LoanTable
                    loans={byStatus[tab as keyof typeof byStatus]}
                    isLoading={isLoading}
                    onReturn={setReturnTarget}
                    onDelete={setDeleteTarget}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>

      <CreateLoanModal open={showCreate} onClose={() => setShowCreate(false)} />
      {returnTarget && (
        <ReturnConfirm open={!!returnTarget} onClose={() => setReturnTarget(undefined)} loan={returnTarget} />
      )}
      {deleteTarget && (
        <DeleteConfirm
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={() => deleteMutation.mutate({ id: deleteTarget.id })}
        />
      )}
    </DashboardLayout>
  );
}
