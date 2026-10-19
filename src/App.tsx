import React, { useState, useMemo } from 'react';
import { SAMPLE_GEDCOM_STRING } from './data/sampleGedcom';
import { parseGedcom, serializeGedcom, extractDirectAncestors } from './utils/gedcomParser';
import { GedcomDocument, Family, Individual } from './types/gedcom';
import { Header } from './components/Header';
import { FamilyManager } from './components/FamilyManager';
import { IndividualsView } from './components/IndividualsView';
import { AncestorsView } from './components/AncestorsView';
import { GitManager } from './components/GitManager';
import { LocalFilesManager } from './components/LocalFilesManager';
import { GedcomCodeViewer } from './components/GedcomCodeViewer';
import { MarriageEditorModal } from './components/MarriageEditorModal';
import { IndividualEditorModal } from './components/IndividualEditorModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  // 1. Initial State: Parsed GEDCOM Document with rich sample data including @I1@
  const [doc, setDoc] = useState<GedcomDocument>(() => parseGedcom(SAMPLE_GEDCOM_STRING));
  const [rootId, setRootId] = useState<string>('@I1@');
  const [activeTab, setActiveTab] = useState<string>('families');

  // Modals state
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [isMarriageModalOpen, setIsMarriageModalOpen] = useState(false);

  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);

  // Status & notifications
  const [isSaving, setIsSaving] = useState(false);
  const [gitDefaultFile, setGitDefaultFile] = useState<string>('arvore_completa.ged');
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    subtext?: string;
  } | null>(null);

  // 2. Computed direct ancestors of @I1@
  const ancestorsResult = useMemo(() => {
    return extractDirectAncestors(doc, rootId);
  }, [doc, rootId]);

  // Serialized full GEDCOM string
  const fullGedcomString = useMemo(() => {
    return serializeGedcom(doc);
  }, [doc]);

  // Show auto-dismissing toast
  const showToast = (type: 'success' | 'error', text: string, subtext?: string) => {
    setToastMessage({ type, text, subtext });
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  // 3. Handlers
  const handleResetSample = () => {
    const newDoc = parseGedcom(SAMPLE_GEDCOM_STRING);
    setDoc(newDoc);
    setRootId('@I1@');
    showToast(
      'success',
      'Dados de exemplo recarregados!',
      'Árvore genealógica com a pessoa @I1@ e todos os seus ascendentes diretos foi restaurada.'
    );
  };

  const handleImportGedcom = (content: string, filename: string) => {
    try {
      const parsed = parseGedcom(content);
      setDoc(parsed);

      // Check if @I1@ exists in imported document, else pick first individual
      if (parsed.individuals.has('@I1@')) {
        setRootId('@I1@');
      } else {
        const firstIndi = Array.from(parsed.individuals.keys())[0];
        if (firstIndi) setRootId(firstIndi);
      }

      showToast(
        'success',
        `Arquivo ${filename} importado!`,
        `${parsed.individuals.size} indivíduos e ${parsed.families.size} famílias carregadas com sucesso.`
      );
    } catch (err: any) {
      showToast('error', 'Erro ao importar arquivo GEDCOM', err.message);
    }
  };

  // Save to local directory on server (gedcom_files/)
  const handleSaveToLocalDir = async (
    filename: string,
    content: string,
    type: 'complete' | 'ancestors'
  ) => {
    try {
      const res = await fetch('/api/save-gedcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content, type }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('Save error:', err);
      return { success: false, error: err.message };
    }
  };

  // Save complete GEDCOM
  const handleSaveFullGedcom = async () => {
    setIsSaving(true);
    const filename = 'arvore_completa.ged';
    const content = fullGedcomString;

    try {
      const res = await handleSaveToLocalDir(filename, content, 'complete');

      // Also trigger browser file download
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (res && res.success) {
        showToast(
          'success',
          'Arquivo GEDCOM Completo Salvo com Sucesso!',
          `Salvo no diretório local (${res.relativePath || filename}) e baixado no computador.`
        );
      } else {
        showToast(
          'success',
          'Arquivo GEDCOM baixado!',
          'Arquivo transferido via download para a sua máquina.'
        );
      }
    } catch (err: any) {
      showToast('error', 'Falha ao salvar arquivo GEDCOM', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Marriage edit handler
  const handleSaveFamily = (updatedFamily: Family) => {
    setDoc(prev => {
      const newFamilies = new Map(prev.families);
      newFamilies.set(updatedFamily.id, updatedFamily);

      // Also update FAMS reference on husband and wife if needed
      const newIndis = new Map(prev.individuals);
      if (updatedFamily.husbandId) {
        const h = newIndis.get(updatedFamily.husbandId);
        if (h && !h.fams.includes(updatedFamily.id)) {
          newIndis.set(updatedFamily.husbandId, { ...h, fams: [...h.fams, updatedFamily.id] });
        }
      }
      if (updatedFamily.wifeId) {
        const w = newIndis.get(updatedFamily.wifeId);
        if (w && !w.fams.includes(updatedFamily.id)) {
          newIndis.set(updatedFamily.wifeId, { ...w, fams: [...w.fams, updatedFamily.id] });
        }
      }

      return {
        ...prev,
        individuals: newIndis,
        families: newFamilies,
      };
    });

    showToast(
      'success',
      'Dados de Casamento Atualizados!',
      `Família ${updatedFamily.id}: Data (${updatedFamily.marriageDate || 'n/a'}) e Local (${updatedFamily.marriagePlace || 'n/a'}).`
    );
  };

  // Quick marriage update from family card
  const handleQuickUpdateMarriage = (familyId: string, date: string, place: string) => {
    const existing = doc.families.get(familyId);
    if (!existing) return;
    const updated: Family = {
      ...existing,
      marriageDate: date,
      marriagePlace: place,
      hasMarriageEvent: Boolean(date || place || existing.hasMarriageEvent),
    };
    handleSaveFamily(updated);
  };

  // Open modal to add a brand new family
  const handleAddNewFamily = () => {
    const existingIds = Array.from(doc.families.keys());
    let nextNum = 1;
    while (existingIds.includes(`@F${nextNum}@`)) {
      nextNum++;
    }
    const newId = `@F${nextNum}@`;
    const newFam: Family = {
      id: newId,
      childrenIds: [],
      hasMarriageEvent: true,
      marriageDate: '',
      marriagePlace: '',
      notes: [],
    };
    setEditingFamily(newFam);
    setIsMarriageModalOpen(true);
  };

  // Delete family
  const handleDeleteFamily = (familyId: string) => {
    if (!confirm(`Deseja realmente excluir a família ${familyId}?`)) return;
    setDoc(prev => {
      const newFams = new Map(prev.families);
      newFams.delete(familyId);

      // Remove fams references in individuals
      const newIndis = new Map(prev.individuals);
      newIndis.forEach(ind => {
        if (ind.fams.includes(familyId)) {
          ind.fams = ind.fams.filter(f => f !== familyId);
        }
        if (ind.famc === familyId) {
          ind.famc = undefined;
        }
      });

      return { ...prev, families: newFams, individuals: newIndis };
    });
    showToast('success', `Família ${familyId} removida.`);
  };

  // Save individual handler
  const handleSaveIndividual = (updated: Individual) => {
    setDoc(prev => {
      const newIndis = new Map(prev.individuals);
      newIndis.set(updated.id, updated);
      return { ...prev, individuals: newIndis };
    });
    showToast('success', `Indivíduo ${updated.id} atualizado com sucesso!`);
  };

  // Add new individual
  const handleAddNewIndividual = () => {
    const existingIds = Array.from(doc.individuals.keys());
    let nextNum = 1;
    while (existingIds.includes(`@I${nextNum}@`)) {
      nextNum++;
    }
    const newId = `@I${nextNum}@`;
    const newIndi: Individual = {
      id: newId,
      name: '',
      givenName: '',
      surname: '',
      sex: 'M',
      fams: [],
      notes: [],
    };
    setEditingIndividual(newIndi);
    setIsIndividualModalOpen(true);
  };

  // Delete individual
  const handleDeleteIndividual = (id: string) => {
    if (id === rootId) {
      if (!confirm(`Atenção: Você está excluindo a pessoa raiz (${rootId}). Deseja continuar?`)) return;
    } else {
      if (!confirm(`Deseja excluir o indivíduo ${id}?`)) return;
    }

    setDoc(prev => {
      const newIndis = new Map(prev.individuals);
      newIndis.delete(id);

      // Clean family references
      const newFams = new Map(prev.families);
      newFams.forEach(fam => {
        if (fam.husbandId === id) fam.husbandId = undefined;
        if (fam.wifeId === id) fam.wifeId = undefined;
        fam.childrenIds = fam.childrenIds.filter(cId => cId !== id);
      });

      return { ...prev, individuals: newIndis, families: newFams };
    });

    showToast('success', `Indivíduo ${id} removido.`);
  };

  // Open marriage editor from an individual or family card
  const handleOpenEditMarriage = (familyId: string) => {
    const fam = doc.families.get(familyId);
    if (fam) {
      setEditingFamily(fam);
      setIsMarriageModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header with Navigation and Quick Actions */}
      <Header
        doc={doc}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetSample={handleResetSample}
        onImportGedcom={handleImportGedcom}
        onSaveFullGedcom={handleSaveFullGedcom}
        onOpenAncestorsTab={() => setActiveTab('ancestors')}
        onOpenGitTab={() => setActiveTab('git')}
        isSaving={isSaving}
        totalDirectAncestors={ancestorsResult.totalDirectAncestors}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-4 rounded-xl border shadow-2xl flex items-start gap-3 backdrop-blur ${
              toastMessage.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-slate-100'
                : 'bg-slate-900/95 border-rose-500/50 text-slate-100'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <h5 className="font-bold text-sm text-white">{toastMessage.text}</h5>
              {toastMessage.subtext && (
                <p className="text-slate-300 mt-1 leading-relaxed">{toastMessage.subtext}</p>
              )}
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'families' && (
          <FamilyManager
            doc={doc}
            onEditFamily={fam => {
              setEditingFamily(fam);
              setIsMarriageModalOpen(true);
            }}
            onAddNewFamily={handleAddNewFamily}
            onDeleteFamily={handleDeleteFamily}
            onQuickUpdateMarriage={handleQuickUpdateMarriage}
          />
        )}

        {activeTab === 'individuals' && (
          <IndividualsView
            doc={doc}
            directAncestorIds={ancestorsResult.ancestorIds}
            onEditIndividual={ind => {
              setEditingIndividual(ind);
              setIsIndividualModalOpen(true);
            }}
            onAddNewIndividual={handleAddNewIndividual}
            onDeleteIndividual={handleDeleteIndividual}
            onEditMarriage={handleOpenEditMarriage}
            onSetRootPerson={id => {
              setRootId(id);
              showToast('success', `Pessoa raiz atualizada para ${id}`, 'O módulo de ascendentes diretos foi recalculado.');
            }}
          />
        )}

        {activeTab === 'ancestors' && (
          <AncestorsView
            doc={doc}
            ancestorsResult={ancestorsResult}
            rootId={rootId}
            onChangeRootId={setRootId}
            onSaveLocalFile={handleSaveToLocalDir}
            onNavigateToGit={(targetFile) => {
              setGitDefaultFile(targetFile);
              setActiveTab('git');
            }}
          />
        )}

        {activeTab === 'git' && (
          <GitManager
            fullGedcomContent={fullGedcomString}
            ancestorsGedcomContent={ancestorsResult.rawGedcomText}
            defaultFileToSync={gitDefaultFile}
          />
        )}

        {activeTab === 'saved' && (
          <LocalFilesManager
            onLoadGedcomFile={(content, filename) => {
              handleImportGedcom(content, filename);
              setActiveTab('families');
            }}
          />
        )}

        {activeTab === 'code' && (
          <GedcomCodeViewer
            fullCode={fullGedcomString}
            ancestorsCode={ancestorsResult.rawGedcomText}
          />
        )}
      </main>

      {/* Marriage Editor Modal */}
      <MarriageEditorModal
        family={editingFamily}
        individuals={doc.individuals}
        isOpen={isMarriageModalOpen}
        onClose={() => {
          setIsMarriageModalOpen(false);
          setEditingFamily(null);
        }}
        onSave={handleSaveFamily}
      />

      {/* Individual Editor Modal */}
      <IndividualEditorModal
        individual={editingIndividual}
        families={doc.families}
        isOpen={isIndividualModalOpen}
        onClose={() => {
          setIsIndividualModalOpen(false);
          setEditingIndividual(null);
        }}
        onSave={handleSaveIndividual}
        onEditMarriage={handleOpenEditMarriage}
      />
    </div>
  );
}
