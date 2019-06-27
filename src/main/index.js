const globals = require('./routes/globals');

// Questo metodo viene chiamato quando Electron ha finito
// l'inizializzazione ed è pronto a creare le finestre browser.
// Alcune API possono essere utilizzate solo dopo che si verifica questo evento.
globals.app.on('ready', async function (){
    require('./routes/main.js').createMainWindow();
});

// Terminiamo l'App quando tutte le finestre vengono chiuse.
globals.app.on('window-all-closed', () => {
    // Su macOS è comune che l'applicazione e la barra menù
    // restano attive finché l'utente non esce espressamente tramite i tasti Cmd + Q
    /*if (process.platform !== 'darwin') {
        globals.app.quit();
    }*/
    globals.app.quit();
});

globals.app.on('activate', () => {
    // Su macOS è comune ri-creare la finestra dell'app quando
    // viene cliccata l'icona sul dock e non ci sono altre finestre aperte.
    if (globals.mainWin === null) {
        require('./routes/main').createMainWindow();
    }
});