const pad = n => String(n).padStart(2, '0');
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ /g, '.');
const D5 = [1, 2, 3, 4, 5];

export const usuarios = [
    ['Ana Souza', 'ADMIN', 1],
    ['Marcos Ferreira', 'COORDENACAO', 1],
    ['Carlos Lima', 'PROFESSOR', 1],
    ['Renata Alves', 'PROFESSOR', 1],
    ['Marina Dias', 'PROFESSOR', 1],
    ['João Prado', 'PROFESSOR', 1],
    ['Diego Farias', 'PROFESSOR', 1],
    ['Paulo Nascimento', 'PROFESSOR', 0]
].map((u, i) => ({
    id: i + 1,
    nome: u[0],
    email: slug(u[0]) + '@escola.edu.br',
    perfil: u[1],
    ativo: !!u[2],
    cadastro: '12/02/2024',
    ts: i + 1
}));

export const salas = [
    ['S-01', 'Biblioteca', '-23.55052', '-46.63331', 15, 1],
    ['S-04', 'Sala de Ciências', '-23.55061', '-46.63298', 12, 1],
    ['S-06', 'Sala 06', '-23.55070', '-46.63310', 10, 1],
    ['S-09', 'Auditório', '-23.55048', '-46.63355', 20, 0],
    ['S-12', 'Sala 12', '-23.55075', '-46.63342', 10, 1],
    ['LAB-INF', 'Lab. Informática', '-23.55066', '-46.63289', 10, 1],
    ['S-14', 'Sala 14', '-23.55081', '-46.63320', 10, 1],
    ['QUADRA-2', 'Quadra 2', '-23.55102', '-46.63360', 30, 1]
].map(s => ({
    id: s[0],
    nome: s[1],
    lat: s[2],
    lng: s[3],
    raio: s[4],
    qr: !!s[5]
}));

export const turmas = [
    ['t1', '2º B', 'Matemática', 'Carlos Lima', 'S-06', '08:20', '09:10'],
    ['t2', '3º A', 'Matemática', 'Carlos Lima', 'S-06', '10:10', '11:00'],
    ['t3', '1º C', 'Física', 'Carlos Lima', 'S-04', '13:30', '14:20'],
    ['t4', '2º C', 'Química', 'Renata Alves', 'S-04', '08:20', '09:10'],
    ['t5', '3º B', 'História', 'Marina Dias', 'S-12', '09:10', '10:00'],
    ['t6', '1º B', 'Educação Física', 'João Prado', 'QUADRA-2', '07:30', '08:20'],
    ['t7', '2º A', 'Informática', 'Diego Farias', 'LAB-INF', '09:10', '10:00'],
    ['t8', '1º A', 'Ciências', 'Paulo Nascimento', 'S-09', '09:20', '10:10']
].map(t => ({
    id: t[0], turma: t[1], disc: t[2], prof: t[3], sala: t[4], ini: t[5], fim: t[6], dias: D5
}));

export const presencas = [];
export const chamados = [];
export const atividade = [];

export const ORDEM = {
    chamados: (a, b) => b.id - a.id,
    presencas: (a, b) => b.ts - a.ts,
    atividade: (a, b) => b.ts - a.ts,
    turmas: (a, b) => a.ini.localeCompare(b.ini) || a.turma.localeCompare(b.turma),
    salas: (a, b) => String(a.id).localeCompare(String(b.id), 'pt', { numeric: true }),
    usuarios: (a, b) => (a.ts || 0) - (b.ts || 0)
};

export const PERFIS = {
    ADMIN: {
        label: 'ADMIN', user: 'Ana Souza', theme: '', desc: 'Controle total do sistema.',
        items: ['Cadastra e gerencia usuários e perfis', 'Configura salas, GPS e QR Codes', 'Monta turmas e horários', 'Vê todos os chamados e presenças em tempo real']
    },
    COORDENACAO: {
        label: 'COORDENAÇÃO', user: 'Marcos Ferreira', theme: 'theme-coord', desc: 'Acompanhamento diário da escola.',
        items: ['Vê o quadro do dia em tempo real', 'Avisa professores sobre atrasos e ocorrências', 'Recebe e encaminha os chamados dos professores', 'Gera relatórios de presença e manutenção']
    },
    PROFESSOR: {
        label: 'PROFESSOR', user: 'Carlos Lima', theme: 'theme-prof', desc: 'Seu dia de aula, sem complicação.',
        items: ['Registra presença lendo o QR Code da sala', 'Consulta sua agenda e sua frequência', 'Abre chamados que coordenação e admin enxergam na hora', 'Acompanha respostas e andamento dos seus chamados']
    }
};