import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { defineConfig, Plugin } from 'vite';

const execAsync = promisify(exec);

// Custom plugin to provide local file saving and Git CLI capabilities
function gedcomApiPlugin(): Plugin {
  return {
    name: 'gedcom-backend-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // Helper to read JSON body
        const readBody = async (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        const jsonResponse = (data: any, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        try {
          const gedcomDir = path.resolve(process.cwd(), 'gedcom_files');
          if (!fs.existsSync(gedcomDir)) {
            fs.mkdirSync(gedcomDir, { recursive: true });
          }

          // 1. Save GEDCOM file to local directory
          if (url === '/api/save-gedcom' && req.method === 'POST') {
            const body = await readBody();
            const { filename, content, type } = body;
            if (!filename || !content) {
              return jsonResponse({ error: 'Filename e content são obrigatórios' }, 400);
            }

            // Sanitize filename
            const safeName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
            const targetPath = path.join(gedcomDir, safeName);
            fs.writeFileSync(targetPath, content, 'utf8');

            const stats = fs.statSync(targetPath);
            return jsonResponse({
              success: true,
              filename: safeName,
              path: targetPath,
              relativePath: `gedcom_files/${safeName}`,
              sizeBytes: stats.size,
              createdAt: stats.birthtime,
              updatedAt: stats.mtime,
              type: type || 'complete',
            });
          }

          // 2. List all saved GEDCOM files in local directory
          if (url === '/api/saved-gedcoms' && req.method === 'GET') {
            const files = fs.readdirSync(gedcomDir);
            const list = files
              .filter(f => f.endsWith('.ged'))
              .map(f => {
                const p = path.join(gedcomDir, f);
                const s = fs.statSync(p);
                return {
                  filename: f,
                  relativePath: `gedcom_files/${f}`,
                  sizeBytes: s.size,
                  updatedAt: s.mtime,
                };
              })
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            return jsonResponse({ files: list, directory: gedcomDir });
          }

          // 3. Load or download saved GEDCOM
          if (url?.startsWith('/api/get-gedcom') && req.method === 'GET') {
            const params = new URL(req.url || '', 'http://localhost').searchParams;
            const file = params.get('file');
            if (!file) {
              return jsonResponse({ error: 'Nome do arquivo não fornecido' }, 400);
            }
            const safeName = file.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
            const targetPath = path.join(gedcomDir, safeName);
            if (!fs.existsSync(targetPath)) {
              return jsonResponse({ error: 'Arquivo não encontrado' }, 404);
            }
            const content = fs.readFileSync(targetPath, 'utf8');
            return jsonResponse({ filename: safeName, content });
          }

          // 3.1 Download entire application project as ZIP
          if (url === '/api/download-project-zip' && req.method === 'GET') {
            const zipPath = path.resolve('/tmp/editor-gedcom.zip');
            await execAsync(`python3 -c "
import zipfile, os
exclude_dirs = {'node_modules', '.git', 'dist'}
with zipfile.ZipFile('${zipPath}', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            p = os.path.join(root, f)
            z.write(p, p)
"`);
            const fileContent = fs.readFileSync(zipPath);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="editor-gedcom-genealogico.zip"');
            res.end(fileContent);
            return;
          }

          // 4. Git status
          if (url === '/api/git/status' && req.method === 'GET') {
            try {
              const isGit = fs.existsSync(path.resolve(process.cwd(), '.git'));
              if (!isGit) {
                return jsonResponse({
                  initialized: false,
                  branch: null,
                  statusText: 'Git não inicializado neste diretório',
                  hasChanges: false,
                });
              }

              const { stdout: branchOut } = await execAsync('git branch --show-current || echo "main"');
              const { stdout: statusOut } = await execAsync('git status --short');
              const { stdout: remoteOut } = await execAsync('git remote -v || true');

              return jsonResponse({
                initialized: true,
                branch: branchOut.trim() || 'main',
                statusText: statusOut.trim(),
                hasChanges: statusOut.trim().length > 0,
                remotes: remoteOut.trim(),
              });
            } catch (err: any) {
              return jsonResponse({ initialized: false, error: err.message });
            }
          }

          // 5. Git init
          if (url === '/api/git/init' && req.method === 'POST') {
            await execAsync('git init');
            await execAsync('git config user.name "GEDCOM Genealogista"');
            await execAsync('git config user.email "genealogia@gedcom.local"');
            return jsonResponse({ success: true, message: 'Repositório Git inicializado com sucesso!' });
          }

          // 6. Git commit
          if (url === '/api/git/commit' && req.method === 'POST') {
            const body = await readBody();
            const message = body.message || 'Atualização de arquivos GEDCOM e dados genealógicos';
            
            // Ensure git config
            await execAsync('git config user.name "GEDCOM Genealogista" || true');
            await execAsync('git config user.email "genealogia@gedcom.local" || true');

            // Stage gedcom files or all
            await execAsync('git add gedcom_files/ || git add .');
            const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}" || echo "Nada para commitar"`);
            
            return jsonResponse({
              success: true,
              output: stdout.trim(),
              message: 'Commit realizado com sucesso!',
            });
          }

          // 7. Git commit log
          if (url === '/api/git/log' && req.method === 'GET') {
            try {
              const { stdout } = await execAsync('git log -n 10 --pretty=format:"%h|%an|%ar|%s" || true');
              const commits = stdout
                .trim()
                .split('\n')
                .filter(Boolean)
                .map(line => {
                  const [hash, author, date, subject] = line.split('|');
                  return { hash, author, date, subject };
                });
              return jsonResponse({ commits });
            } catch {
              return jsonResponse({ commits: [] });
            }
          }

          // 8. Git remote push
          if (url === '/api/git/push' && req.method === 'POST') {
            const body = await readBody();
            const { remoteUrl, branch = 'main', token } = body;

            if (!remoteUrl) {
              return jsonResponse({ error: 'URL do repositório remoto não fornecida' }, 400);
            }

            let pushUrl = remoteUrl;
            if (token && remoteUrl.startsWith('https://')) {
              // Inject token into https url
              const cleanUrl = remoteUrl.replace(/^https:\/\//, '');
              pushUrl = `https://${encodeURIComponent(token)}@${cleanUrl}`;
            }

            try {
              await execAsync(`git remote remove origin || true`);
              await execAsync(`git remote add origin ${pushUrl}`);
              const { stdout, stderr } = await execAsync(`git push -u origin ${branch}`);
              return jsonResponse({ success: true, output: stdout || stderr, message: 'Push realizado com sucesso!' });
            } catch (err: any) {
              return jsonResponse({ success: false, error: err.message }, 500);
            }
          }

        } catch (error: any) {
          console.error('API Error:', error);
          return jsonResponse({ error: error.message || 'Erro interno no servidor' }, 500);
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gedcomApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
