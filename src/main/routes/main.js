module.exports = {
    //TODO Estrarre la funzione dall'oggetto?

    createMainWindow: async function() {
        const ipcMain   = require('electron').ipcMain;
        const globals   = require('./globals');
        const ejse      = require('ejs-electron');
        const utils     = require('./utils');
        const rp        = require('request-promise');
        const path      = require('path');
        const url       = require('url');
        ejse.listen();

        const isProd = false;
        var stringPath;
        if(isProd){
            stringPath = "/src/main"
        }else{
            stringPath = ".."
        }

        globals.mainWin = new globals.BrowserWindow({width: 1024, height: 700, title: 'SoulNetwork Launcher',icon: './public/images/sn.png',transparent: true, frame: false, webPreferences: {
                nodeIntegration: true
            }});
        globals.mainWin.setResizable(false);
        //globals.mainWin.openDevTools();
        globals.mainWin.setMenu(null);


        globals.mainWin.loadURL(
            url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/splash.ejs'),
                protocol: 'file:',
                slashes: true
            }));

        if(require('electron-squirrel-startup')) return;

        await require('./setup')();

        //var zip = archiver("C:/Users/filip/Desktop/Test.zip");
        //zip.extractAllTo("C:/Users/filip/Desktop",true);

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

        //mainWin.loadURL('http://google.com');

        // Open the DevTools.
        //globals.mainWin.webContents.openDevTools()

        // Emesso quando la finestra viene chiusa.
        globals.mainWin.on('closed', () => {
            // Eliminiamo il riferimento dell'oggetto window;  solitamente si tiene traccia delle finestre
            // in array se l'applicazione supporta più finestre, questo è il momento in cui
            // si dovrebbe eliminare l'elemento corrispondente.
            globals.mainWin = null
            utils.saveConfig();
        });


        ipcMain.on('close',(event,payload) => {
            globals.mainWin.close();
        });

        ipcMain.on('tray',(event,payload) => {
            globals.mainWin.minimize();
        });

        ipcMain.on('logout',(event,payload) =>{
            globals.launcherConfig.savedUsername,globals.launcherConfig.savedPassword = undefined;
            utils.saveConfig();
            globals.mainWin.loadURL(url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/index.ejs'),
                protocol: 'file:',
                slashes: true
            }));
        })

        //https://crafatar.com/renders/body/2842ec6ea599466298472a1edbb9619b
        ipcMain.on('login',async (event,payload) =>{
            console.log("here we go")
            if(payload.username && payload.password){
                var body = await utils.mojangAuthentication(payload.username,payload.password);
                if(body != null){
                    if(payload.rememberMe){
                        console.log("remembered");
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

        ipcMain.on('packetSelected',(event,payload) => {
            globals.selectedPacket = payload.selectedPacket;
            ejse.data({username: globals.username,maxPermSize: globals.maxPermSize, maxAllocableRam: globals.maxAllocableRam, savedMaxPermSize: globals.launcherConfig.savedMaxPermSize, savedRam: globals.launcherConfig.savedRam});
            globals.mainWin.loadURL(url.format({
                pathname:path.join(path.resolve(__dirname), stringPath, '/views/launcher.ejs'),
                protocol: 'file:',
                slashes: true
            }));
        });

        ipcMain.on('play',async (event,payload) => {
            //TODO Aggiornamento modpack
            globals.launcherConfig.savedRam = payload.ram;
            globals.launcherConfig.savedMaxPermSize = payload.maxPermSize;
            if (globals.launcherConfig.installed_modpacks.includes(globals.selectedPacket)) {
                require('./launchGame')(globals.selectedPacket);
            } else {
                await utils.downloadModPack(`http://soulnetwork.it/launcher/modpacks/${process.platform}/${globals.selectedPacket}.zip`, globals.launcherDir + "/modpacks/" ,globals.selectedPacket, '.zip', true, globals.selectedPacket, require('./launchGame'));
                globals.launcherConfig.installed_modpacks.push(globals.selectedPacket);
            }
            utils.saveConfig();
        });
    }
}