/**
 * @file src/components/ecommerce/CheckoutFlow.tsx
 * @description Multi-step checkout process with cart, shipping, and payment
 * @created 2025-11-14
 * 
 * OVERVIEW:
 * Complete checkout flow integrating with POST /api/ecommerce/orders endpoint.
 * Handles cart management, shipping address collection, payment processing,
 * and order confirmation. Integrates with fulfillmentSimulator for order processing.
 * 
 * FEATURES:
 * - 3-step checkout (Cart → Shipping → Payment)
 * - Real-time order total calculation (subtotal + shipping + tax)
 * - Shipping cost estimation based on address
 * - Payment processing integration
 * - Order confirmation with tracking
 * - Auto-fulfillment option
 * 
 * USAGE:
 * ```tsx
 * <CheckoutFlow companyId="123" customerId="456" />
 * ```
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Select,
  Divider,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { FiShoppingCart, FiTruck, FiCreditCard, FiCheck } from 'react-icons/fi';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CheckoutFlowProps {
  companyId: string;
  customerId: string;
  initialCart?: CartItem[];
}

export default function CheckoutFlow({
  companyId,
  customerId,
  initialCart = [],
}: CheckoutFlowProps) {
  const toast = useToast();

  // Checkout steps
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'confirmation'>('cart');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(initialCart);

  // Shipping state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'PayPal' | 'Bank Transfer'>(
    'Credit Card'
  );

  // Order state
  const [processing, setProcessing] = useState(false);
  const [_orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  /**
   * Calculate order totals
   */
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingCost = subtotal > 100 ? 0 : 15; // Free shipping over $100
    const taxRate = 0.085; // 8.5% sales tax
    const tax = subtotal * taxRate;
    const total = subtotal + shippingCost + tax;

    return { subtotal, shippingCost, tax, total };
  };

  const { subtotal, shippingCost, tax, total } = calculateTotals();

  /**
   * Update cart item quantity
   */
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter((item) => item.productId !== productId));
    } else {
      setCart(
        cart.map((item) =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  /**
   * Proceed to next step
   */
  const nextStep = () => {
    if (step === 'cart') {
      if (cart.length === 0) {
        toast({
          title: 'Cart is empty',
          description: 'Add items to cart before proceeding',
          status: 'warning',
          duration: 3000,
        });
        return;
      }
      setStep('shipping');
    } else if (step === 'shipping') {
      if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode) {
        toast({
          title: 'Incomplete address',
          description: 'Please fill in all shipping address fields',
          status: 'warning',
          duration: 3000,
        });
        return;
      }
      setStep('payment');
    }
  };

  /**
   * Submit order
   */
  const submitOrder = async () => {
    setProcessing(true);

    try {
      const orderData = {
        companyId,
        customerId,
        items: cart.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        shippingAddress,
        paymentMethod,
        autoFulfill: true, // Enable automatic fulfillment simulation
      };

      const response = await fetch('/api/ecommerce/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error('Order submission failed');

      const data = await response.json();
      setOrderId(data.order._id);
      setOrderNumber(data.order.orderNumber);
      setStep('confirmation');

      toast({
        title: 'Order placed successfully!',
        description: `Order ${data.order.orderNumber} has been created`,
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: 'Order failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box maxW="1000px" mx="auto" p={6}>
      {/* Progress Steps */}
      <Flex justify="space-between" align="center" mb={8}>
        {[
          { key: 'cart', label: 'Cart', icon: FiShoppingCart },
          { key: 'shipping', label: 'Shipping', icon: FiTruck },
          { key: 'payment', label: 'Payment', icon: FiCreditCard },
          { key: 'confirmation', label: 'Confirmation', icon: FiCheck },
        ].map((s, index) => (
          <HStack key={s.key} flex={1} justify="center">
            <Box
              as={s.icon}
              boxSize={6}
              color={
                step === s.key
                  ? 'blue.500'
                  : ['cart', 'shipping', 'payment', 'confirmation'].indexOf(step) > index
                  ? 'green.500'
                  : 'gray.400'
              }
            />
            <Text
              fontWeight={step === s.key ? 'bold' : 'normal'}
              color={step === s.key ? 'blue.500' : 'gray.600'}
            >
              {s.label}
            </Text>
          </HStack>
        ))}
      </Flex>

      {/* Step: Cart */}
      {step === 'cart' && (
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Shopping Cart</Heading>

          {cart.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              Your cart is empty. Add products to get started.
            </Alert>
          ) : (
            <>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Product</Th>
                    <Th>Price</Th>
                    <Th>Quantity</Th>
                    <Th isNumeric>Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {cart.map((item) => (
                    <Tr key={item.productId}>
                      <Td>{item.productName}</Td>
                      <Td>${item.unitPrice.toFixed(2)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <Text>{item.quantity}</Text>
                          <Button
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </HStack>
                      </Td>
                      <Td isNumeric>${(item.unitPrice * item.quantity).toFixed(2)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              <Box bg="gray.50" p={4} borderRadius="md">
                <VStack align="stretch" spacing={2}>
                  <Flex justify="space-between">
                    <Text>Subtotal:</Text>
                    <Text fontWeight="medium">${subtotal.toFixed(2)}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Shipping:</Text>
                    <Text fontWeight="medium">
                      {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text>Tax (8.5%):</Text>
                    <Text fontWeight="medium">${tax.toFixed(2)}</Text>
                  </Flex>
                  <Divider />
                  <Flex justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">
                      Total:
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                      ${total.toFixed(2)}
                    </Text>
                  </Flex>
                </VStack>
              </Box>
            </>
          )}

          <Button colorScheme="blue" size="lg" onClick={nextStep} isDisabled={cart.length === 0}>
            Proceed to Shipping
          </Button>
        </VStack>
      )}

      {/* Step: Shipping */}
      {step === 'shipping' && (
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Shipping Address</Heading>

          <Input
            placeholder="Street Address"
            value={shippingAddress.street}
            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
          />

          <HStack>
            <Input
              placeholder="City"
              value={shippingAddress.city}
              onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
            />
            <Select
              placeholder="State"
              value={shippingAddress.state}
              onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
            >
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="TX">Texas</option>
            </Select>
          </HStack>

          <HStack>
            <Input
              placeholder="ZIP Code"
              value={shippingAddress.zipCode}
              onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
            />
            <Input
              placeholder="Country"
              value={shippingAddress.country}
              onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
            />
          </HStack>

          <HStack>
            <Button onClick={() => setStep('cart')}>Back</Button>
            <Button colorScheme="blue" flex={1} onClick={nextStep}>
              Continue to Payment
            </Button>
          </HStack>
        </VStack>
      )}

      {/* Step: Payment */}
      {step === 'payment' && (
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Payment Method</Heading>

          <Select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as 'Credit Card' | 'PayPal' | 'Bank Transfer')
            }
          >
            <option value="Credit Card">Credit Card</option>
            <option value="PayPal">PayPal</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </Select>

          <Box bg="gray.50" p={4} borderRadius="md">
            <VStack align="stretch" spacing={2}>
              <Text fontWeight="bold">Order Summary</Text>
              <Flex justify="space-between">
                <Text>Items ({cart.length}):</Text>
                <Text>${subtotal.toFixed(2)}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text>Shipping:</Text>
                <Text>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text>Tax:</Text>
                <Text>${tax.toFixed(2)}</Text>
              </Flex>
              <Divider />
              <Flex justify="space-between">
                <Text fontSize="lg" fontWeight="bold">
                  Total:
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                  ${total.toFixed(2)}
                </Text>
              </Flex>
            </VStack>
          </Box>

          <HStack>
            <Button onClick={() => setStep('shipping')}>Back</Button>
            <Button
              colorScheme="blue"
              flex={1}
              onClick={() => void submitOrder()}
              isLoading={processing}
            >
              Place Order
            </Button>
          </HStack>
        </VStack>
      )}

      {/* Step: Confirmation */}
      {step === 'confirmation' && (
        <VStack spacing={6} align="stretch" textAlign="center">
          <Box as={FiCheck} boxSize={16} color="green.500" mx="auto" />
          <Heading size="lg" color="green.600">
            Order Confirmed!
          </Heading>
          <Text fontSize="lg">Thank you for your purchase.</Text>
          <Badge colorScheme="blue" fontSize="lg" p={2}>
            Order Number: {orderNumber}
          </Badge>
          <Text color="gray.600">
            You will receive an email confirmation shortly with tracking information.
          </Text>
          <Button colorScheme="blue" onClick={() => window.location.reload()}>
            Continue Shopping
          </Button>
        </VStack>
      )}
    </Box>
  );
}
