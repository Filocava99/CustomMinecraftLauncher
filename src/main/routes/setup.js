module.exports = function () {
    const globals   = require('./globals');
    const os        = require('os');
    const fs        = require('fs');
    const dialog    = require('electron').dialog;
    const areq      = require('request-promise');
    const req       = require('request');

    return new Promise(async (resolve, reject) => {
        //CONTROLLO OS PER LE PATH
        if(process.platform === 'win32'){
            globals.launcherDir = process.env.APPDATA + "/" + globals.app.getName();
        }else if(process.platform === 'darwin'){
            globals.launcherDir = os.homedir() +"/Documents/SoulNetworkLauncher";
        }else if(process.platform === 'linux'){

        }

        globals.launcherConfigPath = globals.launcherDir + "/config";

        globals.version = globals.app.getVersion();

        globals.launcherConfig = {version: globals.version, installed_modpacks: [], savedRam: 1, savedMaxPermSize: 32};

        //CONTROLLO ARCHITETTURA PER LE OPZIONI DELLA JVM
        if (process.arch === 'x64') {
            globals.maxPermSize = 512;
            globals.maxAllocableRam = Math.round(os.totalmem() / 1073741824);
        } else {
            globals.maxPermSize = 128;
            //TODO Ottimizzare
            globals.maxAllocableRam = Math.round(os.totalmem() / 1073741824) >= 4 ? 4 : Math.round(os.totalmem() / 1073741824);
        }

        let options = {
            url: 'http://51.91.249.64:3004/info',
            method: 'GET',
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8',
            }
        };

        let body = await areq(options);
        if(!body){
            process.exit();
            return;
        }else{
            body = JSON.parse(body);
            globals.packets_list = body.modpacks;
        }

        //SETUP DELL'INSTALLAZIONE DEL LAUNCHER
        if(fs.existsSync(globals.launcherDir)){
            if(fs.existsSync(globals.launcherConfigPath)){
                globals.launcherConfig = JSON.parse(fs.readFileSync(globals.launcherConfigPath, 'utf8'));
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
        //Aggiorno la versione salvata nel config in caso ci sia stato un aggiornamento automatico del launcher
        globals.launcherConfig.version = globals.app.getVersion();
        require('./utils').saveConfig();
        resolve();
    });
};