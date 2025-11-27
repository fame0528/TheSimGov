/**
 * Type declarations for react-simple-maps
 * Package does not provide official types, so declaring module manually
 */

declare module 'react-simple-maps' {
  import { FC, SVGProps, ReactNode } from 'react';

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: any;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: any[] }) => ReactNode;
  }

  export interface ComposableMapProps extends SVGProps<SVGSVGElement> {
    projection?: string;
    width?: number;
    height?: number;
    children?: ReactNode;
  }

  export const Geography: FC<GeographyProps>;
  export const Geographies: FC<GeographiesProps>;
  export const ComposableMap: FC<ComposableMapProps>;
}
