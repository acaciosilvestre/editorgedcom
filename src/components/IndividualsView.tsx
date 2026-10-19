import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Heart,
  Sparkles,
  TreeDeciduous,
} from 'lucide-react';
import { Individual, Family, GedcomDocument } from '../types/gedcom';

interface IndividualsViewProps {
  doc: GedcomDocument;
  directAncestorIds: Set<string>;
  onEditIndividual: (ind: Individual) => void;
  onAddNewIndividual: () => void;
  onDeleteIndividual: (id: string) => void;
  onEditMarriage: (familyId: string) => void;
  onSetRootPerson: (id: string) => void;
}

export const IndividualsView: React.FC<IndividualsViewProps> = ({
  doc,
  directAncestorIds,
  onEditIndividual,
  onAddNewIndividual,
  onDeleteIndividual,
  onEditMarriage,
  onSetRootPerson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'males' | 'females' | 'ancestors'>('all');

  const individualsList = Array.from(doc.individuals.values());

  const filtered = individualsList.filter(ind => {
    if (filterMode === 'males' && ind.sex !== 'M') return false;
    if (filterMode === 'females' && ind.sex !== 'F') return false;
    if (filterMode === 'ancestors' && !directAncestorIds.has(ind.id)) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (ind.name || `${ind.givenName} ${ind.surname}`).toLowerCase();
    const bDate = ind.birthDate?.toLowerCase() || '';
    const bPlace = ind.birthPlace?.toLowerCase() || '';
    const id = ind.id.toLowerCase();

    return name.includes(q) || bDate.includes(q) || bPlace.includes(q) || id.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              Todos os Indivíduos Cadastrados
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 font-medium">
              {individualsList.length} pessoas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consulte a lista completa, veja datas e locais de nascimento e casamento, ou adicione novos membros.
          </p>
        </div>

        <button
          onClick={onAddNewIndividual}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-sky-950/30 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Indivíduo
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, data ou local..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs rounded-lg transition whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Todos ({individualsList.length})
          </button>
          <button
            onClick={() => setFilterMode('ancestors')}
            className={`px-3 py-1.5 text-xs rounded-lg transition flex items-center gap-1 whitespace-nowrap ${
              filterMode === 'ancestors'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TreeDeciduous className="w-3.5 h-3.5 text-indigo-400" />
            Ascendentes Diretos ({directAncestorIds.size})
          </button>
          <button
            onClick={() => setFilterMode('males')}
            className={`px-3 py-1.5 text-xs rounded-lg transition whitespace-nowrap ${
              filterMode === 'males'
                ? 'bg-sky-950 text-sky-300 border border-sky-800 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Homens
          </button>
          <button
            onClick={() => setFilterMode('females')}
            className={`px-3 py-1.5 text-xs rounded-lg transition whitespace-nowrap ${
              filterMode === 'females'
                ? 'bg-pink-950 text-pink-300 border border-pink-800 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Mulheres
          </button>
        </div>
      </div>

      {/* Grid of Individuals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(ind => {
          const isRoot = ind.id === '@I1@';
          const isDirectAncestor = directAncestorIds.has(ind.id);

          return (
            <div
              key={ind.id}
              className={`rounded-2xl p-5 border shadow-sm transition-all flex flex-col justify-between ${
                isRoot
                  ? 'bg-indigo-950/20 border-indigo-500/50 hover:border-indigo-400 shadow-indigo-950/30'
                  : isDirectAncestor
                  ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/70'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {ind.id}
                    </span>
                    {isRoot ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        Pessoa Raiz (@I1@)
                      </span>
                    ) : isDirectAncestor ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
                        <TreeDeciduous className="w-3 h-3" />
                        Ascendente Direto
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Linha Colateral
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditIndividual(ind)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Editar dados"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteIndividual(ind.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                  {ind.name || `${ind.givenName} ${ind.surname}`.trim() || 'Sem Nome'}
                </h3>

                {/* Birth & Death Details */}
                <div className="space-y-1.5 text-xs text-slate-300 mb-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400">Nascimento: </span>
                      <strong>{ind.birthDate || '—'}</strong>
                      {ind.birthPlace && <span className="text-slate-400"> em {ind.birthPlace}</span>}
                    </div>
                  </div>

                  {ind.deathDate && (
                    <div className="flex items-start gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400">Falecimento: </span>
                        <strong>{ind.deathDate}</strong>
                        {ind.deathPlace && <span className="text-slate-400"> em {ind.deathPlace}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Marriage & Spouse info */}
                {ind.fams.length > 0 && (
                  <div className="text-xs space-y-1.5 mb-2">
                    {ind.fams.map(famId => {
                      const fam = doc.families.get(famId);
                      const spouseId = fam?.husbandId === ind.id ? fam?.wifeId : fam?.husbandId;
                      const spouse = spouseId ? doc.individuals.get(spouseId) : null;
                      return (
                        <div
                          key={famId}
                          className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 flex items-center justify-between"
                        >
                          <div className="truncate pr-2">
                            <span className="text-[11px] text-amber-300 flex items-center gap-1">
                              <Heart className="w-3 h-3 text-rose-400" />
                              Cônjuge: {spouse?.givenName || spouseId || '—'}
                            </span>
                            {(fam?.marriageDate || fam?.marriagePlace) && (
                              <span className="text-[10px] text-slate-400 block truncate">
                                Casamento: {fam.marriageDate || ''} {fam.marriagePlace ? `(${fam.marriagePlace})` : ''}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => onEditMarriage(famId)}
                            className="text-[10px] px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-medium whitespace-nowrap"
                          >
                            Casamento
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                {!isRoot && (
                  <button
                    onClick={() => onSetRootPerson(ind.id)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    title="Definir esta pessoa como a raiz do filtro de ascendentes"
                  >
                    Definir como Raiz
                  </button>
                )}
                <span className="text-[10px] text-slate-500 ml-auto">
                  {ind.sex === 'M' ? 'Masculino' : ind.sex === 'F' ? 'Feminino' : 'Indeterminado'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
