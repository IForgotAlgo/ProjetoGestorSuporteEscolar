import { state } from '../models/StateModel.js';
import { DATA } from '../models/DatabaseModel.js';
import { PERFIS } from '../models/MockData.js';
import { initials, atualizaBell } from '../utils/helpers.js';
import { montaNav, goto, closeModal, toast } from '../views/UIComponents.js';

export const AuthController = {
    roleEscolhido: 'ADMIN',
    DEMO_PASSWORD: 'gs123456',
    
    atualizaExplicacao() {
        const p = PERFIS[this.roleEscolhido];
        const explainEl = document.getElementById('role-explain');
        if(explainEl) {
            explainEl.innerHTML = `<h4>${p.label}</h4>${p.desc}<ul>${p.items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
        }
    },
    
    atualizaLoginUsers() {
        const sel = document.getElementById('login-user');
        if(!sel) return;
        const cur = sel.value;
        const ativos = DATA.usuarios.filter(u => u.perfil === this.roleEscolhido && u.ativo);
        sel.innerHTML = ativos.length ? ativos.map(u => `<option>${u.nome}</option>`).join('') : `<option>${PERFIS[this.roleEscolhido].user}</option>`;
        if(cur && ativos.some(u => u.nome === cur)) sel.value = cur;
        const usuario = ativos.find(u => u.nome === sel.value) || ativos[0];
        if(usuario) {
            const emailInput = document.getElementById('login-email');
            if(emailInput) emailInput.value = usuario.email;
        }
    },
    
    selecionaRole(role, element) {
        document.querySelectorAll('.role-opt').forEach(x => {
            x.classList.remove('active');
            x.setAttribute('aria-checked', 'false');
        });
        element.classList.add('active');
        element.setAttribute('aria-checked', 'true');
        this.roleEscolhido = role;
        this.atualizaExplicacao();
        this.atualizaLoginUsers();
    },
    
    login() {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const nome = document.getElementById('login-user').value;
        const usuario = DATA.usuarios.find(u => u.nome === nome && u.ativo);

        if(!usuario || usuario.perfil !== this.roleEscolhido) {
            toast('Selecione um usuário ativo para o perfil escolhido.');
            return;
        }
        if(email !== usuario.email.toLowerCase()) {
            toast('Use o e-mail do usuário selecionado.');
            return;
        }
        if(password !== this.DEMO_PASSWORD) {
            toast('Senha de demonstração inválida.');
            return;
        }

        state.role = this.roleEscolhido;
        state.nome = usuario.nome;
        const p = PERFIS[state.role];
        
        document.body.className = p.theme;
        document.getElementById('login-screen').style.display = 'none';
        
        if(state.role === 'PROFESSOR'){
            document.getElementById('app-prof').classList.add('active');
            document.getElementById('prof-avatar').textContent = initials(state.nome);
            document.getElementById('prof-avatar').title = state.nome;
            montaNav(); 
            goto('inicio');
        } else {
            document.getElementById('app-side').classList.add('active');
            document.getElementById('side-role-tag').textContent = p.label;
            document.getElementById('side-avatar').textContent = initials(state.nome);
            document.getElementById('side-name').textContent = state.nome;
            document.getElementById('side-role').textContent = p.label;
            montaNav(); 
            goto(state.role === 'ADMIN' ? 'dashboard' : 'acompanhamento');
        }
        atualizaBell();
    },
    
    logout() {
        closeModal();
        document.getElementById('app-side').classList.remove('active'); 
        document.getElementById('app-prof').classList.remove('active');
        document.getElementById('login-screen').style.display = 'flex'; 
        document.body.className = ''; 
        state.role = null; 
        state.nome = null;
    }
};