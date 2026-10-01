# Configurador 3D de Racks y Góndolas Industriales

Aplicación web profesional e interactiva en 3D para diseño, cálculo estructural y cotización de sistemas de almacenamiento comercial e industrial:
- **Miniracks Industriales** (módulos iniciales y adicionales, largueros de carga, estantes metálicos).
- **Estanterías Metálicas Modulares** (estantes regulables, perfiles ranurados, escuadras de refuerzo).
- **Góndolas Comerciales de Pared** (fondos perforados/ciegos, zócalos, porta-precios).
- **Góndolas Centrales Isla Doble Cara** (módulos bi-faz con cabeceras redondeadas).
- **Cálculo de Cargas y Física**: Anticolisión 3D, límites de depósito, pasillos de circulación e informe de materiales desglosado.
- **Base de Datos Firebase**: Clientes, cotizaciones y proyectos sincronizados en tiempo real.

---

## 🚀 Despliegue Rápido en Firebase Hosting (Gratuito)

El proyecto ya está preconfigurado con `firebase.json` y `.firebaserc` vinculado a tu proyecto de Firebase.

### 1. En tu máquina local (o terminal):
```bash
# 1. Instalar dependencias si no las tienes
npm install

# 2. Iniciar sesión en Firebase (gratis)
npx firebase login

# 3. Compilar la aplicación
npm run build

# 4. Desplegar a Firebase Hosting
npx firebase deploy --only hosting
```
¡Tu aplicación estará disponible de inmediato en tu dominio gratuito:
`https://gen-lang-client-0343633176.web.app` o `https://gen-lang-client-0343633176.firebaseapp.com`!

---

## 🐙 Subir a GitHub

### Opción A (Desde Google AI Studio):
1. En la parte superior de Google AI Studio, haz clic en el menú de opciones (icono de tres puntos o menú del proyecto).
2. Selecciona **"Export to GitHub"** (Exportar a GitHub).
3. Conecta tu cuenta de GitHub y se creará el repositorio automáticamente.

### Opción B (Vía Git en terminal):
```bash
# 1. Crea un repositorio nuevo y vacío en https://github.com/new (ej: "configurador-racks-3d")
# 2. En tu terminal ejecuta:
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```
