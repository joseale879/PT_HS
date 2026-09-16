const fs = require('node:fs/promises');
const path = require('node:path');

class ReportStorage {
  constructor({ rootDir = process.env.REPORT_STORAGE_DIR || path.join(process.cwd(), 'storage', 'reports') } = {}) {
    this.rootDir = path.resolve(rootDir);
  }

  fileName(reportId, type) {
    return `${reportId}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
  }

  async write(reportId, type, buffer) {
    await fs.mkdir(this.rootDir, { recursive: true });
    const fileName = this.fileName(reportId, type);
    await fs.writeFile(path.join(this.rootDir, fileName), buffer, { flag: 'wx' });
    return fileName;
  }

  async read(storagePath) {
    if (typeof storagePath !== 'string' || path.basename(storagePath) !== storagePath) {
      const error = new Error('La ruta del reporte no es válida');
      error.status = 404;
      throw error;
    }
    try {
      return await fs.readFile(path.join(this.rootDir, storagePath));
    } catch (error) {
      if (error.code === 'ENOENT') {
        const notFound = new Error('El archivo del reporte no está disponible');
        notFound.status = 404;
        throw notFound;
      }
      throw error;
    }
  }
}

module.exports = { ReportStorage };
