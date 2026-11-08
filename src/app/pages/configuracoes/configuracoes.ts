
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

/* ==========================================================================
   LÓGICA DA PÁGINA DE CONFIGURAÇÕES - LETÍCIA GOMES FOTOGRAFIA
   ========================================================================== */

/* Define a estrutura dos dados do perfil da administradora */
interface Perfil {
  nome: string;
  cargo: string;
  email: string;
}

/* Define a estrutura dos dados de contato */
interface Contato {
  telefone: string;
  whatsapp: string;
  emailContato: string;
  instagram: string;
}

/* Define a estrutura das preferências do sistema */
interface Preferencias {
  formatoData: string;
  confirmarExclusao: boolean;
  mensagensAtivas: boolean;
}

/* Define a estrutura das preferências de notificações */
interface Notificacoes {
  notifSolicitacoes: boolean;
  notifAgenda: boolean;
  notifEntregas: boolean;
  notifFinanceiro: boolean;
}

/* Agrupa todas as configurações do painel */
interface ConfiguracoesSistema {
  profile: Perfil;
  contact: Contato;
  preferences: Preferencias;
  notifications: Notificacoes;
}

/* Define a estrutura do arquivo de backup */
interface BackupSistema {
  timestamp: string;
  mainData: Record<string, unknown>;
  settingsData: ConfiguracoesSistema;
}

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './configuracoes.html',
  styleUrl: './configuracoes.css'
})
export class Configuracoes implements OnInit {

  /* ==========================================================================
     1. CHAVES DE ARMAZENAMENTO
     ========================================================================== */

  // Chave utilizada para os dados principais do painel
  private readonly STORAGE_KEY = 'leticia_dashboard_clean_v1';

  // Chave utilizada exclusivamente para as configurações
  private readonly SETTINGS_KEY = 'leticia_settings_clean_v1';

  /* ==========================================================================
     2. VARIÁVEIS DA INTERFACE
     ========================================================================== */

  // Controla a abertura e o fechamento do menu lateral
  menuAberto = false;

  // Armazena o texto da mensagem de feedback
  mensagem = '';

  // Define se a mensagem será de sucesso ou erro
  tipoMensagem: 'sucesso' | 'erro' = 'sucesso';

  // Exibe o ano atual no rodapé
  anoAtual = new Date().getFullYear();

  /* ==========================================================================
     3. DADOS DOS FORMULÁRIOS
     ========================================================================== */

  // Armazena as configurações exibidas nos formulários
  configuracoes: ConfiguracoesSistema = this.obterConfiguracoesPadrao();

  // Campos utilizados na simulação de alteração de senha
  senhaAtual = '';
  senhaNova = '';
  confirmarSenha = '';

  /* ==========================================================================
     4. REFERÊNCIA AO CAMPO DE ARQUIVO
     ========================================================================== */

  // Permite acessar o arquivo selecionado para restauração
  @ViewChild('arquivoBackup')
  arquivoBackup?: ElementRef<HTMLInputElement>;

  constructor(private router: Router) {}

  /* ==========================================================================
     5. INICIALIZAÇÃO DA PÁGINA
     ========================================================================== */

  ngOnInit(): void {

    // Recupera as configurações armazenadas no navegador
    this.configuracoes = this.carregarConfiguracoes();
  }

  /* ==========================================================================
     6. CONFIGURAÇÕES PADRÃO
     ========================================================================== */

  // Retorna os valores iniciais utilizados pelo painel
  obterConfiguracoesPadrao(): ConfiguracoesSistema {

    return {

      // Informações da administradora
      profile: {
        nome: 'Letícia Gomes',
        cargo: 'Administradora',
        email: 'contato@leticiagomes.com'
      },

      // Informações profissionais de contato
      contact: {
        telefone: '(11) 99999-9999',
        whatsapp: '5511999999999',
        emailContato: 'contato@leticiagomes.com',
        instagram: '@leticiagomesfotografia'
      },

      // Preferências de funcionamento do sistema
      preferences: {
        formatoData: 'dd/mm/aaaa',
        confirmarExclusao: true,
        mensagensAtivas: true
      },

      // Preferências de notificações
      notifications: {
        notifSolicitacoes: true,
        notifAgenda: true,
        notifEntregas: true,
        notifFinanceiro: false
      }

    };
  }

  /* ==========================================================================
     7. CARREGAR CONFIGURAÇÕES
     ========================================================================== */

  // Recupera as configurações salvas no localStorage
  carregarConfiguracoes(): ConfiguracoesSistema {

    try {

      // Procura os dados armazenados no navegador
      const dadosSalvos = localStorage.getItem(this.SETTINGS_KEY);

      // Recupera os valores padrão
      const padrao = this.obterConfiguracoesPadrao();

      // Se não existirem dados salvos, retorna o padrão
      if (!dadosSalvos) {
        return padrao;
      }

      // Converte o JSON em objeto JavaScript
      const dados = JSON.parse(dadosSalvos);

      // Combina os valores salvos com os valores padrão
      return {
        profile: {
          ...padrao.profile,
          ...dados.profile
        },

        contact: {
          ...padrao.contact,
          ...dados.contact
        },

        preferences: {
          ...padrao.preferences,
          ...dados.preferences
        },

        notifications: {
          ...padrao.notifications,
          ...dados.notifications
        }
      };

    } catch (erro) {

      // Exibe o erro no console
      console.error('Erro ao carregar configurações:', erro);

      // Retorna os valores padrão em caso de falha
      return this.obterConfiguracoesPadrao();
    }
  }

  /* ==========================================================================
     8. SALVAR CONFIGURAÇÕES
     ========================================================================== */

  // Armazena as configurações atualizadas no navegador
  salvarConfiguracoes(): boolean {

    try {

      // Converte o objeto para JSON e salva no localStorage
      localStorage.setItem(
        this.SETTINGS_KEY,
        JSON.stringify(this.configuracoes)
      );

      return true;

    } catch (erro) {

      console.error('Erro ao salvar configurações:', erro);

      this.exibirMensagem(
        'Não foi possível salvar as configurações.',
        'erro'
      );

      return false;
    }
  }

  /* ==========================================================================
     9. MENSAGENS DE FEEDBACK
     ========================================================================== */

  // Exibe uma mensagem de sucesso ou erro na parte superior da página
  exibirMensagem(
    texto: string,
    tipo: 'sucesso' | 'erro' = 'sucesso'
  ): void {

    // Atualiza o texto da mensagem
    this.mensagem = texto;

    // Define a aparência da mensagem
    this.tipoMensagem = tipo;

    // Rola suavemente até o início da página
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /* ==========================================================================
     10. SALVAR PERFIL
     ========================================================================== */

  // Salva as informações da administradora
  salvarPerfil(): void {

    // Remove espaços extras dos campos
    this.configuracoes.profile.nome =
      this.configuracoes.profile.nome.trim();

    this.configuracoes.profile.cargo =
      this.configuracoes.profile.cargo.trim();

    this.configuracoes.profile.email =
      this.configuracoes.profile.email.trim();

    // Verifica se os campos obrigatórios estão preenchidos
    if (
      !this.configuracoes.profile.nome ||
      !this.configuracoes.profile.email
    ) {

      this.exibirMensagem(
        'Preencha o nome e o e-mail da administradora.',
        'erro'
      );

      return;
    }

    // Salva as informações no navegador
    if (this.salvarConfiguracoes()) {

      this.exibirMensagem(
        'Perfil da administradora atualizado com sucesso!'
      );
    }
  }

  /* ==========================================================================
     11. SALVAR DADOS DE CONTATO
     ========================================================================== */

  // Salva telefone, WhatsApp, e-mail profissional e Instagram
  salvarContato(): void {

    // Remove espaços extras dos campos
    this.configuracoes.contact.telefone =
      this.configuracoes.contact.telefone.trim();

    this.configuracoes.contact.whatsapp =
      this.configuracoes.contact.whatsapp.trim();

    this.configuracoes.contact.emailContato =
      this.configuracoes.contact.emailContato.trim();

    this.configuracoes.contact.instagram =
      this.configuracoes.contact.instagram.trim();

    // Salva os dados de contato
    if (this.salvarConfiguracoes()) {

      this.exibirMensagem(
        'Dados de contato salvos com sucesso!'
      );
    }
  }

  /* ==========================================================================
     12. ALTERAÇÃO DE SENHA - SIMULAÇÃO
     ========================================================================== */

  // Valida os campos de senha sem alterar a autenticação real
  alterarSenha(): void {

    // Verifica se todos os campos foram preenchidos
    if (
      !this.senhaAtual ||
      !this.senhaNova ||
      !this.confirmarSenha
    ) {

      this.exibirMensagem(
        'Preencha todos os campos de senha.',
        'erro'
      );

      return;
    }

    // Verifica o tamanho mínimo das senhas
    if (
      this.senhaAtual.length < 6 ||
      this.senhaNova.length < 6 ||
      this.confirmarSenha.length < 6
    ) {

      this.exibirMensagem(
        'As senhas devem conter pelo menos 6 caracteres.',
        'erro'
      );

      return;
    }

    // Verifica se a nova senha corresponde à confirmação
    if (this.senhaNova !== this.confirmarSenha) {

      this.exibirMensagem(
        'A nova senha e a confirmação não coincidem.',
        'erro'
      );

      return;
    }

    // Limpa os campos preenchidos
    this.senhaAtual = '';
    this.senhaNova = '';
    this.confirmarSenha = '';

    // Informa que a validação foi apenas demonstrativa
    this.exibirMensagem(
      'Validação concluída! A senha real não foi alterada, pois esta função é uma simulação.'
    );
  }

  /* ==========================================================================
     13. RECUPERAÇÃO DE SENHA - SIMULAÇÃO
     ========================================================================== */

  // Demonstra a solicitação de recuperação de senha
  solicitarRecuperacao(): void {

    this.exibirMensagem(
      'Recuperação simulada! Nenhum e-mail foi enviado.'
    );
  }

  /* ==========================================================================
     14. SALVAR PREFERÊNCIAS DO SISTEMA
     ========================================================================== */

  // Salva formato de data e opções de confirmação
  salvarPreferencias(): void {

    if (this.salvarConfiguracoes()) {

      this.exibirMensagem(
        'Preferências do sistema atualizadas!'
      );
    }
  }

  /* ==========================================================================
     15. SALVAR PREFERÊNCIAS DE NOTIFICAÇÕES
     ========================================================================== */

  // Salva os estados dos interruptores de notificação
  salvarNotificacoes(): void {

    if (this.salvarConfiguracoes()) {

      this.exibirMensagem(
        'Preferências de notificação salvas!'
      );
    }
  }

  /* ==========================================================================
     16. EXPORTAR BACKUP DOS DADOS
     ========================================================================== */

  // Gera um arquivo JSON contendo os dados do painel
  exportarBackup(): void {

    try {

      // Recupera os dados principais do painel
      const dadosPrincipais =
        localStorage.getItem(this.STORAGE_KEY) || '{}';

      // Recupera as configurações armazenadas
      const dadosConfiguracoes =
        localStorage.getItem(this.SETTINGS_KEY);

      // Organiza os dados em um único objeto
      const backup: BackupSistema = {

        // Registra o momento da exportação
        timestamp: new Date().toISOString(),

        // Inclui os dados principais
        mainData: JSON.parse(dadosPrincipais),

        // Inclui as configurações
        settingsData: dadosConfiguracoes
          ? JSON.parse(dadosConfiguracoes)
          : this.configuracoes
      };

      // Converte o backup em JSON formatado
      const conteudoJSON = JSON.stringify(
        backup,
        null,
        2
      );

      // Cria um arquivo temporário em memória
      const arquivo = new Blob(
        [conteudoJSON],
        { type: 'application/json' }
      );

      // Cria um endereço temporário para o arquivo
      const url = URL.createObjectURL(arquivo);

      // Cria um link para iniciar o download
      const link = document.createElement('a');

      // Define o endereço do arquivo
      link.href = url;

      // Define a data no nome do arquivo
      const dataAtual = new Date()
        .toISOString()
        .split('T')[0];

      // Define o nome do backup
      link.download = `backup_leticiagomes_${dataAtual}.json`;

      // Adiciona o link temporariamente à página
      document.body.appendChild(link);

      // Inicia o download
      link.click();

      // Remove o link temporário
      document.body.removeChild(link);

      // Libera o endereço temporário
      URL.revokeObjectURL(url);

      // Exibe a mensagem de sucesso
      this.exibirMensagem(
        'Backup local exportado com sucesso!'
      );

    } catch (erro) {

      console.error('Erro ao exportar backup:', erro);

      this.exibirMensagem(
        'Falha ao exportar os dados de backup.',
        'erro'
      );
    }
  }

  /* ==========================================================================
     17. RESTAURAR BACKUP DOS DADOS
     ========================================================================== */

  // Lê um arquivo JSON e restaura os dados do painel
  async restaurarBackup(): Promise<void> {

    // Recupera o campo de seleção de arquivos
    const input = this.arquivoBackup?.nativeElement;

    // Recupera o primeiro arquivo selecionado
    const arquivo = input?.files?.[0];

    // Verifica se algum arquivo foi selecionado
    if (!arquivo) {

      this.exibirMensagem(
        'Selecione um arquivo de backup (.json) para restaurar.',
        'erro'
      );

      return;
    }

    // Verifica a extensão do arquivo
    if (!arquivo.name.toLowerCase().endsWith('.json')) {

      this.exibirMensagem(
        'Selecione um arquivo no formato JSON.',
        'erro'
      );

      return;
    }

    try {

      // Lê o conteúdo do arquivo selecionado
      const texto = await arquivo.text();

      // Converte o JSON em objeto JavaScript
      const backup = JSON.parse(texto);

      // Verifica se o arquivo possui a estrutura esperada
      if (
        !backup ||
        typeof backup !== 'object' ||
        !backup.mainData ||
        !backup.settingsData ||
        typeof backup.mainData !== 'object' ||
        Array.isArray(backup.mainData) ||
        typeof backup.settingsData !== 'object' ||
        Array.isArray(backup.settingsData) ||
        !backup.settingsData.profile ||
        !backup.settingsData.contact ||
        !backup.settingsData.preferences ||
        !backup.settingsData.notifications
      ) {

        this.exibirMensagem(
          'Arquivo de backup inválido ou incompleto.',
          'erro'
        );

        return;
      }

      // Solicita confirmação antes de substituir os dados
      const confirmar = window.confirm(
        'Atenção: a restauração substituirá os dados atuais do painel. Deseja continuar?'
      );

      // Interrompe caso o usuário cancele
      if (!confirmar) {
        return;
      }

      // Guarda cópias dos dados atuais para recuperação
      const dadosAnteriores =
        localStorage.getItem(this.STORAGE_KEY);

      const configuracoesAnteriores =
        localStorage.getItem(this.SETTINGS_KEY);

      try {

        // Restaura os dados principais do painel
        localStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(backup.mainData)
        );

        // Restaura as configurações do sistema
        localStorage.setItem(
          this.SETTINGS_KEY,
          JSON.stringify(backup.settingsData)
        );

      } catch (erro) {

        // Tenta recuperar os dados anteriores se a gravação falhar
        if (dadosAnteriores === null) {
          localStorage.removeItem(this.STORAGE_KEY);
        } else {
          localStorage.setItem(
            this.STORAGE_KEY,
            dadosAnteriores
          );
        }

        if (configuracoesAnteriores === null) {
          localStorage.removeItem(this.SETTINGS_KEY);
        } else {
          localStorage.setItem(
            this.SETTINGS_KEY,
            configuracoesAnteriores
          );
        }

        throw erro;
      }

      // Atualiza os formulários com as configurações restauradas
      this.configuracoes = this.carregarConfiguracoes();

      // Limpa o campo de seleção de arquivo
      if (input) {
        input.value = '';
      }

      // Exibe a mensagem de sucesso
      this.exibirMensagem(
        'Dados restaurados com sucesso! Recarregue a página para atualizar o painel.'
      );

    } catch (erro) {

      console.error('Erro ao restaurar backup:', erro);

      this.exibirMensagem(
        'Não foi possível restaurar o backup. Verifique o arquivo.',
        'erro'
      );
    }
  }

  /* ==========================================================================
     18. CONTROLE DO MENU LATERAL
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
     19. SAIR DO PAINEL
     ========================================================================== */

  // Redireciona para a página de login
  sair(): void {
    this.router.navigate(['/login']);
  }
}
