# Guía Responsive Design - HidroSmart Web

Este documento proporciona pautas y mejores prácticas para mantener el proyecto completamente responsive en todos los dispositivos.

## 📱 Breakpoints Tailwind

El proyecto usa los breakpoints estándar de Tailwind CSS:

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (xl, 2xl)

### Prefijos Tailwind por Breakpoint
```
sm:  - Tablets y dispositivos medianos (640px+)
md:  - Tablets grandes (768px+)
lg:  - Laptops y desktops (1024px+)
xl:  - Desktops grandes (1280px+)
2xl: - Ultra desktops (1536px+)
```

## 🎨 Componentes Responsive Disponibles

### ResponsiveGrid
```tsx
import { ResponsiveGrid } from '@/app/components/responsive-utils';

<ResponsiveGrid cols={3} gap="lg">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</ResponsiveGrid>
```
- **cols**: 1 | 2 | 3 | 4 | 5
- **gap**: 'sm' | 'md' | 'lg'

### ResponsiveStack
```tsx
import { ResponsiveStack } from '@/app/components/responsive-utils';

<ResponsiveStack direction="horizontal" gap="md">
  <Button>Botón 1</Button>
  <Button>Botón 2</Button>
</ResponsiveStack>
```
- **direction**: 'vertical' | 'horizontal'
- **gap**: 'sm' | 'md' | 'lg'

### ResponsiveContainer
```tsx
import { ResponsiveContainer } from '@/app/components/responsive-utils';

<ResponsiveContainer>
  <h1>Contenido responsive</h1>
</ResponsiveContainer>
```

## 📐 Clases Predefinidas

```tsx
import { responsiveClasses } from '@/app/components/responsive-utils';

// Padding responsive
<div className={responsiveClasses.paddingResponsive}>
  Contenido con padding responsive
</div>

// Grid responsive
<div className={`grid ${responsiveClasses.gridAuto3Cols} ${responsiveClasses.gapResponsive}`}>
  {/* Items */}
</div>

// Text responsive
<h1 className={responsiveClasses.textHeading1}>Título</h1>
<p className={responsiveClasses.textBody}>Párrafo</p>
```

### Clases Disponibles
- `paddingResponsive`: p-3 sm:p-4 lg:p-6
- `paddingResponsiveY`: py-3 sm:py-4 lg:py-6
- `paddingResponsiveX`: px-3 sm:px-4 lg:px-6
- `gapResponsive`: gap-3 sm:gap-4 lg:gap-6
- `gapResponsiveSm`: gap-2 sm:gap-3 lg:gap-4
- `gridAuto2Cols`: grid-cols-1 sm:grid-cols-2
- `gridAuto3Cols`: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
- `gridAuto4Cols`: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
- `textHeading1-4`: Textos con tamaños responsive
- `flexResponsive`: Flex direction responsive
- `displayHiddenMobile`: Oculto en móvil
- `displayVisibleMobile`: Solo visible en móvil

## 🎯 Patrones Comunes

### Ocultar/Mostrar Contenido
```tsx
{/* Visible solo en móvil */}
<div className="block sm:hidden">
  Menú móvil
</div>

{/* Oculto en móvil, visible en desktop */}
<div className="hidden sm:block">
  Menú desktop
</div>

{/* Visible en tablets y desktop */}
<div className="hidden lg:block">
  Sidebar
</div>
```

### Grids Responsive
```tsx
{/* 1 columna en móvil, 2 en tablet, 3 en desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>

{/* 1 columna en móvil, 2 en tablet, 4 en desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</div>
```

### Text Responsive
```tsx
{/* Tamaño adaptable según dispositivo */}
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Título Principal
</h1>

<p className="text-sm sm:text-base lg:text-lg">
  Texto descriptivo
</p>
```

### Flexbox Responsive
```tsx
{/* Stack vertical en móvil, horizontal en desktop */}
<div className="flex flex-col sm:flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

{/* Con espaciado responsive */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
  <h2>Título</h2>
  <button>Acción</button>
</div>
```

### Padding/Margin Responsive
```tsx
{/* Espaciado adaptable */}
<div className="p-3 sm:p-4 lg:p-6">
  Contenido con padding responsive
</div>

{/* Márgenes adaptables */}
<div className="m-2 sm:m-4 lg:m-6">
  Elemento con margen responsive
</div>

{/* Espacios verticales */}
<div className="space-y-2 sm:space-y-3 lg:space-y-4">
  <p>Párrafo 1</p>
  <p>Párrafo 2</p>
  <p>Párrafo 3</p>
</div>
```

## 🔄 Gráficos Responsive

Los gráficos de Recharts están optimizados con:
- Altura adaptable según dispositivo
- Fuentes más pequeñas en móvil
- Márgenes ajustados
- Ángulos de etiquetas en eje X para móvil

```tsx
import { useIsMobile } from '@/app/components/ui/use-mobile';

export function MyChart() {
  const isMobile = useIsMobile();

  return (
    <AreaChart
      margin={isMobile ? { top: 5, right: 5, left: -20, bottom: 5 } : { top: 5, right: 5, left: 0, bottom: 5 }}
    >
      <XAxis
        style={{ fontSize: isMobile ? '10px' : '12px' }}
        tick={{ angle: isMobile ? 45 : 0 }}
      />
      {/* ... */}
    </AreaChart>
  );
}
```

## 📊 Tablas Responsive

Para tablas en móvil, considere:
```tsx
{/* Tabla horizontal scrolleable en móvil */}
<div className="overflow-x-auto">
  <table className="w-full text-sm sm:text-base">
    {/* ... */}
  </table>
</div>

{/* O usar tarjetas en móvil */}
<div className="block md:table w-full">
  <div className="md:table-row mb-4 md:mb-0 block border-b">
    <div className="md:table-cell p-2 sm:p-4">
      {/* Contenido */}
    </div>
  </div>
</div>
```

## 🎛️ Diálogos Responsive

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

<Dialog>
  <DialogContent className="max-w-xs sm:max-w-md lg:max-w-lg">
    <DialogHeader>
      <DialogTitle className="text-lg sm:text-xl">Título</DialogTitle>
    </DialogHeader>
    {/* Contenido adaptable */}
  </DialogContent>
</Dialog>
```

## ✅ Checklist Responsive

Al crear componentes nuevos, asegúrese de:

- [ ] Probar en móvil (320px+)
- [ ] Probar en tablet (640px+)
- [ ] Probar en desktop (1024px+)
- [ ] Verificar legibilidad de textos
- [ ] Asegurar altura mínima de 44px para botones/inputs
- [ ] Usar overflow para contenido que no cabe
- [ ] Optimizar gráficos para móvil
- [ ] Pruebas en navegadores reales
- [ ] Usar Chrome DevTools para diferentes viewport sizes

## 🔧 Hook useIsMobile

```tsx
import { useIsMobile } from '@/app/components/ui/use-mobile';

export function MyComponent() {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <MobileVersion />
      ) : (
        <DesktopVersion />
      )}
    </div>
  );
}
```

## 📱 Testing Responsive

### Chrome DevTools
1. Abre DevTools (F12)
2. Click en Toggle Device Toolbar (Ctrl+Shift+M)
3. Selecciona diferentes dispositivos o tamaños personalizados

### Tamaños Comunes para Probar
- Mobile: 375x667 (iPhone SE)
- Mobile: 414x896 (iPhone 11)
- Tablet: 768x1024 (iPad)
- Desktop: 1920x1080 (Monitor estándar)

## 🎨 Mejoras de Performance

- Los estilos CSS optimizados para móvil reducen el tamaño del bundle
- Los gráficos ajustan la altura para mejor performance en dispositivos pequeños
- Las imágenes se adaptan automáticamente con ResponsiveContainer

## 📚 Referencias

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Media Queries](https://developer.mozilla.org/es/docs/Web/CSS/CSS_media_queries)
- [Recharts Responsive Container](https://recharts.org/guide/animation)
