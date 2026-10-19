import React, { useState, useEffect } from 'react';
import { X, Heart, Calendar, MapPin, Check, Code, UserCheck, AlertCircle } from 'lucide-react';
import { Family, Individual } from '../types/gedcom';

interface MarriageEditorModalProps {
  family: Family | null;
  individuals: Map<string, Individual>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFamily: Family) => void;
}

export const MarriageEditorModal: React.FC<MarriageEditorModalProps> = ({
  family,
  individuals,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Family | null>(null);

  useEffect(() => {
    if (family) {
      setFormData({
        ...family,
        childrenIds: [...family.childrenIds],
        notes: family.notes ? [...family.notes] : [],
        rawLines: family.rawLines ? [...family.rawLines] : [],
      });
    }
  }, [family]);

  if (!isOpen || !formData) return null;

  const husband = formData.husbandId ? individuals.get(formData.husbandId) : null;
  const wife = formData.wifeId ? individuals.get(formData.wifeId) : null;

  const handleFieldChange = (field: keyof Family, value: any) => {
    setFormData(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Set hasMarriageEvent true if date or place is specified
    const updated: Family = {
      ...formData,
      hasMarriageEvent: !!(formData.marriageDate || formData.marriagePlace || formData.hasMarriageEvent),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Editar Dados do Casamento
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {formData.id}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Altere ou defina a <strong>Data</strong> (<code className="text-amber-300">1 MARR / 2 DATE</code>) e o <strong>Local</strong> (<code className="text-amber-300">1 MARR / 2 PLAC</code>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Couple Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
            {/* Husband */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Marido / Cônjuge 1 (1 HUSB)
              </label>
              <select
                value={formData.husbandId || ''}
                onChange={e => handleFieldChange('husbandId', e.target.value || undefined)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">(Nenhum selecionado)</option>
                {Array.from(individuals.values()).map(ind => (
                  <option key={ind.id} value={ind.id}>
                    {ind.id}: {ind.name || `${ind.givenName} ${ind.surname}`.trim() || 'Sem nome'}
                  </option>
                ))}
              </select>
              {husband && (
                <div className="mt-1.5 text-[11px] text-slate-400">
                  Nasc.: {husband.birthDate || '—'} {husband.birthPlace ? `(${husband.birthPlace})` : ''}
                </div>
              )}
            </div>

            {/* Wife */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Esposa / Cônjuge 2 (1 WIFE)
              </label>
              <select
                value={formData.wifeId || ''}
                onChange={e => handleFieldChange('wifeId', e.target.value || undefined)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">(Nenhum selecionado)</option>
                {Array.from(individuals.values()).map(ind => (
                  <option key={ind.id} value={ind.id}>
                    {ind.id}: {ind.name || `${ind.givenName} ${ind.surname}`.trim() || 'Sem nome'}
                  </option>
                ))}
              </select>
              {wife && (
                <div className="mt-1.5 text-[11px] text-slate-400">
                  Nasc.: {wife.birthDate || '—'} {wife.birthPlace ? `(${wife.birthPlace})` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Primary Requirement: Marriage Date & Place */}
          <div className="bg-amber-950/15 border border-amber-500/30 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Dados do Casamento (Tags GEDCOM 1 MARR)
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">
                Tags: 1 MARR &gt; 2 DATE / 2 PLAC
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Marriage Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Data do Casamento
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Tag GEDCOM: <code className="text-amber-300">2 DATE</code>
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.marriageDate || ''}
                  onChange={e => handleFieldChange('marriageDate', e.target.value)}
                  placeholder="Ex: 15 MAY 1978 ou 15/05/1978"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition shadow-inner"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Formatos aceitos: <span className="font-mono text-slate-300">DD MMM YYYY</span> (ex: 15 MAY 1978) ou <span className="font-mono text-slate-300">YYYY</span>
                </p>
              </div>

              {/* Marriage Place */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    Local do Casamento
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Tag GEDCOM: <code className="text-amber-300">2 PLAC</code>
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.marriagePlace || ''}
                  onChange={e => handleFieldChange('marriagePlace', e.target.value)}
                  placeholder="Ex: Curitiba, PR, Brasil"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition shadow-inner"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Recomendado: Cidade, Estado/Província, País
                </p>
              </div>
            </div>

            {/* Quick helper buttons for date shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-400">Inserir mês padrão GEDCOM:</span>
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => {
                    const current = formData.marriageDate || '';
                    if (!current) {
                      handleFieldChange('marriageDate', `01 ${m} 1980`);
                    } else if (!current.includes(m)) {
                      handleFieldChange('marriageDate', `${current} ${m}`);
                    }
                  }}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[10px]"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Divorce Date */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Data de Divórcio (Opcional - Tag GEDCOM: <code className="text-slate-400">1 DIV &gt; 2 DATE</code>)
            </label>
            <input
              type="text"
              value={formData.divorceDate || ''}
              onChange={e => handleFieldChange('divorceDate', e.target.value)}
              placeholder="Ex: 10 OCT 1995"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Children in this marriage */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Filhos deste Casamento ({formData.childrenIds.length})
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Tags: 1 CHIL</span>
            </div>
            {formData.childrenIds.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum filho registrado nesta união.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.childrenIds.map(childId => {
                  const child = individuals.get(childId);
                  return (
                    <span
                      key={childId}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3 h-3 text-sky-400" />
                      <strong>{childId}:</strong> {child?.name || child?.givenName || 'Filho'}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live GEDCOM Snippet Preview */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-2">
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span>Visualização do bloco GEDCOM correspondente:</span>
            </div>
            <pre className="text-xs font-mono text-emerald-400 bg-slate-900/90 p-3 rounded-lg overflow-x-auto leading-relaxed border border-slate-800/80">
{`0 ${formData.id} FAM
${formData.husbandId ? `1 HUSB ${formData.husbandId}\n` : ''}${formData.wifeId ? `1 WIFE ${formData.wifeId}\n` : ''}${formData.childrenIds.map(c => `1 CHIL ${c}\n`).join('')}${formData.marriageDate || formData.marriagePlace || formData.hasMarriageEvent ? `1 MARR\n${formData.marriageDate ? `2 DATE ${formData.marriageDate}\n` : ''}${formData.marriagePlace ? `2 PLAC ${formData.marriagePlace}\n` : ''}` : ''}${formData.divorceDate ? `1 DIV\n2 DATE ${formData.divorceDate}\n` : ''}`}
            </pre>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-950/40"
          >
            <Check className="w-4 h-4" />
            Salvar Alterações de Casamento
          </button>
        </div>
      </div>
    </div>
  );
};
