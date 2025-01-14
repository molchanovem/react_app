const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadEmployees: () => ipcRenderer.invoke('load-employees'),
  addEmployee: (employee) => ipcRenderer.invoke('add-employee', employee),
  editEmployee: (employee) => ipcRenderer.invoke('edit-employee', employee),
  deleteEmployee: (id) => ipcRenderer.invoke('delete-employee', id),
});