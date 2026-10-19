import React, { useRef, useState } from 'react';
import {
  GitBranch,
  Upload,
  Download,
  Users,
  Heart,
  Save,
  RotateCcw,
  Sparkles,
  TreeDeciduous,
  Laptop,
  Archive,
  X,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import { GedcomDocument } from '../types/gedcom';

interface HeaderProps {
  doc: GedcomDocument;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetSample: () => void;
  onImportGedcom: (content: string, filename: string) => void;
  onSaveFullGedcom: () => void;
  onOpenAncestorsTab: () => void;
  onOpenGitTab: () => void;
  isSaving: boolean;
  totalDirectAncestors: number;
}

export const Header: React.FC<HeaderProps> = ({
  doc,
  activeTab,
  setActiveTab,
  onResetSample,
  onImportGedcom,
  onSaveFullGedcom,
  onOpenAncestorsTab,
  onOpenGitTab,
  isSaving,
  totalDirectAncestors,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSaveAppModal, setShowSaveAppModal] = useState(false);

  const totalIndis = doc.individuals.size;
  const totalFams = doc.families.size;
  let marrWithData = 0;
  doc.families.forEach(f => {
    if (f.marriageDate || f.marriagePlace) marrWithData++;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        onImportGedcom(content, file.name);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadZip = () => {
    const a = document.createElement('a');
    a.href = '/api/download-project-zip';
    a.download = 'editor-gedcom-genealogico.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top bar with title and quick actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold">
              <TreeDeciduous className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                  Editor GEDCOM Genealógico
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  GEDCOM 5.5.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Edição de casamento (data/local), exportação de ascendentes diretos de @I1@ e sincronização Git
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".ged,.gedcom,text/plain"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
              title="Carregar arquivo GEDCOM local"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              Importar .GED
            </button>

            <button
              onClick={onResetSample}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 transition-all"
              title="Restaurar dados de exemplo com @I1@ e seus ascendentes"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Carregar Exemplo
            </button>

            <button
              onClick={onSaveFullGedcom}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-950 font-semibold disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Salvando...' : 'Salvar GEDCOM'}
            </button>

            <button
              onClick={onOpenAncestorsTab}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-950 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ascendentes de @I1@
            </button>

            <button
              onClick={onOpenGitTab}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all"
            >
              <GitBranch className="w-3.5 h-3.5 text-amber-400" />
              Enviar para Git
            </button>

            <button
              onClick={() => setShowSaveAppModal(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/60 flex items-center gap-1.5 transition-all shadow-sm"
              title="Como salvar e rodar este aplicativo no seu computador"
            >
              <Laptop className="w-3.5 h-3.5 text-sky-400" />
              Salvar App no Computador
            </button>
          </div>
        </div>

        {/* Stats Pill Row */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Indivíduos:</span>
              <strong className="text-white font-mono">{totalIndis}</strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Famílias:</span>
              <strong className="text-white font-mono">{totalFams}</strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Casamentos c/ Data ou Local:</span>
              <strong className="text-emerald-400 font-mono">
                {marrWithData} / {totalFams}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <TreeDeciduous className="w-4 h-4 text-indigo-400" />
              <span>Ascendentes Diretos de @I1@:</span>
              <strong className="text-indigo-400 font-mono">{totalDirectAncestors}</strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Suporte ativo para tags <strong>1 MARR</strong>, <strong>2 DATE</strong>, <strong>2 PLAC</strong></span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto no-scrollbar border-b border-slate-800 -mb-3 pb-1">
          {[
            { id: 'families', label: 'Casamentos & Famílias', icon: Heart, badge: marrWithData },
            { id: 'individuals', label: 'Todos os Indivíduos', icon: Users, badge: totalIndis },
            { id: 'ancestors', label: 'Ascendentes Diretos de @I1@', icon: TreeDeciduous, highlight: true },
            { id: 'git', label: 'Enviar para o Git', icon: GitBranch },
            { id: 'saved', label: 'Arquivos Locais Salvos', icon: Save },
            { id: 'code', label: 'Visualizador GEDCOM', icon: Download },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-amber-500 text-amber-400 bg-slate-800/60 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                } ${tab.highlight ? 'text-indigo-300 hover:text-indigo-200' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal: Como Salvar o App no Computador */}
      {showSaveAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Como Salvar o Aplicativo no Seu Computador
                  </h2>
                  <p className="text-xs text-slate-400">
                    Três maneiras simples de ter este aplicativo na sua máquina
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveAppModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
              {/* Option 1: Baixar ZIP com 1 clique */}
              <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-sky-300 flex items-center gap-2">
                    <Archive className="w-4 h-4 text-sky-400" />
                    Opção 1: Baixar o Código Completo em ZIP (1 Clique)
                  </h4>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-semibold">
                    Recomendado
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Baixe o código-fonte completo deste projeto (React, Vite, TypeScript, Tailwind CSS, parser GEDCOM e rotas) pronto para rodar offline.
                </p>
                <button
                  onClick={handleDownloadZip}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition flex items-center gap-2 shadow-lg shadow-sky-950"
                >
                  <Download className="w-4 h-4" />
                  Baixar Projeto Completo (.ZIP)
                </button>
              </div>

              {/* How to run locally */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Como Rodar no seu Computador após descompactar o ZIP:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                  <li>Extraia o arquivo <code className="text-amber-300 font-mono">editor-gedcom-genealogico.zip</code> em uma pasta do seu computador.</li>
                  <li>Tenha o <strong>Node.js</strong> instalado (disponível gratuitamente em <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">nodejs.org</a>).</li>
                  <li>Abra o terminal na pasta extraída e digite:</li>
                </ol>
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto">
{`npm install
npm run dev`}
                </pre>
                <p className="text-slate-400 text-[11px]">
                  O aplicativo abrirá localmente no seu navegador em <span className="text-slate-200 font-mono">http://localhost:3000</span> sem precisar de internet!
                </p>
              </div>

              {/* Option 2: Salvar como Atalho / App no Navegador */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Opção 2: Salvar como Atalho / Web App na Área de Trabalho
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Você também pode usar este link direto no seu computador como um app:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li>No <strong>Google Chrome</strong>: clique nos três pontinhos no canto superior direito &gt; <em>Salvar e compartilhar</em> &gt; <em>Instalar página como app</em> (ou <em>Criar atalho</em>).</li>
                  <li>No <strong>Microsoft Edge</strong>: clique nos três pontinhos &gt; <em>Aplicativos</em> &gt; <em>Instalar este site como aplicativo</em>.</li>
                </ul>
              </div>

              {/* Option 3: Enviar para o GitHub e Clonar */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-amber-400" />
                  Opção 3: Sincronizar via Git / GitHub
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Use a aba <strong>"Enviar para o Git"</strong> para enviar seus dados e arquivos para um repositório no seu GitHub. Depois, basta rodar <code className="text-amber-300 font-mono">git clone https://github.com/seu-usuario/seu-repositorio.git</code> no seu computador.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setShowSaveAppModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                Entendido / Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
