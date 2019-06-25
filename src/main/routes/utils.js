const request           = require('request');
const globals           = require('./globals');
const archiver          = require('adm-zip');
const fs                = require('fs');

var utils = module.exports = {
    findJavaPath: function () {
        var paths = process.env.path.split(';');
        for(var i = 0; i < paths.length; i++){
            if(paths[i].includes('jre')){
                return paths[i];
            }
        }
        return null;
    },

    downloadModPack: function (file_url , targetPath, packetName, fileExtension, showProcess, displayName, callback){
        return new Promise((resolve,reject) => {
            // Save variable to know progress
            var received_bytes = 0;
            var total_bytes = 0;
            console.log(file_url);
            console.log(targetPath + packetName + fileExtension);
            var req = request({
                method: 'GET',
                uri: file_url
            });

            var out = fs.createWriteStream(targetPath + packetName + fileExtension);
            req.pipe(out);

            req.on('response', function ( data ) {
                // Change the total bytes value to get progress later.
                total_bytes = parseInt(data.headers['content-length' ]);
            });

            req.on('data', function(chunk) {
                // Update the received bytes
                received_bytes += chunk.length;
                //console.log(Math.round((received_bytes * 100) / total_bytes) + "% | " + received_bytes + " bytes out of " + total_bytes + " bytes.");
                if(showProcess){
                    var subPercentage = Math.round((received_bytes * 100) / total_bytes);
                    var mainPercentage = Math.round(subPercentage/2.0);
                    utils.showProgress(mainPercentage,subPercentage,"Downloading modpack...","Waiting for files downloaded...");
                }
            });

            req.on('end', function() {
                utils.showProgress(51,99,"Waiting for modpack uncompressed","Unzipping modpack...");
                //utils.showProgress(50,100,"Waiting for modpack uncompressed","Unzipping modpack...");
                var zip = new archiver(targetPath + packetName + fileExtension);
                zip.extractAllTo(targetPath,true);
                utils.showProgress(100,100,"All files downloaded","Ready to play");
                fs.unlinkSync(targetPath + packetName + fileExtension);
                globals.mainWin.setProgressBar(-1);
                if(callback)
                    callback(packetName);
                console.log("RETURN");
                resolve();
            });
        });
    },

    showProgress: function (mainPercentage,subPercentage,action,status){
        console.log(mainPercentage);
        //console.log(subPercentage);
        globals.mainWin.webContents.send('update', {mainPercentage: mainPercentage,subPercentage: subPercentage,action: action,status: status});
        globals.mainWin.setProgressBar(mainPercentage/100);
    },

    saveConfig: function () {
        fs.writeFileSync(globals.launcherConfigPath, JSON.stringify(globals.launcherConfig), function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The config file was saved!");
        });
    },

    downloadFile: function (file_url , targetPath, packetName, fileExtension, showProcess, displayName, callback){

        function showDownloadProgress(win,received,total){
            var percentage = Math.round((received * 100) / total);
            win.webContents.send('update', {percentage: percentage});
            win.setProgressBar(percentage/100);
            //console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
        }

        return new Promise((resolve,reject) => {
            // Save variable to know progress
            var received_bytes = 0;
            var total_bytes = 0;

            var req = request({
                method: 'GET',
                uri: file_url
            });

            var progressWindow = null;

            if(showProcess){
                progressWindow = new globals.BrowserWindow({width: 310, height: 144, title: `Downloading ${packetName}`,icon: '../public/images/sn.png',frame: false, transparent: true});
                progressWindow.setProgressBar(0.0);
                progressWindow.loadURL('file://' +process.cwd()+'/src/main' + '/views/download.ejs');
                progressWindow.setMenu(null);
            }

            var out = fs.createWriteStream(targetPath + "/" + packetName + fileExtension);
            req.pipe(out);

            req.on('response', function ( data ) {
                // Change the total bytes value to get progress later.
                total_bytes = parseInt(data.headers['content-length' ]);
            });

            req.on('data', function(chunk) {
                // Update the received bytes
                received_bytes += chunk.length;
                if(showProcess)
                    showDownloadProgress(progressWindow,received_bytes, total_bytes);
            });

            req.on('end', function() {
                if(showProcess)
                    progressWindow.close();
                if(fileExtension.includes("zip")) {
                    var zip = new archiver(targetPath + packetName + fileExtension);
                    zip.extractAllTo(targetPath, true);
                    fs.unlinkSync(targetPath + packetName + fileExtension);
                }
                if(callback)
                    callback(packetName);
                resolve();
            });
        });
    },

    mojangAuthentication: function(username,password){
        return new Promise(((resolve, reject) => {
            var content = {
                "agent": {                              // defaults to Minecraft
                    "name": "Minecraft",                // For Mojang's other game Scrolls, "Scrolls" should be used
                    "version": 1                        // This number might be increased
                                                        // by the vanilla client in the future
                },
                "username": username,           // Can be an email address or player name for
                // unmigrated accounts
                "password": password,
                "requestUser": true                     // optional; default: false; true adds the user object to the response
            }

            var options = {
                url: 'https://authserver.mojang.com/authenticate',
                method: 'POST',
                headers: {
                    'Content-Type' : "application/json",
                    "Accept-Charset" : "UTF-8",
                },
                json: content
            };
            request(options,function (err, response, body) {
                if(err){
                    resolve(null);
                    return;
                }
                if(response.statusCode != '200'){
                    resolve(null);
                    return;
                }
                //console.log(body);


                resolve(body);
            });
        }))
    }
};