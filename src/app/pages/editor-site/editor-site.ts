
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

/* ==========================================================================
   LÓGICA DA PÁGINA EDITAR SITE - LETÍCIA GOMES FOTOGRAFIA
   ========================================================================== */

/* Define a estrutura de cada fotografia do portfólio */
interface Fotografia {
  id: number;
  title: string;
  category: string;
  url: string;
}

/* Define a estrutura dos conteúdos editáveis do site */
interface ConteudoSite {
  homeEyebrow: string;
  homeQuote: string;
  homeButton: string;
  homeButtonLink: string;
  portfolioHeading: string;
  portfolioDescription: string;
  aboutHeadingHome: string;
  aboutHeading: string;
  aboutSubtitle: string;
  aboutBiography: string;
  processHeading: string;
  processDescription: string;
  contactEmail: string;
  contactInstagram: string;
  footerDescription: string;
  portfolioPhotos: Fotografia[];
  lastPublished: string | null;
}

/* Define a estrutura dos dados gerais do painel */
interface DadosPainel {
  siteContent: ConteudoSite;
  [chave: string]: any;
}

@Component({
  selector: 'app-editor-site',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './editor-site.html',
  styleUrl: './editor-site.css'
})
export class EditorSite implements OnInit {

  /* ==========================================================================
     1. PERSISTÊNCIA DE DADOS
     ========================================================================== */

  // Chave utilizada pelas páginas do painel administrativo
  private readonly STORAGE_KEY = 'leticia_dashboard_clean_v1';

  // Armazena os dados gerais do painel
  private db: DadosPainel = {
    siteContent: this.obterConteudoPadrao()
  };

  // Armazena os conteúdos exibidos nos campos do editor
  conteudo: ConteudoSite = this.obterConteudoPadrao();

  /* ==========================================================================
     2. CONTROLE DA INTERFACE
     ========================================================================== */

  // Controla a abertura do menu lateral
  menuAberto = false;

  // Controla a aba selecionada
  abaAtiva = 'home';

  // Controla a abertura do modal de publicação
  modalPublicacaoAberto = false;

  // Armazena mensagens de erro
  mensagemFeedback = '';

  // Exibe o ano atual no rodapé
  anoAtual = new Date().getFullYear();

  /* ==========================================================================
     3. STATUS DE PUBLICAÇÃO
     ========================================================================== */

  // Armazena a data da última publicação
  ultimaPublicacao: string | null = null;

  // Texto apresentado no indicador de publicação
  statusPublicacao = 'Nenhuma alteração publicada recentemente';

  // Texto apresentado no indicador de salvamento
  ultimoSalvamento = 'Última alteração não salva';

  /* ==========================================================================
     4. REFERÊNCIA À PRÉ-VISUALIZAÇÃO
     ========================================================================== */

  // Permite acessar o iframe declarado no HTML
  @ViewChild('visualizacaoSite')
  visualizacaoSite?: ElementRef<HTMLIFrameElement>;

  constructor(private router: Router) {}

  /* ==========================================================================
     5. INICIALIZAÇÃO
     ========================================================================== */

  ngOnInit(): void {

    // Recupera os dados salvos no navegador
    this.db = this.carregarDados();

    // Preenche os campos do editor
    this.preencherFormulario();

    // Atualiza o indicador de publicação
    this.atualizarStatusPublicacao();
  }

  /* ==========================================================================
     6. CONTEÚDO PADRÃO DO SITE
     ========================================================================== */

  // Retorna os textos e fotografias iniciais do site
  obterConteudoPadrao(): ConteudoSite {
    return {
      homeEyebrow: 'FOTOGRAFIA DE AFETO E LEVEZA',

      homeQuote:
        'Capturando sorrisos, abraços e histórias que merecem ser lembradas para sempre.',

      homeButton: 'Solicitar proposta',

      homeButtonLink: '/solicitacoes',

      portfolioHeading: 'Portfólio em destaque',

      portfolioDescription:
        'Uma seleção especial de ensaios e momentos inesquecíveis.',

      aboutHeadingHome: 'Sobre Letícia Gomes',

      aboutHeading: 'Olá, sou a Letícia',

      aboutSubtitle:
        'Fotógrafa especialista em retratos e momentos em família.',

      aboutBiography:
        'Acredito que a fotografia é a arte de congelar o tempo e guardar o sentimento de cada abraço. Trabalho com um olhar sensível, acolhedor e focado na luz natural.',

      processHeading: 'Como funciona',

      processDescription:
        'Do primeiro contato ao envio das suas memórias com carinho.',

      contactEmail: 'contato@leticiagomes.com',

      contactInstagram:
        'https://www.instagram.com/leticiagomesfotografia',

      footerDescription:
        'Relacionamento com cuidado, em cada detalhe.',

      portfolioPhotos: [
        {
          id: 1,
          title: 'Ensaio Família',
          category: 'Família',
          url: '/imagens/foto1.jpg'
        },
        {
          id: 2,
          title: 'Retrato Individual',
          category: 'Retrato',
          url: '/imagens/foto2.jpg'
        }
      ],

      lastPublished: null
    };
  }

  /* ==========================================================================
     7. CARREGAMENTO DOS DADOS
     ========================================================================== */

  // Recupera os dados existentes no localStorage
  carregarDados(): DadosPainel {

    try {

      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      // Caso ainda não existam dados, utiliza o conteúdo padrão
      if (!dadosSalvos) {
        return {
          siteContent: this.obterConteudoPadrao(),
          events: [],
          requests: [],
          clients: [],
          deliveries: [],
          finances: []
        };
      }

      // Converte o JSON em objeto JavaScript
      const dados = JSON.parse(dadosSalvos);

      // Verifica se o conteúdo do site já existe
      if (!dados.siteContent) {
        dados.siteContent = this.obterConteudoPadrao();
      }

      // Garante que a lista de fotografias seja um array
      if (!Array.isArray(dados.siteContent.portfolioPhotos)) {
        dados.siteContent.portfolioPhotos = [];
      }

      return dados;

    } catch (erro) {

      console.error('Erro ao carregar dados do site:', erro);

      return {
        siteContent: this.obterConteudoPadrao(),
        events: [],
        requests: [],
        clients: [],
        deliveries: [],
        finances: []
      };
    }
  }

  /* ==========================================================================
     8. SALVAMENTO DOS DADOS
     ========================================================================== */

  // Salva o conteúdo do site sem apagar informações de outras páginas
  salvarDados(): boolean {

    try {

      // Recupera a versão mais recente do armazenamento
      const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);

      const dadosAtuais = dadosSalvos
        ? JSON.parse(dadosSalvos)
        : {};

      // Atualiza somente o conteúdo do site
      const dadosAtualizados = {
        ...dadosAtuais,
        siteContent: this.db.siteContent
      };

      // Armazena os dados atualizados
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(dadosAtualizados)
      );

      return true;

    } catch (erro) {

      console.error('Erro ao salvar conteúdo do site:', erro);

      this.mensagemFeedback =
        'Não foi possível salvar as alterações.';

      return false;
    }
  }

  /* ==========================================================================
     9. PREENCHIMENTO DOS CAMPOS
     ========================================================================== */

  // Preenche o formulário com os conteúdos armazenados
  preencherFormulario(): void {

    const conteudoPadrao = this.obterConteudoPadrao();

    // Copia os valores para não modificar os dados salvos diretamente
    this.conteudo = {
      ...conteudoPadrao,
      ...this.db.siteContent,

      // Cria uma cópia independente da lista de fotografias
      portfolioPhotos: (
        this.db.siteContent.portfolioPhotos || []
      ).map(foto => ({ ...foto }))
    };

    this.mensagemFeedback = '';
  }

  /* ==========================================================================
     10. STATUS DA PUBLICAÇÃO
     ========================================================================== */

  // Atualiza o indicador visual da última publicação
  atualizarStatusPublicacao(): void {

    this.ultimaPublicacao =
      this.db.siteContent.lastPublished || null;

    if (this.ultimaPublicacao) {

      const data = new Date(this.ultimaPublicacao);

      const dataFormatada = data.toLocaleDateString('pt-BR');

      const horarioFormatado = data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      this.statusPublicacao =
        `Versão publicada em ${dataFormatada} às ${horarioFormatado}`;

    } else {

      this.statusPublicacao =
        'Nenhuma alteração publicada recentemente';
    }
  }

  /* ==========================================================================
     11. NAVEGAÇÃO ENTRE AS ABAS
     ========================================================================== */

  // Exibe a seção selecionada no editor
  selecionarAba(aba: string): void {

    this.abaAtiva = aba;

    // Limpa mensagens anteriores
    this.mensagemFeedback = '';
  }

  /* ==========================================================================
     12. ADICIONAR FOTOGRAFIA
     ========================================================================== */

  // Adiciona uma nova fotografia ao portfólio
  adicionarFoto(): void {

    // Solicita o título da fotografia
    const titulo = prompt(
      'Título da fotografia:',
      'Novo Ensaio'
    );

    // Interrompe caso o usuário cancele ou deixe vazio
    if (!titulo || !titulo.trim()) {
      return;
    }

    // Solicita a categoria da fotografia
    const categoria = prompt(
      'Categoria:',
      'Retrato'
    );

    // Cria uma nova fotografia
    const novaFoto: Fotografia = {
      id: Date.now(),
      title: titulo.trim(),
      category: categoria?.trim() || 'Geral',
      url: '/imagens/foto1.jpg'
    };

    // Adiciona a fotografia ao formulário
    this.conteudo.portfolioPhotos.push(novaFoto);

    // A alteração permanece no formulário até salvar ou publicar
    this.ultimoSalvamento = 'Alterações ainda não salvas';
  }

  /* ==========================================================================
     13. ALTERAR A ORDEM DAS FOTOGRAFIAS
     ========================================================================== */

  // Move uma fotografia para cima ou para baixo
  moverFoto(indice: number, direcao: number): void {

    const fotografias = this.conteudo.portfolioPhotos;

    // Calcula a nova posição
    const novaPosicao = indice + direcao;

    // Verifica se a nova posição é válida
    if (
      novaPosicao < 0 ||
      novaPosicao >= fotografias.length
    ) {
      return;
    }

    // Guarda temporariamente a fotografia atual
    const fotografiaAtual = fotografias[indice];

    // Troca a posição das fotografias
    fotografias[indice] = fotografias[novaPosicao];

    fotografias[novaPosicao] = fotografiaAtual;

    // Cria um novo array para atualizar a exibição
    this.conteudo.portfolioPhotos = [...fotografias];

    this.ultimoSalvamento = 'Alterações ainda não salvas';
  }

  /* ==========================================================================
     14. REMOVER FOTOGRAFIA
     ========================================================================== */

  // Remove uma fotografia após confirmação
  removerFoto(indice: number): void {

    const confirmar = confirm(
      'Deseja remover esta fotografia do portfólio?'
    );

    if (!confirmar) {
      return;
    }

    // Remove a fotografia da lista
    this.conteudo.portfolioPhotos.splice(indice, 1);

    // Atualiza o array exibido no HTML
    this.conteudo.portfolioPhotos = [
      ...this.conteudo.portfolioPhotos
    ];

    this.ultimoSalvamento = 'Alterações ainda não salvas';
  }

  /* ==========================================================================
     15. COLETAR DADOS DO FORMULÁRIO
     ========================================================================== */

  // Organiza os dados preenchidos para o salvamento
  coletarDadosFormulario(): ConteudoSite {

    return {

      ...this.conteudo,

      homeEyebrow: this.conteudo.homeEyebrow.trim(),

      homeQuote: this.conteudo.homeQuote.trim(),

      homeButton: this.conteudo.homeButton.trim(),

      homeButtonLink: this.conteudo.homeButtonLink.trim(),

      portfolioHeading: this.conteudo.portfolioHeading.trim(),

      portfolioDescription:
        this.conteudo.portfolioDescription.trim(),

      aboutHeadingHome: this.conteudo.aboutHeadingHome.trim(),

      aboutHeading: this.conteudo.aboutHeading.trim(),

      aboutSubtitle: this.conteudo.aboutSubtitle.trim(),

      aboutBiography: this.conteudo.aboutBiography.trim(),

      processHeading: this.conteudo.processHeading.trim(),

      processDescription:
        this.conteudo.processDescription.trim(),

      contactEmail: this.conteudo.contactEmail.trim(),

      contactInstagram: this.conteudo.contactInstagram.trim(),

      footerDescription:
        this.conteudo.footerDescription.trim(),

      portfolioPhotos:
        this.conteudo.portfolioPhotos.map(foto => ({ ...foto })),

      // Preserva a data da última publicação
      lastPublished: this.db.siteContent.lastPublished || null
    };
  }

  /* ==========================================================================
     16. SALVAR RASCUNHO
     ========================================================================== */

  // Salva os dados preenchidos sem alterar a data de publicação
  salvarRascunho(): void {

    // Guarda a versão anterior para restaurar se houver erro
    const conteudoAnterior = this.db.siteContent;

    // Atualiza os dados do site
    this.db.siteContent = this.coletarDadosFormulario();

    // Salva os dados no navegador
    const salvou = this.salvarDados();

    if (!salvou) {
      this.db.siteContent = conteudoAnterior;
      return;
    }

    // Atualiza o horário do último salvamento
    const horario = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    this.ultimoSalvamento = `Rascunho salvo às ${horario}`;

    this.mensagemFeedback = '';

    alert('Rascunho salvo com sucesso!');
  }

  /* ==========================================================================
     17. DESCARTAR ALTERAÇÕES
     ========================================================================== */

  // Descarta alterações que ainda não foram salvas
  descartarAlteracoes(): void {

    const confirmar = confirm(
      'Deseja descartar as alterações não salvas?'
    );

    if (!confirmar) {
      return;
    }

    // Recarrega a versão salva no navegador
    this.db = this.carregarDados();

    // Preenche novamente os campos
    this.preencherFormulario();

    // Atualiza o status
    this.atualizarStatusPublicacao();

    this.ultimoSalvamento = 'Alterações descartadas';

    alert('Alterações descartadas.');
  }

  /* ==========================================================================
     18. ABRIR E FECHAR MODAL DE PUBLICAÇÃO
     ========================================================================== */

  // Exibe a confirmação de publicação
  abrirModalPublicacao(): void {

    this.mensagemFeedback = '';

    this.modalPublicacaoAberto = true;
  }

  // Fecha o modal de publicação
  fecharModalPublicacao(): void {

    this.modalPublicacaoAberto = false;
  }

  /* ==========================================================================
     19. CONFIRMAR PUBLICAÇÃO
     ========================================================================== */

  // Salva as alterações e registra a data da publicação
  confirmarPublicacao(): void {

    // Guarda a versão anterior para restaurar em caso de erro
    const conteudoAnterior = this.db.siteContent;

    // Recupera os dados preenchidos
    const novoConteudo = this.coletarDadosFormulario();

    // Registra a data e o horário da publicação
    novoConteudo.lastPublished = new Date().toISOString();

    // Atualiza o objeto de dados
    this.db.siteContent = novoConteudo;

    // Salva as informações no navegador
    const salvou = this.salvarDados();

    if (!salvou) {
      this.db.siteContent = conteudoAnterior;
      this.fecharModalPublicacao();
      return;
    }

    // Atualiza o formulário com os dados salvos
    this.preencherFormulario();

    // Fecha o modal
    this.fecharModalPublicacao();

    // Atualiza o status de publicação
    this.atualizarStatusPublicacao();

    // Atualiza o horário do último salvamento
    const horario = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    this.ultimoSalvamento = `Publicado às ${horario}`;

    alert('Alterações registradas como publicadas!');

    // Recarrega a pré-visualização
    this.atualizarVisualizacao();
  }

  /* ==========================================================================
     20. ATUALIZAR PRÉ-VISUALIZAÇÃO
     ========================================================================== */

  // Recarrega a página pública dentro do iframe
  atualizarVisualizacao(): void {

    const iframe = this.visualizacaoSite?.nativeElement;

    if (iframe) {
      iframe.src = iframe.src;
    }
  }

  /* ==========================================================================
     21. CONTROLE DO MENU LATERAL
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
     22. SAIR DO PAINEL
     ========================================================================== */

  // Redireciona para a página de login
  sair(): void {
    this.router.navigate(['/login']);
  }
}
