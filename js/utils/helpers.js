import { state } from '../models/StateModel.js';
import { DATA } from '../models/DatabaseModel.js';

export function esc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

export function pad(n) {
    return String(n).padStart(2, '0');
}

export function hoje() {
    return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function hojeCurto() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function agora() {
    return Date.now();
}

export function agoraData() {
    return new Date().toISOString();
}

export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function initials(name) {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function meuNome() {
    return state.nome || 'Sistema';
}

export function perfilLabel(role) {
    const labels = { 'ADMIN': 'Administração', 'COORDENACAO': 'Coordenação', 'PROFESSOR': 'Professor' };
    return labels[role] || role;
}

export function nomeSala(id) {
    const s = DATA.salas.find(x => x.id === id);
    return s ? s.nome : id;
}

export function diasTxt(dias) {
    if (!dias || dias.length === 5) return 'Seg–Sex';
    const map = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return dias.map(d => map[d]).filter(Boolean).join(', ');
}

export const PRES_CLASS = { NO_HORARIO: 'ok', ATRASADO: 'warn', FORA_DA_SALA: 'danger', QRCODE_INATIVO: 'danger' };
export const CHAM_CLASS = { ABERTO: 'danger', EM_ANDAMENTO: 'warn', RESOLVIDO: 'ok' };

export function badgePres(status) {
    const labels = { NO_HORARIO: 'NO HORÁRIO', ATRASADO: 'ATRASADO', FORA_DA_SALA: 'FORA DA SALA', QRCODE_INATIVO: 'QR INATIVO' };
    return `<span class="badge ${PRES_CLASS[status] || 'neutral'}">${labels[status] || status}</span>`;
}

export function badgeCham(status) {
    const labels = { ABERTO: 'ABERTO', EM_ANDAMENTO: 'EM ANDAMENTO', RESOLVIDO: 'RESOLVIDO' };
    return `<span class="badge ${CHAM_CLASS[status] || 'neutral'}">${labels[status] || status}</span>`;
}

export function contaChamados(status) {
    return DATA.chamados.filter(c => c.status === status).length;
}

export function presencasHoje() {
    const h = hojeCurto();
    return DATA.presencas.filter(p => p.data === h);
}

export function turmasHoje() {
    const diaSemana = new Date().getDay(); 
    return DATA.turmas.filter(t => !t.dias || t.dias.includes(diaSemana));
}

export function ultimaPresenca(t) {
    const h = hojeCurto();
    const lista = DATA.presencas.filter(p => p.data === h && p.turma === t.turma && p.prof === t.prof);
    return lista.length ? lista[lista.length - 1] : null;
}

export function aulaFeita(t) {
    return !!ultimaPresenca(t);
}

export function estadoSala(sala) {
    const emUso = DATA.turmas.some(t => {
        const diaSemana = new Date().getDay();
        const ehHoje = !t.dias || t.dias.includes(diaSemana);
        return ehHoje && t.sala === sala.id;
    });
    if (!sala.qr) return 'off';
    return emUso ? 'ocupada' : 'livre';
}

export function qrSvg(text) {
    return `<svg viewBox="0 0 100 100" width="100%" height="100%" style="background:#fff;padding:8px">
        <rect x="10" y="10" width="30" height="30" fill="#111"/><rect x="15" y="15" width="20" height="20" fill="#fff"/><rect x="20" y="20" width="10" height="10" fill="#111"/>
        <rect x="60" y="10" width="30" height="30" fill="#111"/><rect x="65" y="15" width="20" height="20" fill="#fff"/><rect x="70" y="20" width="10" height="10" fill="#111"/>
        <rect x="10" y="60" width="30" height="30" fill="#111"/><rect x="15" y="65" width="20" height="20" fill="#fff"/><rect x="20" y="70" width="10" height="10" fill="#111"/>
        <rect x="45" y="45" width="10" height="10" fill="#111"/><rect x="55" y="55" width="10" height="10" fill="#111"/>
        <rect x="45" y="65" width="15" height="15" fill="#111"/><rect x="65" y="45" width="25" height="10" fill="#111"/>
        <rect x="65" y="65" width="10" height="25" fill="#111"/><rect x="80" y="80" width="15" height="15" fill="#111"/>
    </svg>`;
}

export function avisa(texto, paraQuem, refChamado = null) {
    const obj = { id: uid(), ts: agora(), texto, para: paraQuem, ref: refChamado };
    DATA.atividade.unshift(obj);
    atualizaBell();
}

export function avisaNovas(snap) {}

export function minhasNotifs() {
    return DATA.atividade.filter(a => {
        if (!Array.isArray(a.para)) return true;
        if (state.role === 'ADMIN') return a.para.includes('ADMIN');
        if (state.role === 'COORDENACAO') return a.para.includes('COORDENACAO');
        if (state.role === 'PROFESSOR') return a.para.includes('PROFESSOR:' + state.nome);
        return false;
    });
}

export function lastSeen() {
    return localStorage.getItem('gs_last_seen') || '2020-01-01T00:00:00.000Z';
}

export function marcaVisto() {
    localStorage.setItem('gs_last_seen', new Date().toISOString());
    atualizaBell();
}

export function atualizaBell() {
    const dot = document.getElementById('bell-dot') || document.querySelector('.bell-count');
    if (!dot) return;
    const ls = lastSeen();
    const novas = DATA.atividade.filter(a => new Date(a.ts) > new Date(ls)).length;
    
    dot.style.display = novas ? 'inline-block' : 'none';
    dot.textContent = novas;
}

export function abrirNotifs() {
    marcaVisto();
}