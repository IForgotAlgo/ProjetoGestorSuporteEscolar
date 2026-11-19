export function isPresenceDuplicate(lista, registro) {
    if(!Array.isArray(lista) || !registro) return false;
    return lista.some(item =>
        item.prof === registro.prof &&
        item.turma === registro.turma &&
        item.data === registro.data
    );
}
