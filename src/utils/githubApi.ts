/**
 * Utility to commit and push GEDCOM files directly to a GitHub repository using GitHub REST API.
 */

export interface GitHubPushConfig {
  token: string;
  repo: string; // e.g. "usuario/meu-gedcom"
  branch: string; // e.g. "main"
  filePath: string; // e.g. "genealogia/arvore_completa.ged" or "ascendentes_I1.ged"
  commitMessage: string;
  content: string; // GEDCOM text
}

export interface GitHubPushResult {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  contentUrl?: string;
  error?: string;
}

export async function pushGedcomToGitHub(config: GitHubPushConfig): Promise<GitHubPushResult> {
  const { token, repo, branch, filePath, commitMessage, content } = config;

  if (!token) {
    return { success: false, error: 'Token de Acesso Pessoal (PAT) do GitHub não informado.' };
  }
  if (!repo || !repo.includes('/')) {
    return { success: false, error: 'Repositório inválido. Utilize o formato: usuario/nome-do-repositorio' };
  }
  if (!filePath) {
    return { success: false, error: 'Caminho do arquivo no repositório é obrigatório (ex: arvore.ged).' };
  }

  const [owner, repoName] = repo.split('/');
  const cleanPath = filePath.replace(/^\/+/, '');
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${cleanPath}`;

  const headers = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Check if the file already exists to get its current blob SHA (required for updating)
    let existingSha: string | undefined;
    try {
      const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch || 'main')}`, {
        headers,
      });
      if (getRes.ok) {
        const fileData = await getRes.json();
        existingSha = fileData.sha;
      }
    } catch {
      // File doesn't exist yet, which is completely fine for initial commit
    }

    // 2. Base64 encode the GEDCOM content with UTF-8 support
    const utf8Bytes = new TextEncoder().encode(content);
    let binary = '';
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64Content = btoa(binary);

    // 3. Prepare payload for GitHub PUT Contents API
    const payload: any = {
      message: commitMessage || `Atualização de arquivo GEDCOM (${cleanPath})`,
      content: base64Content,
      branch: branch || 'main',
    };

    if (existingSha) {
      payload.sha = existingSha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      const msg = errJson.message || `Erro HTTP ${putRes.status}: ${putRes.statusText}`;
      if (putRes.status === 401 || putRes.status === 403) {
        return {
          success: false,
          error: `Falha de autenticação no GitHub: ${msg}. Verifique se o seu Token tem a permissão 'repo' ou 'contents:write'.`,
        };
      }
      if (putRes.status === 404) {
        return {
          success: false,
          error: `Repositório ${repo} ou branch ${branch} não encontrado. Verifique se o nome está correto.`,
        };
      }
      return { success: false, error: `Erro no GitHub: ${msg}` };
    }

    const resData = await putRes.json();
    return {
      success: true,
      commitSha: resData.commit?.sha,
      commitUrl: resData.commit?.html_url,
      contentUrl: resData.content?.html_url,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro de rede ao conectar com GitHub: ${err.message || 'Falha de comunicação'}`,
    };
  }
}
