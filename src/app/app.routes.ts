import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Admin } from './pages/admin/admin';
import { Agenda } from './pages/agenda/agenda';
import { Clientes } from './pages/clientes/clientes';
import { Configuracoes } from './pages/configuracoes/configuracoes';
import { EditorSite } from './pages/editor-site/editor-site';
import { Entregas } from './pages/entregas/entregas';
import { Financeiro } from './pages/financeiro/financeiro';
import { Solicitacoes } from './pages/solicitacoes/solicitacoes';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'home', component: Home },
  { path: 'admin', component: Admin },
  { path: 'agenda', component: Agenda },
  { path: 'clientes', component: Clientes },
  { path: 'configuracoes', component: Configuracoes },
  { path: 'editor-site', component: EditorSite },
  { path: 'entregas', component: Entregas },
  { path: 'financeiro', component: Financeiro },
  { path: 'solicitacoes', component: Solicitacoes }
];