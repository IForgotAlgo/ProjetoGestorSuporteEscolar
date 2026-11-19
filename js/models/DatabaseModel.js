import { usuarios, salas, turmas, presencas, chamados, atividade, ORDEM } from './MockData.js';
import { state } from './StateModel.js';
import { AuthController } from '../controllers/AuthController.js';
import { toast, render } from '../views/UIComponents.js';
import { clone, atualizaBell, avisaNovas } from '../utils/helpers.js';
import { isPresenceDuplicate } from '../utils/validation.js';

export const DATA = { usuarios, salas, turmas, presencas, chamados, atividade };
export let db = null;

export function mostraSync() {
    document.querySelectorAll('.sync-status').forEach(el => {
        el.className = 'sync-status ' + (db ? 'on' : 'off');
        el.textContent = db ? 'Conectado · dados compartilhados em tempo real' : 'Modo local · dados só nesta aba';
    });
}

export function falha(e) { 
    toast(e && e.code === 'invalid_argument' ? 'Sem permissão para alterar dados (acesso somente leitura).' : 'Não foi possível salvar. Tente novamente.'); 
}

export function aoMudar(col) {
    if (col === 'usuarios') AuthController.atualizaLoginUsers();
    if (!state.role) return;
    if (col === 'atividade') atualizaBell();
    
    const ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.closest('#side-content,#prof-content')) { 
        state.pendente = true; 
        return; 
    }
    
    render(true);
    
    if (col === 'chamados' && state.modalChamado && document.getElementById('modal').classList.contains('active')) {
        document.dispatchEvent(new CustomEvent('updateChamadoModal', { detail: state.modalChamado }));
    }
}

export async function gravar(col, obj) {
    const dado = clone(obj);
    if(col === 'presencas') {
        const jaRegistrada = isPresenceDuplicate(DATA.presencas, dado);
        if(jaRegistrada) {
            toast('Já existe um registro de presença para esta aula hoje.');
            return false;
        }
    }
    if (db) {
        try { 
            await db.collection(col).doc(String(dado.id)).set(dado); 
            return true; 
        } catch (e) { 
            falha(e); 
            return false; 
        }
    }
    const a = DATA[col];
    const i = a.findIndex(x => String(x.id) === String(dado.id));
    if (i >= 0) a[i] = dado; 
    else a.push(dado);
    
    a.sort(ORDEM[col]); 
    aoMudar(col); 
    return true;
}

export async function apagar(col, id) {
    if (db) { 
        try { 
            await db.collection(col).doc(String(id)).delete(); 
            return true; 
        } catch (e) { 
            falha(e); 
            return false; 
        } 
    }
    const a = DATA[col];
    const i = a.findIndex(x => String(x.id) === String(id)); 
    if (i >= 0) a.splice(i, 1);
    
    aoMudar(col); 
    return true;
}

export function assina(col, q) {
    q.onSnapshot(snap => {
        const arr = DATA[col]; 
        arr.length = 0;
        snap.docs.forEach(d => { 
            const v = d.data(); 
            if (v) arr.push({ ...v }); 
        });
        arr.sort(ORDEM[col]);
        if (col === 'atividade') avisaNovas(snap);
        aoMudar(col);
    }, e => console.error('db', col, e));
}

export async function conectaDB() {
    try { 
        if (window.claude) db = await window.claude.use('db'); 
    } catch (e) { 
        db = null; 
    }
    
    mostraSync();
    if (!db) return;
    
    Object.values(DATA).forEach(a => { a.length = 0; });
    ['usuarios', 'salas', 'turmas', 'presencas', 'chamados'].forEach(c => assina(c, db.collection(c)));
    assina('atividade', db.collection('atividade').orderBy('ts', 'desc').limit(60));
    AuthController.atualizaLoginUsers();
}

window.addEventListener('gs:notification', async event => {
    if(db && event.detail) {
        await gravar('atividade', event.detail);
    }
});