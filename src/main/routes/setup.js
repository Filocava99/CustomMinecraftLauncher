module.exports = function () {
    const autoUpdater = require('electron').autoUpdater;
    const globals   = require('./globals');
    const os        = require('os');
    const fs        = require('fs');
    const dialog    = require('electron').dialog;
    const areq      = require('request-promise');
    const req       = require('request');

    return new Promise(async (resolve, reject) => {
        //CONTROLLO OS PER LE PATH
        if(process.platform == 'win32'){
            globals.launcherDir = process.env.APPDATA + "/" + globals.app.getName();
            globals.launcherConfigPath = globals.launcherDir + "/config";
        }else if(process.platform == 'darwin'){
            globals.launcherDir = os.homedir() +"/Documents/SoulNetworkLauncher"
            globals.launcherConfigPath = globals.launcherDir + "/config";
        }else if(process.platform == 'linux'){

        }

        globals.version = globals.app.getVersion();

        globals.launcherConfig = {version: globals.version, installed_modpacks: [], savedRam: 1, savedMaxPermSize: 32};

        //CONTROLLO ARCHITETTURA PER LE OPZIONI DELLA JVM
        if(process.arch === 'x64'){
            globals.maxPermSize = 512;
            globals.maxAllocableRam = Math.round(os.totalmem()/1073741824);
        }else{
            globals.maxPermSize = 128;
            //TODO Ottimizzare
            globals.maxAllocableRam = Math.round(os.totalmem()/1073741824) >= 4 ? 4: Math.round(os.totalmem()/1073741824);
        }

        var options = {
            url: 'http://51.91.249.64:3004/info',
            method: 'GET',
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8',
            }
        };

        var body = await areq(options);
        if(!body){
            process.exit();
            return;
        }else{
            body = JSON.parse(body);
            globals.packets_list = body.modpacks;
            globals.version = globals.app.getVersion();
            //require('./updater')();

            //CONTROLLO UPDATE
        }

        //SETUP DELL'INSTALLAZIONE DEL LAUNCHER
        if(fs.existsSync(globals.launcherDir)){
            if(fs.existsSync(globals.launcherConfigPath)){
                globals.launcherConfig = JSON.parse(fs.readFileSync(globals.launcherDir + '/config', 'utf8'));
                console.log(globals.launcherConfig);
                //Sovrascrivo l'eventuale modifica della versione da parte dell'utente
                globals.launcherConfig.version = globals.version;
            }else{
                fs.writeFileSync(globals.launcherConfigPath, JSON.stringify(globals.launcherConfig), function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    console.log("The config file was saved!");
                });
            }
            if(!fs.existsSync(globals.launcherDir + "/modpacks")){
                fs.mkdirSync(globals.launcherDir+"/modpacks");
            }
        }else{
            fs.mkdirSync(globals.launcherDir);
            fs.mkdirSync(globals.launcherDir+"/modpacks");
            fs.writeFileSync(globals.launcherConfigPath, JSON.stringify(globals.launcherConfig), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The config file was saved!");
            });
        }
        resolve();
    });
}


/*
    //Gestisco l'update solo se l'app e' stata avviata da Squirrel su windows
    if(process.platform === 'win32' && !globals.isDev){
        const server = 'http://185.25.204.245:1337';
        const platform = 'win' + process.arch.substr(1);
        const feed = `${server}/update/${platform}/${globals.app.getVersion()}/beta`;
        //const feed = `${server}/update/${platform}/:version/:channel`;
        console.log(feed);
        autoUpdater.setFeedURL(feed);

        autoUpdater.on('error', err => console.log(err));
        autoUpdater.on('checking-for-update', () => console.log('checking-for-update'));
        autoUpdater.on('update-available', () => console.log('update-available'));
        autoUpdater.on('update-not-available', () => console.log('update-not-available'));

        autoUpdater.checkForUpdates();

        setInterval(() => {
            autoUpdater.checkForUpdates()
        }, 60000);

        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
            const dialogOpts = {
                type: 'info',
                buttons: ['Restart', 'Later'],
                title: 'Application Update',
                message: process.platform === 'win32' ? releaseNotes : releaseName,
                detail: 'A new version has been downloaded. Restart the application to apply the updates.'
            }

            dialog.showMessageBox(dialogOpts, (response) => {
                if (response === 0) autoUpdater.quitAndInstall()
            })
        });

    }*/