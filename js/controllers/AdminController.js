import { state } from '../models/StateModel.js';
import { DATA, gravar, apagar } from '../models/DatabaseModel.js';
import { toast, closeModal } from '../views/UIComponents.js';
import { esc, hoje, hojeCurto, agora, qrSvg, uid, avisa } from '../utils/helpers.js';

export const AdminController = {
    async salvaUsuario(id) {
        const nome = document.getElementById('u-nome').value.trim();
        const email = document.getElementById('u-email').value.trim();
        const perfil = document.getElementById('u-perfil').value;
        
        if(!nome || !/^\S+@\S+\.\S+$/.test(email)){ 
            toast('Informe nome e um e-mail válido.'); 
            return; 
        }
        
        const base = id ? Object.assign({}, DATA.usuarios.find(x => String(x.id) === String(id))) : { id: uid(), ativo: true, cadastro: hojeCurto() + '/' + new Date().getFullYear(), ts: agora() };
        Object.assign(base, { nome, email, perfil });
        
        closeModal(); 
        if (await gravar('usuarios', base)) toast('Usuário salvo.');
    },
    
    async toggleUsuario(id) {
        const u = Object.assign({}, DATA.usuarios.find(x => String(x.id) === String(id))); 
        u.ativo = !u.ativo;
        if(await gravar('usuarios', u)) toast(`${u.nome} agora está ${u.ativo ? 'ativo' : 'inativo'}.`);
    },
    
    async confirmaExclusao(id) {
        closeModal(); 
        if(await apagar('usuarios', id)) toast('Usuário excluído.');
    },
    
    async salvaSala() {
        const id = document.getElementById('s-id').value.trim().replace(/[^A-Za-z0-9_-]/g, '');
        const nome = document.getElementById('s-nome').value.trim();
        const lat = document.getElementById('s-lat').value.trim();
        const lng = document.getElementById('s-lng').value.trim();
        const raio = +document.getElementById('s-raio').value;
        
        if(!id || !nome || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)) || !(raio >= 1)){ 
            toast('Preencha código, nome, coordenadas válidas e raio.'); 
            return; 
        }
        if(DATA.salas.some(s => s.id === id)){ 
            toast('Já existe uma sala com este código.'); 
            return; 
        }
        
        closeModal(); 
        if(await gravar('salas', { id, nome, lat, lng, raio, qr: true })) {
            toast('Sala cadastrada e QR Code gerado.');
        }
    },
    
    async toggleQr(id) {
        const s = Object.assign({}, DATA.salas.find(x => x.id === id)); 
        s.qr = !s.qr;
        if(await gravar('salas', s)){
            toast(`QR Code da sala ${id} ${s.qr ? 'ativado' : 'inativado'}.`);
            const profsAvisar = DATA.turmas.filter(t => t.sala === id).map(t => 'PROFESSOR:' + t.prof);
            avisa(`O QR Code da sala ${id} (${s.nome}) foi ${s.qr ? 'ativado' : 'inativado'}.`, ['COORDENACAO', ...profsAvisar]);
        }
    },
    
    async salvaTurma() {
        const turma = document.getElementById('f-turma').value.trim();
        const disc = document.getElementById('f-disc').value.trim();
        const prof = document.getElementById('f-prof').value;
        const sala = document.getElementById('f-sala').value;
        
        if(!turma || !disc || !prof || !sala){ 
            toast('Preencha turma, disciplina, professor e sala.'); 
            return; 
        }
        
        const ini = document.getElementById('f-ini').value;
        const fim = document.getElementById('f-fim').value;
        const t = { id: 't' + uid(), turma, disc, prof, sala, ini, fim, dias: [1,2,3,4,5] };
        
        closeModal();
        if(await gravar('turmas', t)){ 
            toast('Turma cadastrada. O professor já vê na agenda.'); 
            avisa(`Nova aula na sua agenda: ${disc} — ${turma}, sala ${sala}, ${t.ini}.`, ['PROFESSOR:' + prof, 'COORDENACAO']); 
        }
    }
};