const cp = require('child_process');
const path = require('path');


module.exports = function (app) {
    if (process.platform !== 'win32') {
        return false;
    }

    var squirrelCommand = process.argv[1];
    console.log(app);
    console.log(squirrelCommand);
    switch (squirrelCommand) {
        case '--squirrel-install':
            let target = path.basename(process.execPath);
            let updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
            let createShortcut = updateDotExe + ' --createShortcut=' + target + ' --shortcut-locations=Desktop,StartMenu' ;
            console.log (createShortcut);
            cp.exec(createShortcut);
            // Always quit when done
            app.quit();
            return true;
        case '--squirrel-updated':
            target = path.basename(process.execPath);
            updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
            createShortcut = updateDotExe + ' --createShortcut=' + target + ' --shortcut-locations=Desktop,StartMenu' ;
            console.log (createShortcut);
            cp.exec(createShortcut);
            // Always quit when done
            app.quit();
            return true;
        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers
            target = path.basename(process.execPath);
            updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
            createShortcut = updateDotExe + ' --removeShortcut=' + target ;
            console.log (createShortcut);
            cp.exec(createShortcut);
            // Always quit when done
            app.quit();
            return true;
        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated
            app.quit();
            return true;
    }
}