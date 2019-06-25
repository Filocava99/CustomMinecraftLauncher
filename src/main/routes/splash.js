module.exports = function () {
    const globals = require('./globals');

    globals.splash = new globals.BrowserWindow({width: 1024, height: 700, title: 'SoulNetwork Launcher',icon: '../public/images/sn.png',transparent: true, frame: false});
    globals.splash.loadURL('file://' +process.cwd()+'/src/main'+ '/views/splash.ejs');
}