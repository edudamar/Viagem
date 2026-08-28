export type Categoria = string;

export type Gasto = { categoria: string; valor: number };

export type ChecklistItem = {
  id: string;
  grupo: string;
  titulo: string;
  done: boolean;
  urgente?: boolean;
};

export type Coord = { lat: number; lng: number };

export type Atividade = {
  id: string;
  hora: string;
  titulo: string;
  local: string;
  custo: number;
  notas?: string;
  relato?: string;
  fotos?: string[];
  nota?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  endereco?: string;
  coord?: Coord;
  placeId?: string;
};

export type Dia = {
  data: string;
  atividades: Atividade[];
  relato?: string;
  destaque?: string;
};

export type Subcategoria = { id: string; nome: string };

export type CategoriaFin = {
  id: string;
  nome: string;
  tipo: "despesa" | "receita";
  cor: string;
  subcategorias: Subcategoria[];
};

export type Conta = {
  id: string;
  nome: string;
  tipo: "Banco" | "Cartão" | "Dinheiro" | "Pix" | "Carteira";
  cor: string;
  instituicao?: string;
  agencia?: string;
  numeroConta?: string;
  titular?: string;
  documentoTitular?: string;
  chavePix?: string;
  tipoChavePix?: "CPF" | "CNPJ" | "Email" | "Telefone" | "Aleatória";
  bandeira?: string;
  ultimosDigitos?: string;
  diaFechamento?: number;
  diaVencimento?: number;
  limite?: number;
  saldoInicial?: number;
  moeda?: string;
  observacoes?: string;
};

export type FormaPagamento = { id: string; nome: string };

export type Viajante = { id: string; nome: string; cor: string };

export type DivisaoModo = "igual" | "porcentagem" | "valor" | "cotas";

export type Divisao = {
  modo: DivisaoModo;
  partes: { viajanteId: string; peso: number }[];
};

export type OrigemImport = {
  descricaoOriginal: string;
  hash: string;
};

export type Anexo = {
  id: string;
  nome: string;
  mime: string;
  tamanho: number;
  webViewLink?: string;
  criadoEm: string;
};

export type Lancamento = {
  id: string;
  tipo: "despesa" | "receita";
  data: string;
  valor: number;
  descricao: string;
  categoriaId: string;
  subcategoriaId?: string;
  contaId: string;
  formaPagamentoId: string;
  viajantesIds: string[];
  divisao?: Divisao;
  diaIndex?: number;
  origemImport?: OrigemImport;
  anexos?: Anexo[];
};

export type RegraImport = {
  id: string;
  termo: string;
  categoriaId: string;
  subcategoriaId?: string;
  ativa?: boolean;
};

export type Viagem = {
  id: string;
  destino: string;
  inicio: string;
  fim: string;
  orcamento: number;
  capaUrl?: string;
  dataImportacao?: string;
  _updatedAt?: number;
  gastos: Gasto[];
  checklist: ChecklistItem[];
  gruposChecklist: string[];
  dias: Dia[];
  viajantes: Viajante[];
  contas: Conta[];
  formasPagamento: FormaPagamento[];
  categorias: CategoriaFin[];
  lancamentos: Lancamento[];
  regrasImport: RegraImport[];
};

export type NovaViagemInput = {
  destino: string;
  inicio: string;
  fim: string;
  orcamento: number;
};
