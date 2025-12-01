/**
 * @fileoverview Crime Marketplace Listing Card Component
 * @module components/crime/ListingCard
 * 
 * @created 2025-12-01
 * @author ECHO v1.3.3
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Chip } from '@heroui/react';
import { Package, MapPin, DollarSign, Star } from 'lucide-react';
import type { MarketplaceListingDTO } from '@/lib/dto/crime';

interface ListingCardProps {
  listing: MarketplaceListingDTO;
  onClick?: (listingId: string) => void;
}

const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
  switch (status) {
    case 'Active': return 'success';
    case 'Sold': return 'default';
    case 'Expired': return 'warning';
    case 'Seized': return 'danger';
    default: return 'default';
  }
};

export function ListingCard({ listing, onClick }: ListingCardProps) {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      isPressable={!!onClick}
      onPress={() => onClick?.(listing.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="text-md font-semibold">{listing.substance}</h3>
              <p className="text-xs text-gray-500">
                {listing.location.city}, {listing.location.state}
              </p>
            </div>
          </div>
          <Chip size="sm" color={getStatusColor(listing.status)} variant="flat">
            {listing.status}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="pt-0 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Quantity</div>
            <div className="text-sm font-semibold">{listing.quantity}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Purity</div>
            <div className="text-sm font-semibold text-green-600">{listing.purity}%</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Price</div>
            <div className="text-sm font-semibold">${listing.pricePerUnit}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-600">Total Value</span>
          <span className="text-sm font-bold text-purple-700">
            ${(listing.quantity * listing.pricePerUnit).toLocaleString()}
          </span>
        </div>

        {listing.sellerRep !== undefined && (
          <div className="flex items-center space-x-1 text-xs">
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="text-gray-600">Reputation: {listing.sellerRep}%</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default ListingCard;
