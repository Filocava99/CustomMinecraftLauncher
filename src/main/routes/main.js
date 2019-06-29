module.exports = {

    createMainWindow: async function() {
        const ipcMain   = require('electron').ipcMain;
        const globals   = require('./globals');
        const ejse      = require('ejs-electron');
        const utils     = require('./utils');
        const rp        = require('request-promise');
        const path      = require('path');
        const url       = require('url');
        const fs        = require('fs');

        let serverStatus;

        ejse.listen();

        let stringPath;
        if(process.env.isDev){
            stringPath = ".."
        }else{
            stringPath = "/src/main"
        }

        globals.mainWin = new globals.BrowserWindow({width: 1024, height: 700, title: 'SoulNetwork Launcher',icon: './public/images/sn.png',transparent: true, frame: false, webPreferences: {
                nodeIntegration: true
            }});
        globals.mainWin.setResizable(false);
        globals.mainWin.setMenu(null);
        //globals.mainWin.webContents.openDevTools();

        //UPDATER
        const log = require('electron-log');
        const {autoUpdater} = require("electron-updater");

        autoUpdater.setFeedURL({
            provider: 'github',
            repo: 'SoulNetworkLauncher',
            owner: 'tigierrei',
            private: true,
            token: '2a47d60fe17d3c765116cd7d712e5f3974353a13'
        });

        autoUpdater.logger = log;
        autoUpdater.logger.transports.file.level = 'info';
        log.info('App starting...');

        function sendStatusToWindow(text) {
            log.info(text);
            globals.mainWin.webContents.send('message', text);
        }

        autoUpdater.on('checking-for-update', () => {
            sendStatusToWindow('Checking for update...');
        });
        autoUpdater.on('update-available', (info) => {
            sendStatusToWindow('Update available.');
        });
        autoUpdater.on('update-not-available', (info) => {
            sendStatusToWindow('Update not available.');
        });
        autoUpdater.on('error', (err) => {
            sendStatusToWindow('Error in auto-updater. ' + err);
        });
        autoUpdater.on('download-progress', (progressObj) => {
            let log_message = "Download speed: " + progressObj.bytesPerSecond;
            log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
            log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
            sendStatusToWindow(log_message);
        });
        autoUpdater.on('update-downloaded', (info) => {
            sendStatusToWindow('Update downloaded');
        });


        globals.mainWin.loadURL(
            url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/splash.ejs'),
                protocol: 'file:',
                slashes: true
            }));

        await autoUpdater.checkForUpdatesAndNotify();
        await require('./setup')();
        console.log(globals.launcherDir)

        // Creazione della finestra del browser.

        if(globals.launcherConfig.savedUsername && globals.launcherConfig.savedPassword) {
            var body = await utils.mojangAuthentication(globals.launcherConfig.savedUsername,globals.launcherConfig.savedPassword);
            if(body != null){
                globals.accessToken = body.accessToken;
                globals.uuid = body.selectedProfile.id;
                globals.username = body.selectedProfile.name;
                ejse.data({packets: globals.packets_list});
                globals.mainWin.loadURL(
                    url.format({
                        pathname:path.join(path.resolve(__dirname), stringPath, '/views/pack.ejs'),
                        protocol: 'file:',
                        slashes: true
                    }));
            }else{
                globals.mainWin.loadURL(
                    url.format({
                        pathname:path.join(path.resolve(__dirname), stringPath, '/views/index.ejs'),
                        protocol: 'file:',
                        slashes: true
                    }));
            }
        }else if(globals.launcherConfig.savedUsername){
            var body = JSON.parse(await rp({
                method: "GET",
                uri: "http://51.91.249.64:3004/token"
            }));
            globals.accessToken = body.accessToken;
            globals.uuid = body.uuid;
            globals.username = globals.launcherConfig.savedUsername;
            ejse.data({packets: globals.packets_list});
            globals.mainWin.loadURL(url.format({
                pathname: path.join(path.resolve(__dirname), stringPath, '/views/pack.ejs'),
                protocol: 'file:',
                slashes: true
            }));
        } else{
            globals.mainWin.loadURL(url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/index.ejs'),
                protocol: 'file:',
                slashes: true
            }));
        }

        // Emesso quando la finestra viene chiusa.
        globals.mainWin.on('closed', () => {
            // Eliminiamo il riferimento dell'oggetto window;  solitamente si tiene traccia delle finestre
            // in array se l'applicazione supporta più finestre, questo è il momento in cui
            // si dovrebbe eliminare l'elemento corrispondente.
            globals.mainWin = null;
            utils.saveConfig();
        });


        ipcMain.on('close',(event,payload) => {
            globals.mainWin.close();
        });

        ipcMain.on('tray',(event,payload) => {
            globals.mainWin.minimize();
        });

        ipcMain.on('register',(event,payload) => {
            const { BrowserWindow } = require('electron');
            let child = new BrowserWindow({ parent: globals.mainWin, modal: true, show: false });
            child.loadURL('https://minecraft.net/it-it/store/minecraft/#register');
            child.setMenu(null);
            child.once('ready-to-show', () => {
                child.show()
            });
        });

        ipcMain.on('forgot-password',(event,payload) => {
            const { BrowserWindow } = require('electron');
            let child = new BrowserWindow({ parent: globals.mainWin, modal: true, show: false });
            child.loadURL('https://account.mojang.com/password');
            child.setMenu(null);
            child.once('ready-to-show', () => {
                child.show()
            });
        });

        ipcMain.on('logout',(event,payload) =>{
            globals.launcherConfig.savedUsername = undefined;
            globals.launcherConfig.savedPassword = undefined;
            utils.saveConfig();
            globals.mainWin.loadURL(url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/index.ejs'),
                protocol: 'file:',
                slashes: true
            }));
        })

        //https://crafatar.com/renders/body/2842ec6ea599466298472a1edbb9619b
        ipcMain.on('login',async (event,payload) =>{
            if(payload.username && payload.password){
                var body = await utils.mojangAuthentication(payload.username,payload.password);
                if(body != null){
                    if(payload.rememberMe){
                        globals.launcherConfig.savedUsername = payload.username;
                        globals.launcherConfig.savedPassword = payload.password;
                        utils.saveConfig();
                    }
                    globals.accessToken = body.accessToken;
                    globals.uuid = body.selectedProfile.id;
                    globals.username = body.selectedProfile.name;

                    ejse.data({packets: globals.packets_list});

                    globals.mainWin.loadURL(url.format({
                        pathname:path.join(path.resolve(__dirname), stringPath, '/views/pack.ejs'),
                        protocol: 'file:',
                        slashes: true
                    }));
                }
            }else if(payload.username){
                var body = JSON.parse(await rp({
                    method: "GET",
                    uri: "http://51.91.249.64:3004/token"
                }));
                globals.accessToken = body.accessToken;
                globals.uuid = body.uuid;
                globals.username = payload.username;
                ejse.data({packets: globals.packets_list});
                if(payload.rememberMe){
                    console.log("remembered");
                    globals.launcherConfig.savedUsername = payload.username;
                    utils.saveConfig();
                }

                globals.mainWin.loadURL(url.format({
                    pathname:path.join(path.resolve(__dirname), stringPath, '/views/pack.ejs'),
                    protocol: 'file:',
                    slashes: true
                }));
            }
        });

        ipcMain.on('packetSelection',(event,payload) => {
            ejse.data({packets: globals.packets_list});
            globals.mainWin.loadURL(url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/pack.ejs'),
                protocol: 'file:',
                slashes: true
            }));
        });

        ipcMain.on('packetSelected',async (event,payload) => {
            globals.packets_list.forEach(function (packet) {
               if(packet.Name === payload.selectedPacket){
                   globals.selectedPacket = packet;
                   return;
               }
            });
            try {
                serverStatus = await require('is-port-reachable')(parseInt(globals.selectedPacket.Port), {host: globals.selectedPacket.Ip});
            }catch (e) {
                serverStatus = false;
            }
            console.log(serverStatus);
            ejse.data({username: globals.username,maxPermSize: globals.maxPermSize, maxAllocableRam: globals.maxAllocableRam, savedMaxPermSize: globals.launcherConfig.savedMaxPermSize, savedRam: globals.launcherConfig.savedRam, serverStatus: serverStatus});
            globals.mainWin.loadURL(url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/launcher.ejs'),
                protocol: 'file:',
                slashes: true
            }));
        });

        ipcMain.on('changelog', async (event,payload) =>{
            var options = {
                uri: 'https://api.github.com/repos/tigierrei/SoulNetworkLauncher/commits',
                method: 'GET',
                auth: {
                    'user': 'tigierrei',
                    'pass': '2a47d60fe17d3c765116cd7d712e5f3974353a13'
                },
                headers: {
                    'User-Agent': 'Request-Promise'
                }
            };
            let response = JSON.parse(await rp(options));
            let changelog = "";
            response.forEach(function (entry) {
                changelog += entry.commit.message+"<br><br>";
            });
            ejse.data({username: globals.username,maxPermSize: globals.maxPermSize, maxAllocableRam: globals.maxAllocableRam, savedMaxPermSize: globals.launcherConfig.savedMaxPermSize, savedRam: globals.launcherConfig.savedRam, serverStatus: serverStatus,changelog: changelog});
            globals.mainWin.loadURL(url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/changelog.ejs'),
                protocol: 'file:',
                slashes: true
            }));
        });

        ipcMain.on('news', async (event,payload) =>{
            ejse.data({username: globals.username,maxPermSize: globals.maxPermSize, maxAllocableRam: globals.maxAllocableRam, savedMaxPermSize: globals.launcherConfig.savedMaxPermSize, savedRam: globals.launcherConfig.savedRam, serverStatus: serverStatus});
            globals.mainWin.loadURL(url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/launcher.ejs'),
                protocol: 'file:',
                slashes: true
            }));
        });

        ipcMain.on('play',async (event,payload) => {
            globals.launcherConfig.savedRam = payload.ram;
            globals.launcherConfig.savedMaxPermSize = payload.maxPermSize;
            if (globals.launcherConfig.installed_modpacks.includes(globals.selectedPacket.Name+"-"+globals.selectedPacket.Version)) {
                require('./launchGame')(globals.selectedPacket.Name);
            } else {
                //Se esiste una vecchia versiona installata la cancello
                if(fs.existsSync(globals.launcherDir+"/modpacks/"+globals.selectedPacket.Name)){
                    require('rimraf').sync(globals.launcherDir+"/modpacks/"+globals.selectedPacket.Name);
                }
                await utils.downloadModPack(`http://51.91.249.64/modpacks/${process.platform}/${globals.selectedPacket.Name}.zip`, globals.launcherDir + "/modpacks/" ,globals.selectedPacket.Name, '.zip', true, globals.selectedPacket.Name, require('./launchGame'));
                globals.launcherConfig.installed_modpacks.push(globals.selectedPacket.Name+"-"+globals.selectedPacket.Version);
            }
            utils.saveConfig();
        });
    }
}