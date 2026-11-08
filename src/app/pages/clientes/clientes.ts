
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

/* ==========================================================================
   LÓGICA DA PÁGINA DE CLIENTES - LETÍCIA GOMES FOTOGRAFIA
   ========================================================================== */

/* Define a estrutura dos dados de cada cliente */
interface Cliente {
  id: number;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  lastSession: string;
  lastSessionType: string;
  paymentStatus: string;
  paymentAmount: number;
  notes: string;
  proposalStatus?: string;
}

/* Define a estrutura dos registros do histórico */
interface RegistroHistorico {
  id: number;
  clientId: number;
  date: string;
  type: string;
  text: string;
}

/* Define a estrutura dos dados compartilhados entre as páginas */
interface BancoLocal {
  requests: any[];
  clients: Cliente[];
  history: RegistroHistorico[];
  [chave: string]: any;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes implements OnInit {

  /* Chave usada para salvar os dados no navegador */
  private readonly STORAGE_KEY = 'leticia_dashboard_clean_v1';

  /* Armazena os dados carregados do localStorage */
  db: BancoLocal = {
    requests: [],
    clients: [],
    history: []
  };

  /* Controla a abertura do menu lateral */
  menuAberto = false;

  /* Controla os modais da página */
  modalClienteAberto = false;
  modalFichaAberto = false;
  formularioHistoricoAberto = false;

  /* Armazena o cliente que está sendo editado ou visualizado */
  clienteEmEdicao: Cliente | null = null;
  clienteSelecionado: Cliente | null = null;

  /* Armazena os clientes que aparecem na tabela */
  clientesFiltrados: Cliente[] = [];

  /* Valores dos filtros */
  termoBusca = '';
  filtroRelacionamento = '';
  filtroEnsaio = '';
  filtroPagamento = '';

  /* Indicadores dos cards */
  totalClientes = 0;
  clientesComEnsaio = 0;
  propostasEmAberto = 0;
  pagamentosPendentes = 0;

  /* Ano exibido no rodapé */
  anoAtual = new Date().getFullYear();

  /* Mensagem de validação do formulário */
  erroFormulario = '';

  /* Dados do formulário de cadastro e edição */
  formCliente: Cliente = this.criarClienteVazio();

  /* Dados do formulário de histórico */
  formHistorico = {
    date: '',
    type: 'Contato',
    text: ''
  };

  /* Histórico do cliente selecionado */
  historicoCliente: RegistroHistorico[] = [];

  constructor(private router: Router) {}

  /* Executa quando o componente é carregado */
  ngOnInit(): void {
    this.carregarDados();
    this.atualizarPagina();
  }

  /* ==========================================================================
     1. PERSISTÊNCIA DE DADOS
     ========================================================================== */

  /* Recupera os dados existentes no navegador */
  carregarDados(): void {
    try {
      const salvos = localStorage.getItem(this.STORAGE_KEY);

      if (salvos) {
        const dados = JSON.parse(salvos);

        this.db = {
          ...dados,
          requests: Array.isArray(dados.requests) ? dados.requests : [],
          clients: Array.isArray(dados.clients) ? dados.clients : [],
          history: Array.isArray(dados.history) ? dados.history : []
        };
      }
    } catch (erro) {
      console.error('Erro ao carregar os dados:', erro);
    }
  }

  /* Salva as alterações no localStorage */
  salvarDados(): void {
    try {
      // Recupera a versão mais recente para preservar outras áreas do painel.
      const salvos = localStorage.getItem(this.STORAGE_KEY);
      const dadosAtuais = salvos ? JSON.parse(salvos) : {};

      const dadosAtualizados = {
        ...dadosAtuais,
        clients: this.db.clients,
        history: this.db.history
      };

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(dadosAtualizados)
      );

      this.db = {
        ...dadosAtualizados,
        requests: Array.isArray(dadosAtualizados.requests)
          ? dadosAtualizados.requests
          : [],
        clients: this.db.clients,
        history: this.db.history
      };
    } catch (erro) {
      console.error('Erro ao salvar os dados:', erro);
    }
  }

  /* ==========================================================================
     2. UTILITÁRIOS
     ========================================================================== */

  /* Cria um formulário vazio para cadastrar um novo cliente */
  criarClienteVazio(): Cliente {
    return {
      id: 0,
      name: '',
      email: '',
      phone: '',
      relationship: 'Lead',
      lastSession: '',
      lastSessionType: '',
      paymentStatus: 'Não se aplica',
      paymentAmount: 0,
      notes: ''
    };
  }

  /* Formata datas no padrão brasileiro */
  formatarData(data?: string): string {
    if (!data) {
      return 'Não informada';
    }

    const partes = data.split('-').map(Number);

    if (partes.length !== 3 || partes.some(n => !Number.isFinite(n))) {
      return 'Não informada';
    }

    const dataFormatada = new Date(
      partes[0],
      partes[1] - 1,
      partes[2]
    );

    if (isNaN(dataFormatada.getTime())) {
      return 'Não informada';
    }

    return dataFormatada.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
  }

  /* Formata valores em reais */
  formatarMoeda(valor?: number): string {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  /* ==========================================================================
     3. INDICADORES
     ========================================================================== */

  /* Calcula os valores exibidos nos quatro cards */
  atualizarIndicadores(): void {
    const clientes = this.db.clients;

    this.totalClientes = clientes.length;

    this.clientesComEnsaio = clientes.filter(
      cliente => !!cliente.lastSession
    ).length;

    this.propostasEmAberto = clientes.filter(
      cliente =>
        cliente.proposalStatus === 'Enviada' ||
        cliente.proposalStatus === 'Rascunho'
    ).length;

    this.pagamentosPendentes = clientes.filter(
      cliente =>
        cliente.paymentStatus === 'Pendente' ||
        cliente.paymentStatus === 'Parcial'
    ).length;
  }

  /* ==========================================================================
     4. TABELA E FILTROS
     ========================================================================== */

  /* Aplica os filtros selecionados à tabela de clientes */
  aplicarFiltros(): void {
    const busca = this.termoBusca.trim().toLowerCase();

    this.clientesFiltrados = this.db.clients.filter(cliente => {

      const correspondeBusca =
        !busca ||
        (cliente.name || '').toLowerCase().includes(busca) ||
        (cliente.email || '').toLowerCase().includes(busca) ||
        (cliente.phone || '').toLowerCase().includes(busca);

      const correspondeRelacionamento =
        !this.filtroRelacionamento ||
        cliente.relationship === this.filtroRelacionamento;

      const correspondeEnsaio =
        !this.filtroEnsaio ||
        (this.filtroEnsaio === 'com' && !!cliente.lastSession) ||
        (this.filtroEnsaio === 'sem' && !cliente.lastSession);

      const correspondePagamento =
        !this.filtroPagamento ||
        cliente.paymentStatus === this.filtroPagamento;

      return (
        correspondeBusca &&
        correspondeRelacionamento &&
        correspondeEnsaio &&
        correspondePagamento
      );
    });
  }

  /* Limpa os campos de pesquisa e filtros */
  limparFiltros(): void {
    this.termoBusca = '';
    this.filtroRelacionamento = '';
    this.filtroEnsaio = '';
    this.filtroPagamento = '';

    this.aplicarFiltros();
  }

  /* Atualiza indicadores e tabela */
  atualizarPagina(): void {
    this.atualizarIndicadores();
    this.aplicarFiltros();
  }

  /* ==========================================================================
     5. CADASTRO E EDIÇÃO DE CLIENTES
     ========================================================================== */

  /* Abre o formulário para cadastrar um cliente */
  novoCliente(): void {
    this.clienteEmEdicao = null;
    this.formCliente = this.criarClienteVazio();
    this.erroFormulario = '';
    this.modalClienteAberto = true;
  }

  /* Fecha o formulário de cadastro */
  fecharModalCliente(): void {
    this.modalClienteAberto = false;
    this.clienteEmEdicao = null;
    this.formCliente = this.criarClienteVazio();
    this.erroFormulario = '';
  }

  /* Salva um novo cliente ou atualiza um cadastro existente */
  salvarCliente(): void {
    const nome = this.formCliente.name.trim();

    if (!nome) {
      this.erroFormulario = 'Informe o nome completo do cliente.';
      return;
    }

    const cliente: Cliente = {
      ...this.formCliente,
      id: this.clienteEmEdicao
        ? this.clienteEmEdicao.id
        : Date.now(),
      name: nome,
      email: this.formCliente.email.trim(),
      phone: this.formCliente.phone.trim(),
      lastSessionType: this.formCliente.lastSessionType.trim(),
      paymentAmount: Number(this.formCliente.paymentAmount) || 0,
      notes: this.formCliente.notes.trim()
    };

    if (this.clienteEmEdicao) {
      const indice = this.db.clients.findIndex(
        item => item.id === this.clienteEmEdicao!.id
      );

      if (indice !== -1) {
        this.db.clients[indice] = cliente;
      }
    } else {
      this.db.clients.unshift(cliente);
    }

    this.salvarDados();
    this.fecharModalCliente();
    this.atualizarPagina();
  }

  /* ==========================================================================
     6. FICHA DETALHADA DO CLIENTE
     ========================================================================== */

  /* Abre a ficha de um cliente */
  abrirFicha(cliente: Cliente): void {
    this.clienteSelecionado = cliente;
    this.modalFichaAberto = true;
    this.formularioHistoricoAberto = false;
    this.atualizarHistorico();
  }

  /* Fecha a ficha detalhada */
  fecharFicha(): void {
    this.modalFichaAberto = false;
    this.clienteSelecionado = null;
    this.formularioHistoricoAberto = false;
  }

  /* Abre o cadastro para editar o cliente selecionado */
  editarDaFicha(): void {
    if (!this.clienteSelecionado) {
      return;
    }

    this.clienteEmEdicao = this.clienteSelecionado;
    this.formCliente = { ...this.clienteSelecionado };

    this.erroFormulario = '';
    this.modalFichaAberto = false;
    this.modalClienteAberto = true;
  }

  /* ==========================================================================
     7. HISTÓRICO DE INTERAÇÕES
     ========================================================================== */

  /* Atualiza os registros do cliente selecionado */
  atualizarHistorico(): void {
    if (!this.clienteSelecionado) {
      this.historicoCliente = [];
      return;
    }

    this.historicoCliente = this.db.history
      .filter(
        registro => registro.clientId === this.clienteSelecionado!.id
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /* Mostra o formulário para registrar uma interação */
  mostrarFormularioHistorico(): void {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    this.formHistorico = {
      date: `${ano}-${mes}-${dia}`,
      type: 'Contato',
      text: ''
    };

    this.formularioHistoricoAberto = true;
  }

  /* Cancela o registro de interação */
  cancelarHistorico(): void {
    this.formularioHistoricoAberto = false;
  }

  /* Salva uma interação no histórico do cliente */
  salvarHistorico(): void {
    if (!this.clienteSelecionado) {
      return;
    }

    const descricao = this.formHistorico.text.trim();

    if (!this.formHistorico.date || !descricao) {
      return;
    }

    const registro: RegistroHistorico = {
      id: Date.now(),
      clientId: this.clienteSelecionado.id,
      date: this.formHistorico.date,
      type: this.formHistorico.type,
      text: descricao
    };

    this.db.history.unshift(registro);

    this.salvarDados();
    this.atualizarHistorico();
    this.cancelarHistorico();
  }

  /* ==========================================================================
     8. IMPORTAÇÃO DE SOLICITAÇÕES
     ========================================================================== */

  /* Permite cadastrar um cliente a partir de uma solicitação */
  importarSolicitacao(): void {
    // Recarrega os dados para incluir solicitações recém-cadastradas.
    this.carregarDados();

    if (this.db.requests.length === 0) {
      alert('Não há solicitações cadastradas para importar.');
      return;
    }

    // Apresenta as solicitações disponíveis para escolha.
    const opcoes = this.db.requests.map((solicitacao, indice) => {
      const nome = solicitacao.clientName ||
                   solicitacao.name ||
                   solicitacao.nome ||
                   'Sem nome';

      return `${indice + 1} - ${nome}`;
    }).join('\n');

    const escolha = prompt(
      'Escolha o número da solicitação que deseja importar:\n\n' + opcoes
    );

    if (escolha === null) {
      return;
    }

    const numero = Number(escolha);

    if (
      !Number.isInteger(numero) ||
      numero < 1 ||
      numero > this.db.requests.length
    ) {
      alert('Selecione um número válido.');
      return;
    }

    const solicitacao = this.db.requests[numero - 1];

    const nome = String(
      solicitacao.clientName ||
      solicitacao.name ||
      solicitacao.nome ||
      ''
    ).trim();

    if (!nome) {
      alert('A solicitação selecionada não possui nome de cliente.');
      return;
    }

    // Preenche o cadastro com os dados disponíveis da solicitação.
    this.clienteEmEdicao = null;

    this.formCliente = {
      ...this.criarClienteVazio(),
      name: nome,
      email: String(
        solicitacao.email ||
        solicitacao.clientEmail ||
        ''
      ),
      phone: String(
        solicitacao.phone ||
        solicitacao.clientPhone ||
        solicitacao.telefone ||
        ''
      ),
      lastSessionType: String(
        solicitacao.sessionType ||
        solicitacao.tipoEnsaio ||
        ''
      )
    };

    this.erroFormulario = '';
    this.modalClienteAberto = true;
  }

  /* ==========================================================================
     9. EXPORTAÇÃO DE CLIENTES PARA CSV
     ========================================================================== */

  /* Exporta os clientes cadastrados para uma planilha CSV */
  exportarCSV(): void {
    if (this.db.clients.length === 0) {
      alert('Não há clientes cadastrados para exportar.');
      return;
    }

    const cabecalho = [
      'Nome',
      'E-mail',
      'Telefone',
      'Relacionamento',
      'Último ensaio',
      'Tipo de ensaio',
      'Pagamento',
      'Valor combinado',
      'Observações'
    ];

    const escaparCSV = (valor: unknown): string => {
      const texto = String(valor ?? '');

      // Protege a estrutura do CSV e evita fórmulas em planilhas.
      const seguro = /^[\s]*[=+\-@]/.test(texto)
        ? "'" + texto
        : texto;

      return '"' + seguro.replace(/"/g, '""') + '"';
    };

    const linhas = this.db.clients.map(cliente => [
      cliente.name,
      cliente.email,
      cliente.phone,
      cliente.relationship,
      cliente.lastSession,
      cliente.lastSessionType,
      cliente.paymentStatus,
      cliente.paymentAmount,
      cliente.notes
    ].map(escaparCSV).join(';'));

    const conteudo = [
      cabecalho.map(escaparCSV).join(';'),
      ...linhas
    ].join('\r\n');

    const arquivo = new Blob(
      ['\uFEFF' + conteudo],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'clientes-leticia-gomes.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /* ==========================================================================
     10. MENU LATERAL E NAVEGAÇÃO
     ========================================================================== */

  /* Abre ou fecha o menu lateral */
  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  /* Fecha o menu lateral */
  fecharMenu(): void {
    this.menuAberto = false;
  }

  /* Retorna para a página de login */
  sair(): void {
    this.router.navigate(['/login']);
  }
}
