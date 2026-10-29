import { state } from '../models/StateModel.js';
import { DATA } from '../models/DatabaseModel.js';
import { PERFIS } from '../models/MockData.js';
import { initials, atualizaBell } from '../utils/helpers.js';
import { montaNav, goto, closeModal } from '../views/UIComponents.js';

export const AuthController = {
    roleEscolhido: 'ADMIN',
    
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
    },
    
    selecionaRole(role, element) {
        document.querySelectorAll('.role-opt').forEach(x => x.classList.remove('active'));
        element.classList.add('active');
        this.roleEscolhido = role;
        this.atualizaExplicacao();
        this.atualizaLoginUsers();
    },
    
    login() {
        state.role = this.roleEscolhido;
        state.nome = document.getElementById('login-user').value || PERFIS[state.role].user;
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