module.exports = {

    isDev: true,

    app: require('electron').app,
    BrowserWindow: require('electron').BrowserWindow,

    mainWin: null,
    splash: null,

    version: null,

    launcherDir: null,
    launcherConfigPath: null,

    launcherConfig: null,
    packets_list: null,
    maxPermSize: null,
    maxAllocableRam: null,

    accessToken: null,
    uuid: null,
    username: null,
    selectedPacket: null,

    javaPath: null
};