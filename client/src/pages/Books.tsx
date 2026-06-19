import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, BookOpen, X, Filter } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Book } from "../../../drizzle/schema";

const CATEGORIES = ["Ciências Exatas", "Ciências Humanas", "Ciências Biológicas", "Engenharia", "Literatura", "Direito", "Medicina", "Administração", "Tecnologia", "Outros"];

const bookSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  author: z.string().min(1, "Autor obrigatório"),
  isbn: z.string().optional(),
  category: z.string().optional(),
  publishYear: z.coerce.number().int().min(1000).max(new Date().getFullYear()).optional().or(z.literal("")),
  totalCopies: z.coerce.number().int().min(1, "Mínimo 1 exemplar"),
  availableCopies: z.coerce.number().int().min(0).optional(),
  description: z.string().optional(),
});
type BookForm = z.infer<typeof bookSchema>;

function BookFormModal({
  open, onClose, book,
}: { open: boolean; onClose: () => void; book?: Book }) {
  const utils = trpc.useUtils();
  const isEdit = !!book;

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<BookForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bookSchema) as any,
    defaultValues: book ? {
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? "",
      category: book.category ?? "",
      publishYear: book.publishYear ?? "",
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      description: book.description ?? "",
    } : { totalCopies: 1 },
  });

  const createMutation = trpc.books.create.useMutation({
    onSuccess: () => { utils.books.list.invalidate(); toast.success("Livro cadastrado com sucesso!"); onClose(); reset(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.books.update.useMutation({
    onSuccess: () => { utils.books.list.invalidate(); toast.success("Livro atualizado!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      publishYear: data.publishYear === "" ? undefined : Number(data.publishYear),
      availableCopies: data.availableCopies ?? data.totalCopies,
    };
    if (isEdit) updateMutation.mutate({ id: book.id, ...payload });
    else createMutation.mutate(payload as Parameters<typeof createMutation.mutate>[0]);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg glass-card-lg border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-green flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            {isEdit ? "Editar Livro" : "Cadastrar Livro"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" {...register("title")} placeholder="Ex: Cálculo Vol. 1" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="author">Autor *</Label>
              <Input id="author" {...register("author")} placeholder="Ex: James Stewart" />
              {errors.author && <p className="text-xs text-destructive">{errors.author.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" {...register("isbn")} placeholder="Ex: 978-3-16-148410-0" />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select onValueChange={(v) => setValue("category", v)} defaultValue={book?.category ?? ""}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="publishYear">Ano de Publicação</Label>
              <Input id="publishYear" type="number" {...register("publishYear")} placeholder="Ex: 2020" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="totalCopies">Total de Exemplares *</Label>
              <Input id="totalCopies" type="number" min={1} {...register("totalCopies")} />
              {errors.totalCopies && <p className="text-xs text-destructive">{errors.totalCopies.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="availableCopies">Exemplares Disponíveis</Label>
              <Input id="availableCopies" type="number" min={0} {...register("availableCopies")} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register("description")} placeholder="Breve descrição do livro..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPending} className="gradient-green text-white border-0">
              {isPending ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirm({ open, onClose, onConfirm, title }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm glass-card-lg border-0">
        <DialogHeader>
          <DialogTitle>Excluir Livro</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir <strong>"{title}"</strong>? Esta ação não pode ser desfeita.</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Excluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Books() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState<Book | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Book | undefined>();

  const utils = trpc.useUtils();
  const { data: books, isLoading } = trpc.books.list.useQuery({ search: search || undefined });
  const deleteMutation = trpc.books.delete.useMutation({
    onSuccess: () => { utils.books.list.invalidate(); toast.success("Livro excluído!"); setDeleteTarget(undefined); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = books?.filter(b => {
    if (filterCategory !== "all" && b.category !== filterCategory) return false;
    if (filterAvailability === "available" && b.availableCopies <= 0) return false;
    if (filterAvailability === "unavailable" && b.availableCopies > 0) return false;
    return true;
  }) ?? [];

  return (
    <DashboardLayout title="Livros">
      <div className="p-4 lg:p-6 pb-20 lg:pb-6 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Livros</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie o acervo da biblioteca</p>
          </div>
          <Button onClick={() => { setEditBook(undefined); setShowModal(true); }} className="gradient-green text-white border-0 gap-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Cadastrar Livro
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, autor, ISBN..."
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
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-white/70">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterAvailability} onValueChange={setFilterAvailability}>
            <SelectTrigger className="w-full sm:w-40 bg-white/70">
              <SelectValue placeholder="Disponibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponíveis</SelectItem>
              <SelectItem value="unavailable">Indisponíveis</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Stats bar */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtered.length} livro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Livro</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">ISBN</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Categoria</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">Ano</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Disponível</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton className="h-10 w-full" /></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-6 w-16 mx-auto" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-8 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhum livro encontrado</p>
                        <Button variant="link" className="mt-2 text-primary text-sm" onClick={() => { setSearch(""); setFilterCategory("all"); }}>
                          Limpar filtros
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {filtered.map((book, i) => (
                        <motion.tr
                          key={book.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03, ease: "easeOut" }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate max-w-[180px]">{book.title}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{book.author}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs text-muted-foreground font-mono">{book.isbn ?? "—"}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {book.category ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                {book.category}
                              </span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground">{book.publishYear ?? "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-semibold ${book.availableCopies > 0 ? "text-green-700" : "text-red-600"}`}>
                              {book.availableCopies}/{book.totalCopies}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditBook(book); setShowModal(true); }}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(book)}
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

      <BookFormModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditBook(undefined); }}
        book={editBook}
      />
      {deleteTarget && (
        <DeleteConfirm
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={() => deleteMutation.mutate({ id: deleteTarget.id })}
          title={deleteTarget.title}
        />
      )}
    </DashboardLayout>
  );
}
