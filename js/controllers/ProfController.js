import { state } from '../models/StateModel.js';
import { DATA, gravar } from '../models/DatabaseModel.js';
import { toast, closeModal, render } from '../views/UIComponents.js';
import { uid, agora, hojeCurto, avisa, meuNome, pad } from '../utils/helpers.js';
import { isPresenceDuplicate } from '../utils/validation.js';

export const ProfController = {
    async salvaChamado() {
        const titulo = document.getElementById('c-titulo').value.trim();
        const sala = document.getElementById('c-sala').value;
        
        if(!titulo){ 
            toast('Informe o título do chamado.'); 
            return; 
        }
        
        const id = DATA.chamados.length > 0 ? Math.max(...DATA.chamados.map(c => c.id)) + 1 : 1;
        const desc = document.getElementById('c-desc').value.trim() || 'Sem descrição.';
        
        const c = {
            id, titulo, desc, sala, por: meuNome(), perfil: state.role, 
            abertura: hojeCurto(), ts: agora(), resolucao: null, status: 'ABERTO',
            hist: [{ ts: agora(), por: meuNome(), perfil: state.role, tipo: 'evento', texto: 'abriu o chamado' }]
        };
        
        closeModal();
        if(await gravar('chamados', c)){
            toast(`Chamado #${id} aberto.` + (state.role === 'PROFESSOR' ? ' Coordenação e admin já podem ver.' : ''));
            avisa(`${meuNome()} abriu o chamado #${id}: ${titulo} (Sala ${sala}).`, ['ADMIN', 'COORDENACAO'], id);
        }
    },

    rodaCheckin(turmaId) {
        const aula = DATA.turmas.find(a => a.id === turmaId);
        if(!aula) {
            toast('Esta aula não está mais disponível.');
            closeModal();
            return;
        }
        const sala = DATA.salas.find(s => s.id === aula.sala);
        if(!sala) {
            toast('A sala desta aula não foi encontrada.');
            closeModal();
            return;
        }
        const btn = document.getElementById('btn-scan');
        const jaRegistrada = isPresenceDuplicate(DATA.presencas, {
            prof: meuNome(),
            turma: aula.turma,
            data: hojeCurto()
        });
        if(jaRegistrada) {
            toast('Sua presença desta turma já foi registrada hoje.');
            closeModal();
            return;
        }
        
        let cen = document.getElementById('cenario').value;
        if(sala && !sala.qr) cen = 'QRCODE_INATIVO';
        
        btn.disabled = true; 
        document.getElementById('result').innerHTML = '';
        
        const outraSala = cen === 'FORA_DA_SALA' ? (DATA.salas.find(s => s.id !== aula.sala) || {id: 'S-99'}).id : aula.sala;
        const [h, m] = aula.ini.split(':').map(Number);
        const minutos = h * 60 + m + (cen === 'ATRASADO' ? 9 : -1);
        const real = `${pad(Math.floor(((minutos % 1440) + 1440) % 1440 / 60))}:${pad((((minutos % 1440) + 1440) % 1440) % 60)}`;
        
        const passos = [
            { t: 'Lendo QR Code da sala', ok: cen !== 'QRCODE_INATIVO', d: cen === 'QRCODE_INATIVO' ? `GS-${aula.sala} · código inativo` : `GS-${outraSala} · lido com sucesso`, stop: cen === 'QRCODE_INATIVO' },
            { t: 'Conferindo se é a sala da aula', ok: cen !== 'FORA_DA_SALA', d: cen === 'FORA_DA_SALA' ? `QR lido: ${outraSala} · esperado: ${aula.sala}` : `Sala esperada: ${aula.sala}`, stop: cen === 'FORA_DA_SALA' },
            { t: 'Comparando com o horário da aula', ok: true, warn: cen === 'ATRASADO', d: `Registro às ${real} · aula às ${aula.ini}` }
        ];
        
        document.getElementById('steps').innerHTML = passos.map((p, i) => `<div class="step wait" id="st${i}"><div class="step-ic">${i + 1}</div><div><div class="st">${p.t}</div><div class="sd">aguardando…</div></div></div>`).join('');
        
        let i = 0;
        const next = () => {
            if(i >= passos.length) return fim();
            const p = passos[i];
            const el = document.getElementById('st' + i);
            setTimeout(() => {
                if(!el || !document.body.contains(el)) return;
                el.className = 'step ' + (!p.ok ? 'fail' : p.warn ? 'warn' : 'ok');
                el.querySelector('.step-ic').textContent = !p.ok ? '✕' : p.warn ? '!' : '✓';
                el.querySelector('.sd').textContent = p.d;
                if(p.stop) return fim(); 
                i++; 
                next();
            }, 650);
        };
        next();
        
        const fim = async () => {
            const status = cen;
            const real2 = status === 'QRCODE_INATIVO' ? '—' : real;
            const reg = { id: uid(), prof: meuNome(), turma: aula.turma, sala: aula.sala, prev: aula.ini, real: real2, status, data: hojeCurto(), ts: agora() };
            
            const ok = await gravar('presencas', reg);
            if(ok && status !== 'NO_HORARIO') {
                avisa(`${meuNome()} registrou presença ${status} — ${aula.turma}, ${aula.sala} (${aula.ini}).`, ['ADMIN', 'COORDENACAO']);
            }
            
            const msg = {
                NO_HORARIO: 'Presença registrada no horário.',
                ATRASADO: 'Presença registrada com atraso.',
                FORA_DA_SALA: 'Este QR Code é de outra sala. Escaneie o código da sala da sua aula.',
                QRCODE_INATIVO: 'O QR Code desta sala está inativo. A coordenação foi avisada; você também pode abrir um chamado.'
            }[status];
            
            const rb = document.getElementById('result'); 
            if(!rb) return;
            
            const badgeClass = status === 'NO_HORARIO' ? 'ok' : status === 'ATRASADO' ? 'warn' : 'danger';
            rb.innerHTML = `<div class="result-box" style="background:var(--${badgeClass}-bg)">
                              <span class="badge ${badgeClass}">${status}</span>
                              <div style="font-size:13.5px;margin-top:8px;">${msg}</div>
                              ${ok ? '<div class="mono" style="font-size:11px;margin-top:8px;color:var(--steel)">Registro enviado para coordenação e administração.</div>' : ''}
                            </div>`;
                            
            btn.textContent = 'Concluído'; 
            btn.onclick = () => { closeModal(); render(true); }; 
            btn.disabled = false;
        };
    }
};