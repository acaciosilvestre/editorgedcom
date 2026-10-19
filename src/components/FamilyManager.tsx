import React, { useState } from 'react';
import {
  Heart,
  Calendar,
  MapPin,
  Edit3,
  Plus,
  Trash2,
  Users,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Family, Individual, GedcomDocument } from '../types/gedcom';

interface FamilyManagerProps {
  doc: GedcomDocument;
  onEditFamily: (family: Family) => void;
  onAddNewFamily: () => void;
  onDeleteFamily: (familyId: string) => void;
  onQuickUpdateMarriage: (familyId: string, date: string, place: string) => void;
}

export const FamilyManager: React.FC<FamilyManagerProps> = ({
  doc,
  onEditFamily,
  onAddNewFamily,
  onDeleteFamily,
  onQuickUpdateMarriage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'with-marriage' | 'missing-marriage'>('all');
  const [quickEditingId, setQuickEditingId] = useState<string | null>(null);
  const [quickDate, setQuickDate] = useState('');
  const [quickPlace, setQuickPlace] = useState('');

  const familiesList = Array.from(doc.families.values());

  const filteredFamilies = familiesList.filter(fam => {
    const husband = fam.husbandId ? doc.individuals.get(fam.husbandId) : null;
    const wife = fam.wifeId ? doc.individuals.get(fam.wifeId) : null;

    const hasMarr = Boolean(fam.marriageDate || fam.marriagePlace || fam.hasMarriageEvent);

    if (filterMode === 'with-marriage' && !hasMarr) return false;
    if (filterMode === 'missing-marriage' && hasMarr) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    const hName = husband?.name?.toLowerCase() || '';
    const wName = wife?.name?.toLowerCase() || '';
    const mDate = fam.marriageDate?.toLowerCase() || '';
    const mPlace = fam.marriagePlace?.toLowerCase() || '';
    const id = fam.id.toLowerCase();

    return hName.includes(q) || wName.includes(q) || mDate.includes(q) || mPlace.includes(q) || id.includes(q);
  });

  const startQuickEdit = (fam: Family) => {
    setQuickEditingId(fam.id);
    setQuickDate(fam.marriageDate || '');
    setQuickPlace(fam.marriagePlace || '');
  };

  const saveQuickEdit = (familyId: string) => {
    onQuickUpdateMarriage(familyId, quickDate, quickPlace);
    setQuickEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400 fill-rose-500/20" />
              Gestão de Casamentos e Famílias
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
              Tags 1 MARR, 2 DATE, 2 PLAC
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualize, adicione e edite dados de casamentos com suporte completo às tags GEDCOM de data e local.
          </p>
        </div>

        <button
          onClick={onAddNewFamily}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-950/30 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Adicionar Novo Casamento / Família
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por cônjuges, data ou local..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs rounded-lg transition ${
              filterMode === 'all'
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Todas ({familiesList.length})
          </button>
          <button
            onClick={() => setFilterMode('with-marriage')}
            className={`px-3 py-1.5 text-xs rounded-lg transition flex items-center gap-1 ${
              filterMode === 'with-marriage'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Com Casamento Completo
          </button>
          <button
            onClick={() => setFilterMode('missing-marriage')}
            className={`px-3 py-1.5 text-xs rounded-lg transition flex items-center gap-1 ${
              filterMode === 'missing-marriage'
                ? 'bg-amber-950 text-amber-300 border border-amber-800 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Sem Data/Local
          </button>
        </div>
      </div>

      {/* Families List Grid */}
      {filteredFamilies.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Heart className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">Nenhuma família encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tente mudar os filtros de busca ou adicione um novo registro de casamento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFamilies.map(fam => {
            const husband = fam.husbandId ? doc.individuals.get(fam.husbandId) : null;
            const wife = fam.wifeId ? doc.individuals.get(fam.wifeId) : null;
            const isQuickEditing = quickEditingId === fam.id;
            const hasMarriage = Boolean(fam.marriageDate || fam.marriagePlace || fam.hasMarriageEvent);

            return (
              <div
                key={fam.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Family Header */}
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {fam.id}
                      </span>
                      {hasMarriage ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Casamento Registrado
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Sem dados de casamento
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditFamily(fam)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                        title="Abrir editor completo de casamento"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteFamily(fam.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                        title="Remover este vínculo familiar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Spouses display */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Husband */}
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
                      <span className="text-[10px] text-sky-400 uppercase font-semibold block mb-0.5">
                        Marido ({fam.husbandId || '—'})
                      </span>
                      <strong className="text-xs text-white block truncate">
                        {husband?.name || (husband ? `${husband.givenName} ${husband.surname}` : 'Não especificado')}
                      </strong>
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                        {husband?.birthDate ? `Nasc: ${husband.birthDate}` : 'Nascimento não informado'}
                      </span>
                    </div>

                    {/* Wife */}
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
                      <span className="text-[10px] text-pink-400 uppercase font-semibold block mb-0.5">
                        Esposa ({fam.wifeId || '—'})
                      </span>
                      <strong className="text-xs text-white block truncate">
                        {wife?.name || (wife ? `${wife.givenName} ${wife.surname}` : 'Não especificada')}
                      </strong>
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                        {wife?.birthDate ? `Nasc: ${wife.birthDate}` : 'Nascimento não informado'}
                      </span>
                    </div>
                  </div>

                  {/* Marriage Details Box (User Request Focus) */}
                  <div className="p-3.5 rounded-xl bg-amber-950/15 border border-amber-500/25 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Heart className="w-3 h-3 text-amber-400 fill-amber-400/40" />
                        Tags de Casamento (1 MARR)
                      </span>
                      {!isQuickEditing && (
                        <button
                          onClick={() => startQuickEdit(fam)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edição rápida
                        </button>
                      )}
                    </div>

                    {isQuickEditing ? (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-0.5 font-medium">
                            Data de Casamento (2 DATE):
                          </label>
                          <input
                            type="text"
                            value={quickDate}
                            onChange={e => setQuickDate(e.target.value)}
                            placeholder="Ex: 15 MAY 1978"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-300 block mb-0.5 font-medium">
                            Local de Casamento (2 PLAC):
                          </label>
                          <input
                            type="text"
                            value={quickPlace}
                            onChange={e => setQuickPlace(e.target.value)}
                            placeholder="Ex: Curitiba, PR, Brasil"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => saveQuickEdit(fam.id)}
                            className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setQuickEditingId(null)}
                            className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="text-slate-400">Data (2 DATE):</span>
                          {fam.marriageDate ? (
                            <strong className="text-slate-100 font-mono">{fam.marriageDate}</strong>
                          ) : (
                            <span className="text-slate-500 italic">Não informada</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="text-slate-400">Local (2 PLAC):</span>
                          {fam.marriagePlace ? (
                            <strong className="text-slate-100">{fam.marriagePlace}</strong>
                          ) : (
                            <span className="text-slate-500 italic">Não informado</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Children Preview */}
                  {fam.childrenIds.length > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>Filhos ({fam.childrenIds.length}):</span>
                      {fam.childrenIds.map(cId => {
                        const child = doc.individuals.get(cId);
                        return (
                          <span
                            key={cId}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]"
                          >
                            {child?.givenName || cId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    GEDCOM: 1 MARR &gt; 2 DATE / 2 PLAC
                  </span>
                  <button
                    onClick={() => onEditFamily(fam)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-medium rounded-lg transition border border-slate-700/80 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3 h-3 text-amber-400" />
                    Editar Casamento
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
