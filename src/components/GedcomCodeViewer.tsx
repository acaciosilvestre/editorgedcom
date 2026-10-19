import React, { useState } from 'react';
import { Code, Download, Copy, Check, Search, FileText } from 'lucide-react';

interface GedcomCodeViewerProps {
  fullCode: string;
  ancestorsCode: string;
}

export const GedcomCodeViewer: React.FC<GedcomCodeViewerProps> = ({
  fullCode,
  ancestorsCode,
}) => {
  const [selectedView, setSelectedView] = useState<'full' | 'ancestors'>('full');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const activeContent = selectedView === 'full' ? fullCode : ancestorsCode;
  const filename = selectedView === 'full' ? 'arvore_completa.ged' : 'ascendentes_I1.ged';

  const lines = activeContent.split('\n');
  const filteredLines = searchQuery.trim()
    ? lines
        .map((line, idx) => ({ line, num: idx + 1 }))
        .filter(item => item.line.toLowerCase().includes(searchQuery.toLowerCase()))
    : lines.map((line, idx) => ({ line, num: idx + 1 }));

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Viewer Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-400" />
              Visualizador de Código GEDCOM
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
              {lines.length} linhas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Examine a estrutura padrão com suporte a tags <code className="text-amber-300">1 MARR</code>, <code className="text-amber-300">2 DATE</code> e <code className="text-amber-300">2 PLAC</code>.
          </p>
        </div>

        {/* Toggle between Full Tree and Ancestors */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center">
            <button
              onClick={() => setSelectedView('full')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                selectedView === 'full'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Árvore Completa
            </button>
            <button
              onClick={() => setSelectedView('ancestors')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                selectedView === 'ancestors'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ascendentes de @I1@
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar .GED
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filtrar linhas de código (ex: MARR, PLAC, DATE, @I1@, @F1@)..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
        />
      </div>

      {/* Code Display Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
        <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Arquivo: <strong className="text-slate-200">{filename}</strong></span>
          <span>Exibindo {filteredLines.length} de {lines.length} linhas</span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto space-y-0.5 leading-relaxed">
          {filteredLines.map(item => {
            const isMarr = item.line.includes('MARR');
            const isDate = item.line.includes('DATE');
            const isPlac = item.line.includes('PLAC');
            const isIndi = item.line.includes('INDI');
            const isFam = item.line.includes('FAM');
            const isLevel0 = item.line.startsWith('0 ');

            let lineClass = 'text-slate-300';
            if (isLevel0) lineClass = 'text-amber-400 font-bold';
            else if (isMarr) lineClass = 'text-rose-400 font-bold';
            else if (isDate) lineClass = 'text-sky-300 font-semibold';
            else if (isPlac) lineClass = 'text-emerald-300 font-semibold';
            else if (isIndi || isFam) lineClass = 'text-amber-300';

            return (
              <div key={item.num} className="flex hover:bg-slate-900/60 px-2 py-0.5 rounded transition">
                <span className="w-12 text-slate-600 select-none text-right pr-4 flex-shrink-0">
                  {item.num}
                </span>
                <span className={lineClass}>{item.line}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
