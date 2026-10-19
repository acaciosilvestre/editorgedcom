import React, { useState, useEffect } from 'react';
import {
  Folder,
  Download,
  FileText,
  RotateCw,
  Clock,
  HardDrive,
  CheckCircle2,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { SavedLocalFile } from '../types/gedcom';

interface LocalFilesManagerProps {
  onLoadGedcomFile: (content: string, filename: string) => void;
}

export const LocalFilesManager: React.FC<LocalFilesManagerProps> = ({ onLoadGedcomFile }) => {
  const [files, setFiles] = useState<SavedLocalFile[]>([]);
  const [directoryPath, setDirectoryPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ filename: string; content: string } | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/saved-gedcoms');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setDirectoryPath(data.directory || '');
      }
    } catch (err) {
      console.error('Failed to fetch local files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (filename: string) => {
    try {
      const res = await fetch(`/api/get-gedcom?file=${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const handlePreview = async (filename: string) => {
    try {
      const res = await fetch(`/api/get-gedcom?file=${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewContent(data);
      }
    } catch (err) {
      console.error('Failed to preview file:', err);
    }
  };

  const handleLoadToEditor = async (filename: string) => {
    try {
      const res = await fetch(`/api/get-gedcom?file=${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        onLoadGedcomFile(data.content, filename);
      }
    } catch (err) {
      console.error('Failed to load into editor:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              Arquivos GEDCOM Salvos no Diretório Local
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
              {files.length} arquivos salvos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Diretório de armazenamento no servidor local: <code className="text-slate-300 font-mono">{directoryPath || './gedcom_files'}</code>
          </p>
        </div>

        <button
          onClick={fetchFiles}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition flex items-center gap-1.5 self-start md:self-auto border border-slate-700"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </button>
      </div>

      {/* Files Grid / List */}
      {files.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Folder className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">Nenhum arquivo salvo ainda</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Utilize o botão "Salvar GEDCOM" ou "Salvar no Diretório Local" na aba de Ascendentes para gravar arquivos no disco.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map(f => {
            const isAncestors = f.filename.includes('ascendentes');
            return (
              <div
                key={f.filename}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isAncestors
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {isAncestors ? 'Ascendentes Diretos' : 'Árvore Completa'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {Math.round(f.sizeBytes / 1024 * 10) / 10} KB
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white font-mono break-all mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    {f.filename}
                  </h3>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-4">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Modificado: {new Date(f.updatedAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(f.filename)}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center justify-center gap-1"
                    title="Baixar arquivo no navegador"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    Baixar
                  </button>

                  <button
                    onClick={() => handlePreview(f.filename)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    title="Visualizar conteúdo"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleLoadToEditor(f.filename)}
                    className="py-1.5 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg transition"
                    title="Carregar este arquivo no editor atual"
                  >
                    Abrir no Editor
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Drawer/Modal */}
      {previewContent && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              {previewContent.filename}
            </h3>
            <button
              onClick={() => setPreviewContent(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fechar Pré-visualização
            </button>
          </div>
          <pre className="text-xs font-mono text-emerald-400 bg-slate-900/90 p-4 rounded-xl overflow-x-auto max-h-80 leading-relaxed">
            {previewContent.content}
          </pre>
        </div>
      )}
    </div>
  );
};
