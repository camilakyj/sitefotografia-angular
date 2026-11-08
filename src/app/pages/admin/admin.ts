
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

// Estrutura dos dados armazenados no navegador
interface DadosPainel {
  requests: { status?: string }[];
  sessions: unknown[];
  deliveries: { status?: string }[];
  finances: { type?: string; amount?: number | string }[];
}

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-admin',
  styleUrl: './admin.css',
  templateUrl: './admin.html',
})
export class Admin implements OnInit {

  // Chave utilizada para acessar os dados salvos no localStorage
  private readonly STORAGE_KEY = 'leticia_dashboard_clean_v1';

  // Valores exibidos nos cards do painel
  novasSolicitacoes = 0;
  ensaiosConfirmados = 0;
  entregasPendentes = 0;
  receitas = 'R$ 0,00';

  // Ano atual exibido no rodapé
  anoAtual = new Date().getFullYear();

  // Controla a abertura e o fechamento do menu lateral
  menuAberto = false;

  // Dados carregados do armazenamento local
  private dados: DadosPainel = {
    requests: [],
    sessions: [],
    deliveries: [],
    finances: []
  };

  constructor(private router: Router) {}

  // Executa quando o componente é inicializado
  ngOnInit(): void {
    this.carregarDados();
    this.atualizarResumo();
  }

  // Carrega os dados salvos no navegador
  carregarDados(): void {
    try {
      const salvo = localStorage.getItem(this.STORAGE_KEY);

      if (salvo) {
        const dadosSalvos = JSON.parse(salvo);

        this.dados = {
          requests: Array.isArray(dadosSalvos.requests) ? dadosSalvos.requests : [],
          sessions: Array.isArray(dadosSalvos.sessions) ? dadosSalvos.sessions : [],
          deliveries: Array.isArray(dadosSalvos.deliveries) ? dadosSalvos.deliveries : [],
          finances: Array.isArray(dadosSalvos.finances) ? dadosSalvos.finances : []
        };
      }

    } catch (erro) {
      console.error('Erro ao carregar dados do painel:', erro);
    }
  }

  // Atualiza os indicadores exibidos na página inicial
  atualizarResumo(): void {

    const solicitacoes = this.dados.requests;
    const ensaios = this.dados.sessions;
    const entregas = this.dados.deliveries;
    const financeiro = this.dados.finances;

    // Conta as solicitações que ainda são novas
    this.novasSolicitacoes = solicitacoes.filter(
      item => item.status === 'Nova'
    ).length;

    // Conta os ensaios cadastrados ou as solicitações confirmadas
    this.ensaiosConfirmados = ensaios.length ||
      solicitacoes.filter(item => item.status === 'Confirmada').length;

    // Conta as entregas que ainda não foram concluídas
    this.entregasPendentes = entregas.filter(
      item => item.status !== 'Entregue'
    ).length;

    // Soma as receitas cadastradas
    const totalReceitas = financeiro
      .filter(item => item.type === 'Entrada' || !item.type)
      .reduce((total, item) => total + (Number(item.amount) || 0), 0);

    // Formata o valor como moeda brasileira
    this.receitas = totalReceitas.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Abre ou fecha o menu lateral
  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  // Fecha o menu lateral
  fecharMenu(): void {
    this.menuAberto = false;
  }

  // Retorna para a página de login
  sair(): void {
    this.router.navigate(['/login']);
  }
}
