import React, { useState, useEffect } from 'react';
import { X, User, Calendar, MapPin, Check, Heart, Shield } from 'lucide-react';
import { Individual, Family } from '../types/gedcom';

interface IndividualEditorModalProps {
  individual: Individual | null;
  families: Map<string, Family>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Individual) => void;
  onEditMarriage?: (familyId: string) => void;
}

export const IndividualEditorModal: React.FC<IndividualEditorModalProps> = ({
  individual,
  families,
  isOpen,
  onClose,
  onSave,
  onEditMarriage,
}) => {
  const [formData, setFormData] = useState<Individual | null>(null);

  useEffect(() => {
    if (individual) {
      setFormData({
        ...individual,
        fams: [...individual.fams],
        notes: individual.notes ? [...individual.notes] : [],
        rawLines: individual.rawLines ? [...individual.rawLines] : [],
      });
    }
  }, [individual]);

  if (!isOpen || !formData) return null;

  const handleFieldChange = (field: keyof Individual, val: any) => {
    setFormData(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: val };
      // Keep name synchronized if givenName or surname changes
      if (field === 'givenName' || field === 'surname') {
        const given = field === 'givenName' ? val : prev.givenName;
        const sur = field === 'surname' ? val : prev.surname;
        updated.name = `${given || ''} ${sur ? `/${sur}/` : ''}`.trim();
      }
      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              formData.sex === 'M'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : formData.sex === 'F'
                ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                : 'bg-slate-700/20 text-slate-300'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Editar Indivíduo
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {formData.id}
                </span>
                {formData.id === '@I1@' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    Pessoa Raiz @I1@
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Dados pessoais, nascimento, óbito e vínculos familiares</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Name & Sex */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome Próprio (GIVN)
              </label>
              <input
                type="text"
                value={formData.givenName || ''}
                onChange={e => handleFieldChange('givenName', e.target.value)}
                placeholder="Ex: João Carlos"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sexo (SEX)
              </label>
              <select
                value={formData.sex}
                onChange={e => handleFieldChange('sex', e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="M">Masculino (M)</option>
                <option value="F">Feminino (F)</option>
                <option value="U">Desconhecido (U)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Sobrenome (SURN)
            </label>
            <input
              type="text"
              value={formData.surname || ''}
              onChange={e => handleFieldChange('surname', e.target.value)}
              placeholder="Ex: da Silva"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Birth */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Nascimento (Tag 1 BIRT)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Data (2 DATE)</label>
                <input
                  type="text"
                  value={formData.birthDate || ''}
                  onChange={e => handleFieldChange('birthDate', e.target.value)}
                  placeholder="Ex: 12 APR 1955"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Local (2 PLAC)</label>
                <input
                  type="text"
                  value={formData.birthPlace || ''}
                  onChange={e => handleFieldChange('birthPlace', e.target.value)}
                  placeholder="Ex: São Paulo, SP, Brasil"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Death */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Óbito (Tag 1 DEAT - Opcional)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Data (2 DATE)</label>
                <input
                  type="text"
                  value={formData.deathDate || ''}
                  onChange={e => handleFieldChange('deathDate', e.target.value)}
                  placeholder="Ex: 14 MAR 2012"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Local (2 PLAC)</label>
                <input
                  type="text"
                  value={formData.deathPlace || ''}
                  onChange={e => handleFieldChange('deathPlace', e.target.value)}
                  placeholder="Ex: Campinas, SP, Brasil"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Marriage links */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Famílias / Casamentos Vinculados ({formData.fams.length})
            </span>
            {formData.fams.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum casamento vinculado a este indivíduo.</p>
            ) : (
              <div className="space-y-2">
                {formData.fams.map(fId => {
                  const fam = families.get(fId);
                  return (
                    <div
                      key={fId}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-amber-400 font-mono">{fId}</strong>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Casamento:{' '}
                          {fam?.marriageDate || fam?.marriagePlace
                            ? `${fam.marriageDate || 'Data ?'} - ${fam.marriagePlace || 'Local ?'}`
                            : 'Sem data/local cadastrado'}
                        </div>
                      </div>
                      {onEditMarriage && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditMarriage(fId);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium"
                        >
                          Editar Casamento
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Salvar Dados
          </button>
        </div>
      </div>
    </div>
  );
};
