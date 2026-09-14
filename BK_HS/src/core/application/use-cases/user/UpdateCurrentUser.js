const { isValidPersonName } = require('../../../../shared/validation');

class UpdateCurrentUser {
  constructor({ userRepository }) { this.userRepository = userRepository; }
  async execute({ userId, fullName, phone, city, avatarDataUrl }) {
    if (!userId) throw this.error('El usuario autenticado es obligatorio', 400);
    if (typeof phone === 'string' && phone.trim().length > 60) throw this.error('El telefono no puede superar 60 caracteres', 400);
    if (!isValidPersonName(fullName)) throw this.error('El nombre solo puede contener letras, tildes, ñ y espacios', 400);
    if (phone !== null && phone !== undefined && typeof phone !== 'string') throw this.error('phone no es válido', 400);
    if (city !== null && city !== undefined && typeof city !== 'string') throw this.error('city no es válida', 400);
    if (avatarDataUrl !== null && avatarDataUrl !== undefined && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(avatarDataUrl)) throw this.error('La foto debe ser JPG, PNG o WebP', 400);
    if (typeof avatarDataUrl === 'string' && Buffer.byteLength(avatarDataUrl, 'utf8') > 2.8 * 1024 * 1024) throw this.error('La foto supera el tamaño permitido de 2 MB', 400);
    const user = await this.userRepository.updateProfile({ userId, fullName: fullName.trim(), phone: phone?.trim() || null, city: city?.trim() || null, avatarDataUrl: avatarDataUrl || null });
    if (!user) throw this.error('Usuario no encontrado', 404);
    return user;
  }
  error(message, status) { const error = new Error(message); error.status = status; return error; }
}
module.exports = { UpdateCurrentUser };
