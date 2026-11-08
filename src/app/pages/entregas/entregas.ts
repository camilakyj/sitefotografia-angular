
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

/* ==========================================================================
   LÓGICA DA PÁGINA DE ENTREGAS - LETÍCIA GOMES FOTOGRAFIA
   ========================================================================== */

/* Define a estrutura dos clientes cadastrados */
interface Cliente {
  id: number | string;
  name: string;
}

/* Define a estrutura dos trabalhos e entregas */
interface Trabalho {
  id: number;
  title: string;
  clientId: string | null;
  clientName: string;
  type: string;
  date: string;
  deadline: string;
  status: string;
  sentDate: string;
  link: string;
  files: string;
  notes: string;
  confirmed: boolean;
}

@Component({
  selector: 'app-entregas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './entregas.html',
  styleUrl: './entregas.css'
})
export class Entregas implements OnInit {

  /* ==========================================================================
     1. ARMAZENAMENTO LOCAL
     ========================================================================== */

  // Utiliza a mesma chave das outras páginas do painel
  private readonly STORAGE_KEY = 'leticia_dashboard_clean_v1';

  // Lista de clientes cadastrados
  clientes: Cliente[] = [];

  // Lista completa de trabalhos
  trabalhos: Trabalho[] = [];

  // Lista de trabalhos após aplicar os filtros
  trabalhosFiltrados: Trabalho[] = [];

  /* ==========================================================================
     2. VARIÁVEIS DA INTERFACE
     ========================================================================== */

  // Controla o menu lateral
  menuAberto = false;

  // Controla a abertura dos modais
  modalAberto = false;
  detalhesAbertos = false;

  // Indica se o formulário está editando um trabalho
  editando = false;

  // Armazena o trabalho selecionado
  trabalhoSelecionado: Trabalho | null = null;

  // Armazena mensagens de erro do formulário
  erroFormulario = '';

  // Ano exibido no rodapé
  anoAtual = new Date().getFullYear();

  /* ==========================================================================
     3. INDICADORES DA PÁGINA
     ========================================================================== */

  totalTrabalhos = 0;
  emProducao = 0;
  prazosProximos = 0;
  entregues = 0;

  /* ==========================================================================
     4. FILTROS DA TABELA
     ========================================================================== */

  busca = '';
  filtroStatus = '';
  filtroPrazo = '';

  /* ==========================================================================
     5. FORMULÁRIO DE CADASTRO E EDIÇÃO
     ========================================================================== */

  // Objeto utilizado pelo formulário HTML
  formTrabalho: Trabalho = this.criarTrabalhoVazio();

  constructor(private router: Router) {}

  /* ==========================================================================
     6. INICIALIZAÇÃO
     ========================================================================== */

  ngOnInit(): void {
    // Carrega os dados existentes no navegador
    this.carregarDados();

    // Atualiza os indicadores e a tabela
    this.atualizarPagina();
  }

  /* ==========================================================================
     7. PERSISTÊNCIA DE DADOS
     ========================================================================== */

  // Recupera os clientes e trabalhos do localStorage
  carregarDados(): void {
    try {
      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      if (!dadosSalvos) {
        this.clientes = [];
        this.trabalhos = [];
        return;
      }

      const dados = JSON.parse(dadosSalvos);

      this.clientes = Array.isArray(dados.clients)
        ? dados.clients.map((cliente: any) => ({
            id: cliente.id,
            name: cliente.name || cliente.nome || cliente.fullName || ''
          }))
        : [];

      this.trabalhos = Array.isArray(dados.deliveries)
        ? dados.deliveries
        : [];

    } catch (erro) {
      console.error('Erro ao carregar dados de entregas:', erro);

      this.clientes = [];
      this.trabalhos = [];
    }
  }

  // Salva os trabalhos sem apagar os dados das outras páginas
  salvarDados(): void {
    try {
      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      // Recupera os dados existentes antes de salvar
      const dadosAtuais = dadosSalvos
        ? JSON.parse(dadosSalvos)
        : {};

      // Atualiza somente a lista de entregas
      const dadosAtualizados = {
        ...dadosAtuais,
        deliveries: this.trabalhos
      };

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(dadosAtualizados)
      );

    } catch (erro) {
      console.error('Erro ao salvar entregas:', erro);
    }
  }

  /* ==========================================================================
     8. FUNÇÕES AUXILIARES
     ========================================================================== */

  // Cria um formulário vazio para cadastrar um novo trabalho
  criarTrabalhoVazio(): Trabalho {
    return {
      id: 0,
      title: '',
      clientId: '',
      clientName: '',
      type: '',
      date: '',
      deadline: '',
      status: 'Produção',
      sentDate: '',
      link: '',
      files: '',
      notes: '',
      confirmed: false
    };
  }

  // Retorna uma data no formato YYYY-MM-DD usando o horário local
  formatarDataLocal(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  // Converte datas para o formato brasileiro
  formatarData(data: string): string {
    if (!data) {
      return 'Sem data';
    }

    const partes = data.split('-');

    if (partes.length !== 3) {
      return data;
    }

    const ano = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const dia = Number(partes[2]);

    const dataFormatada = new Date(ano, mes, dia);

    return dataFormatada.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace('.', '');
  }

  // Retorna a classe CSS correspondente ao status do trabalho
  classeStatus(status: string): string {
    const texto = (status || '').toLowerCase();

    if (texto.includes('produção')) {
      return 'producao';
    }

    if (texto.includes('edição')) {
      return 'edicao';
    }

    if (texto.includes('revisão')) {
      return 'revisao';
    }

    if (texto.includes('pronta')) {
      return 'pronta';
    }

    if (texto.includes('entregue')) {
      return 'entregue';
    }

    return 'producao';
  }

  // Permite somente links HTTP ou HTTPS válidos
  linkSeguro(link: string): string | null {
    if (!link) {
      return null;
    }

    try {
      const endereco = new URL(link);

      if (
        endereco.protocol === 'https:' ||
        endereco.protocol === 'http:'
      ) {
        return endereco.href;
      }

      return null;

    } catch {
      return null;
    }
  }

  /* ==========================================================================
     9. INDICADORES
     ========================================================================== */

  atualizarIndicadores(): void {
    const hoje = new Date();

    const proximaSemana = new Date();
    proximaSemana.setDate(hoje.getDate() + 7);

    const hojeTexto = this.formatarDataLocal(hoje);
    const proximaSemanaTexto = this.formatarDataLocal(proximaSemana);

    // Conta todos os trabalhos cadastrados
    this.totalTrabalhos = this.trabalhos.length;

    // Conta os trabalhos que ainda não foram entregues
    this.emProducao = this.trabalhos.filter(
      trabalho => trabalho.status !== 'Entregue'
    ).length;

    // Conta os trabalhos com prazo nos próximos sete dias
    this.prazosProximos = this.trabalhos.filter(trabalho => {
      return (
        trabalho.deadline &&
        trabalho.deadline >= hojeTexto &&
        trabalho.deadline <= proximaSemanaTexto &&
        trabalho.status !== 'Entregue'
      );
    }).length;

    // Conta os trabalhos entregues
    this.entregues = this.trabalhos.filter(
      trabalho => trabalho.status === 'Entregue'
    ).length;
  }

  /* ==========================================================================
     10. FILTROS DA TABELA
     ========================================================================== */

  filtrarTrabalhos(): void {
    const pesquisa = this.busca.trim().toLowerCase();

    const hoje = new Date();

    const proximaSemana = new Date();
    proximaSemana.setDate(hoje.getDate() + 7);

    const hojeTexto = this.formatarDataLocal(hoje);
    const proximaSemanaTexto = this.formatarDataLocal(proximaSemana);

    this.trabalhosFiltrados = this.trabalhos.filter(trabalho => {

      // Pesquisa por nome do trabalho, cliente ou tipo de ensaio
      const correspondeBusca =
        !pesquisa ||
        (trabalho.title || '').toLowerCase().includes(pesquisa) ||
        (trabalho.clientName || '').toLowerCase().includes(pesquisa) ||
        (trabalho.type || '').toLowerCase().includes(pesquisa);

      // Verifica o filtro de status
      const correspondeStatus =
        !this.filtroStatus ||
        trabalho.status === this.filtroStatus;

      // Verifica o filtro de prazo
      let correspondePrazo = true;

      if (this.filtroPrazo === 'upcoming') {
        correspondePrazo = Boolean(
          trabalho.deadline &&
          trabalho.deadline >= hojeTexto &&
          trabalho.deadline <= proximaSemanaTexto
        );

      } else if (this.filtroPrazo === 'overdue') {
        correspondePrazo = Boolean(
          trabalho.deadline &&
          trabalho.deadline < hojeTexto &&
          trabalho.status !== 'Entregue'
        );

      } else if (this.filtroPrazo === 'no-date') {
        correspondePrazo = !trabalho.deadline;
      }

      return (
        correspondeBusca &&
        correspondeStatus &&
        correspondePrazo
      );
    });
  }

  // Limpa todos os filtros aplicados
  limparFiltros(): void {
    this.busca = '';
    this.filtroStatus = '';
    this.filtroPrazo = '';

    this.filtrarTrabalhos();
  }

  /* ==========================================================================
     11. MODAL DE CADASTRO
     ========================================================================== */

  // Abre o formulário para cadastrar um novo trabalho
  novoTrabalho(): void {
    this.formTrabalho = this.criarTrabalhoVazio();

    this.editando = false;
    this.erroFormulario = '';

    // Atualiza os clientes cadastrados
    this.atualizarClientes();

    this.modalAberto = true;
  }

  // Fecha o formulário
  fecharModal(): void {
    this.modalAberto = false;
    this.editando = false;
    this.erroFormulario = '';
  }

  // Recupera novamente a lista de clientes
  atualizarClientes(): void {
    try {
      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      if (!dadosSalvos) {
        this.clientes = [];
        return;
      }

      const dados = JSON.parse(dadosSalvos);

      this.clientes = Array.isArray(dados.clients)
        ? dados.clients.map((cliente: any) => ({
            id: cliente.id,
            name: cliente.name || cliente.nome || cliente.fullName || ''
          }))
        : [];

    } catch (erro) {
      console.error('Erro ao atualizar clientes:', erro);
    }
  }

  /* ==========================================================================
     12. CADASTRO E EDIÇÃO DE TRABALHOS
     ========================================================================== */

  salvarTrabalho(): void {
    const titulo = this.formTrabalho.title.trim();

    // Valida o nome do trabalho
    if (!titulo) {
      this.erroFormulario = 'Informe o nome do trabalho.';
      return;
    }

    // Localiza o cliente selecionado
    const cliente = this.clientes.find(
      item => String(item.id) === String(this.formTrabalho.clientId)
    );

    // Recupera o nome do cliente
    const nomeCliente = cliente ? cliente.name : '';

    // Monta o objeto que será salvo
    const trabalho: Trabalho = {
      ...this.formTrabalho,
      id: this.editando
        ? this.formTrabalho.id
        : Date.now(),
      title: titulo,
      clientId: this.formTrabalho.clientId
        ? String(this.formTrabalho.clientId)
        : null,
      clientName: nomeCliente,
      type: this.formTrabalho.type.trim(),
      link: this.formTrabalho.link.trim(),
      files: this.formTrabalho.files.trim(),
      notes: this.formTrabalho.notes.trim()
    };

    // Valida o link informado, caso exista
    if (trabalho.link && !this.linkSeguro(trabalho.link)) {
      this.erroFormulario =
        'Informe um link válido começando com http:// ou https://.';
      return;
    }

    if (this.editando) {
      // Atualiza o trabalho existente
      const indice = this.trabalhos.findIndex(
        item => item.id === trabalho.id
      );

      if (indice !== -1) {
        this.trabalhos[indice] = trabalho;
      }

    } else {
      // Adiciona o novo trabalho no início da lista
      this.trabalhos.unshift(trabalho);
    }

    // Salva no localStorage
    this.salvarDados();

    // Fecha o formulário e atualiza a página
    this.fecharModal();
    this.atualizarPagina();
  }

  /* ==========================================================================
     13. MODAL DE DETALHES
     ========================================================================== */

  // Abre a ficha de um trabalho
  abrirDetalhes(trabalho: Trabalho): void {
    this.trabalhoSelecionado = trabalho;
    this.detalhesAbertos = true;
  }

  // Fecha a ficha do trabalho
  fecharDetalhes(): void {
    this.detalhesAbertos = false;
    this.trabalhoSelecionado = null;
  }

  // Abre o formulário para editar um trabalho existente
  editarTrabalho(): void {
    if (!this.trabalhoSelecionado) {
      return;
    }

    // Atualiza a lista de clientes
    this.atualizarClientes();

    // Copia os dados para o formulário
    this.formTrabalho = {
      ...this.trabalhoSelecionado
    };

    this.editando = true;
    this.erroFormulario = '';

    // Fecha os detalhes e abre o formulário
    this.fecharDetalhes();
    this.modalAberto = true;
  }

  // Exclui um trabalho após confirmação
  excluirTrabalho(): void {
    if (!this.trabalhoSelecionado) {
      return;
    }

    const confirmar = confirm(
      'Deseja realmente excluir este trabalho?'
    );

    if (!confirmar) {
      return;
    }

    const id = this.trabalhoSelecionado.id;

    // Remove o trabalho da lista
    this.trabalhos = this.trabalhos.filter(
      trabalho => trabalho.id !== id
    );

    // Atualiza o armazenamento
    this.salvarDados();

    // Fecha os detalhes e atualiza a interface
    this.fecharDetalhes();
    this.atualizarPagina();
  }

  /* ==========================================================================
     14. MENU LATERAL
     ========================================================================== */

  // Abre ou fecha o menu lateral
  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  // Fecha o menu lateral
  fecharMenu(): void {
    this.menuAberto = false;
  }

  // Redireciona para a página de login
  sair(): void {
    this.router.navigate(['/login']);
  }

  /* ==========================================================================
     15. ATUALIZAÇÃO GERAL DA PÁGINA
     ========================================================================== */

  atualizarPagina(): void {
    // Atualiza os indicadores superiores
    this.atualizarIndicadores();

    // Atualiza a tabela conforme os filtros
    this.filtrarTrabalhos();
  }
}
