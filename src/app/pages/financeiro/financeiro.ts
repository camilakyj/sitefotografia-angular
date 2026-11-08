
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

/* ==========================================================================
   LÓGICA DA PÁGINA FINANCEIRO - LETÍCIA GOMES FOTOGRAFIA
   ========================================================================== */

/* Define a estrutura dos clientes cadastrados */
interface Cliente {
  id: number | string;
  name: string;
}

/* Define a estrutura dos trabalhos cadastrados */
interface Trabalho {
  id: number | string;
  title: string;
}

/* Define a estrutura dos lançamentos financeiros */
interface Lancamento {
  id: number;
  type: string;
  status: string;
  description: string;
  amount: number | null;
  date: string;
  dueDate: string;
  paidDate: string;
  category: string;
  method: string;
  clientId: string | null;
  clientName: string;
  deliveryId: string | null;
  deliveryTitle: string;
  notes: string;
}

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './financeiro.html',
  styleUrl: './financeiro.css'
})
export class Financeiro implements OnInit {

  /* ==========================================================================
     1. PERSISTÊNCIA DE DADOS
     ========================================================================== */

  // Define a chave utilizada pelas páginas do painel administrativo
  private readonly STORAGE_KEY = 'leticia_dashboard_clean_v1';

  // Armazena os lançamentos financeiros cadastrados
  lancamentos: Lancamento[] = [];

  // Armazena os lançamentos após aplicar os filtros
  lancamentosFiltrados: Lancamento[] = [];

  // Armazena os clientes cadastrados
  clientes: Cliente[] = [];

  // Armazena os trabalhos cadastrados
  trabalhos: Trabalho[] = [];

  /* ==========================================================================
     2. CONTROLE DA INTERFACE
     ========================================================================== */

  // Controla a abertura do menu lateral
  menuAberto = false;

  // Controla a abertura do formulário
  modalAberto = false;

  // Identifica se o formulário está editando um lançamento
  editando = false;

  // Armazena mensagens de erro
  erroFormulario = '';

  // Define o ano exibido no rodapé
  anoAtual = new Date().getFullYear();

  /* ==========================================================================
     3. FILTROS DE CONSULTA
     ========================================================================== */

  // Inicializa o período com o mês atual
  mesSelecionado = this.obterMesAtual();

  // Armazena o texto digitado na pesquisa
  busca = '';

  // Armazena o tipo selecionado
  filtroTipo = '';

  // Armazena a situação selecionada
  filtroSituacao = '';

  /* ==========================================================================
     4. INDICADORES FINANCEIROS
     ========================================================================== */

  // Valores efetivamente recebidos
  receitasRecebidas = 0;

  // Valores que ainda serão recebidos
  receitasPendentes = 0;

  // Valores efetivamente pagos
  despesasPagas = 0;

  // Valores que ainda serão pagos
  despesasPendentes = 0;

  // Saldo das movimentações pagas
  saldoPeriodo = 0;

  // Diferença entre receitas e despesas pendentes
  saldoPendente = 0;

  // Quantidade de lançamentos de receita
  quantidadeReceitas = 0;

  // Quantidade de lançamentos de despesa
  quantidadeDespesas = 0;

  // Soma dos lançamentos exibidos na tabela
  totalFiltrado = 0;

  /* ==========================================================================
     5. FORMULÁRIO DE LANÇAMENTOS
     ========================================================================== */

  // Armazena os dados preenchidos no formulário
  formLancamento: Lancamento = this.criarLancamentoVazio();

  constructor(private router: Router) {}

  /* ==========================================================================
     6. INICIALIZAÇÃO
     ========================================================================== */

  ngOnInit(): void {
    // Recupera os dados existentes no navegador
    this.carregarDados();

    // Calcula os indicadores e atualiza a tabela
    this.atualizarFinanceiro();
  }

  /* ==========================================================================
     7. CARREGAMENTO DOS DADOS
     ========================================================================== */

  // Recupera as informações armazenadas no localStorage
  carregarDados(): void {
    try {
      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      if (!dadosSalvos) {
        this.lancamentos = [];
        this.clientes = [];
        this.trabalhos = [];
        return;
      }

      // Converte o JSON armazenado em objeto JavaScript
      const dados = JSON.parse(dadosSalvos);

      // Recupera os lançamentos financeiros
      this.lancamentos = Array.isArray(dados.finances)
        ? dados.finances
        : [];

      // Recupera os clientes cadastrados
      this.clientes = Array.isArray(dados.clients)
        ? dados.clients.map((cliente: any) => ({
            id: cliente.id,
            name: cliente.name || cliente.nome || cliente.fullName || ''
          }))
        : [];

      // Recupera os trabalhos cadastrados
      this.trabalhos = Array.isArray(dados.deliveries)
        ? dados.deliveries.map((trabalho: any) => ({
            id: trabalho.id,
            title: trabalho.title || ''
          }))
        : [];

    } catch (erro) {
      console.error('Erro ao carregar dados financeiros:', erro);

      this.lancamentos = [];
      this.clientes = [];
      this.trabalhos = [];
    }
  }

  /* ==========================================================================
     8. SALVAMENTO DOS DADOS
     ========================================================================== */

  // Salva somente os dados financeiros, preservando as outras páginas
  salvarDados(): void {
    try {
      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      // Recupera o objeto completo antes de atualizar
      const dadosAtuais = dadosSalvos
        ? JSON.parse(dadosSalvos)
        : {};

      // Atualiza somente a propriedade finances
      const dadosAtualizados = {
        ...dadosAtuais,
        finances: this.lancamentos
      };

      // Salva o objeto atualizado
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(dadosAtualizados)
      );

    } catch (erro) {
      console.error('Erro ao salvar dados financeiros:', erro);
      this.erroFormulario = 'Não foi possível salvar os dados.';
    }
  }

  /* ==========================================================================
     9. UTILITÁRIOS
     ========================================================================== */

  // Retorna o mês atual no formato AAAA-MM
  obterMesAtual(): string {
    const hoje = new Date();

    const ano = hoje.getFullYear();

    const mes = String(hoje.getMonth() + 1).padStart(2, '0');

    return `${ano}-${mes}`;
  }

  // Retorna a data atual no formato AAAA-MM-DD
  obterDataAtual(): string {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  // Formata valores monetários para Real brasileiro
  formatarMoeda(valor: number | null | undefined): string {
    return (Number(valor) || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Converte datas para o formato brasileiro
  formatarData(data: string): string {
    if (!data) {
      return '-';
    }

    const partes = data.split('-').map(Number);

    if (partes.length !== 3) {
      return data;
    }

    const dataFormatada = new Date(
      partes[0],
      partes[1] - 1,
      partes[2]
    );

    return dataFormatada.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
  }

  /* ==========================================================================
     10. CRIAÇÃO DO FORMULÁRIO VAZIO
     ========================================================================== */

  // Retorna um lançamento com os valores iniciais do formulário
  criarLancamentoVazio(): Lancamento {
    return {
      id: 0,
      type: 'Receita',
      status: 'Pendente',
      description: '',
      amount: null,
      date: this.obterDataAtual(),
      dueDate: '',
      paidDate: '',
      category: 'Ensaio fotográfico',
      method: '',
      clientId: '',
      clientName: '',
      deliveryId: '',
      deliveryTitle: '',
      notes: ''
    };
  }

  /* ==========================================================================
     11. CÁLCULO DOS INDICADORES FINANCEIROS
     ========================================================================== */

  // Calcula os valores de receitas, despesas e saldo do período
  atualizarFinanceiro(): void {

    // Seleciona os lançamentos do mês informado
    const lancamentosMes = this.lancamentos.filter(lancamento => {
      return (
        !this.mesSelecionado ||
        (
          lancamento.date &&
          lancamento.date.startsWith(this.mesSelecionado)
        )
      );
    });

    // Zera os indicadores antes de recalcular
    this.receitasRecebidas = 0;
    this.receitasPendentes = 0;
    this.despesasPagas = 0;
    this.despesasPendentes = 0;

    this.quantidadeReceitas = 0;
    this.quantidadeDespesas = 0;

    // Percorre todos os lançamentos do período
    lancamentosMes.forEach(lancamento => {

      const valor = Number(lancamento.amount) || 0;

      const ehReceita = lancamento.type === 'Receita';
      const estaPago = lancamento.status === 'Pago';

      if (ehReceita) {

        // Contabiliza receitas
        this.quantidadeReceitas++;

        if (estaPago) {
          this.receitasRecebidas += valor;
        } else {
          this.receitasPendentes += valor;
        }

      } else {

        // Contabiliza despesas
        this.quantidadeDespesas++;

        if (estaPago) {
          this.despesasPagas += valor;
        } else {
          this.despesasPendentes += valor;
        }
      }
    });

    // Calcula o saldo efetivo do período
    this.saldoPeriodo =
      this.receitasRecebidas - this.despesasPagas;

    // Calcula o saldo dos valores pendentes
    this.saldoPendente =
      this.receitasPendentes - this.despesasPendentes;

    // Atualiza os lançamentos exibidos na tabela
    this.filtrarLancamentos();
  }

  /* ==========================================================================
     12. FILTROS DA TABELA
     ========================================================================== */

  // Filtra os lançamentos por mês, descrição, tipo e situação
  filtrarLancamentos(): void {

    const pesquisa = this.busca.trim().toLowerCase();

    this.lancamentosFiltrados = this.lancamentos.filter(lancamento => {

      // Verifica se o lançamento pertence ao período selecionado
      const correspondeMes =
        !this.mesSelecionado ||
        Boolean(
          lancamento.date &&
          lancamento.date.startsWith(this.mesSelecionado)
        );

      // Pesquisa na descrição, categoria e cliente
      const correspondeBusca =
        !pesquisa ||
        (lancamento.description || '').toLowerCase().includes(pesquisa) ||
        (lancamento.category || '').toLowerCase().includes(pesquisa) ||
        (lancamento.clientName || '').toLowerCase().includes(pesquisa);

      // Verifica o tipo do lançamento
      const correspondeTipo =
        !this.filtroTipo ||
        lancamento.type === this.filtroTipo;

      // Verifica a situação do pagamento
      const correspondeSituacao =
        !this.filtroSituacao ||
        lancamento.status === this.filtroSituacao;

      return (
        correspondeMes &&
        correspondeBusca &&
        correspondeTipo &&
        correspondeSituacao
      );
    });

    // Calcula o total dos lançamentos filtrados
    this.totalFiltrado = this.lancamentosFiltrados.reduce(
      (total, lancamento) => {

        const valor = Number(lancamento.amount) || 0;

        if (lancamento.type === 'Receita') {
          return total + valor;
        }

        return total - valor;
      },
      0
    );
  }

  // Limpa os filtros da tabela, mantendo o mês selecionado
  limparFiltros(): void {
    this.busca = '';
    this.filtroTipo = '';
    this.filtroSituacao = '';

    this.filtrarLancamentos();
  }

  // Retorna rapidamente ao mês atual
  selecionarMesAtual(): void {
    this.mesSelecionado = this.obterMesAtual();

    this.atualizarFinanceiro();
  }

  /* ==========================================================================
     13. ABERTURA DO MODAL
     ========================================================================== */

  // Abre o formulário para cadastrar um lançamento
  novoLancamento(): void {

    // Recupera clientes e trabalhos atualizados
    this.atualizarRelacionamentos();

    // Limpa os campos do formulário
    this.formLancamento = this.criarLancamentoVazio();

    this.editando = false;
    this.erroFormulario = '';

    // Exibe o modal
    this.modalAberto = true;
  }

  // Fecha o formulário de cadastro ou edição
  fecharModal(): void {
    this.modalAberto = false;
    this.editando = false;
    this.erroFormulario = '';
  }

  /* ==========================================================================
     14. CLIENTES E TRABALHOS RELACIONADOS
     ========================================================================== */

  // Atualiza os clientes e trabalhos disponíveis nos selects
  atualizarRelacionamentos(): void {
    try {
      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      if (!dadosSalvos) {
        this.clientes = [];
        this.trabalhos = [];
        return;
      }

      const dados = JSON.parse(dadosSalvos);

      // Atualiza a lista de clientes
      this.clientes = Array.isArray(dados.clients)
        ? dados.clients.map((cliente: any) => ({
            id: cliente.id,
            name: cliente.name || cliente.nome || cliente.fullName || ''
          }))
        : [];

      // Atualiza a lista de trabalhos
      this.trabalhos = Array.isArray(dados.deliveries)
        ? dados.deliveries.map((trabalho: any) => ({
            id: trabalho.id,
            title: trabalho.title || ''
          }))
        : [];

    } catch (erro) {
      console.error('Erro ao atualizar relacionamentos:', erro);
    }
  }

  /* ==========================================================================
     15. SALVAR LANÇAMENTO
     ========================================================================== */

  // Cadastra um novo lançamento ou atualiza um lançamento existente
  salvarLancamento(): void {

    const descricao = this.formLancamento.description.trim();

    const valor = Number(this.formLancamento.amount);

    // Valida os campos obrigatórios
    if (
      !descricao ||
      !Number.isFinite(valor) ||
      valor <= 0 ||
      valor > 999999999 ||
      !this.formLancamento.date ||
      !this.formLancamento.category
    ) {
      this.erroFormulario =
        'Informe uma descrição, uma data e um valor válido.';
      return;
    }

    // Localiza o cliente selecionado
    const cliente = this.clientes.find(
      item => String(item.id) === String(this.formLancamento.clientId)
    );

    // Localiza o trabalho selecionado
    const trabalho = this.trabalhos.find(
      item => String(item.id) === String(this.formLancamento.deliveryId)
    );

    // Monta o objeto do lançamento financeiro
    const lancamento: Lancamento = {
      ...this.formLancamento,

      // Mantém o ID existente durante a edição
      id: this.editando
        ? this.formLancamento.id
        : Date.now(),

      description: descricao,
      amount: valor,

      // Armazena o ID e o nome do cliente
      clientId: cliente ? String(cliente.id) : null,
      clientName: cliente ? cliente.name : '',

      // Armazena o ID e o título do trabalho
      deliveryId: trabalho ? String(trabalho.id) : null,
      deliveryTitle: trabalho ? trabalho.title : '',

      notes: this.formLancamento.notes.trim()
    };

    if (this.editando) {

      // Procura o lançamento existente
      const indice = this.lancamentos.findIndex(
        item => item.id === lancamento.id
      );

      // Atualiza o lançamento encontrado
      if (indice !== -1) {
        this.lancamentos[indice] = lancamento;
      }

    } else {

      // Adiciona o novo lançamento no início da lista
      this.lancamentos.unshift(lancamento);
    }

    // Salva no armazenamento local
    this.salvarDados();

    // Fecha o formulário
    this.fecharModal();

    // Atualiza indicadores e tabela
    this.atualizarFinanceiro();
  }

  /* ==========================================================================
     16. EDITAR LANÇAMENTO
     ========================================================================== */

  // Abre o formulário com os dados do lançamento selecionado
  editarLancamento(lancamento: Lancamento): void {

    // Recupera os clientes e trabalhos cadastrados
    this.atualizarRelacionamentos();

    // Copia os dados do lançamento para o formulário
    this.formLancamento = {
      ...lancamento,
      clientId: lancamento.clientId
        ? String(lancamento.clientId)
        : '',
      deliveryId: lancamento.deliveryId
        ? String(lancamento.deliveryId)
        : ''
    };

    // Ativa o modo de edição
    this.editando = true;

    this.erroFormulario = '';

    // Abre o modal
    this.modalAberto = true;
  }

  /* ==========================================================================
     17. EXCLUIR LANÇAMENTO
     ========================================================================== */

  // Exclui um lançamento após confirmação
  excluirLancamento(id: number): void {

    const confirmar = confirm(
      'Deseja realmente excluir este lançamento?'
    );

    if (!confirmar) {
      return;
    }

    // Remove o lançamento da lista
    this.lancamentos = this.lancamentos.filter(
      lancamento => lancamento.id !== id
    );

    // Salva os dados atualizados
    this.salvarDados();

    // Recalcula os indicadores e a tabela
    this.atualizarFinanceiro();
  }

  /* ==========================================================================
     18. EXPORTAÇÃO DE RELATÓRIO CSV
     ========================================================================== */

  // Exporta os lançamentos do período selecionado para CSV
  exportarCSV(): void {

    // Seleciona os lançamentos do período
    const lancamentosMes = this.lancamentos.filter(
      lancamento =>
        !this.mesSelecionado ||
        Boolean(
          lancamento.date &&
          lancamento.date.startsWith(this.mesSelecionado)
        )
    );

    // Verifica se existem lançamentos para exportar
    if (lancamentosMes.length === 0) {
      alert('Nenhum lançamento para exportar neste período.');
      return;
    }

    // Define as colunas do arquivo CSV
    const cabecalho = [
      'ID',
      'Tipo',
      'Situacao',
      'Descricao',
      'Valor',
      'Data',
      'Categoria',
      'Metodo',
      'Cliente'
    ];

    // Trata os valores para evitar que vírgulas e aspas quebrem o CSV
    const escaparCSV = (valor: unknown): string => {
      const texto = String(valor ?? '');

      // Evita que textos iniciados por operadores sejam
      // interpretados como fórmulas em planilhas
      const textoSeguro = /^[=+\-@\t\r]/.test(texto)
        ? "'" + texto
        : texto;

      return '"' + textoSeguro.replace(/"/g, '""') + '"';
    };

    // Monta o conteúdo do relatório
    const linhas = lancamentosMes.map(lancamento => [
      lancamento.id,
      lancamento.type,
      lancamento.status,
      lancamento.description,
      lancamento.amount,
      lancamento.date,
      lancamento.category,
      lancamento.method,
      lancamento.clientName
    ].map(escaparCSV).join(';'));

    // Junta o cabeçalho e as linhas
    const conteudoCSV = [
      cabecalho.join(';'),
      ...linhas
    ].join('\r\n');

    // Cria o arquivo CSV em UTF-8
    const arquivo = new Blob(
      ['\uFEFF' + conteudoCSV],
      { type: 'text/csv;charset=utf-8;' }
    );

    // Cria um endereço temporário para download
    const endereco = URL.createObjectURL(arquivo);

    // Cria um link para baixar o arquivo
    const link = document.createElement('a');

    link.href = endereco;
    link.download =
      `financeiro_${this.mesSelecionado || 'todos'}.csv`;

    // Inicia o download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Libera o endereço temporário
    setTimeout(() => URL.revokeObjectURL(endereco), 1000);
  }

  /* ==========================================================================
     19. MENU LATERAL RETRÁTIL
     ========================================================================== */

  // Abre ou fecha o menu lateral
  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  // Fecha o menu lateral
  fecharMenu(): void {
    this.menuAberto = false;
  }

  /* ==========================================================================
     20. NAVEGAÇÃO E LOGOUT
     ========================================================================== */

  // Retorna para a página de login
  sair(): void {
    this.router.navigate(['/login']);
  }
}
