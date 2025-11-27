/**
 * @file src/types/react-simple-maps.d.ts
 * @description Type declarations for react-simple-maps library
 * @created 2025-11-13
 * 
 * OVERVIEW:
 * Provides TypeScript type definitions for react-simple-maps components
 * used in the interactive US map feature.
 */

declare module 'react-simple-maps' {
  import { ComponentType, SVGProps } from 'react';

  export interface GeographyType {
    rsmKey: string;
    properties: {
      name?: string;
      [key: string]: any;
    };
    geometry: {
      type: string;
      coordinates: any;
    };
    id?: string;
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
    };
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (data: { geographies: GeographyType[] }) => React.ReactNode;
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: GeographyType;
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void;
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
}
