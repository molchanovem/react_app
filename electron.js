const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Создание или открытие базы данных
const db = new sqlite3.Database('employees.db', (err) => {
  if (err) {
    console.error(err.message);
  }
});

// Создание таблицы, если она не существует
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fio TEXT,
      phone TEXT,
      email TEXT,
      department TEXT,
      birthDate TEXT,
      unionDate TEXT,
      maternityLeave TEXT,
      children INTEGER,
      financialAid TEXT,
      vznos TEXT
    )
  `);
});

// Создание окна приложения
function createWindow() {
  const win = new BrowserWindow({
    width: 1800,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // подключаем preload для безопасной работы с IPC
      contextIsolation: true,
      enableRemoteModule: false, // отключаем удалённые модули для безопасности
    },
  });
  
  // Загрузить локальный HTML файл из папки build
  win.loadFile(path.join(__dirname, 'build', 'index.html'))
    .catch(err => {
      console.error("Ошибка загрузки файла:", err);
    });
}


// Обработка события готовности приложения
app.whenReady().then(createWindow);

// Обработка закрытия приложения
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработка события активации приложения
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC для загрузки сотрудников
ipcMain.handle('load-employees', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM employees', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// IPC для добавления сотрудника
ipcMain.handle('add-employee', async (event, employee) => {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO employees (fio, phone, email, department, birthDate, unionDate, maternityLeave, children, financialAid, vznos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee.fio, employee.phone, employee.email, employee.department, employee.birthDate, employee.unionDate, employee.maternityLeave, employee.children, employee.financialAid, employee.vznos],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
});

// IPC для редактирования сотрудника по имени
ipcMain.handle('edit-employee', async (event, employee) => {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE employees
      SET fio = ?, phone = ?, email = ?, department = ?, birthDate = ?, unionDate = ?, maternityLeave = ?, children = ?, financialAid = ?, vznos = ?
      WHERE fio = ?`,
      [employee.fio, employee.phone, employee.email, employee.department, employee.birthDate, employee.unionDate, employee.maternityLeave, employee.children, employee.financialAid, employee.vznos, employee.fio],
      (err) => {
        if (err) {
          console.error('Ошибка редактирования сотрудника:', err);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
});

// IPC для удаления сотрудника по имени
ipcMain.handle('delete-employee', async (event, fio) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM employees WHERE fio = ?`, [fio], (err) => {
      if (err) {
        console.error('Ошибка удаления сотрудника:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
});
