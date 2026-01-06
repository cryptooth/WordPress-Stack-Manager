const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const session = require('express-session');

const app = express();
const PORT = 3000;
const SITES_DIR = '/app/sites';
const TEMPLATE_DIR = path.join(SITES_DIR, 'template');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

app.use(express.json());
app.use(session({
    secret: 'wp-manager-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Auth Middleware
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Routes
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Serve frontend assets
app.use(express.static('public'));


// PROTECTED API
function parseEnv(content) {
    const config = {};
    const lines = content.split('\n');
    for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) config[match[1].trim()] = match[2].trim();
    }
    return config;
}

app.get('/api/sites', requireAuth, async (req, res) => {
    try {
        const sites = [];
        const items = await fs.readdir(SITES_DIR, { withFileTypes: true });

        for (const item of items) {
            if (item.isDirectory() && item.name !== 'template' && item.name !== 'lost+found') {
                const envPath = path.join(SITES_DIR, item.name, '.env');
                if (await fs.pathExists(envPath)) {
                    const envContent = await fs.readFile(envPath, 'utf8');
                    const config = parseEnv(envContent);
                    sites.push({
                        name: item.name,
                        appPort: parseInt(config.APP_PORT) || 0,
                        dbPort: parseInt(config.DB_PORT) || 0,
                        pmaPort: parseInt(config.PMA_PORT) || 0,
                        sftpPort: parseInt(config.SFTP_PORT) || 0
                    });
                }
            }
        }
        res.json(sites);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to list sites' });
    }
});

app.get('/api/stats', requireAuth, (req, res) => {
    exec('docker stats --no-stream --format "{{json .}}"', (error, stdout, stderr) => {
        if (error) {
            console.error(`Stats error: ${error}`);
            return res.status(500).json({ error: 'Failed to fetch stats' });
        }
        try {
            // Docker stats outputs one JSON object per line.
            const lines = stdout.trim().split('\n');
            // Filter out empty lines and parse
            const stats = lines.filter(line => line).map(line => JSON.parse(line));
            res.json(stats);
        } catch (parseError) {
            console.error(`Parse error: ${parseError}`);
            res.status(500).json({ error: 'Failed to parse stats' });
        }
    });
});

app.post('/api/sites', requireAuth, async (req, res) => {
    try {
        const { domain, dbName, dbUser, dbPassword, dbRootPassword, sftpUser, sftpPassword } = req.body;

        if (!domain || !dbPassword || !dbRootPassword || !sftpUser || !sftpPassword) return res.status(400).json({ error: 'Missing required fields' });

        const safeDomain = domain.replace(/[^a-z0-9.-]/g, '');
        const targetDir = path.join(SITES_DIR, safeDomain);

        if (await fs.pathExists(targetDir)) {
            return res.status(400).json({ error: 'Site already exists' });
        }

        const finalDbName = dbName || 'wordpress';
        const finalDbUser = dbUser || 'user';

        // Internal port scan (no fetch)
        const items = await fs.readdir(SITES_DIR, { withFileTypes: true });
        const usedAppPorts = new Set();

        for (const item of items) {
            if (item.isDirectory() && item.name !== 'template' && item.name !== 'lost+found') {
                const envPath = path.join(SITES_DIR, item.name, '.env');
                if (await fs.pathExists(envPath)) {
                    const envContent = await fs.readFile(envPath, 'utf8');
                    const config = parseEnv(envContent);
                    if (config.APP_PORT) usedAppPorts.add(parseInt(config.APP_PORT));
                }
            }
        }

        let nextAppPort = 8001;
        let nextDbPort = 3301;
        let nextPmaPort = 8801;
        let nextSftpPort = 2201;

        while (usedAppPorts.has(nextAppPort)) {
            nextAppPort++;
            nextDbPort++;
            nextPmaPort++;
            nextSftpPort++;
        }

        await fs.copy(TEMPLATE_DIR, targetDir);

        const envExamplePath = path.join(targetDir, '.env.example');
        const envPath = path.join(targetDir, '.env');
        let envContent = await fs.readFile(envExamplePath, 'utf8');

        envContent = envContent.replace(/DB_ROOT_PASSWORD=.*/g, `DB_ROOT_PASSWORD=${dbRootPassword}`);
        envContent = envContent.replace(/DB_NAME=.*/g, `DB_NAME=${finalDbName}`);
        envContent = envContent.replace(/DB_USER=.*/g, `DB_USER=${finalDbUser}`);
        envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${dbPassword}`);

        envContent = envContent.replace(/APP_PORT=.*\n?/g, '');
        envContent = envContent.replace(/DB_PORT=.*\n?/g, '');
        envContent = envContent.replace(/PMA_PORT=.*\n?/g, '');
        envContent = envContent.replace(/SFTP_PORT=.*\n?/g, '');
        envContent = envContent.replace(/SFTP_USER=.*\n?/g, '');
        envContent = envContent.replace(/SFTP_PASSWORD=.*\n?/g, '');

        envContent += `\nAPP_PORT=${nextAppPort}\nDB_PORT=${nextDbPort}\nPMA_PORT=${nextPmaPort}\nSFTP_PORT=${nextSftpPort}\nSFTP_USER=${sftpUser}\nSFTP_PASSWORD=${sftpPassword}\n`;

        await fs.writeFile(envPath, envContent);

        exec(`docker compose up -d --build`, { cwd: targetDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).json({ error: 'Docker start failed' });
            }
            res.json({
                success: true,
                config: {
                    domain: safeDomain,
                    dbName: finalDbName,
                    dbUser: finalDbUser,
                    dbPassword: dbPassword,
                    ports: { app: nextAppPort, db: nextDbPort, pma: nextPmaPort, sftp: nextSftpPort },
                    sftp: { user: sftpUser, password: sftpPassword }
                }
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Creation failed' });
    }
});

// Delete site
app.delete('/api/sites/:domain', requireAuth, async (req, res) => {
    try {
        const { domain } = req.params;
        const safeDomain = domain.replace(/[^a-z0-9.-]/g, '');
        const targetDir = path.join(SITES_DIR, safeDomain);

        if (!domain || !await fs.pathExists(targetDir)) {
            return res.status(404).json({ error: 'Site not found' });
        }

        // Security check: prevent deleting system folders
        if (safeDomain === 'template' || safeDomain === '.' || safeDomain === '..') {
            return res.status(400).json({ error: 'Cannot delete system folders' });
        }

        console.log(`Deleting site: ${safeDomain}`);

        // 1. Stop containers and remove volumes
        exec(`docker compose down -v`, { cwd: targetDir }, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Down error: ${error}`);
                // Proceed anyway to try deleting folder? Maybe risky if busy. 
                // But usually we want to force delete. Let's return error for now.
                return res.status(500).json({ error: 'Docker down failed' });
            }

            // 2. Remove directory
            try {
                await fs.remove(targetDir);
                console.log(`Deleted directory: ${targetDir}`);
                res.json({ success: true });
            } catch (fsErr) {
                console.error(fsErr);
                res.status(500).json({ error: 'File cleanup failed' });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Manager running on http://localhost:${PORT}`);
});
