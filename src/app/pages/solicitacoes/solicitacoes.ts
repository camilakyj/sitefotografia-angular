
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

// Estrutura de uma solicitação
interface Solicitacao {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  desiredDate: string;
  notes: string;
  status: string;
  proposalStatus: string;
  proposalAmount: number;
  proposalValidity: string;
  proposalConditions: string;
}

// Estrutura dos dados salvos no navegador
interface DadosPainel {
  requests: Solicitacao[];
  sessions: unknown[];
  deliveries: unknown[];
  tasks: unknown[];
  finances: unknown[];
  clients: unknown[];
  [key: string]: unknown;
}

@Component({
  selector: 'app-solicitacoes',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './solicitacoes.html',
  styleUrl: './solicitacoes.css'
})
export class Solicitacoes implements OnInit {

  // Chave utilizada para acessar os dados salvos no navegador
  private readonly STORAGE_KEY = 'leticia_dashboard_clean_v1';

  // Armazena todas as solicitações
  solicitacoes: Solicitacao[] = [];

  // Armazena as solicitações depois da aplicação dos filtros
  solicitacoesFiltradas: Solicitacao[] = [];

  // Valores dos filtros da tabela
  termoBusca = '';
  filtroStatus = '';
  filtroProposta = '';

  // Valores exibidos nos indicadores
  countNew = 0;
  countNegotiation = 0;
  countProposals = 0;
  countConfirmed = 0;

  // Controla a abertura do menu lateral
  menuAberto = false;

  // Controla a abertura do modal
  modalAberto = false;
  editando = false;

  // Mensagem de erro do formulário
  formError = '';

  // Ano atual exibido no rodapé
  anoAtual = new Date().getFullYear();

  // Dados completos do painel
  // Mantemos os outros dados para não apagar informações de outras páginas
  private dados: DadosPainel = {
    requests: [],
    sessions: [],
    deliveries: [],
    tasks: [],
    finances: [],
    clients: []
  };

  // Dados iniciais do formulário
  solicitacaoForm: Solicitacao = this.novaSolicitacaoVazia();

  constructor(private router: Router) {}

  // Executado quando a página é carregada
  ngOnInit(): void {
    this.carregarDados();
    this.atualizarResumo();
    this.aplicarFiltros();
  }

  // Cria um formulário vazio com os valores padrão
  novaSolicitacaoVazia(): Solicitacao {
    return {
      id: 0,
      name: '',
      email: '',
      phone: '',
      service: '',
      desiredDate: '',
      notes: '',
      status: 'Nova',
      proposalStatus: 'Não elaborada',
      proposalAmount: 0,
      proposalValidity: '',
      proposalConditions: ''
    };
  }

  // Carrega os dados armazenados no navegador
  carregarDados(): void {
    try {
      const salvo = localStorage.getItem(this.STORAGE_KEY);

      if (salvo) {
        const dadosSalvos = JSON.parse(salvo);

        this.dados = {
          ...this.dados,
          ...dadosSalvos,
          requests: Array.isArray(dadosSalvos.requests)
            ? dadosSalvos.requests
            : [],
          sessions: Array.isArray(dadosSalvos.sessions)
            ? dadosSalvos.sessions
            : [],
          deliveries: Array.isArray(dadosSalvos.deliveries)
            ? dadosSalvos.deliveries
            : [],
          tasks: Array.isArray(dadosSalvos.tasks)
            ? dadosSalvos.tasks
            : [],
          finances: Array.isArray(dadosSalvos.finances)
            ? dadosSalvos.finances
            : [],
          clients: Array.isArray(dadosSalvos.clients)
            ? dadosSalvos.clients
            : []
        };
      }

      this.solicitacoes = this.dados.requests;

    } catch (erro) {
      console.error('Erro ao carregar solicitações:', erro);
    }
  }

  // Salva os dados no armazenamento do navegador
  salvarDados(): void {
    this.dados.requests = this.solicitacoes;

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(this.dados)
    );
  }

  // Atualiza os números dos indicadores
  atualizarResumo(): void {
    this.countNew = this.solicitacoes.filter(
      item => item.status === 'Nova'
    ).length;

    this.countNegotiation = this.solicitacoes.filter(
      item => item.status === 'Em negociação'
    ).length;

    this.countProposals = this.solicitacoes.filter(
      item =>
        item.proposalStatus === 'Enviada' ||
        item.status === 'Proposta enviada'
    ).length;

    this.countConfirmed = this.solicitacoes.filter(
      item => item.status === 'Confirmada'
    ).length;
  }

  // Aplica os filtros de pesquisa na tabela
  aplicarFiltros(): void {
    const busca = this.termoBusca.toLowerCase();

    this.solicitacoesFiltradas = this.solicitacoes.filter(item => {

      const correspondeBusca =
        !busca ||
        item.name.toLowerCase().includes(busca) ||
        item.email.toLowerCase().includes(busca) ||
        item.service.toLowerCase().includes(busca);

      const correspondeStatus =
        !this.filtroStatus ||
        item.status === this.filtroStatus;

      const correspondeProposta =
        !this.filtroProposta ||
        item.proposalStatus === this.filtroProposta;

      return correspondeBusca &&
        correspondeStatus &&
        correspondeProposta;
    });
  }

  // Limpa todos os filtros
  limparFiltros(): void {
    this.termoBusca = '';
    this.filtroStatus = '';
    this.filtroProposta = '';

    this.aplicarFiltros();
  }

  // Formata a data para o padrão brasileiro
  formatDate(dateStr?: string): string {
    if (!dateStr) {
      return 'Data não informada';
    }

    const partes = dateStr.split('-').map(Number);

    const data = new Date(
      partes[0],
      partes[1] - 1,
      partes[2]
    );

    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
  }

  // Define a classe visual de acordo com o status
  getStatusClass(status: string): string {
    const valor = (status || '').toLowerCase();

    if (valor.includes('negociaç')) {
      return 'negociacao';
    }

    if (valor.includes('proposta')) {
      return 'proposta';
    }

    if (valor.includes('confirmad')) {
      return 'confirmada';
    }

    if (valor.includes('encerrada')) {
      return 'encerrada';
    }

    return 'nova';
  }

  // Abre o modal para cadastrar uma nova solicitação
  novaSolicitacao(): void {
    this.solicitacaoForm = this.novaSolicitacaoVazia();
    this.editando = false;
    this.formError = '';
    this.modalAberto = true;
  }

  // Abre o modal preenchido para editar uma solicitação
  editarSolicitacao(item: Solicitacao): void {
    this.solicitacaoForm = { ...item };
    this.editando = true;
    this.formError = '';
    this.modalAberto = true;
  }

  // Salva uma solicitação nova ou atualiza uma existente
  salvarSolicitacao(): void {

    // Verifica se os campos obrigatórios foram preenchidos
    if (
      !this.solicitacaoForm.name.trim() ||
      !this.solicitacaoForm.service.trim()
    ) {
      this.formError = 'Preencha o nome do cliente e o tipo de ensaio.';
      return;
    }

    if (this.editando) {

      // Localiza a solicitação que está sendo editada
      const indice = this.solicitacoes.findIndex(
        item => item.id === this.solicitacaoForm.id
      );

      if (indice !== -1) {
        this.solicitacoes[indice] = { ...this.solicitacaoForm };
      }

    } else {

      // Gera um identificador e adiciona a nova solicitação no início da lista
      this.solicitacaoForm.id = Date.now();

      this.solicitacoes.unshift({
        ...this.solicitacaoForm
      });
    }

    this.salvarDados();
    this.fecharModal();
    this.atualizarResumo();
    this.aplicarFiltros();
  }

  // Exclui uma solicitação após confirmação
  excluirSolicitacao(id: number): void {
    const confirmar = window.confirm(
      'Tem certeza de que deseja excluir esta solicitação?'
    );

    if (confirmar) {
      this.solicitacoes = this.solicitacoes.filter(
        item => item.id !== id
      );

      this.salvarDados();
      this.atualizarResumo();
      this.aplicarFiltros();
    }
  }

  // Fecha o modal e limpa o formulário
  fecharModal(): void {
    this.modalAberto = false;
    this.editando = false;
    this.formError = '';
    this.solicitacaoForm = this.novaSolicitacaoVazia();
  }

  // Abre ou fecha o menu lateral
  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  // Fecha o menu lateral
  fecharMenu(): void {
    this.menuAberto = false;
  }

  // Sai da área administrativa e retorna ao login
  sair(): void {
    this.router.navigate(['/login']);
  }
}
