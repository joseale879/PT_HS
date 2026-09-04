# 🌐 Enlaces para Acceder al Proyecto HidroSmart

El servidor está corriendo y es accesible desde múltiples dispositivos en tu red.

## 📍 Enlaces de Acceso

### En tu computadora
- **Local**: [http://localhost:5175](http://localhost:5175)

### Desde otros dispositivos en la red
Use una de estas direcciones IP según tu dispositivo:

#### Opción 1 (Red principal)
```
http://192.168.56.1:5175
```
- ✅ Móviles en la misma red
- ✅ Tablets
- ✅ Otras computadoras en la red

#### Opción 2 (Red alternativa)  
```
http://10.3.234.249:5175
```
- ✅ Dispositivos con acceso a esta red
- ✅ Mejor para conexiones VPN o redes múltiples

## 📱 Cómo Acceder desde Diferentes Dispositivos

### Desde iPhone/iPad
1. Abre Safari
2. Ingresa: `http://192.168.56.1:5175` o `http://10.3.234.249:5175`
3. ¡Listo! Verás el proyecto responsive

### Desde Android
1. Abre Chrome o navegador
2. Ingresa: `http://192.168.56.1:5175` o `http://10.3.234.249:5175`
3. ¡Listo! Verás el proyecto adaptado para móvil

### Desde otra Laptop/PC
1. Abre navegador (Chrome, Firefox, Edge)
2. Ingresa: `http://192.168.56.1:5175` o `http://10.3.234.249:5175`
3. ¡Listo!

## 🔧 Requisitos Previos

✅ Ambos dispositivos deben estar en la **misma red Wi-Fi**
✅ El servidor debe estar ejecutando (`npm run dev`)
✅ Firewall debe permitir conexiones en el puerto 5175

## 🛑 Detener el Servidor

Para detener el servidor, presiona `q` en la terminal donde se ejecuta `npm run dev`.

## 📋 Info del Servidor

- **Puerto**: 5175 (se cambió a 5175 porque 5174 estaba en uso)
- **Host**: 0.0.0.0 (acepta conexiones de cualquier dispositivo)
- **Estado**: ✅ En ejecución y accesible

## ⚠️ Solución de Problemas

### No puedo acceder desde otro dispositivo

1. **Verifica la conexión Wi-Fi**
   - Asegúrate de que ambos dispositivos estén en la misma red

2. **Comprueba el firewall**
   - Es posible que Windows bloquee el puerto 5175
   - Ve a: Configuración > Firewall > Permitir aplicación a través del firewall

3. **Prueba con ambas IPs**
   - Intenta con: `http://192.168.56.1:5175`
   - Si no funciona, intenta: `http://10.3.234.249:5175`

4. **Reinicia el servidor**
   - Presiona `q` en la terminal
   - Ejecuta `npm run dev` de nuevo

5. **Comprueba que el servidor está corriendo**
   - Deberías ver en la terminal:
   ```
   ➜  Local:   http://localhost:5175/
   ➜  Network: http://192.168.56.1:5175/
   ➜  Network: http://10.3.234.249:5175/
   ```

## 🎯 Pruebas Recomendadas

- [ ] Accede desde iPhone en modo portrait
- [ ] Accede desde iPhone en modo landscape  
- [ ] Accede desde Android en modo portrait
- [ ] Accede desde Android en modo landscape
- [ ] Accede desde tablet en modo portrait
- [ ] Accede desde tablet en modo landscape
- [ ] Accede desde laptop/desktop
- [ ] Prueba todos los botones y menús
- [ ] Verifica que los gráficos se ven bien
- [ ] Comprueba la velocidad de carga

## 📊 Características Responsive ya Implementadas

✅ Layout adaptable (1 col mobile → 4 cols desktop)
✅ Tipografía responsive (14px mobile → 16px desktop)
✅ Gráficos optimizados para móvil
✅ Elementos de 44px mínimo para táctil
✅ Menú colapsible en móvil
✅ Diálogos adaptables
✅ Tablas scrolleables en móvil

---

**¡El proyecto está listo para visualizar en cualquier dispositivo!** 🚀
