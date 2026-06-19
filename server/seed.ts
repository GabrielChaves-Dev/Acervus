import type Database from "better-sqlite3";

export function seed(sqlite: Database.Database) {
  const now = new Date();

  const books = [
    { title: "Cálculo Vol. 1", author: "James Stewart", isbn: "978-85-221-1597-8", category: "Ciências Exatas", publishYear: 2013, totalCopies: 5, availableCopies: 3, description: "Livro clássico de cálculo diferencial e integral para cursos de engenharia e ciências exatas." },
    { title: "Introdução à Programação com Python", author: "Nilo Ney Coutinho Menezes", isbn: "978-85-7522-718-3", category: "Tecnologia", publishYear: 2019, totalCopies: 4, availableCopies: 2, description: "Guia completo para iniciantes em programação utilizando a linguagem Python." },
    { title: "Estruturas de Dados e Algoritmos", author: "Michael T. Goodrich", isbn: "978-85-216-2994-7", category: "Tecnologia", publishYear: 2014, totalCopies: 3, availableCopies: 1, description: "Abordagem moderna de estruturas de dados e algoritmos com implementações em Java." },
    { title: "Física para Cientistas e Engenheiros", author: "Raymond A. Serway", isbn: "978-85-221-1687-6", category: "Ciências Exatas", publishYear: 2018, totalCopies: 6, availableCopies: 4, description: "Texto abrangente de física universitária cobrindo mecânica, termodinâmica, eletromagnetismo e óptica." },
    { title: "O Processo", author: "Franz Kafka", isbn: "978-85-359-0277-5", category: "Literatura", publishYear: 1925, totalCopies: 3, availableCopies: 3, description: "Obra-prima do expressionismo literário sobre Josef K., acusado de um crime que nunca é revelado." },
    { title: "Direito Constitucional", author: "Alexandre de Moraes", isbn: "978-85-97-01982-4", category: "Direito", publishYear: 2021, totalCopies: 4, availableCopies: 2, description: "Manual completo de direito constitucional brasileiro, amplamente adotado em concursos e faculdades." },
    { title: "Princípios de Administração Financeira", author: "Lawrence J. Gitman", isbn: "978-85-4301-878-1", category: "Administração", publishYear: 2017, totalCopies: 3, availableCopies: 3, description: "Fundamentos de finanças corporativas com foco em análise e tomada de decisão financeira." },
    { title: "Anatomia Humana", author: "Dangelo & Fattini", isbn: "978-85-277-2178-2", category: "Medicina", publishYear: 2011, totalCopies: 5, availableCopies: 3, description: "Referência clássica de anatomia humana descritiva e topográfica para estudantes de medicina." },
    { title: "Microeconomia", author: "Robert S. Pindyck", isbn: "978-85-4301-852-1", category: "Ciências Humanas", publishYear: 2013, totalCopies: 4, availableCopies: 2, description: "Análise microeconômica moderna com aplicações práticas ao comportamento de consumidores e firmas." },
    { title: "Banco de Dados: Projeto e Implementação", author: "Felipe Nery Rodrigues Machado", isbn: "978-85-365-0413-9", category: "Tecnologia", publishYear: 2020, totalCopies: 3, availableCopies: 1, description: "Guia prático de modelagem, projeto e implementação de bancos de dados relacionais." },
    { title: "Engenharia de Software", author: "Ian Sommerville", isbn: "978-85-4301-974-0", category: "Engenharia", publishYear: 2018, totalCopies: 4, availableCopies: 2, description: "Texto de referência em engenharia de software cobrindo processos, modelagem e gerenciamento de projetos." },
    { title: "Dom Casmurro", author: "Machado de Assis", isbn: "978-85-359-0275-1", category: "Literatura", publishYear: 1899, totalCopies: 4, availableCopies: 4, description: "Clássico da literatura brasileira que narra a história de Bentinho e Capitu, obra do Realismo nacional." },
  ];

  const members = [
    { name: "Ana Clara Oliveira", matricula: "2024001", email: "ana.clara@email.com", phone: "(85) 98765-4321", status: "active" },
    { name: "Bruno Henrique Santos", matricula: "2024002", email: "bruno.santos@email.com", phone: "(85) 99123-4567", status: "active" },
    { name: "Carla Fernanda Lima", matricula: "2023015", email: "carla.lima@email.com", phone: "(85) 98234-5678", status: "active" },
    { name: "Diego Alves Pereira", matricula: "2023022", email: "diego.pereira@email.com", phone: "(85) 97345-6789", status: "active" },
    { name: "Eduarda Martins Costa", matricula: "2022030", email: "eduarda.costa@email.com", phone: "(85) 96456-7890", status: "active" },
    { name: "Felipe Rodrigues Neto", matricula: "2022041", email: "felipe.neto@email.com", phone: "(85) 95567-8901", status: "active" },
    { name: "Gabriela Sousa Ferreira", matricula: "2021055", email: "gabriela.ferreira@email.com", phone: "(85) 94678-9012", status: "active" },
    { name: "Henrique Castro Barbosa", matricula: "2021063", email: "henrique.barbosa@email.com", phone: "(85) 93789-0123", status: "active" },
    { name: "Isabela Mendes Rocha", matricula: "2020078", email: "isabela.rocha@email.com", phone: "(85) 92890-1234", status: "active" },
    { name: "João Pedro Carvalho", matricula: "2020089", email: "joao.carvalho@email.com", phone: "(85) 91901-2345", status: "inactive" },
  ];

  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const a = (daysAhead: number) => new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

  const loans = [
    { memberId: 1, bookId: 1, loanDate: d(5), dueDate: a(9), returnDate: null, status: "active", notes: null },
    { memberId: 2, bookId: 3, loanDate: d(3), dueDate: a(11), returnDate: null, status: "active", notes: null },
    { memberId: 3, bookId: 5, loanDate: d(7), dueDate: a(7), returnDate: null, status: "active", notes: null },
    { memberId: 4, bookId: 7, loanDate: d(2), dueDate: a(12), returnDate: null, status: "active", notes: null },
    { memberId: 5, bookId: 9, loanDate: d(10), dueDate: a(4), returnDate: null, status: "active", notes: null },
    { memberId: 6, bookId: 2, loanDate: d(20), dueDate: d(6), returnDate: null, status: "overdue", notes: "Usuário notificado por e-mail" },
    { memberId: 7, bookId: 4, loanDate: d(18), dueDate: d(4), returnDate: null, status: "overdue", notes: null },
    { memberId: 8, bookId: 6, loanDate: d(25), dueDate: d(11), returnDate: null, status: "overdue", notes: "Segunda notificação enviada" },
    { memberId: 1, bookId: 8, loanDate: d(30), dueDate: d(16), returnDate: d(18), status: "returned", notes: null },
    { memberId: 2, bookId: 10, loanDate: d(28), dueDate: d(14), returnDate: d(15), status: "returned", notes: null },
    { memberId: 3, bookId: 11, loanDate: d(25), dueDate: d(11), returnDate: d(12), status: "returned", notes: null },
    { memberId: 4, bookId: 12, loanDate: d(22), dueDate: d(8), returnDate: d(9), status: "returned", notes: null },
    { memberId: 5, bookId: 1, loanDate: d(45), dueDate: d(31), returnDate: d(33), status: "returned", notes: null },
    { memberId: 9, bookId: 3, loanDate: d(40), dueDate: d(26), returnDate: d(28), status: "returned", notes: null },
  ];

  const insertBook = sqlite.prepare(`INSERT INTO books (title, author, isbn, category, publishYear, totalCopies, availableCopies, description, createdAt, updatedAt) VALUES (@title, @author, @isbn, @category, @publishYear, @totalCopies, @availableCopies, @description, @createdAt, @updatedAt)`);
  const insertMember = sqlite.prepare(`INSERT INTO library_members (name, matricula, email, phone, status, createdAt, updatedAt) VALUES (@name, @matricula, @email, @phone, @status, @createdAt, @updatedAt)`);
  const insertLoan = sqlite.prepare(`INSERT INTO loans (memberId, bookId, loanDate, dueDate, returnDate, status, notes, createdAt, updatedAt) VALUES (@memberId, @bookId, @loanDate, @dueDate, @returnDate, @status, @notes, @createdAt, @updatedAt)`);

  const ts = nowISO();

  const tx = sqlite.transaction(() => {
    for (const b of books) {
      insertBook.run({ ...b, createdAt: ts, updatedAt: ts });
    }
    for (const m of members) {
      insertMember.run({ ...m, createdAt: ts, updatedAt: ts });
    }
    for (const l of loans) {
      insertLoan.run({ ...l, createdAt: ts, updatedAt: ts });
    }
  });
  tx();
}

function nowISO() {
  return new Date().toISOString();
}
