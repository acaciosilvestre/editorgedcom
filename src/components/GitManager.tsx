import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Send,
  RefreshCw,
  Folder,
  FileCode,
  Terminal,
  Key,
} from 'lucide-react';
import { pushGedcomToGitHub } from '../utils/githubApi';
import { GitStatusInfo, GitCommitRecord } from '../types/gedcom';

interface GitManagerProps {
  fullGedcomContent: string;
  ancestorsGedcomContent: string;
  defaultFileToSync?: string;
}

export const GitManager: React.FC<GitManagerProps> = ({
  fullGedcomContent,
  ancestorsGedcomContent,
  defaultFileToSync,
}) => {
  // Mode selection: Complete vs Ancestors
  const [selectedFileOption, setSelectedFileOption] = useState<'complete' | 'ancestors'>(
    defaultFileToSync?.includes('ascendentes') ? 'ancestors' : 'complete'
  );

  // GitHub Remote settings
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('gedcom_gh_token') || '');
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('gedcom_gh_repo') || '');
  const [githubBranch, setGithubBranch] = useState(() => localStorage.getItem('gedcom_gh_branch') || 'main');
  const [githubPath, setGithubPath] = useState(
    defaultFileToSync?.includes('ascendentes') ? 'ascendentes_I1.ged' : 'arvore_completa.ged'
  );
  const [commitMessage, setCommitMessage] = useState(
    'Atualização de arquivo GEDCOM com dados de casamento (data e local)'
  );

  // State flags for GitHub
  const [isPushingGitHub, setIsPushingGitHub] = useState(false);
  const [githubResult, setGithubResult] = useState<{
    success: boolean;
    commitSha?: string;
    commitUrl?: string;
    error?: string;
  } | null>(null);

  // Local Git State
  const [localGitStatus, setLocalGitStatus] = useState<GitStatusInfo | null>(null);
  const [localGitLogs, setLocalGitLogs] = useState<GitCommitRecord[]>([]);
  const [isOperatingLocal, setIsOperatingLocal] = useState(false);
  const [localGitMessage, setLocalGitMessage] = useState('');
  const [localCommitMsg, setLocalCommitMsg] = useState('Atualização de registros GEDCOM');

  // Load local Git status on mount
  useEffect(() => {
    fetchLocalGitStatus();
  }, []);

  const fetchLocalGitStatus = async () => {
    try {
      const res = await fetch('/api/git/status');
      if (res.ok) {
        const data = await res.json();
        setLocalGitStatus(data);
      }
      const logRes = await fetch('/api/git/log');
      if (logRes.ok) {
        const logData = await logRes.json();
        setLocalGitLogs(logData.commits || []);
      }
    } catch (err) {
      console.error('Failed to query local git:', err);
    }
  };

  const currentContent =
    selectedFileOption === 'ancestors' ? ancestorsGedcomContent : fullGedcomContent;

  const handlePushGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPushingGitHub(true);
    setGithubResult(null);

    // Save preferences to localStorage
    if (githubToken) localStorage.setItem('gedcom_gh_token', githubToken);
    if (githubRepo) localStorage.setItem('gedcom_gh_repo', githubRepo);
    if (githubBranch) localStorage.setItem('gedcom_gh_branch', githubBranch);

    try {
      const res = await pushGedcomToGitHub({
        token: githubToken,
        repo: githubRepo,
        branch: githubBranch,
        filePath: githubPath,
        commitMessage,
        content: currentContent,
      });
      setGithubResult(res);
    } catch (err: any) {
      setGithubResult({ success: false, error: err.message });
    } finally {
      setIsPushingGitHub(false);
    }
  };

  const handleInitLocalGit = async () => {
    setIsOperatingLocal(true);
    setLocalGitMessage('');
    try {
      const res = await fetch('/api/git/init', { method: 'POST' });
      const data = await res.json();
      setLocalGitMessage(data.message || 'Git inicializado');
      await fetchLocalGitStatus();
    } catch (err: any) {
      setLocalGitMessage(`Erro: ${err.message}`);
    } finally {
      setIsOperatingLocal(false);
    }
  };

  const handleLocalCommit = async () => {
    setIsOperatingLocal(true);
    setLocalGitMessage('');
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: localCommitMsg }),
      });
      const data = await res.json();
      setLocalGitMessage(data.message || 'Commit realizado com sucesso');
      await fetchLocalGitStatus();
    } catch (err: any) {
      setLocalGitMessage(`Erro: ${err.message}`);
    } finally {
      setIsOperatingLocal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-amber-400" />
              Sincronização e Envio para o Git
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              Controle de Versão
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Envie seus arquivos GEDCOM diretamente para um repositório remoto (GitHub) ou faça commits no repositório Git local.
          </p>
        </div>

        {/* File selector pill toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              setSelectedFileOption('complete');
              setGithubPath('arvore_completa.ged');
            }}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              selectedFileOption === 'complete'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Árvore Completa
          </button>
          <button
            onClick={() => {
              setSelectedFileOption('ancestors');
              setGithubPath('ascendentes_I1.ged');
            }}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              selectedFileOption === 'ancestors'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Apenas Ascendentes (@I1@)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Panel: GitHub Remote Commit & Push */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white">
                <GitPullRequest className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Enviar para o GitHub (Push Direto)</h3>
                <p className="text-xs text-slate-400">Cria ou atualiza o arquivo diretamente no repositório</p>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">
              REST API v3
            </span>
          </div>

          <form onSubmit={handlePushGitHub} className="space-y-4 text-xs">
            {/* Repo and Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  Repositório GitHub (usuario/repo) *
                </label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={e => setGithubRepo(e.target.value)}
                  placeholder="ex: meu-usuario/minha-genealogia"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={githubBranch}
                  onChange={e => setGithubBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Target Path in Repo */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Caminho do Arquivo no Repositório *
              </label>
              <input
                type="text"
                value={githubPath}
                onChange={e => setGithubPath(e.target.value)}
                placeholder="ex: gedcom/arvore.ged ou ascendentes_I1.ged"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Personal Access Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  GitHub Personal Access Token (PAT) *
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  Gerar Token <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Necessita da permissão <code className="text-amber-300">repo</code> (ou <code className="text-amber-300">contents:write</code> em fine-grained tokens).
              </p>
            </div>

            {/* Commit Message */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Mensagem do Commit *
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* File Info Preview */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>
                  Arquivo a enviar:{' '}
                  <strong className="text-white font-mono">{githubPath}</strong>
                </span>
              </div>
              <span className="font-mono text-slate-400">
                {currentContent.length} caracteres ({Math.round(currentContent.length / 1024)} KB)
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPushingGitHub}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 text-xs disabled:opacity-50"
            >
              {isPushingGitHub ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enviando para o GitHub...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar para o GitHub Agora
                </>
              )}
            </button>
          </form>

          {/* GitHub Push Result Banner */}
          {githubResult && (
            <div
              className={`p-4 rounded-xl text-xs border ${
                githubResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {githubResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {githubResult.success ? 'Commit e Push Concluídos com Sucesso!' : 'Falha ao Enviar'}
                  </h4>
                  {githubResult.success ? (
                    <div className="mt-1 space-y-1">
                      <p>
                        O arquivo GEDCOM foi salvo e versionado no seu repositório no GitHub.
                      </p>
                      {githubResult.commitSha && (
                        <p className="font-mono text-[11px] text-slate-300">
                          Commit SHA: {githubResult.commitSha.slice(0, 10)}
                        </p>
                      )}
                      {githubResult.commitUrl && (
                        <a
                          href={githubResult.commitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-300 underline font-semibold mt-1"
                        >
                          Ver Commit no GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-rose-300">{githubResult.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Panel: Local Project Git */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white">
                <Terminal className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Git Local no Servidor</h3>
                <p className="text-xs text-slate-400">Repositório Git do projeto local</p>
              </div>
            </div>
            <button
              onClick={fetchLocalGitStatus}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Atualizar status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Local Status */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status do Git:</span>
              {localGitStatus?.initialized ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Inicializado ({localGitStatus.branch || 'main'})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Não inicializado
                </span>
              )}
            </div>

            {localGitStatus?.initialized ? (
              <div>
                <span className="text-slate-400 block mb-1">Arquivos modificados:</span>
                <pre className="p-2 rounded bg-slate-900 text-slate-300 font-mono text-[11px] max-h-24 overflow-y-auto">
                  {localGitStatus.statusText || 'Nenhuma alteração pendente (Working tree limpa)'}
                </pre>
              </div>
            ) : (
              <button
                onClick={handleInitLocalGit}
                disabled={isOperatingLocal}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition"
              >
                Inicializar Git Local (git init)
              </button>
            )}
          </div>

          {/* Local Commit Action */}
          {localGitStatus?.initialized && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
              <label className="block text-slate-300 font-semibold">
                Mensagem do Commit Local:
              </label>
              <input
                type="text"
                value={localCommitMsg}
                onChange={e => setLocalCommitMsg(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleLocalCommit}
                disabled={isOperatingLocal}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <GitCommit className="w-3.5 h-3.5" />
                {isOperatingLocal ? 'Commitando...' : 'Fazer Commit Local (git add & commit)'}
              </button>
            </div>
          )}

          {localGitMessage && (
            <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-sky-200 text-xs">
              {localGitMessage}
            </div>
          )}

          {/* Recent Commits Log */}
          {localGitLogs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-300">Últimos Commits Locais:</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {localGitLogs.map(c => (
                  <div key={c.hash} className="p-2 rounded bg-slate-950/50 border border-slate-800/60 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-amber-400 font-bold">{c.hash}</span>
                      <span className="text-slate-500">{c.date}</span>
                    </div>
                    <p className="text-slate-200 text-xs mt-0.5 truncate">{c.subject}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
