
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

/* ==========================================================================
   LÓGICA DA PÁGINA DE AGENDA E PLANNER - LETÍCIA GOMES FOTOGRAFIA
   ========================================================================== */

/* Define a estrutura dos compromissos cadastrados */
interface Evento {
  id: number;
  title: string;
  type: string;
  clientId: string | number | null;
  date: string;
  time: string;
  duration: string;
  notes: string;
  completed: boolean;
}

/* Define os dados dos clientes utilizados na agenda */
interface Cliente {
  id: number;
  name: string;
}

/* Define a estrutura de cada dia exibido no calendário */
interface DiaCalendario {
  numero: number;
  data: string;
  hoje: boolean;
  eventos: Evento[];
}

/* Define a estrutura dos dados armazenados no navegador */
interface BancoLocal {
  requests: any[];
  clients: Cliente[];
  events: Evento[];
  [chave: string]: any;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class Agenda implements OnInit {

  /* ==========================================================================
     1. ARMAZENAMENTO LOCAL
     ========================================================================== */

  // Utiliza a mesma chave das outras páginas administrativas
  private readonly STORAGE_KEY = 'leticia_dashboard_clean_v1';

  // Armazena os dados carregados do navegador
  db: BancoLocal = {
    requests: [],
    clients: [],
    events: []
  };

  // Lista de clientes disponíveis para vincular aos compromissos
  clientes: Cliente[] = [];

  // Lista de compromissos cadastrados
  eventos: Evento[] = [];

  /* ==========================================================================
     2. VARIÁVEIS DA INTERFACE
     ========================================================================== */

  // Controla a abertura do menu lateral
  menuAberto = false;

  // Controla a abertura dos modais
  modalAberto = false;
  detalhesAbertos = false;

  // Indica se o formulário está editando um compromisso existente
  editando = false;

  // Armazena o compromisso selecionado para visualizar seus detalhes
  eventoSelecionado: Evento | null = null;

  // Mensagem de erro do formulário
  erroFormulario = '';

  // Armazena a data utilizada na navegação do calendário
  dataAtual = new Date();

  // Define a visualização inicial como mensal
  visualizacao: 'month' | 'week' | 'day' | 'tasks' = 'month';

  // Dias da semana exibidos no calendário
  diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Lista dos dias que serão exibidos no calendário
  diasCalendario: DiaCalendario[] = [];

  // Eventos exibidos na visualização diária
  eventosDoPeriodo: Evento[] = [];

  // Lista completa de tarefas para o Planner
  tarefasPlanner: Evento[] = [];

  // Lista resumida de tarefas
  tarefasResumo: Evento[] = [];

  // Lista dos próximos compromissos
  proximosCompromissos: Evento[] = [];

  // Indicadores superiores
  totalMes = 0;
  totalEnsaios = 0;
  tarefasPendentes = 0;

  // Informações de data
  tituloPeriodo = '';
  hojeLabel = '';
  anoAtual = new Date().getFullYear();

  // Objeto utilizado pelo formulário de cadastro e edição
  formEvento: Evento = this.criarEventoVazio();

  /* ==========================================================================
     3. INICIALIZAÇÃO DA PÁGINA
     ========================================================================== */

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Carrega os dados existentes no localStorage
    this.carregarDados();

    // Atualiza a data de hoje exibida na página
    this.hojeLabel = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Atualiza todas as informações da agenda
    this.atualizarPagina();
  }

  /* ==========================================================================
     4. CARREGAMENTO E SALVAMENTO DOS DADOS
     ========================================================================== */

  // Recupera os dados salvos no navegador
  carregarDados(): void {
    try {
      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);

        this.db = {
          ...dados,
          requests: Array.isArray(dados.requests) ? dados.requests : [],
          clients: Array.isArray(dados.clients) ? dados.clients : [],
          events: Array.isArray(dados.events) ? dados.events : []
        };
      }

    } catch (erro) {
      console.error('Erro ao carregar os dados da agenda:', erro);
    }

    this.clientes = this.db.clients;
    this.eventos = this.db.events;
  }

  // Salva somente os eventos atualizados, preservando os demais dados
  salvarDados(): void {
    try {
      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      const dadosAtuais = dadosSalvos ? JSON.parse(dadosSalvos) : {};

      const dadosAtualizados = {
        ...dadosAtuais,
        events: this.eventos
      };

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(dadosAtualizados)
      );

      this.db = {
        ...dadosAtualizados,
        requests: Array.isArray(dadosAtualizados.requests)
          ? dadosAtualizados.requests : [],
        clients: Array.isArray(dadosAtualizados.clients)
          ? dadosAtualizados.clients : [],
        events: this.eventos
      };

    } catch (erro) {
      console.error('Erro ao salvar os compromissos:', erro);
    }
  }

  /* ==========================================================================
     5. FUNÇÕES AUXILIARES
     ========================================================================== */

  // Retorna a data no formato YYYY-MM-DD, utilizando o horário local
  formatarDataLocal(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  // Cria um formulário vazio com os valores iniciais
  criarEventoVazio(): Evento {
    return {
      id: 0,
      title: '',
      type: 'shoot',
      clientId: '',
      date: this.formatarDataLocal(new Date()),
      time: '09:00',
      duration: '60',
      notes: '',
      completed: false
    };
  }

  // Converte o tipo do compromisso para um nome em português
  nomeTipo(tipo: string): string {
    const tipos: { [chave: string]: string } = {
      shoot: 'Ensaio',
      meeting: 'Reunião',
      deadline: 'Prazo de edição',
      task: 'Tarefa'
    };

    return tipos[tipo] || 'Compromisso';
  }

  // Formata a duração de um compromisso
  formatarDuracao(duracao: string): string {
    if (String(duracao) === '0') {
      return 'Dia inteiro';
    }

    return `${duracao} minutos`;
  }

  // Retorna o nome do mês e o ano
  formatarMes(data: Date): string {
    return data.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  }

  /* ==========================================================================
     6. ATUALIZAÇÃO DOS INDICADORES
     ========================================================================== */

  atualizarIndicadores(): void {
    const mes = this.dataAtual.getMonth();
    const ano = this.dataAtual.getFullYear();

    // Conta os compromissos do mês selecionado
    this.totalMes = this.eventos.filter(evento => {
      const data = new Date(evento.date + 'T00:00:00');

      return data.getMonth() === mes &&
             data.getFullYear() === ano;
    }).length;

    // Conta todos os ensaios cadastrados
    this.totalEnsaios = this.eventos.filter(
      evento => evento.type === 'shoot'
    ).length;

    // Conta as tarefas ainda não concluídas
    this.tarefasPendentes = this.eventos.filter(
      evento => evento.type === 'task' && !evento.completed
    ).length;
  }

  /* ==========================================================================
     7. PRÓXIMOS COMPROMISSOS
     ========================================================================== */

  atualizarProximosCompromissos(): void {
    const hoje = this.formatarDataLocal(new Date());

    this.proximosCompromissos = this.eventos
      .filter(evento => evento.date >= hoje)
      .sort((a, b) => {
        const comparacaoData = a.date.localeCompare(b.date);

        if (comparacaoData !== 0) {
          return comparacaoData;
        }

        return a.time.localeCompare(b.time);
      })
      .slice(0, 4);
  }

  /* ==========================================================================
     8. LISTA DE TAREFAS
     ========================================================================== */

  atualizarTarefas(): void {
    // Lista todas as tarefas para a visualização Planner
    this.tarefasPlanner = this.eventos
      .filter(evento => evento.type === 'task')
      .sort((a, b) => a.date.localeCompare(b.date));

    // Exibe somente quatro tarefas no resumo inferior
    this.tarefasResumo = this.tarefasPlanner.slice(0, 4);
  }

  // Alterna o estado de conclusão de uma tarefa
  alternarTarefa(tarefa: Evento): void {
    const evento = this.eventos.find(item => item.id === tarefa.id);

    if (evento) {
      evento.completed = !evento.completed;

      this.salvarDados();
      this.atualizarPagina();
    }
  }

  /* ==========================================================================
     9. CALENDÁRIO MENSAL
     ========================================================================== */

  gerarCalendarioMensal(): void {
    const ano = this.dataAtual.getFullYear();
    const mes = this.dataAtual.getMonth();

    // Identifica o primeiro dia da semana do mês
    const primeiroDia = new Date(ano, mes, 1).getDay();

    // Descobre a quantidade de dias do mês
    const quantidadeDias = new Date(ano, mes + 1, 0).getDate();

    const hoje = this.formatarDataLocal(new Date());

    this.diasCalendario = [];

    // Adiciona os espaços vazios antes do primeiro dia do mês
    for (let i = 0; i < primeiroDia; i++) {
      this.diasCalendario.push({
        numero: 0,
        data: '',
        hoje: false,
        eventos: []
      });
    }

    // Adiciona os dias do mês e seus compromissos
    for (let dia = 1; dia <= quantidadeDias; dia++) {
      const data = this.formatarDataLocal(new Date(ano, mes, dia));

      const eventosDia = this.eventos.filter(
        evento => evento.date === data
      );

      this.diasCalendario.push({
        numero: dia,
        data: data,
        hoje: data === hoje,
        eventos: eventosDia
      });
    }
  }

  /* ==========================================================================
     10. CALENDÁRIO SEMANAL
     ========================================================================== */

  gerarCalendarioSemanal(): void {
    this.diasCalendario = [];

    const hoje = this.formatarDataLocal(new Date());

    // Copia a data selecionada
    const inicioSemana = new Date(this.dataAtual);

    // Volta até o domingo da semana selecionada
    inicioSemana.setDate(
      inicioSemana.getDate() - inicioSemana.getDay()
    );

    // Gera os sete dias da semana
    for (let i = 0; i < 7; i++) {
      const dataDia = new Date(inicioSemana);

      dataDia.setDate(inicioSemana.getDate() + i);

      const data = this.formatarDataLocal(dataDia);

      this.diasCalendario.push({
        numero: dataDia.getDate(),
        data: data,
        hoje: data === hoje,
        eventos: this.eventos.filter(
          evento => evento.date === data
        )
      });
    }
  }

  /* ==========================================================================
     11. CALENDÁRIO DIÁRIO
     ========================================================================== */

  gerarCalendarioDiario(): void {
    const data = this.formatarDataLocal(this.dataAtual);

    this.eventosDoPeriodo = this.eventos
      .filter(evento => evento.date === data)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  /* ==========================================================================
     12. NAVEGAÇÃO DO CALENDÁRIO
     ========================================================================== */

  // Alterna entre Mês, Semana, Dia e Planner
  alterarVisualizacao(
    modo: 'month' | 'week' | 'day' | 'tasks'
  ): void {
    this.visualizacao = modo;
    this.atualizarPagina();
  }

  // Volta para o período anterior
  periodoAnterior(): void {
    const data = new Date(this.dataAtual);

    if (this.visualizacao === 'month') {
      // Usa o primeiro dia para evitar saltos em meses mais curtos
      data.setDate(1);
      data.setMonth(data.getMonth() - 1);

    } else if (this.visualizacao === 'week') {
      data.setDate(data.getDate() - 7);

    } else if (this.visualizacao === 'day') {
      data.setDate(data.getDate() - 1);

    } else {
      data.setDate(1);
      data.setMonth(data.getMonth() - 1);
    }

    this.dataAtual = data;
    this.atualizarPagina();
  }

  // Avança para o próximo período
  proximoPeriodo(): void {
    const data = new Date(this.dataAtual);

    if (this.visualizacao === 'month') {
      data.setDate(1);
      data.setMonth(data.getMonth() + 1);

    } else if (this.visualizacao === 'week') {
      data.setDate(data.getDate() + 7);

    } else if (this.visualizacao === 'day') {
      data.setDate(data.getDate() + 1);

    } else {
      data.setDate(1);
      data.setMonth(data.getMonth() + 1);
    }

    this.dataAtual = data;
    this.atualizarPagina();
  }

  // Retorna para a data atual
  irParaHoje(): void {
    this.dataAtual = new Date();
    this.atualizarPagina();
  }

  // Atualiza o título conforme a visualização selecionada
  atualizarTituloPeriodo(): void {
    if (this.visualizacao === 'month' ||
        this.visualizacao === 'tasks') {
      this.tituloPeriodo = this.formatarMes(this.dataAtual);

    } else if (this.visualizacao === 'day') {
      this.tituloPeriodo = this.dataAtual.toLocaleDateString(
        'pt-BR',
        {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }
      );

    } else {
      const inicio = new Date(this.dataAtual);

      inicio.setDate(inicio.getDate() - inicio.getDay());

      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);

      this.tituloPeriodo =
        `${inicio.toLocaleDateString('pt-BR')} - ` +
        `${fim.toLocaleDateString('pt-BR')}`;
    }
  }

  /* ==========================================================================
     13. MODAL DE CADASTRO
     ========================================================================== */

  // Abre o formulário para cadastrar um novo compromisso
  novoCompromisso(): void {
    this.formEvento = this.criarEventoVazio();
    this.editando = false;
    this.erroFormulario = '';

    // Atualiza a lista de clientes cadastrados
    this.atualizarClientes();

    this.modalAberto = true;
  }

  // Abre o formulário já configurado para uma nova tarefa
  novaTarefa(): void {
    this.novoCompromisso();
    this.formEvento.type = 'task';
  }

  // Fecha o formulário de cadastro ou edição
  fecharModal(): void {
    this.modalAberto = false;
    this.editando = false;
    this.erroFormulario = '';
  }

  // Recupera a lista atual de clientes
  atualizarClientes(): void {
    try {
      const dados = localStorage.getItem(this.STORAGE_KEY);

      if (dados) {
        const banco = JSON.parse(dados);

        this.clientes = Array.isArray(banco.clients)
          ? banco.clients
          : [];
      }
    } catch (erro) {
      console.error('Erro ao atualizar clientes:', erro);
    }
  }

  /* ==========================================================================
     14. SALVAMENTO DOS COMPROMISSOS
     ========================================================================== */

  salvarCompromisso(): void {
    const titulo = this.formEvento.title.trim();
    const data = this.formEvento.date;

    // Valida os campos obrigatórios
    if (!titulo || !data) {
      this.erroFormulario = 'Preencha o título e a data do compromisso.';
      return;
    }

    // Monta o objeto que será armazenado
    const evento: Evento = {
      ...this.formEvento,
      title: titulo,
      notes: this.formEvento.notes.trim(),
      id: this.editando
        ? this.formEvento.id
        : Date.now()
    };

    if (this.editando) {
      // Atualiza o compromisso existente
      const indice = this.eventos.findIndex(
        item => item.id === evento.id
      );

      if (indice !== -1) {
        this.eventos[indice] = evento;
      }

    } else {
      // Adiciona o novo compromisso
      this.eventos.push(evento);
    }

    // Salva no navegador
    this.salvarDados();

    // Fecha o modal e atualiza a interface
    this.fecharModal();
    this.atualizarPagina();
  }

  /* ==========================================================================
     15. MODAL DE DETALHES
     ========================================================================== */

  // Exibe os detalhes de um compromisso selecionado
  abrirDetalhes(evento: Evento): void {
    this.eventoSelecionado = evento;
    this.detalhesAbertos = true;
  }

  // Fecha o modal de detalhes
  fecharDetalhes(): void {
    this.detalhesAbertos = false;
    this.eventoSelecionado = null;
  }

  // Abre o formulário para editar o compromisso selecionado
  editarCompromisso(): void {
    if (!this.eventoSelecionado) {
      return;
    }

    // Atualiza a lista de clientes antes de editar
    this.atualizarClientes();

    // Copia os dados do compromisso para o formulário
    this.formEvento = {
      ...this.eventoSelecionado
    };

    this.editando = true;
    this.erroFormulario = '';
    this.fecharDetalhes();
    this.modalAberto = true;
  }

  // Exclui um compromisso após confirmação
  excluirCompromisso(): void {
    if (!this.eventoSelecionado) {
      return;
    }

    const confirmar = confirm(
      'Deseja excluir este compromisso?'
    );

    if (!confirmar) {
      return;
    }

    const id = this.eventoSelecionado.id;

    this.eventos = this.eventos.filter(
      evento => evento.id !== id
    );

    this.salvarDados();
    this.fecharDetalhes();
    this.atualizarPagina();
  }

  /* ==========================================================================
     16. MENU LATERAL
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
     17. ATUALIZAÇÃO GERAL DA PÁGINA
     ========================================================================== */

  atualizarPagina(): void {
    // Atualiza os indicadores
    this.atualizarIndicadores();

    // Atualiza os próximos compromissos
    this.atualizarProximosCompromissos();

    // Atualiza as tarefas
    this.atualizarTarefas();

    // Atualiza o título do período
    this.atualizarTituloPeriodo();

    // Atualiza o calendário conforme a visualização
    if (this.visualizacao === 'month') {
      this.gerarCalendarioMensal();

    } else if (this.visualizacao === 'week') {
      this.gerarCalendarioSemanal();

    } else if (this.visualizacao === 'day') {
      this.gerarCalendarioDiario();
    }
  }
}
