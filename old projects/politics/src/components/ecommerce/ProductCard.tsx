/**
 * @file src/components/ecommerce/ProductCard.tsx
 * @description Individual product card component for marketplace display
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Reusable product card showing image, name, price, rating, and stock status.
 * Displays sale prices, featured badges, and out-of-stock indicators.
 * 
 * FEATURES:
 * - Responsive image display with fallback
 * - Sale price highlighting (strikethrough original price)
 * - Star rating visualization
 * - Stock status badges
 * - Featured product indicator
 * - Hover effects for interactivity
 * 
 * USAGE:
 * ```tsx
 * <ProductCard product={productData} onClick={handleClick} />
 * ```
 */

'use client';

import {
  Box,
  Image,
  Text,
  Badge,
  Flex,
  HStack,
  VStack,
} from '@chakra-ui/react';
import { FiStar } from 'react-icons/fi';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  salePrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  quantityAvailable: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const effectivePrice = product.salePrice || product.basePrice;
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)
    : 0;

  return (
    <Box
      bg="white"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
      transition="all 0.2s"
      cursor="pointer"
      _hover={{
        shadow: 'xl',
        transform: 'translateY(-4px)',
      }}
      onClick={onClick}
    >
      {/* Product Image */}
      <Box position="relative" h="200px" bg="gray.100">
        <Image
          src={product.images[0] || '/placeholder-product.png'}
          alt={product.name}
          objectFit="cover"
          w="100%"
          h="100%"
        />

        {/* Badges Overlay */}
        <Box position="absolute" top={2} left={2} right={2}>
          <Flex justify="space-between" align="flex-start">
            <VStack align="flex-start" spacing={1}>
              {product.isFeatured && (
                <Badge colorScheme="purple" fontSize="xs">
                  Featured
                </Badge>
              )}
              {hasDiscount && (
                <Badge colorScheme="red" fontSize="xs">
                  {discountPercent}% OFF
                </Badge>
              )}
            </VStack>

            {product.quantityAvailable === 0 && (
              <Badge colorScheme="red" fontSize="xs">
                Out of Stock
              </Badge>
            )}
          </Flex>
        </Box>
      </Box>

      {/* Product Details */}
      <Box p={4}>
        {/* Category */}
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" mb={1}>
          {product.category}
        </Text>

        {/* Product Name */}
        <Text fontWeight="bold" fontSize="md" mb={2} noOfLines={2} minH="48px">
          {product.name}
        </Text>

        {/* Rating */}
        <HStack spacing={1} mb={2}>
          <HStack spacing={0}>
            {[...Array(5)].map((_, i) => (
              <Box
                key={i}
                as={FiStar}
                color={i < Math.round(product.rating) ? 'yellow.400' : 'gray.300'}
                fill={i < Math.round(product.rating) ? 'yellow.400' : 'none'}
              />
            ))}
          </HStack>
          <Text fontSize="sm" color="gray.600">
            ({product.reviewCount})
          </Text>
        </HStack>

        {/* Price */}
        <Flex align="baseline" gap={2}>
          <Text fontSize="xl" fontWeight="bold" color="blue.600">
            ${effectivePrice.toFixed(2)}
          </Text>
          {hasDiscount && (
            <Text
              fontSize="sm"
              color="gray.500"
              textDecoration="line-through"
            >
              ${product.basePrice.toFixed(2)}
            </Text>
          )}
        </Flex>

        {/* Stock Status */}
        <Text fontSize="xs" color={product.quantityAvailable > 0 ? 'green.600' : 'red.600'} mt={2}>
          {product.quantityAvailable > 0
            ? product.quantityAvailable < 10
              ? `Only ${product.quantityAvailable} left!`
              : 'In Stock'
            : 'Out of Stock'}
        </Text>
      </Box>
    </Box>
  );
}
