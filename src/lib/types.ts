export type TipoLancamento = 'RECEITA' | 'DESPESA';
export type StatusLancamento = 'OK' | 'PENDENTE';
export type Usuario = 'THARCISIO' | 'TAMIRES';

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoLancamento;
  subtipo?: 'FIXA' | 'VARIAVEL' | 'CARTAO';
  criadaEm: Date;
}

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  valor: number;
  categoria: string;
  descricao: string;
  data: Date;
  status: StatusLancamento;
  usuario: Usuario;
  criadoEm: Date;
}

export interface LancamentoInput {
  texto?: string;
  imagemBase64?: string;
}

export interface LancamentoProcessado {
  tipo: TipoLancamento;
  valor: number;
  categoria: string;
  descricao: string;
  data: Date;
  status: StatusLancamento;
}
