import { state } from '../models/StateModel.js';
import { DATA } from '../models/DatabaseModel.js';
import { AuthController } from '../controllers/AuthController.js';
import { AdminController } from '../controllers/AdminController.js';
import { CoordController } from '../controllers/CoordController.js';
import { ProfController } from '../controllers/ProfController.js';
import { AdminView } from './AdminView.js';
import { CoordView } from './CoordView.js';
import { ProfView } from './ProfView.js';
import { escapeCsvValue } from '../utils/csv.js';
import {
    esc, pad, hoje, hojeCurto, initials, nomeSala, diasTxt,
    PRES_CLASS, CHAM_CLASS, badgePres, badgeCham, contaChamados, 
    presencasHoje, turmasHoje, ultimaPresenca, aulaFeita, estadoSala, 
    qrSvg, minhasNotifs, marcaVisto, atualizaBell,
    meuNome
} from '../utils/helpers.js';

export const NAV = {
    ADMIN: [
        ['dashboard', 'Dashboard'],
        ['usuarios', 'Usuários'],
        ['salas', 'Salas'],
        ['turmas', 'Turmas & Horários'],
        ['presencas', 'Presenças'],
        ['chamados', 'Chamados'],
        ['relatorios', 'Relatórios']
    ],
    COORDENACAO: [
        ['acompanhamento', 'Acompanhamento do dia'],
        ['presencas', 'Presenças'],
        ['turmas', 'Turmas & Horários'],
        ['chamados', 'Chamados'],
        ['relatorios', 'Relatórios']
    ],
    PROFESSOR: [
        ['inicio', 'Início'],
        ['agenda', 'Minha agenda'],
        ['meus-chamados', 'Meus chamados'],
        ['historico', 'Meu histórico']
    ]
};

export function toast(msg) {
    const t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg; 
    t.classList.add('show');
    clearTimeout(toast._t); 
    toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}

export function openModal(title, body, foot) {
    const modalBox = document.getElementById('modal-box');
    const modal = document.getElementById('modal');
    if(!modalBox || !modal) return;
    
    modalBox.innerHTML = `
        <div class="modal-head">
            <h3 id="modal-title">${title}</h3>
            <button type="button" class="modal-close" aria-label="Fechar" id="btn-close-modal">✕</button>
        </div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
    `;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    modal.classList.add('active');
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
}

export function closeModal() {
    const modal = document.getElementById('modal');
    if(modal) modal.classList.remove('active');
    state.modalChamado = null;
}

export function montaNav() {
    const items = NAV[state.role];
    if(state.role === 'PROFESSOR'){
        const profNav = document.getElementById('prof-nav');
        if(profNav) {
            profNav.innerHTML = items.map(([k, l]) => `<div class="prof-tab" data-v="${k}">${l}</div>`).join('');
            profNav.querySelectorAll('.prof-tab').forEach(t => t.addEventListener('click', () => goto(t.dataset.v)));
        }
    } else {
        const sideNav = document.getElementById('side-nav');
        if(sideNav) {
            sideNav.innerHTML = items.map(([k, l], i) => `
                <div class="navlink" data-v="${k}">
                    <span class="num">${pad(i + 1)}</span>${l}
                    <span class="pill" id="pill-${k}" style="display:none"></span>
                </div>
            `).join('');
            sideNav.querySelectorAll('.navlink').forEach(t => t.addEventListener('click', () => goto(t.dataset.v)));
        }
    }
}

export function goto(v) {
    state.view = v; 
    state.busca = '';
    document.querySelectorAll('.navlink, .prof-tab').forEach(t => t.classList.toggle('active', t.dataset.v === v));
    render(false);
}

export function render(keep) {
    if(!state.role) return;
    const fn = VIEWS[state.role][state.view]; 
    if(!fn) return;
    
    const y = window.scrollY;
    const container = state.role === 'PROFESSOR' ? document.getElementById('prof-content') : document.getElementById('side-content');
    if(container) container.innerHTML = fn();
    
    const p = document.getElementById('pill-chamados'); 
    if(p){ 
        const n = contaChamados('ABERTO'); 
        p.textContent = n; 
        p.style.display = n ? 'inline-block' : 'none'; 
    }
    
    atualizaBell();
    window.scrollTo(0, keep ? y : 0);
}

export function topbar(eyebrow, titulo, meta, acao = '') {
    return `
        <div class="topbar">
            <div>
                <span class="eyebrow">${eyebrow}</span>
                <h1>${titulo}</h1>
                <div class="meta">${meta}</div>
            </div>
            ${acao}
        </div>
    `;
}

// ================= VIEWS COMPARTILHADAS =================
export function tabelaPresencas(lista, comAcao) {
    if(!lista.length) return `<div class="table-wrap"><div class="empty">Nenhum registro para este filtro.</div></div>`;
    return `
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr><th>Data</th><th>Professor</th><th>Turma</th><th>Sala</th><th>Previsto</th><th>Registrado</th><th>Status</th>${comAcao ? '<th></th>' : ''}</tr>
                </thead>
                <tbody>
                    ${lista.map(p => `
                        <tr>
                            <td class="cell-mono">${p.data}</td>
                            <td>${esc(p.prof)}</td>
                            <td>${esc(p.turma)}</td>
                            <td class="cell-mono">${esc(p.sala)}</td>
                            <td class="cell-mono">${p.prev}</td>
                            <td class="cell-mono">${p.real}</td>
                            <td>${badgePres(p.status)}</td>${comAcao ? `<td>${p.status !== 'NO_HORARIO' ? `<button class="icon-btn" data-action="notificar" data-id="${p.id}">Avisar professor</button>` : ''}</td>` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

export function filtraPres() {
    const f = state.filtroPres, q = state.busca.toLowerCase();
    return DATA.presencas.filter(p => (f === 'TODOS' || p.status === f) && (!q || (p.prof + p.sala).toLowerCase().includes(q)));
}

export function viewPresencas() {
    const chips = ['TODOS', 'NO_HORARIO', 'ATRASADO', 'FORA_DA_SALA', 'QRCODE_INATIVO'];
    return topbar('Operação', 'Presenças', 'Registros feitos pelos professores via QR Code e horário da aula — aparecem aqui assim que são enviados') +
        `<div class="toolbar">
            <input class="search-input" id="search-pres" placeholder="Buscar professor ou sala…" value="${esc(state.busca)}">
            <div class="chip-row">${chips.map(c => `<div class="filter-chip ${state.filtroPres === c ? 'active' : ''}" data-filter="${c}">${c}</div>`).join('')}</div>
         </div>
         <div id="lista-pres">${tabelaPresencas(filtraPres(), true)}</div>`;
}

export function viewTurmas() {
    const admin = state.role === 'ADMIN';
    return topbar('Cadastros', 'Turmas & Horários', 'Turma, disciplina, professor e sala de cada aula', admin ? `<button class="btn-primary" id="btn-nova-turma">+ Nova turma</button>` : '') +
        (admin ? '' : `<div class="notice">Somente leitura. Para alterar horários, solicite ao administrador.</div>`) +
        `<div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>Turma</th><th>Disciplina</th><th>Professor</th><th>Sala</th><th>Horário</th><th>Dias</th></tr></thead>
                <tbody>
                    ${DATA.turmas.map(t => `
                        <tr>
                            <td>${esc(t.turma)}</td>
                            <td>${esc(t.disc)}</td>
                            <td>${esc(t.prof)}</td>
                            <td class="cell-mono">${esc(t.sala)}</td>
                            <td class="cell-mono">${t.ini}–${t.fim}</td>
                            <td class="cell-mono">${diasTxt(t.dias)}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="6"><div class="empty">Nenhuma turma cadastrada.</div></td></tr>'}
                </tbody>
            </table>
         </div>`;
}

export function viewRelatorios() {
    const ST = ['NO_HORARIO', 'ATRASADO', 'FORA_DA_SALA', 'QRCODE_INATIVO'];
    const COR = { NO_HORARIO: 'var(--ok)', ATRASADO: 'var(--warn)' };
    const pres = ST.map(s => [s, DATA.presencas.filter(p => p.status === s).length, COR[s] || 'var(--danger)']);
    const maxP = Math.max(1, ...pres.map(p => p[1]));
    
    const porSala = {}; 
    DATA.chamados.forEach(c => porSala[c.sala] = (porSala[c.sala] || 0) + 1);
    const salaList = Object.entries(porSala).sort((a, b) => b[1] - a[1]);
    
    const bar = (l, v, max, cor) => `
        <div class="bar-row">
            <div class="lbl"><span>${l}</span><span class="mono">${v}</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${v / max * 100}%;background:${cor}"></div></div>
        </div>
    `;
    
    return topbar('Análise', 'Relatórios', 'Calculados a partir dos registros reais de presenças e chamados', `<button class="btn-ghost" id="btn-export-csv">Exportar CSV</button>`) +
        `<div class="grid-eq">
            <div class="bracket panel"><div class="panel-head"><h3>Presenças por status</h3></div>${pres.map(p => bar(p[0], p[1], maxP, p[2])).join('')}</div>
            <div class="bracket panel"><div class="panel-head"><h3>Chamados por sala</h3></div>${salaList.map(([s, n]) => bar(`${esc(s)} —${esc(nomeSala(s))}`, n, salaList[0][1], 'var(--accent)')).join('') || '<div class="empty">Sem chamados.</div>'}</div>
         </div>
         <div class="bracket panel">
            <div class="panel-head"><h3>Chamados por situação</h3></div>
            ${['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO'].map(s => bar(s, contaChamados(s), Math.max(1, DATA.chamados.length), s === 'RESOLVIDO' ? 'var(--ok)' : s === 'ABERTO' ? 'var(--danger)' : 'var(--warn)')).join('')}
         </div>`;
}

// ================= MODAIS =================
export function modalTurma() {
    const profs = DATA.usuarios.filter(u => u.perfil === 'PROFESSOR' && u.ativo).map(u => `<option>${esc(u.nome)}</option>`).join('');
    openModal('Nova turma',
        `<div class="field"><label>Turma</label><input id="f-turma" placeholder="Ex.: 3º C"></div>
         <div class="field"><label>Disciplina</label><input id="f-disc" placeholder="Ex.: Geografia"></div>
         <div class="field"><label>Professor</label><select id="f-prof">${profs}</select></div>
         <div class="field"><label>Sala</label><select id="f-sala">${DATA.salas.map(s => `<option value="${esc(s.id)}">${esc(s.id)} —${esc(s.nome)}</option>`).join('')}</select></div>
         <div class="field"><label>Início</label><input id="f-ini" type="time" value="13:30"></div>
         <div class="field"><label>Fim</label><input id="f-fim" type="time" value="14:20"></div>`,
        `<button class="btn-ghost" id="modal-close-btn">Cancelar</button><button class="btn-primary" id="btn-salva-turma">Salvar turma</button>`
    );
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('btn-salva-turma').addEventListener('click', AdminController.salvaTurma);
}

export function modalChamado() {
    openModal('Novo chamado',
        `<div class="notice" style="margin-bottom:14px">${state.role === 'PROFESSOR' ? 'A coordenação e o administrador vão ver este chamado assim que você abrir.' : 'Os outros perfis de gestão e o professor da sala serão avisados.'}</div>
         <div class="field"><label>Título</label><input id="c-titulo" placeholder="Ex.: Projetor sem imagem"></div>
         <div class="field"><label>Descrição</label><textarea id="c-desc" placeholder="Descreva o problema e o que já foi tentado"></textarea></div>
         <div class="field"><label>Sala</label><select id="c-sala">${DATA.salas.map(s => `<option value="${esc(s.id)}">${esc(s.id)} —${esc(s.nome)}</option>`).join('')}</select></div>`,
        `<button class="btn-ghost" id="modal-close-btn">Cancelar</button><button class="btn-primary" id="btn-salva-chamado">Abrir chamado</button>`
    );
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('btn-salva-chamado').addEventListener('click', ProfController.salvaChamado);
}

export function verChamado(id, refresh) {
    const c = DATA.chamados.find(x => x.id === id);
    if(!c){ closeModal(); toast('Este chamado não está mais disponível.'); return; }
    
    const salvo = (refresh && document.getElementById('msg-texto')) ? document.getElementById('msg-texto').value : '';
    const focado = refresh && document.activeElement && document.activeElement.id === 'msg-texto';
    const staff = state.role !== 'PROFESSOR', pode = staff || c.por === meuNome();
    
    const hist = (c.hist || []).slice().sort((a, b) => a.ts - b.ts).map(h => h.tipo === 'msg'
        ? `<div class="msg ${h.perfil === 'PROFESSOR' ? 'prof' : 'staff'}"><div class="msg-meta">${esc(h.por)} · ${h.perfil} · ${new Date(h.ts).toLocaleTimeString()}</div>${esc(h.texto)}</div>`
        : `<div class="evt"><span class="mono">${new Date(h.ts).toLocaleTimeString()}</span> <b>${esc(h.por)}</b> ${esc(h.texto)}</div>`).join('');
    
    const ctrl = staff ? `
        <div class="field">
            <label>Situação do chamado</label>
            <div style="display:flex;gap:8px">
                <select id="sel-status">${['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO'].map(s => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
                <button class="btn-primary btn-sm" id="btn-atualiza-status">Atualizar</button>
            </div>
        </div>` : '';
        
    openModal(`Chamado #${c.id}`,
        `<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:6px">
            <div style="font-size:15px;font-weight:600">${esc(c.titulo)}</div>${badgeCham(c.status)}
         </div>
         <div style="font-size:13.5px;color:var(--steel);margin-bottom:14px">${esc(c.desc)}</div>
         <div class="kv">
            <div><span class="eyebrow">Sala</span><br>${esc(nomeSala(c.sala))}</div>
            <div><span class="eyebrow">Aberto por</span><br>${esc(c.por)}</div>
            <div><span class="eyebrow">Abertura</span><br><span class="mono">${c.abertura}</span></div>
            <div><span class="eyebrow">Resolução</span><br><span class="mono">${c.resolucao || '—'}</span></div>
         </div>
         ${ctrl}
         <div class="eyebrow" style="margin:6px 0 8px">Andamento</div>
         <div class="timeline">${hist || '<div class="empty">Sem registros.</div>'}</div>
         ${pode ? `<div class="field" style="margin-top:12px"><label>Mensagem</label><textarea id="msg-texto" placeholder="${staff ? 'Responder ao professor…' : 'Complementar o chamado ou responder à equipe…'}"></textarea></div>` : ''}`,
        `<button class="btn-ghost" id="modal-close-btn">Fechar</button>${pode ? `<button class="btn-primary" id="btn-envia-msg">Enviar mensagem</button>` : ''}`
    );
    
    state.modalChamado = id;
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    
    if(staff && document.getElementById('btn-atualiza-status')) {
        document.getElementById('btn-atualiza-status').addEventListener('click', () => {
            const novoSt = document.getElementById('sel-status').value;
            CoordController.mudaStatusChamado(c.id, novoSt);
        });
    }
    
    if(pode && document.getElementById('btn-envia-msg')) {
        document.getElementById('btn-envia-msg').addEventListener('click', () => CoordController.enviaMsgChamado(c.id));
    }
    
    if(salvo && document.getElementById('msg-texto')) document.getElementById('msg-texto').value = salvo;
    if(focado && document.getElementById('msg-texto')) document.getElementById('msg-texto').focus();
}

export function adminDashboard() {
    const hojeP = presencasHoje(), aulas = turmasHoje();
    const presentes = hojeP.filter(p => ['NO_HORARIO', 'ATRASADO'].includes(p.status)).length;
    const atrasados = hojeP.filter(p => p.status === 'ATRASADO').length;
    const salasQrOff = DATA.salas.filter(s => !s.qr).length, usrInativos = DATA.usuarios.filter(u => !u.ativo).length;
    
    return topbar('Central de controle · ' + hoje(), 'Dashboard', 'Tudo o que professores e coordenação registram aparece aqui na hora') +
        `<div class="stat-grid">
            <div class="bracket stat-card"><span class="eyebrow">Professores presentes</span><div class="value c-ok">${presentes}</div><div class="delta">de ${aulas.length} aulas previstas hoje</div></div>
            <div class="bracket stat-card"><span class="eyebrow">Atrasados</span><div class="value c-warn">${atrasados}</div><div class="delta">${hojeP.filter(p => !['NO_HORARIO', 'ATRASADO'].includes(p.status)).length} ocorrência(s) de presença</div></div>
            <div class="bracket stat-card"><span class="eyebrow">Chamados abertos</span><div class="value c-danger">${contaChamados('ABERTO')}</div><div class="delta">${contaChamados('EM_ANDAMENTO')} em andamento</div></div>
            <div class="bracket stat-card"><span class="eyebrow">Chamados resolvidos</span><div class="value c-ok">${contaChamados('RESOLVIDO')}</div><div class="delta">total registrado</div></div>
         </div>
         <div class="grid-2">
            <div class="bracket panel">
                <div class="panel-head"><h3>Agenda de hoje</h3><button class="link-btn" id="link-goto-turmas">VER TURMAS →</button></div>
                ${aulas.slice(0, 7).map(t => { const p = ultimaPresenca(t); return `<div class="row-item"><div class="row-time">${t.ini}</div><div class="row-body"><div class="t">${esc(t.disc)} —${esc(t.turma)}</div><div class="s">${esc(t.prof)} ·${esc(nomeSala(t.sala))}</div></div><div class="row-end">${p ? badgePres(p.status) : '<span class="badge neutral">AGUARDANDO</span>'}</div></div>`; }).join('') || '<div class="empty">Sem aulas hoje.</div>'}
            </div>
            <div class="bracket panel">
                <div class="panel-head"><h3>Pendências do sistema</h3></div>
                <div class="row-item"><div class="row-body"><div class="t">QR Codes inativos</div><div class="s">${salasQrOff} sala(s) sem leitura habilitada</div></div><div class="row-end"><button class="icon-btn" id="pnd-salas">Revisar</button></div></div>
                <div class="row-item"><div class="row-body"><div class="t">Usuários inativos</div><div class="s">${usrInativos} conta(s) desativada(s)</div></div><div class="row-end"><button class="icon-btn" id="pnd-users">Revisar</button></div></div>
                <div class="row-item"><div class="row-body"><div class="t">Chamados sem atendimento</div><div class="s">${contaChamados('ABERTO')} aguardando triagem</div></div><div class="row-end"><button class="icon-btn" id="pnd-cham">Abrir</button></div></div>
            </div>
         </div>
         <div class="grid-2">
            <div class="bracket panel">
                <div class="panel-head"><h3>Atividade recente</h3></div>
                ${DATA.atividade.slice(0, 6).map(a => `<div class="row-item"><div class="row-time" style="width:84px">${new Date(a.ts).toLocaleTimeString()}</div><div class="row-body"><div class="s" style="color:var(--text);font-size:13px;margin:0">${esc(a.texto)}</div>${a.ref ? `<button class="link-btn" data-action="verChamado" data-id="${a.ref}">VER CHAMADO →</button>` : ''}</div></div>`).join('') || '<div class="empty">Nenhuma atividade ainda.</div>'}
            </div>
            <div class="bracket panel">
                <div class="panel-head"><h3>Status das salas</h3><button class="link-btn" id="link-salas">GERENCIAR →</button></div>
                <div class="room-mini-grid">${DATA.salas.map(s => `<div class="room-mini ${estadoSala(s)}">${esc(s.id)}<div class="bar"></div></div>`).join('')}</div>
            </div>
         </div>`;
}

export function tabelaUsuarios() {
    const f = state.filtroUsr, q = state.busca.toLowerCase();
    const lista = DATA.usuarios.filter(u => (f === 'TODOS' || (f === 'INATIVOS' ? !u.ativo : u.perfil === f)) && (!q || (u.nome + u.email).toLowerCase().includes(q)));
    if(!lista.length) return `<div class="table-wrap"><div class="empty">Nenhum usuário encontrado.</div></div>`;
    return `
        <div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Cadastro</th><th></th></tr></thead>
                <tbody>
                    ${lista.map(u => `
                        <tr>
                            <td>${esc(u.nome)}</td>
                            <td class="cell-mono">${esc(u.email)}</td>
                            <td><span class="badge ${u.perfil === 'ADMIN' ? 'accent' : 'neutral'}">${u.perfil}</span></td>
                            <td>${u.ativo ? '<span class="badge ok">ATIVO</span>' : '<span class="badge danger">INATIVO</span>'}</td>
                            <td class="cell-mono">${u.cadastro}</td>
                            <td>
                                <div class="row-actions">
                                    <button class="icon-btn" data-action="modalUsuario" data-id="${u.id}">Editar</button>
                                    <button class="icon-btn" data-action="toggleUsuario" data-id="${u.id}">${u.ativo ? 'Inativar' : 'Ativar'}</button>
                                    <button class="icon-btn" data-action="excluiUsuario" data-id="${u.id}">Excluir</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

export function adminUsuarios() {
    const chips = ['TODOS', 'ADMIN', 'COORDENACAO', 'PROFESSOR', 'INATIVOS'];
    return topbar('Cadastros', 'Usuários', 'Contas de acesso, perfis e situação — quem é inativado deixa de aparecer no login', `<button class="btn-primary" id="btn-novo-usuario">+ Novo usuário</button>`) +
        `<div class="toolbar">
            <input class="search-input" id="search-usr" placeholder="Buscar por nome ou e-mail…" value="${esc(state.busca)}">
            <div class="chip-row">${chips.map(c => `<div class="filter-chip ${state.filtroUsr === c ? 'active' : ''}" data-filter-usr="${c}">${c === 'COORDENACAO' ? 'COORDENAÇÃO' : c}</div>`).join('')}</div>
         </div>
         <div id="lista-usr">${tabelaUsuarios()}</div>`;
}

export function modalUsuario(id) {
    const u = id ? DATA.usuarios.find(x => String(x.id) === String(id)) : { nome: '', email: '', perfil: 'PROFESSOR' };
    openModal(id ? 'Editar usuário' : 'Novo usuário',
        `<div class="field"><label>Nome completo</label><input id="u-nome" value="${esc(u.nome)}"></div>
         <div class="field"><label>E-mail</label><input id="u-email" type="email" value="${esc(u.email)}"></div>
         <div class="field"><label>Perfil</label><select id="u-perfil">${['ADMIN', 'COORDENACAO', 'PROFESSOR'].map(p => `<option value="${p}" ${u.perfil === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
         ${id ? '' : '<div class="field"><label>Senha provisória</label><input type="password" value="12345678"></div>'}`,
        `<button class="btn-ghost" id="modal-close-btn">Cancelar</button><button class="btn-primary" id="btn-salva-usuario" data-id="${id || ''}">Salvar usuário</button>`
    );
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('btn-salva-usuario').addEventListener('click', () => AdminController.salvaUsuario(id || ''));
}

export function excluiUsuario(id) {
    const u = DATA.usuarios.find(x => String(x.id) === String(id));
    openModal('Excluir usuário', `<p style="margin:0;font-size:14px;">Excluir <b>${esc(u.nome)}</b>? Essa ação não pode ser desfeita. Para manter o histórico, inative a conta.</p>`,
        `<button class="btn-ghost" id="modal-close-btn">Cancelar</button><button class="btn-primary" style="background:var(--danger)" id="btn-confirma-del" data-id="${id}">Excluir definitivamente</button>`
    );
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('btn-confirma-del').addEventListener('click', () => AdminController.confirmaExclusao(id));
}

export function adminSalas() {
    return topbar('Cadastros', 'Salas', 'Localização e QR Code — o que você altera vale para o check-in dos professores', `<button class="btn-primary" id="btn-nova-sala">+ Nova sala</button>`) +
        `<div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>Código</th><th>Nome</th><th>Latitude</th><th>Longitude</th><th>Raio</th><th>QR Code</th><th></th></tr></thead>
                <tbody>
                    ${DATA.salas.map(s => `
                        <tr>
                            <td class="cell-mono">${esc(s.id)}</td>
                            <td>${esc(s.nome)}</td>
                            <td class="cell-mono">${esc(s.lat)}</td>
                            <td class="cell-mono">${esc(s.lng)}</td>
                            <td class="cell-mono">${s.raio} m</td>
                            <td>${s.qr ? '<span class="badge ok">ATIVO</span>' : '<span class="badge danger">INATIVO</span>'}</td>
                            <td>
                                <div class="row-actions">
                                    <button class="icon-btn" data-action="verQr" data-id="${esc(s.id)}">Ver QR</button>
                                    <button class="icon-btn" data-action="toggleQr" data-id="${esc(s.id)}">${s.qr ? 'Inativar QR' : 'Ativar QR'}</button>
                                </div>
                            </td>
                        </tr>
                    `).join('') || '<tr><td colspan="7"><div class="empty">Nenhuma sala cadastrada.</div></td></tr>'}
                </tbody>
            </table>
         </div>`;
}

export function verQr(id) {
    const s = DATA.salas.find(x => x.id === id); 
    if(!s) return;
    openModal(`QR Code — ${esc(s.nome)}`, 
        `<div class="qr-box">${qrSvg('GS-' + id)}</div>
         <div style="text-align:center">
            <div class="eyebrow">Código de identificação</div>
            <div class="mono" style="font-size:13px;margin-top:2px;">GS-${esc(id)}</div>
            ${s.qr ? '' : '<div class="badge danger" style="margin-top:12px;">QR INATIVO — leituras serão rejeitadas</div>'}
         </div>`,
        `<button class="btn-ghost" id="modal-close-btn">Fechar</button><button class="btn-primary" id="btn-print-qr">Imprimir</button>`
    );
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('btn-print-qr').addEventListener('click', () => {
        const popup = window.open('', '_blank', 'width=700,height=700');
        if (!popup) {
            toast('Permita pop-ups para imprimir o QR Code.');
            return;
        }
        popup.document.write(`<!doctype html><html><head><title>QR ${esc(s.id)}</title></head><body style="font-family:sans-serif;text-align:center;padding:40px"><h1>${esc(s.nome)}</h1>${qrSvg('GS-' + s.id)}<p><strong>GS-${esc(s.id)}</strong></p><script>window.onload=()=>{window.print();}<\/script></body></html>`);
        popup.document.close();
    });
}

export function modalSala() {
    openModal('Nova sala',
        `<div class="field"><label>Código</label><input id="s-id" placeholder="Ex.: S-15"></div>
         <div class="field"><label>Nome</label><input id="s-nome" placeholder="Ex.: Sala 15"></div>
         <div class="field"><label>Latitude</label><input id="s-lat" placeholder="-23.55052"></div>
         <div class="field"><label>Longitude</label><input id="s-lng" placeholder="-46.63331"></div>
         <div class="field"><label>Raio permitido (metros)</label><input id="s-raio" type="number" value="10" min="1"></div>`,
        `<button class="btn-ghost" id="modal-close-btn">Cancelar</button><button class="btn-primary" id="btn-salva-sala">Salvar e gerar QR Code</button>`
    );
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('btn-salva-sala').addEventListener('click', AdminController.salvaSala);
}

export function adminChamados() {
    const col = (s, t) => {
        const l = DATA.chamados.filter(c => c.status === s);
        return `<div>
            <div class="kcol-head"><h4>${t}</h4><span class="count">${l.length}</span></div>
            ${l.map(c => `
                <div class="ticket">
                    <div class="t-title">#${c.id} ·${esc(c.titulo)}</div>
                    <div class="t-desc">${esc(c.desc)}</div>
                    <div class="t-meta"><span>${esc(nomeSala(c.sala))}</span><span>${esc(c.por)} ·${c.abertura}</span></div>
                    <div class="t-actions">
                        ${s === 'ABERTO' ? `<button class="icon-btn" data-action="mudaStatus" data-id="${c.id}" data-status="EM_ANDAMENTO">Iniciar →</button>` : ''}
                        ${s === 'EM_ANDAMENTO' ? `<button class="icon-btn" data-action="mudaStatus" data-id="${c.id}" data-status="RESOLVIDO">Resolver ✓</button>` : ''}
                        ${s === 'RESOLVIDO' ? `<button class="icon-btn" data-action="mudaStatus" data-id="${c.id}" data-status="ABERTO">Reabrir</button>` : ''}
                        <button class="icon-btn" data-action="verChamado" data-id="${c.id}">Detalhes</button>
                    </div>
                </div>
            `).join('') || '<div class="empty">Sem chamados.</div>'}
        </div>`;
    };
    return topbar('Operação', 'Chamados', 'Todos os chamados abertos por professores, coordenação e administração', `<button class="btn-primary" id="btn-novo-chamado-adm">+ Novo chamado</button>`) +
        `<div class="kanban">${col('ABERTO', 'Aberto')}${col('EM_ANDAMENTO', 'Em andamento')}${col('RESOLVIDO', 'Resolvido')}</div>`;
}

export function coordAcompanhamento() {
    const hojeP = presencasHoje(), aulas = turmasHoje();
    const ocorr = hojeP.filter(p => p.status !== 'NO_HORARIO');
    const pend = DATA.chamados.filter(c => c.status !== 'RESOLVIDO');
    
    return topbar('Acompanhamento · ' + hoje(), 'Acompanhamento do dia', 'Quem está em sala, quem está atrasado e o que precisa de atenção agora') +
        `<div class="stat-grid">
            <div class="bracket stat-card"><span class="eyebrow">No horário</span><div class="value c-ok">${hojeP.filter(p => p.status === 'NO_HORARIO').length}</div><div class="delta">de ${aulas.length} aulas hoje</div></div>
            <div class="bracket stat-card"><span class="eyebrow">Atrasados</span><div class="value c-warn">${hojeP.filter(p => p.status === 'ATRASADO').length}</div><div class="delta">acima da tolerância</div></div>
            <div class="bracket stat-card"><span class="eyebrow">Ocorrências de presença</span><div class="value c-danger">${hojeP.filter(p => !['NO_HORARIO', 'ATRASADO'].includes(p.status)).length}</div><div class="delta">sala ou QR</div></div>
            <div class="bracket stat-card"><span class="eyebrow">Chamados pendentes</span><div class="value c-accent">${pend.length}</div><div class="delta">${contaChamados('ABERTO')} sem andamento</div></div>
         </div>
         <div class="grid-2">
            <div class="bracket panel">
                <div class="panel-head"><h3>Quadro do dia</h3><button class="link-btn" id="link-pres">HISTÓRICO →</button></div>
                <div class="table-wrap" style="border:none">
                    <table class="data-table">
                        <thead><tr><th>Horário</th><th>Turma</th><th>Professor</th><th>Sala</th><th>Situação</th></tr></thead>
                        <tbody>
                            ${aulas.map(t => { const p = ultimaPresenca(t); return `<tr><td class="cell-mono">${t.ini}</td><td>${esc(t.turma)} · ${esc(t.disc)}</td><td>${esc(t.prof)}</td><td class="cell-mono">${esc(t.sala)}</td><td>${p ? badgePres(p.status) : '<span class="badge neutral">AGUARDANDO</span>'}</td></tr>`; }).join('') || '<tr><td colspan="5"><div class="empty">Sem aulas hoje.</div></td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="bracket panel">
                <div class="panel-head"><h3>Precisa de atenção</h3></div>
                ${ocorr.map(p => `<div class="row-item"><div class="row-body"><div class="t">${esc(p.prof)}</div><div class="s">${esc(p.turma)} · ${esc(p.sala)} ·${p.prev}</div><div style="margin-top:6px">${badgePres(p.status)}</div></div><div class="row-end"><button class="icon-btn" data-action="notificar" data-id="${p.id}">Avisar</button></div></div>`).join('') || '<div class="empty">Tudo em ordem.</div>'}
            </div>
         </div>
         <div class="bracket panel">
            <div class="panel-head"><h3>Chamados aguardando encaminhamento</h3><button class="link-btn" id="link-cham">VER TODOS →</button></div>
            ${pend.slice(0, 5).map(c => `<div class="row-item"><div class="row-time">#${c.id}</div><div class="row-body"><div class="t">${esc(c.titulo)}</div><div class="s">${esc(nomeSala(c.sala))} · aberto por ${esc(c.por)} em${c.abertura}</div></div><div class="row-end" style="display:flex;gap:8px;align-items:center">${badgeCham(c.status)}<button class="icon-btn" data-action="verChamado" data-id="${c.id}">Detalhes</button></div></div>`).join('') || '<div class="empty">Nenhum chamado pendente.</div>'}
         </div>`;
}

export function coordChamados() {
    return topbar('Operação', 'Chamados', 'Receba, encaminhe e responda os chamados da escola', `<button class="btn-primary" id="btn-novo-chamado-coord">+ Novo chamado</button>`) +
        `<div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>#</th><th>Chamado</th><th>Sala</th><th>Aberto por</th><th>Abertura</th><th>Resolução</th><th>Situação</th><th></th></tr></thead>
                <tbody>
                    ${DATA.chamados.map(c => `
                        <tr>
                            <td class="cell-mono">${c.id}</td>
                            <td><b style="font-weight:600">${esc(c.titulo)}</b><div style="font-size:12px;color:var(--steel)">${esc(c.desc)}</div></td>
                            <td class="cell-mono">${esc(c.sala)}</td>
                            <td>${esc(c.por)}</td>
                            <td class="cell-mono">${c.abertura}</td>
                            <td class="cell-mono">${c.resolucao || '—'}</td>
                            <td>
                                <select class="inline-select" data-id="${c.id}">
                                    ${['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO'].map(s => `<option ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                                </select>
                            </td>
                            <td><button class="icon-btn" data-action="verChamado" data-id="${c.id}">Detalhes</button></td>
                        </tr>
                    `).join('') || '<tr><td colspan="8"><div class="empty">Nenhum chamado ainda.</div></td></tr>'}
                </tbody>
            </table>
         </div>`;
}

export function profInicio() {
    const aulas = turmasHoje().filter(t => t.prof === state.nome), proxima = aulas.find(a => !aulaFeita(a));
    const meus = DATA.presencas.filter(p => p.prof === state.nome);
    const avisos = minhasNotifs().slice(0, 3);
    
    const hero = proxima ? `
        <div class="checkin-card">
            <span class="eyebrow">Próxima aula</span>
            <h2>${esc(proxima.disc)} — ${esc(proxima.turma)}</h2>
            <div class="where">${esc(nomeSala(proxima.sala))} (${esc(proxima.sala)})</div>
            <div class="time-big">Início às ${proxima.ini} · término às ${proxima.fim}</div>
            <button class="btn-checkin" id="btn-abrir-checkin" data-id="${proxima.id}">Registrar presença com QR Code</button>
        </div>` : `<div class="done-banner"><b>${aulas.length ? 'Todas as aulas de hoje já têm presença registrada.' : 'Você não tem aulas hoje.'}</b><br>Coordenação e administração já veem seus registros.</div>`;
        
    return `<div class="hello"><h1>Olá, ${esc(state.nome.split(' ')[0])}</h1><p>${hoje()}</p></div>
    ${hero}
    ${avisos.length ? `<div class="bracket panel" style="margin-bottom:20px"><div class="panel-head"><h3>Avisos para você</h3><button class="link-btn" id="link-avisos">VER TODOS →</button></div>${avisos.map(a => `<div class="row-item"><div class="row-time" style="width:84px">${new Date(a.ts).toLocaleTimeString()}</div><div class="row-body"><div class="s" style="color:var(--text);font-size:13px;margin:0">${esc(a.texto)}</div></div></div>`).join('')}</div>` : ''}
    <div class="mini-stats">
        <div class="bracket stat-card"><span class="eyebrow">Presenças no horário</span><div class="value c-ok">${meus.filter(h => h.status === 'NO_HORARIO').length}/${meus.length}</div><div class="delta">nos seus registros</div></div>
        <div class="bracket stat-card"><span class="eyebrow">Atrasados</span><div class="value c-warn">${meus.filter(h => h.status === 'ATRASADO').length}</div><div class="delta">no período</div></div>
        <div class="bracket stat-card"><span class="eyebrow">Chamados em aberto</span><div class="value c-accent">${DATA.chamados.filter(c => c.por === state.nome && c.status !== 'RESOLVIDO').length}</div><div class="delta">abertos por você</div></div>
    </div>
    <div class="bracket panel">
        <div class="panel-head"><h3>Aulas de hoje</h3></div>
        ${aulas.map(a => { const p = ultimaPresenca(a); return `<div class="row-item"><div class="row-time">${a.ini}</div><div class="row-body"><div class="t">${esc(a.disc)} —${esc(a.turma)}</div><div class="s">${esc(nomeSala(a.sala))} · até ${a.fim}</div></div><div class="row-end">${p ? badgePres(p.status) : '<span class="badge neutral">PENDENTE</span>'}</div></div>`; }).join('') || '<div class="empty">Sem aulas hoje.</div>'}
    </div>`;
}

export function abrirCheckin(turmaId) {
    const aula = DATA.turmas.find(a => a.id === turmaId); 
    if(!aula) return;
    const sala = DATA.salas.find(s => s.id === aula.sala);
    
    openModal('Registrar presença',
        `<div style="font-size:13.5px;margin-bottom:14px;"><b>${esc(aula.disc)} — ${esc(aula.turma)}</b><br><span class="cell-mono">${esc(aula.sala)} · ${aula.ini}</span></div>
         ${sala && !sala.qr ? '<div class="notice">O QR Code desta sala está inativo no cadastro. A leitura será rejeitada.</div>' : ''}
         <div class="field"><label>Simular situação (apenas na demonstração)</label>
           <select id="cenario"><option value="NO_HORARIO">Tudo certo — no horário</option><option value="ATRASADO">Chegou atrasado</option><option value="FORA_DA_SALA">Leu o QR de outra sala</option><option value="QRCODE_INATIVO">QR Code da sala inativo</option></select></div>
         <div id="steps"></div><div id="result"></div>`,
        `<button class="btn-ghost" id="modal-close-btn">Fechar</button><button class="btn-primary" id="btn-scan" data-id="${aula.id}">Escanear QR Code</button>`
    );
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('btn-scan').addEventListener('click', () => ProfController.rodaCheckin(aula.id));
}

export function profAgenda() {
    const dias = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'], mine = DATA.turmas.filter(t => t.prof === state.nome);
    const slots = [...new Set(mine.map(t => t.ini))].sort();
    let cells = `<div class="h">Hora</div>${dias.map(d => `<div class="h">${d}</div>`).join('')}`;
    
    slots.forEach(h => {
        cells += `<div class="tm">${h}</div>`;
        dias.forEach((d, i) => { 
            const t = mine.find(x => x.ini === h && (x.dias || [1,2,3,4,5]).includes(i + 1)); 
            cells += `<div>${t ? `<div class="slot"><b>${esc(t.disc)} · ${esc(t.turma)}</b><span>${esc(t.sala)}</span></div>` : ''}</div>`; 
        });
    });
    return `<div class="hello"><h1>Minha agenda</h1><p>Aulas cadastradas pela administração para você</p></div>` + (slots.length ? `<div style="overflow-x:auto"><div class="week-grid">${cells}</div></div>` : '<div class="bracket panel"><div class="empty">Nenhuma aula cadastrada para você.</div></div>');
}

export function profChamados() {
    const meus = DATA.chamados.filter(c => c.por === state.nome);
    return `<div class="topbar"><div class="hello" style="margin:0"><h1>Meus chamados</h1><p style="margin:0">Coordenação e administração veem tudo o que você abre aqui</p></div><button class="btn-primary" id="btn-novo-chamado-prof">+ Novo chamado</button></div>` +
        (meus.length ? `<div class="bracket panel">${meus.map(c => {
            const h = (c.hist || []).slice().sort((a, b) => b.ts - a.ts)[0];
            const ult = h ? `${h.por} ${h.tipo === 'msg' ? 'respondeu' : h.texto} ·${new Date(h.ts).toLocaleTimeString()}` : '';
            return `<div class="row-item"><div class="row-time">#${c.id}</div><div class="row-body"><div class="t">${esc(c.titulo)}</div><div class="s">${esc(nomeSala(c.sala))} · aberto em ${c.abertura}${c.resolucao ? ' · resolvido em ' + c.resolucao : ''}</div><div class="s" style="margin-top:4px">Última atualização: ${esc(ult)}</div></div><div class="row-end" style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">${badgeCham(c.status)}<button class="icon-btn" data-action="verChamado" data-id="${c.id}">Ver andamento</button></div></div>`;
        }).join('')}</div>` : `<div class="bracket panel"><div class="empty">Você ainda não abriu chamados. Se algo não estiver funcionando na sala, use “Novo chamado”.</div></div>`);
}

export function profHistorico() {
    const meus = DATA.presencas.filter(p => p.prof === state.nome);
    return `<div class="hello"><h1>Meu histórico</h1><p>Seus registros de presença</p></div>` +
        `<div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>Data</th><th>Turma</th><th>Sala</th><th>Previsto</th><th>Registrado</th><th>Status</th></tr></thead>
                <tbody>
                    ${meus.map(h => `<tr><td class="cell-mono">${h.data}</td><td>${esc(h.turma)}</td><td class="cell-mono">${esc(h.sala)}</td><td class="cell-mono">${h.prev}</td><td class="cell-mono">${h.real}</td><td>${badgePres(h.status)}</td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">Nenhum registro ainda.</div></td></tr>'}
                </tbody>
            </table>
         </div>`;
}

export const VIEWS = {
    ADMIN: { dashboard: adminDashboard, usuarios: adminUsuarios, salas: adminSalas, turmas: viewTurmas, presencas: viewPresencas, chamados: adminChamados, relatorios: viewRelatorios },
    COORDENACAO: { acompanhamento: coordAcompanhamento, presencas: viewPresencas, turmas: viewTurmas, chamados: coordChamados, relatorios: viewRelatorios },
    PROFESSOR: { inicio: profInicio, agenda: profAgenda, 'meus-chamados': profChamados, historico: profHistorico }
};

function abrirAvisos() {
    marcaVisto();
    const avisos = minhasNotifs();
    openModal('Avisos',
        avisos.length
            ? avisos.map(a => `
                <div class="row-item">
                    <div class="row-time" style="width:84px">${new Date(a.ts).toLocaleTimeString()}</div>
                    <div class="row-body">
                        <div class="s" style="color:var(--text);font-size:13px;margin:0">${esc(a.texto)}</div>
                        ${a.ref ? `<button class="link-btn" data-action="verChamado" data-id="${a.ref}">VER CHAMADO →</button>` : ''}
                    </div>
                </div>`).join('')
            : '<div class="empty">Nenhum aviso para o seu perfil.</div>',
        '<button class="btn-primary" id="modal-close-btn">Fechar</button>'
    );
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
}

function exportarCsv() {
    const linhas = [
        ['Data', 'Professor', 'Turma', 'Sala', 'Previsto', 'Registrado', 'Status'],
        ...DATA.presencas.map(p => [p.data, p.prof, p.turma, p.sala, p.prev, p.real, p.status])
    ];
    const csv = '\ufeff' + linhas.map(linha => linha.map(escapeCsvValue).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-presencas-${hojeCurto().replace(/-/g, '')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Relatório CSV exportado.');
}

document.addEventListener('click', (e) => {
    const t = e.target;
    if(!t) return;

    if(t.id === 'btn-logout-side' || t.id === 'btn-logout-prof') AuthController.logout();
    
    if(t.id === 'link-goto-turmas' || t.id === 'link-salas') goto('turmas');
    if(t.id === 'pnd-salas') goto('salas');
    if(t.id === 'pnd-users') goto('usuarios');
    if(t.id === 'pnd-cham') goto('chamados');
    if(t.id === 'link-pres') goto('presencas');
    if(t.id === 'link-cham') goto('chamados');
    if(t.id === 'link-avisos' || t.id === 'bell-side' || t.id === 'bell-prof') abrirAvisos();
    if(t.id === 'btn-export-csv') exportarCsv();
    
    if(t.id === 'btn-nova-turma') modalTurma();
    if(t.id === 'btn-novo-usuario') modalUsuario();
    if(t.id === 'btn-nova-sala') modalSala();
    if(t.id === 'btn-novo-chamado-adm' || t.id === 'btn-novo-chamado-coord' || t.id === 'btn-novo-chamado-prof') modalChamado();
    if(t.id === 'btn-abrir-checkin') abrirCheckin(t.dataset.id);

    const actionBtn = t.closest('[data-action]');
    if (actionBtn) {
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;
        
        if(action === 'notificar') CoordController.notificar(id);
        if(action === 'verQr') verQr(id);
        if(action === 'toggleQr') AdminController.toggleQr(id);
        if(action === 'modalUsuario') modalUsuario(id);
        if(action === 'toggleUsuario') AdminController.toggleUsuario(id);
        if(action === 'excluiUsuario') excluiUsuario(id);
        if(action === 'verChamado') verChamado(+id);
        if(action === 'mudaStatus') CoordController.mudaStatusChamado(+id, actionBtn.dataset.status);
    }

    if(t.dataset.filter) { state.filtroPres = t.dataset.filter; render(true); }
    if(t.dataset.filterUsr) { state.filtroUsr = t.dataset.filterUsr; render(true); }
});

document.addEventListener('input', (e) => {
    const t = e.target;
    if(!t) return;
    if(t.id === 'search-pres' || t.id === 'search-usr') {
        state.busca = t.value;
        if(state.view === 'presencas') {
            const listPresEl = document.getElementById('lista-pres');
            if(listPresEl) listPresEl.innerHTML = tabelaPresencas(filtraPres(), true);
        } else if(state.view === 'usuarios') {
            const listUsrEl = document.getElementById('lista-usr');
            if(listUsrEl) listUsrEl.innerHTML = tabelaUsuarios();
        }
    }
});

document.addEventListener('change', (e) => {
    const t = e.target;
    if(t && t.classList.contains('inline-select')) {
        CoordController.mudaStatusChamado(+t.dataset.id, t.value);
    }
});

document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});