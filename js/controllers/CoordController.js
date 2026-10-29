import { state } from '../models/StateModel.js';
import { DATA, gravar } from '../models/DatabaseModel.js';
import { toast } from '../views/UIComponents.js';
import { avisa, meuNome, perfilLabel, agora, hojeCurto } from '../utils/helpers.js';

export const CoordController = {
    notificar(id) {
        const p = DATA.presencas.find(x => x.id === id); 
        if(!p) return;
        avisa(`${meuNome()} (${perfilLabel(state.role)}) pede que você confira sua presença de ${p.data}: ${p.turma}, ${p.sala} — ${p.status}.`, ['PROFESSOR:' + p.prof]);
        toast(`Aviso enviado para ${p.prof}.`);
    },
    
    async mudaStatusChamado(id, novoStatus) {
        if(state.role === 'PROFESSOR') return; // Bloqueio de segurança
        const c = DATA.chamados.find(x => x.id === id); 
        if(!c || c.status === novoStatus) return;
        
        const n = Object.assign({}, c); 
        n.status = novoStatus;
        n.resolucao = novoStatus === 'RESOLVIDO' ? hojeCurto() : null;
        n.hist = [...(n.hist || []), { ts: agora(), por: meuNome(), perfil: state.role, tipo: 'evento', texto: `alterou a situação para ${novoStatus}` }];
        
        if(await gravar('chamados', n)){
            toast(`Chamado #${id}: ${novoStatus}`);
            avisa(`${meuNome()} alterou o chamado #${id} (${c.titulo}) para ${novoStatus}.`, ['PROFESSOR:' + c.por, 'ADMIN', 'COORDENACAO'], id);
        }
    },
    
    async enviaMsgChamado(id) {
        const el = document.getElementById('msg-texto');
        if(!el) return;
        const texto = el.value.trim(); 
        if(!texto) return;
        
        const c = DATA.chamados.find(x => x.id === id); 
        if(!c) return;
        
        const n = Object.assign({}, c);
        n.hist = [...(n.hist || []), { ts: agora(), por: meuNome(), perfil: state.role, tipo: 'msg', texto }];
        el.value = '';
        
        if(await gravar('chamados', n)){
            const para = state.role === 'PROFESSOR' ? ['ADMIN', 'COORDENACAO'] : ['PROFESSOR:' + c.por, 'ADMIN', 'COORDENACAO'];
            avisa(`${meuNome()} respondeu no chamado #${id} (${c.titulo}).`, para, id);
        }
    }
};