const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    requestBossTaunt: (data) => ipcRenderer.invoke('ai-boss-taunt', data)
});
