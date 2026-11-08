import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {

  enviarWhats(event: Event): void {
    event.preventDefault();

    const formulario = event.target as HTMLFormElement;

    const nome = (formulario.querySelector('#nome') as HTMLInputElement).value;
    const whatsapp = (formulario.querySelector('#whatsapp') as HTMLInputElement).value;
    const tipoEnsaio = (formulario.querySelector('#tipoEnsaio') as HTMLSelectElement).value;
    const data = (formulario.querySelector('#dataDesejada') as HTMLInputElement).value;
    const mensagem = (formulario.querySelector('#mensagem') as HTMLTextAreaElement).value;

    // Formata a data
    let dataFormatada = 'A definir';

    if (data) {
      const partes = data.split('-');
      dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    // Monta a mensagem
    let texto = `Olá, Letícia! Me chamo *${nome}*.\n\n`;
    texto += `Gostaria de solicitar um orçamento para:\n`;
    texto += `• *Tipo de Ensaio:* ${tipoEnsaio}\n`;
    texto += `• *Data Prevista:* ${dataFormatada}\n`;
    texto += `• *Meu WhatsApp:* ${whatsapp}\n`;

    if (mensagem.trim() !== '') {
      texto += `• *Mais detalhes:* ${mensagem}\n`;
    }

    // Abre o WhatsApp
    const mensagemCodificada = encodeURIComponent(texto);

    // Coloque aqui o mesmo número usado no seu JavaScript original
    const numeroWhatsapp = 'SEU_NUMERO_AQUI';

    window.open(
      `https://wa.me/${numeroWhatsapp}?text=${mensagemCodificada}`,
      '_blank'
    );
  }
}