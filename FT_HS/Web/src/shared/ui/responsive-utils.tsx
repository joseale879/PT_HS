/**
 * Utilidades responsive reutilizables para componentes
 * Facilita mantener consistencia en responsive design
 */

// Clases Tailwind para diferentes breakpoints
export const responsiveClasses = {
  // Padding responsive
  paddingResponsive: 'p-3 sm:p-4 lg:p-6',
  paddingResponsiveY: 'py-3 sm:py-4 lg:py-6',
  paddingResponsiveX: 'px-3 sm:px-4 lg:px-6',

  // Grid responsive
  gridAuto1Col: 'grid-cols-1',
  gridAuto2Cols: 'grid-cols-1 sm:grid-cols-2',
  gridAuto3Cols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  gridAuto4Cols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  gridAuto5Cols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',

  // Gap responsive
  gapResponsive: 'gap-3 sm:gap-4 lg:gap-6',
  gapResponsiveSm: 'gap-2 sm:gap-3 lg:gap-4',

  // Text responsive
  textHeading1: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
  textHeading2: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
  textHeading3: 'text-lg sm:text-xl lg:text-2xl font-semibold',
  textHeading4: 'text-base sm:text-lg lg:text-xl font-semibold',
  textBody: 'text-sm sm:text-base lg:text-base',
  textSmall: 'text-xs sm:text-sm lg:text-sm',

  // Flex responsive
  flexResponsive: 'flex flex-col sm:flex-row',
  flexCenterResponsive: 'flex flex-col sm:flex-row items-center justify-center',

  // Width responsive
  widthFull: 'w-full',
  widthResponsive: 'w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl',

  // Altura responsive
  heightResponsive: 'h-64 sm:h-72 lg:h-96',

  // Display responsive
  displayHiddenMobile: 'hidden sm:block',
  displayVisibleMobile: 'block sm:hidden',
  displayHiddenTablet: 'block lg:hidden',
  displayVisibleTablet: 'hidden lg:block',

  // Margin responsive
  marginResponsive: 'm-3 sm:m-4 lg:m-6',
  marginResponsiveY: 'my-3 sm:my-4 lg:my-6',
  marginResponsiveX: 'mx-3 sm:mx-4 lg:mx-6',

  // Border responsive
  borderResponsive: 'border-l-2 sm:border-l-4',

  // Container responsive
  containerResponsive: 'container mx-auto px-3 sm:px-4 lg:px-6',
};

/**
 * Componente para envolver contenido responsive
 */
export function ResponsiveContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${responsiveClasses.containerResponsive} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Componente Grid responsive
 */
export function ResponsiveGrid({
  children,
  cols = 3,
  gap = 'lg',
  className = '',
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const gridClass = {
    1: responsiveClasses.gridAuto1Col,
    2: responsiveClasses.gridAuto2Cols,
    3: responsiveClasses.gridAuto3Cols,
    4: responsiveClasses.gridAuto4Cols,
    5: responsiveClasses.gridAuto5Cols,
  }[cols];

  const gapClass = {
    sm: responsiveClasses.gapResponsiveSm,
    md: 'gap-2 sm:gap-3 md:gap-4 lg:gap-5',
    lg: responsiveClasses.gapResponsive,
  }[gap];

  return (
    <div className={`grid ${gridClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Componente Stack responsive (Flex vertical/horizontal)
 */
export function ResponsiveStack({
  children,
  direction = 'horizontal',
  gap = 'md',
  className = '',
}: {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const directionClass = direction === 'horizontal'
    ? 'flex flex-col sm:flex-row'
    : 'flex flex-col';

  const gapClass = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6',
  }[gap];

  return (
    <div className={`${directionClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Hook para obtener clases responsive condicionalmente
 */
export function useResponsiveClass(
  mobile: string,
  tablet?: string,
  desktop?: string
): string {
  const tabletClass = tablet || mobile;
  const desktopClass = desktop || tabletClass;

  return `${mobile} sm:${tabletClass} lg:${desktopClass}`;
}

/**
 * Constantes para breakpoints
 */
export const breakpoints = {
  mobile: '640px',
  tablet: '1024px',
  desktop: '1280px',
} as const;

/**
 * Función para obtener clases responsive para espaciado
 */
export function getResponsivePadding(
  mobile: string,
  tablet?: string,
  desktop?: string
): string {
  const tab = tablet || mobile;
  const desk = desktop || tab;
  return `p-${mobile} sm:p-${tab} lg:p-${desk}`;
}

/**
 * Función para obtener tamaño responsive
 */
export function getResponsiveSize(
  mobile: string,
  tablet?: string,
  desktop?: string
): string {
  const tab = tablet || mobile;
  const desk = desktop || tab;
  return `w-${mobile} sm:w-${tab} lg:w-${desk}`;
}

/**
 * Clase para tarjetas responsive
 */
export const cardResponsiveClass =
  'rounded-lg border border-gray-200 bg-white p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow';

/**
 * Clase para botones responsive
 */
export const buttonResponsiveClass =
  'inline-flex items-center justify-center rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]';

/**
 * Utilidad para clases condicionales
 */
export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
