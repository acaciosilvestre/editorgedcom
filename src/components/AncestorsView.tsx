import React, { useState } from 'react';
import {
  TreeDeciduous,
  Download,
  Save,
  GitBranch,
  Code,
  Sparkles,
  CheckCircle2,
  Calendar,
  MapPin,
  Heart,
  User,
  ShieldCheck,
  ChevronRight,
  FileCheck,
  AlertCircle,
  FolderCheck,
} from 'lucide-react';
import { GedcomDocument, DirectAncestorsResult, DirectAncestorNode } from '../types/gedcom';

interface AncestorsViewProps {
  doc: GedcomDocument;
  ancestorsResult: DirectAncestorsResult;
  rootId: string;
  onChangeRootId: (id: string) => void;
  onSaveLocalFile: (filename: string, content: string, type: 'ancestors' | 'complete') => Promise<any>;
  onNavigateToGit: (targetFile: string, content: string) => void;
}

export const AncestorsView: React.FC<AncestorsViewProps> = ({
  doc,
  ancestorsResult,
  rootId,
  onChangeRootId,
  onSaveLocalFile,
  onNavigateToGit,
}) => {
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<{ path: string; size: number } | null>(null);
  const [showRawCode, setShowRawCode] = useState(false);
  const [selectedGenFilter, setSelectedGenFilter] = useState<number | 'all'>('all');

  const rootIndi = doc.individuals.get(rootId);

  // Group nodes by generation
  const generationGroups: Record<number, DirectAncestorNode[]> = {};
  ancestorsResult.ancestorNodes.forEach(node => {
    if (!generationGroups[node.generation]) {
      generationGroups[node.generation] = [];
    }
    generationGroups[node.generation].push(node);
  });

  const generationKeys = Object.keys(generationGroups)
    .map(Number)
    .sort((a, b) => a - b);

  // Relatives excluded from the direct ancestors tree
  const excludedIndividuals = Array.from(doc.individuals.values()).filter(
    ind => !ancestorsResult.ancestorIds.has(ind.id)
  );

  // Default filename for saving
  const defaultFilename = `ascendentes_${rootId.replace(/@/g, '')}.ged`;

  // Handle saving to local directory
  const handleSaveToLocalDir = async () => {
    setIsSavingLocal(true);
    setSaveSuccessMsg(null);
    try {
      const res = await onSaveLocalFile(defaultFilename, ancestorsResult.rawGedcomText, 'ancestors');
      if (res && res.success) {
        setSaveSuccessMsg({ path: res.relativePath || res.path, size: res.sizeBytes });
      }

      // Also trigger browser file download for immediate offline backup
      const blob = new Blob([ancestorsResult.rawGedcomText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleDownloadOnly = () => {
    const blob = new Blob([ancestorsResult.rawGedcomText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <TreeDeciduous className="w-56 h-56 text-indigo-400" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Módulo de Linhagem Direta
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              Foco na Pessoa: {rootId}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Ascendentes Diretos de {rootId} ({rootIndi?.name || rootIndi?.givenName || 'Indivíduo Raiz'})
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Esta funcionalidade gera um <strong>novo arquivo GEDCOM exclusivo</strong> contendo
            apenas a linha ascendente direta (pais, avós, bisavós) da pessoa <strong>{rootId}</strong>,
            preservando todas as tags de casamento (<code className="text-amber-300">1 MARR</code>, <code className="text-amber-300">2 DATE</code>, <code className="text-amber-300">2 PLAC</code>) dos casamentos ancestrais e excluindo ramos colaterais (irmãos, tios e descendentes).
          </p>

          {/* Action Toolbar */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveToLocalDir}
              disabled={isSavingLocal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-950/40 disabled:opacity-50"
            >
              <FolderCheck className="w-4 h-4" />
              {isSavingLocal ? 'Salvando no Diretório Local...' : 'Salvar no Diretório Local'}
            </button>

            <button
              onClick={handleDownloadOnly}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-xl transition flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-400" />
              Baixar {defaultFilename}
            </button>

            <button
              onClick={() => onNavigateToGit(defaultFilename, ancestorsResult.rawGedcomText)}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <GitBranch className="w-4 h-4 text-amber-400" />
              Enviar Ascendentes para o Git
            </button>

            <button
              onClick={() => setShowRawCode(!showRawCode)}
              className="px-3 py-2 text-xs text-slate-300 hover:text-white rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5 ml-auto"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              {showRawCode ? 'Ocultar Código GEDCOM' : 'Ver Código GEDCOM Gerado'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification if saved to local directory */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-start gap-3 animate-in fade-in duration-300 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm text-emerald-200">Arquivo Salvo com Sucesso no Diretório Local!</h4>
            <p className="mt-1 text-slate-300">
              O arquivo foi gravado no servidor local em: <code className="bg-slate-900 px-2 py-0.5 rounded text-emerald-400 font-mono">{saveSuccessMsg.path}</code>
            </p>
            <p className="mt-0.5 text-slate-400">
              Tamanho do arquivo: <span className="font-mono text-slate-200">{saveSuccessMsg.size} bytes</span>. Uma cópia para download também foi enviada ao seu navegador.
            </p>
          </div>
        </div>
      )}

      {/* Verification & Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Direct Ancestors Count */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Ascendentes Diretos de {rootId}</span>
            <TreeDeciduous className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {ancestorsResult.totalDirectAncestors}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">
            {generationKeys.length} gerações mapeadas
          </span>
        </div>

        {/* Card 2: Ancestral Marriages */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Casamentos Ancestrais</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {ancestorsResult.totalFamilies}
          </div>
          <span className="text-[11px] text-amber-400 font-medium">
            Com datas e locais (1 MARR) preservados
          </span>
        </div>

        {/* Card 3: Filter Comparison */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Filtro Exclusivo Aplicado</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs text-slate-300 mt-1">
            <div className="flex justify-between py-0.5">
              <span>Total no arquivo completo:</span>
              <strong className="text-white font-mono">{doc.individuals.size}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-indigo-300">
              <span>Ascendentes diretos:</span>
              <strong className="font-mono">{ancestorsResult.totalDirectAncestors}</strong>
            </div>
            <div className="flex justify-between py-0.5 text-slate-400">
              <span>Colaterais/descendentes excluídos:</span>
              <strong className="font-mono">{excludedIndividuals.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Code Preview if toggled */}
      {showRawCode && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 font-mono">
                {defaultFilename} — Conteúdo GEDCOM Filtrado
              </h3>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(ancestorsResult.rawGedcomText)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded bg-slate-800"
            >
              Copiar GEDCOM
            </button>
          </div>
          <pre className="text-xs font-mono text-emerald-400 bg-slate-900/80 p-4 rounded-xl overflow-x-auto max-h-96 leading-relaxed">
            {ancestorsResult.rawGedcomText}
          </pre>
        </div>
      )}

      {/* Generations Tree breakdown */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TreeDeciduous className="w-4 h-4 text-indigo-400" />
            Linhagem Genealógica por Gerações (Ahnentafel)
          </h3>

          {/* Root selector dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Pessoa Raiz:</span>
            <select
              value={rootId}
              onChange={e => onChangeRootId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              {Array.from(doc.individuals.values()).map(ind => (
                <option key={ind.id} value={ind.id}>
                  {ind.id}: {ind.name || `${ind.givenName} ${ind.surname}`.trim()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {generationKeys.map(gen => {
          const nodes = generationGroups[gen];
          const genTitles: Record<number, string> = {
            0: 'Geração 0: Pessoa Raiz',
            1: 'Geração 1: Pais Biológicos',
            2: 'Geração 2: Avós (Paternos e Maternos)',
            3: 'Geração 3: Bisavós',
            4: 'Geração 4: Trisavós',
          };

          return (
            <div key={gen} className="border border-slate-800 rounded-2xl bg-slate-900/50 p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center font-mono">
                    G{gen}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {genTitles[gen] || `Geração ${gen}`}
                  </h4>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {nodes.length} {nodes.length === 1 ? 'ascendente' : 'ascendentes'}
                </span>
              </div>

              {/* Cards in this generation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {nodes.map(node => {
                  const ind = node.individual;
                  return (
                    <div
                      key={node.id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                            {node.id}
                          </span>
                          <span className="text-xs font-semibold text-indigo-300">
                            {node.relationship}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          Ahnentafel #{node.ahnentafelNumber}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white">
                        {ind.name || `${ind.givenName} ${ind.surname}`.trim() || 'Sem nome'}
                      </div>

                      <div className="text-xs text-slate-300 space-y-1 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                          <span>Nasc.: {ind.birthDate || '—'} {ind.birthPlace ? `em ${ind.birthPlace}` : ''}</span>
                        </div>

                        {ind.deathDate && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span>Óbito: {ind.deathDate} {ind.deathPlace ? `em ${ind.deathPlace}` : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Marriage information of parents for this lineage */}
                      {(node.marriageDate || node.marriagePlace) && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 flex items-center gap-1.5">
                          <Heart className="w-3 h-3 text-rose-400 flex-shrink-0" />
                          <span>
                            Casamento: <strong>{node.marriageDate || 'Data n/d'}</strong>{' '}
                            {node.marriagePlace ? `(${node.marriagePlace})` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Excluded Relatives Summary (Collateral Branches) */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Ramos Colaterais e Descendentes Corretamente Omitidos ({excludedIndividuals.length})
        </h4>
        <p className="text-xs text-slate-400 mb-3">
          De acordo com o padrão genealógico, o arquivo exportado omite os seguintes parentes que não são ascendentes diretos de {rootId}:
        </p>

        <div className="flex flex-wrap gap-2">
          {excludedIndividuals.map(ind => (
            <span
              key={ind.id}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/70 text-slate-400 border border-slate-700/60"
            >
              <strong className="text-slate-300 font-mono">{ind.id}:</strong>{' '}
              {ind.name || `${ind.givenName} ${ind.surname}`.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
