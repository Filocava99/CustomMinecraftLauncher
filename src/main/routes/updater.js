const globals       = require('./globals');
const utils         = require('./utils');
const ipcMain       = require('electron').ipcMain;
const req           = require('request');
const cp            = require('child_process');
const os            = require('os');

module.exports = function () {

    options = {
        url: 'http://spank.soulnetwork.it:1337/api/version',
        method: 'GET',
        contentType: 'application/json',
        headers: {
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8',
        }
    }

    req(options,async function(err,res,body){
        body =  JSON.parse(body);
        var latestVersion = globals.version;
        body.forEach(function (release) {
            if(release.assets[0].version > latestVersion)
                latestVersion = release.assets[0].version;
        })
        if(latestVersion > globals.version){
            //TODO DOWNLOAD
            console.log("Nuova versione disponibile!");
            var downloadPath;
            var fileName = "";
            var fileExtension = "";
            if(process.platform === 'win32'){
                downloadPath = os.homedir + "/Desktop";
                fileName += 'windows_';
                fileExtension = ".exe";
            }else if(process.platform === 'darwin'){
                downloadPath = os.homedir() + "/Downloads";
                fileName += 'osx';
                fileExtension = '.dmg';
            }
            //Controllo architettura 64 bit
            if(process.arch === 'x64'){
                fileName += '64';
                //e 32 bit
            }else{
                fileName += '32';
            }
            console.log(`${downloadPath}\\SNLauncherUpdate${fileExtension}`);
            var updateWin = new globals.BrowserWindow({width: 350, height: 200, title: `New version`,icon: '../public/images/sn.png',frame: false, transparent: true});
            updateWin.loadURL('file://' +process.cwd()+'/src/main' + '/views/newVersionPopup.ejs');
            //updateWin.openDevTools();

            ipcMain.on('updater',async (event,payload) => {
                updateWin.close();
                if(payload.update){
                    console.log(`http://185.25.204.245:1337/download/latest/${fileName}`);
                    await utils.downloadFile(`http://185.25.204.245:1337/download/latest/${fileName}`,downloadPath,"SNLauncherUpdate",fileExtension,true,`version ${latestVersion}`);
                    if(process.platform === 'win32'){
                        /*const child = cp.spawn("cmd.exe",[`${downloadPath}\\SNLauncherUpdate${fileExtension}`], {
                            detached: true,
                            stdio: ['ignore']
                        });

                        child.unref();
                        cp.execFile(`${downloadPath}\\cmd.cmd`);*/
                    }
                    globals.mainWin.close();
                    globals.app.quit();
                    process.exit();
                }
            });
        }
    });
}