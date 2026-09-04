# HidroSmart Mobile

Esta carpeta contiene la version para Expo Go sin modificar el proyecto web original.

## Estructura

- `index.js`: registra la app en Expo.
- `src/App.jsx`: raiz de la aplicacion mobile.
- `src/components/MobileShell.jsx`: contenedor principal de la pantalla mobile.
- `src/components/AppStatusBar.jsx`: barra de estado de la app.
- `src/components/HidroSmartWebView.jsx`: WebView que carga HidroSmart.
- `src/components/WebViewLoading.jsx`: estado de carga del WebView.
- `src/config/webView.js`: configuracion del WebView.
- `src/constants/colors.js`: colores compartidos.
- `src/constants/layout.js`: espaciado seguro para la barra superior de Android.
- `src/webBundle.js`: bundle generado desde `../Web`.

## Como abrirla en Expo Go

1. Instala dependencias:
   npm install

2. Inicia Expo:
   npm start

El script genera primero el bundle web desde ../Web y luego abre Expo. Escanea el QR con Expo Go.
