const globals   = require('./globals');
const fs        = require('fs');
const cmd       = require('node-cmd');

module.exports = function(selectedPacketName){
    globals.mainWin.minimize();

    console.log("STARTED");
    var packetDir = globals.launcherDir+"/modpacks/" + selectedPacketName;
    var packetConfig = JSON.parse(fs.readFileSync(packetDir + "/config.conf"));

    var librariesPath = getLibrariesPath(packetDir);
    console.log(librariesPath);
    var assetsPath = packetDir+"/assets";
    var nativesPath = packetDir+"/natives";
    var minecraftCore = packetDir+"/cores/"+packetConfig.minecraftVersion+".jar";
    var mainClass = (packetConfig.forgeJar != undefined) ? 'net.minecraft.launchwrapper.Launch' : 'net.minecraft.client.main.Main';
    var forge = (packetConfig.forgeJar != undefined) ? packetDir+"/cores/"+packetConfig.forgeJar+";" : "";
    var forgeCommand = (packetConfig.forgeJar != undefined) ? '--tweakClass cpw.mods.fml.common.launcher.FMLTweaker' : "";
    var extraStartCommands = (process.platform == 'win32') ? "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump" : "";
    cmd.run(`java -XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump -Djava.library.path=${nativesPath} -cp ${librariesPath}${forge}${minecraftCore} -Xmx${globals.launcherConfig.savedRam}G -XX:MaxPermSize=${globals.launcherConfig.savedMaxPermSize}m ${mainClass} --username ${globals.username} --version ${packetConfig.minecraftVersion} --gameDir ${packetDir} --assetsDir ${assetsPath} --assetIndex ${packetConfig.assets} --uuid ${globals.uuid} --accessToken ${globals.accessToken} --userProperties {} --userType mojang ${forgeCommand}`);
    console.log(`java ${extraStartCommands} -Djava.library.path=${nativesPath} -cp ${librariesPath}${forge}${minecraftCore} -Xmx${globals.launcherConfig.savedRam}G -XX:MaxPermSize=${globals.launcherConfig.savedMaxPermSize}m ${mainClass} --username ${globals.username} --version ${packetConfig.minecraftVersion} --gameDir ${packetDir} --assetsDir ${assetsPath} --assetIndex ${packetConfig.assets} --uuid ${globals.uuid} --accessToken ${globals.accessToken} --userProperties {} --userType mojang ${forgeCommand}`);
}

function getLibrariesPath(packetDir) {
    var files = fs.readdirSync(packetDir+"/bin");
    var libraryPath = "";
    var pathSeparator = (process.platform === 'win32' ? ";" : ":");
    for(var i = 0; i < files.length; i++){
        if(files[i].includes('.jar')) {
            libraryPath = libraryPath + packetDir + "/bin/" + files[i] + pathSeparator;
        }
    }
    return libraryPath;
}