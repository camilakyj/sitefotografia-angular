
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  // 1. DADOS DE ACESSO EXCLUSIVOS DA ADMINISTRADORA
  // ATENÇÃO: credenciais no frontend são apenas para demonstração.
  private readonly ADMIN_CREDENTIALS = {
    email: 'leticiagomesdonato2911@gmail.com',
    senha: 'senha'
  };

  // 2. SELEÇÃO DE ELEMENTOS
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;
  @ViewChild('feedback') feedback!: ElementRef<HTMLParagraphElement>;
  @ViewChild('loginForm') loginForm!: ElementRef<HTMLFormElement>;
  @ViewChild('togglePassword') togglePassword!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnSubmit') btnSubmit!: ElementRef<HTMLButtonElement>;

  constructor(private router: Router) {}

  // 3. ANO AUTOMÁTICO NO RODAPÉ
  anoAtual = new Date().getFullYear();

  // 4. EXIBIÇÃO DE MENSAGENS DE FEEDBACK
  exibirMensagem(texto: string, tipo: string = 'erro') {
    const feedback = this.feedback.nativeElement;

    feedback.textContent = texto;
    feedback.style.display = 'block';
    feedback.style.marginBottom = '15px';
    feedback.style.fontSize = '0.85rem';
    feedback.style.textAlign = 'center';
    feedback.style.fontWeight = '500';

    if (tipo === 'sucesso') {
      feedback.style.color = '#2E7D32';
    } else {
      feedback.style.color = '#D32F2F';
    }
  }

  // 5. ALTERNAR VISIBILIDADE DA SENHA (OLHINHO)
  alternarSenha() {
    const passwordInput = this.passwordInput.nativeElement;
    const togglePassword = this.togglePassword.nativeElement;

    const visivel = passwordInput.type === 'text';

    passwordInput.type = visivel ? 'password' : 'text';
    togglePassword.textContent = visivel ? '◉' : '◎';

    togglePassword.setAttribute(
      'aria-label',
      visivel ? 'Mostrar senha' : 'Ocultar senha'
    );
  }

  // 6. RECUPERAÇÃO DE SENHA
  recuperarSenha() {
    const email = this.emailInput.nativeElement.value.trim();

    if (!email) {
      this.exibirMensagem(
        'Informe seu e-mail para receber as instruções de recuperação.'
      );

      this.emailInput.nativeElement.focus();
      return;
    }

    this.exibirMensagem(
      'Instruções enviadas! Verifique sua caixa de entrada.',
      'sucesso'
    );
  }

  // 7. AUTENTICAÇÃO PRINCIPAL DO FORMULÁRIO
  entrar(event: Event) {
    event.preventDefault();

    const emailDigitado = this.emailInput.nativeElement.value.trim();
    const senhaDigitada = this.passwordInput.nativeElement.value;

    this.exibirMensagem('');

    // Validação 1: Campos Vazios
    if (!emailDigitado || !senhaDigitada) {
      this.exibirMensagem('Preencha todos os campos para continuar.');
      return;
    }

    // Validação 2: Formato de E-mail
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regexEmail.test(emailDigitado)) {
      this.exibirMensagem(
        'Por favor, digite um endereço de e-mail válido.'
      );

      this.emailInput.nativeElement.focus();
      return;
    }

    // Validação 3: Checagem com Credenciais de Administradora
    const emailCorreto =
      emailDigitado.toLowerCase() ===
      this.ADMIN_CREDENTIALS.email.toLowerCase();

    const senhaCorreta =
      senhaDigitada === this.ADMIN_CREDENTIALS.senha;

    if (emailCorreto && senhaCorreta) {
      this.exibirMensagem(
        'Acesso autorizado! Entrando no painel...',
        'sucesso'
      );

      const btnSubmit = this.btnSubmit.nativeElement;
      btnSubmit.disabled = true;

      setTimeout(() => {
        this.router.navigate(['/admin']);
      }, 1000);

    } else {
      this.exibirMensagem(
        'Credenciais incorretas. Verifique seu e-mail e senha.'
      );
    }
  }
}
