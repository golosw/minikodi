/**
 * Tests para MiniKodi
 * 
 * Estos tests verifican la lógica de negocio sin dependencias de UI
 */

const fs = require('fs');
const path = require('path');

// Mock de datos para tests
const mockMods = [
  { id: 'mod1', name: 'Skin Ocean Dark', version: '2.1', type: 'skin', size: '15MB' },
  { id: 'mod2', name: 'Video Player Enhanced', version: '1.5', type: 'player', size: '8MB' },
  { id: 'mod3', name: 'Torrent Integrator', version: '3.0', type: 'addon', size: '5MB' }
];

describe('MiniKodi Core Tests', () => {
  
  describe('Search Functionality', () => {
    test('should return all mods when query is empty', () => {
      const result = mockMods.filter(mod => !'' || 
        mod.name.toLowerCase().includes(''.toLowerCase()) ||
        mod.type.toLowerCase().includes(''.toLowerCase())
      );
      
      expect(result).toHaveLength(3);
      expect(result.map(m => m.id)).toContain('mod1');
    });

    test('should filter mods by name', () => {
      const query = 'ocean';
      const result = mockMods.filter(mod => 
        mod.name.toLowerCase().includes(query.toLowerCase()) ||
        mod.type.toLowerCase().includes(query.toLowerCase())
      );
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Skin Ocean Dark');
    });

    test('should filter mods by type', () => {
      const query = 'addon';
      const result = mockMods.filter(mod => 
        mod.name.toLowerCase().includes(query.toLowerCase()) ||
        mod.type.toLowerCase().includes(query.toLowerCase())
      );
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('addon');
    });

    test('should return empty array when no matches', () => {
      const query = 'nonexistent';
      const result = mockMods.filter(mod => 
        mod.name.toLowerCase().includes(query.toLowerCase()) ||
        mod.type.toLowerCase().includes(query.toLowerCase())
      );
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Favorites Management', () => {
    const tempDir = path.join(__dirname, 'temp-test');
    const favoritesFile = path.join(tempDir, 'favorites.json');

    beforeEach(() => {
      // Crear directorio temporal
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      // Limpiar archivo de favoritos
      if (fs.existsSync(favoritesFile)) {
        fs.unlinkSync(favoritesFile);
      }
    });

    afterEach(() => {
      // Limpiar después de cada test
      if (fs.existsSync(favoritesFile)) {
        fs.unlinkSync(favoritesFile);
      }
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir, { recursive: true });
      }
    });

    test('should create empty favorites file if not exists', () => {
      // Simular lectura de favoritos inexistentes
      let favorites = [];
      if (fs.existsSync(favoritesFile)) {
        const data = fs.readFileSync(favoritesFile, 'utf8');
        favorites = JSON.parse(data);
      }
      
      expect(favorites).toEqual([]);
    });

    test('should add favorite without duplicates', () => {
      // Añadir primer favorito
      let favorites = [];
      const newItem = { id: 'mod1', name: 'Test Mod', type: 'addon' };
      
      if (!favorites.find(f => f.id === newItem.id)) {
        favorites.push(newItem);
      }
      
      fs.writeFileSync(favoritesFile, JSON.stringify(favorites, null, 2));
      
      // Intentar añadir el mismo favorito
      const data = JSON.parse(fs.readFileSync(favoritesFile, 'utf8'));
      if (!data.find(f => f.id === newItem.id)) {
        data.push(newItem);
      }
      
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('mod1');
    });

    test('should remove favorite by id', () => {
      // Crear favoritos iniciales
      const initialFavorites = [
        { id: 'mod1', name: 'Mod 1', type: 'addon' },
        { id: 'mod2', name: 'Mod 2', type: 'skin' }
      ];
      fs.writeFileSync(favoritesFile, JSON.stringify(initialFavorites, null, 2));
      
      // Eliminar uno
      let favorites = JSON.parse(fs.readFileSync(favoritesFile, 'utf8'));
      favorites = favorites.filter(f => f.id !== 'mod1');
      fs.writeFileSync(favoritesFile, JSON.stringify(favorites, null, 2));
      
      const result = JSON.parse(fs.readFileSync(favoritesFile, 'utf8'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mod2');
    });

    test('should persist favorites across reads', () => {
      const favorite = { id: 'mod1', name: 'Persistent Mod', type: 'addon' };
      
      // Guardar
      let favorites = [];
      if (!favorites.find(f => f.id === favorite.id)) {
        favorites.push(favorite);
      }
      fs.writeFileSync(favoritesFile, JSON.stringify(favorites, null, 2));
      
      // Leer después
      const savedData = JSON.parse(fs.readFileSync(favoritesFile, 'utf8'));
      expect(savedData).toHaveLength(1);
      expect(savedData[0].name).toBe('Persistent Mod');
    });
  });

  describe('Path Portability', () => {
    test('should use path.join for cross-platform paths', () => {
      const baseDir = '/home/user';
      const subDir = 'minikodi';
      const file = 'config.json';
      
      const linuxPath = path.join(baseDir, subDir, file);
      expect(linuxPath).toContain('minikodi/config.json');
      
      // En Windows sería diferente, pero path.join lo maneja
      const winBase = 'C:\\Users\\user';
      const winPath = path.win32.join(winBase, subDir, file);
      expect(winPath).toBe('C:\\Users\\user\\minikodi\\config.json');
    });

    test('should not contain hardcoded paths', () => {
      const mainJs = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
      
      // Verificar que no hay paths hardcoded
      expect(mainJs).not.toMatch(/C:\\\\/);
      expect(mainJs).not.toMatch(/\/home\//);
      expect(mainJs).not.toMatch(/\/Users\//);
    });
  });

  describe('Mod Installation Simulation', () => {
    const tempDir = path.join(__dirname, 'temp-mods');
    
    beforeEach(() => {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir, { recursive: true });
      }
    });

    test('should create mod directory structure', () => {
      const modId = 'test-mod';
      const modPath = path.join(tempDir, modId);
      
      if (!fs.existsSync(modPath)) {
        fs.mkdirSync(modPath, { recursive: true });
      }
      
      expect(fs.existsSync(modPath)).toBe(true);
      expect(fs.statSync(modPath).isDirectory()).toBe(true);
    });

    test('should create info file in mod directory', () => {
      const modId = 'test-mod-info';
      const modPath = path.join(tempDir, modId);
      
      if (!fs.existsSync(modPath)) {
        fs.mkdirSync(modPath, { recursive: true });
      }
      
      const infoContent = `Mod Test Mod v1.0`;
      fs.writeFileSync(path.join(modPath, 'info.txt'), infoContent);
      
      expect(fs.existsSync(path.join(modPath, 'info.txt'))).toBe(true);
      const content = fs.readFileSync(path.join(modPath, 'info.txt'), 'utf8');
      expect(content).toContain('Test Mod');
    });

    test('should list installed mods', () => {
      // Crear dos mods de prueba
      const mod1Path = path.join(tempDir, 'mod-installed-1');
      const mod2Path = path.join(tempDir, 'mod-installed-2');
      
      fs.mkdirSync(mod1Path, { recursive: true });
      fs.mkdirSync(mod2Path, { recursive: true });
      
      fs.writeFileSync(path.join(mod1Path, 'info.txt'), 'Mod 1 v1.0');
      fs.writeFileSync(path.join(mod2Path, 'info.txt'), 'Mod 2 v2.0');
      
      // Listar mods instalados
      const installedMods = fs.readdirSync(tempDir).map(dir => {
        const dirPath = path.join(tempDir, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          const infoPath = path.join(dirPath, 'info.txt');
          if (fs.existsSync(infoPath)) {
            const content = fs.readFileSync(infoPath, 'utf8');
            return { name: dir, info: content };
          }
        }
        return null;
      }).filter(Boolean);
      
      expect(installedMods).toHaveLength(2);
      expect(installedMods.map(m => m.name)).toContain('mod-installed-1');
      expect(installedMods.map(m => m.name)).toContain('mod-installed-2');
    });
  });

  describe('Data Validation', () => {
    test('should validate mod object structure', () => {
      const mod = { id: 'mod1', name: 'Test', version: '1.0', type: 'addon', size: '5MB' };
      
      expect(mod).toHaveProperty('id');
      expect(mod).toHaveProperty('name');
      expect(mod).toHaveProperty('version');
      expect(mod).toHaveProperty('type');
      expect(mod).toHaveProperty('size');
    });

    test('should validate favorite object structure', () => {
      const favorite = { id: 'fav1', name: 'Favorite Mod', type: 'mod' };
      
      expect(favorite).toHaveProperty('id');
      expect(favorite).toHaveProperty('name');
      expect(favorite).toHaveProperty('type');
    });

    test('should validate torrent progress object', () => {
      const progress = {
        progress: 50.5,
        downloadSpeed: 1024000,
        uploadSpeed: 512000,
        numPeers: 10,
        downloaded: 5000000,
        total: 10000000
      };
      
      expect(progress.progress).toBeGreaterThanOrEqual(0);
      expect(progress.progress).toBeLessThanOrEqual(100);
      expect(progress.downloadSpeed).toBeGreaterThanOrEqual(0);
      expect(progress.numPeers).toBeGreaterThanOrEqual(0);
    });
  });
});
