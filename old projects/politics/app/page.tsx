"use client";

/**
 * @file app/page.tsx
 * @description Landing page for Business & Politics Simulation MMO
 * @created 2025-11-13
 * @updated 2025-11-13
 *
 * OVERVIEW:
 * Hero section with AAA styling, semantic tokens, and consistent CTAs.
 */

import { Box, Heading, Text, Button, Container, VStack, HStack, Link as ChakraLink, usePrefersReducedMotion } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import SectionCard from "../components/ui/SectionCard";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  const [motionOK, setMotionOK] = useState(true);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    const reduce = prefersReduced || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    const small = window.innerWidth < 768;
    setMotionOK(!reduce && !small);
  }, [prefersReduced]);

  useEffect(() => {
    if (!motionOK) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [motionOK]);

  const parallax = motionOK ? `translateY(${-(scrollY * 0.15)}px) scale(1.05)` : undefined;

  // Micro-motion keyframes (respect motionOK)
  const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  `;
  const float = keyframes`
    0% { transform: translateY(0); }
    50% { transform: translateY(6px); }
    100% { transform: translateY(0); }
  `;

  return (
    <Box position="relative" minH="100vh" bg="bg" overflow="hidden">
      {/* Background image layer (lightly visible) */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        bgImage="url('/images/senate.jpg')"
        bgSize="cover"
        bgPos="center"
        bgRepeat="no-repeat"
        opacity={0.35}
        filter="grayscale(6%) saturate(85%)"
        transform={parallax}
        willChange="transform"
        pointerEvents="none"
      />
      {/* Darkening gradient overlay */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        bgGradient="linear(to-b, rgba(0,0,0,0.45) 0%, rgba(20,20,20,0.7) 45%, rgba(20,20,20,0.95) 100%)"
        pointerEvents="none"
      />
      {/* Subtle vignette to focus center */}
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        bgImage="radial-gradient(circle at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.5) 100%)"
        pointerEvents="none"
      />

      {/* Foreground content */}
      <Box position="relative" zIndex={1}>
        {/* Soft spotlight behind the hero copy for readability */}
        <Box
          aria-hidden
          position="absolute"
          left="50%"
          top={{ base: 10, md: 16 }}
          transform="translateX(-50%)"
          w={{ base: "90vw", md: "70vw" }}
          h={{ base: "40vh", md: "45vh" }}
          bgGradient="radial(ellipse at center, rgba(0,174,243,0.18), rgba(0,0,0,0) 60%)"
          filter="blur(60px)"
          opacity={0.6}
          pointerEvents="none"
          zIndex={0}
        />

        <Box py={{ base: 20, md: 28 }}>
          <Container>
            <VStack
              spacing={6}
              textAlign="center"
              sx={motionOK ? { animation: `${fadeUp} 600ms ease-out both` } : undefined}
            >
            <Text textStyle="kicker">Economic Strategy MMO</Text>
            <Heading as="h1" size={{ base: "2xl", md: "3xl", lg: "4xl" }}>
              Business & Politics Simulation
            </Heading>
            <Text fontSize={{ base: "lg", md: "xl" }} maxW="2xl">
              Build companies, hire talent, influence elections, and dominate a living multiplayer economy.
            </Text>
            <HStack spacing={4} pt={2} justify="center">
              <Button
                as={Link}
                href="/register"
                variant="primary"
                size="lg"
                leftIcon={<Box as="i" className="fa-solid fa-rocket" aria-hidden="true" />}
              >
                Get Started
              </Button>
              <Button
                as={Link}
                href="/login"
                variant="outline"
                size="lg"
                leftIcon={<Box as="i" className="fa-solid fa-right-to-bracket" aria-hidden="true" />}
              >
                Login
              </Button>
            </HStack>
            </VStack>
          </Container>
        </Box>

        {/* Scroll cue */}
        <Box position="relative" h={0}>
          <ChakraLink
            href="#features"
            aria-label="Scroll to features"
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
            bottom={-6}
            zIndex={1}
            _hover={{ textDecoration: 'none' }}
          >
            <Box
              as="span"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              boxSize="10"
              borderRadius="full"
              bg="rgba(0,0,0,0.4)"
              borderWidth="1px"
              borderColor="border"
              color="brand"
              sx={motionOK ? { animation: `${float} 2.2s ease-in-out infinite` } : undefined}
            >
              <Box as="i" className="fa-solid fa-chevron-down" aria-hidden="true" />
            </Box>
          </ChakraLink>
        </Box>

        <Container pb={{ base: 16, md: 24 }}>
          <SectionCard title="Game Features" iconClass="fa-solid fa-list-check">
            <Box id="features" position="relative" top={-64} />
            <VStack align="stretch" spacing={3}>
            <HStack spacing={3} align="start">
              <Box as="i" className="fa-solid fa-building" color="brand" aria-hidden="true" />
              <Text>Build companies in construction, real estate, crypto, stocks, retail, and banking.</Text>
            </HStack>
            <HStack spacing={3} align="start">
              <Box as="i" className="fa-solid fa-users" color="brand" aria-hidden="true" />
              <Text>Hire NPC employees with unique skills, loyalty, and morale.</Text>
            </HStack>
            <HStack spacing={3} align="start">
              <Box as="i" className="fa-solid fa-landmark-flag" color="brand" aria-hidden="true" />
              <Text>Run for office from local mayor to president and shape policy.</Text>
            </HStack>
            <HStack spacing={3} align="start">
              <Box as="i" className="fa-solid fa-scale-balanced" color="brand" aria-hidden="true" />
              <Text>Pass laws that benefit your businesses and industries.</Text>
            </HStack>
            <HStack spacing={3} align="start">
              <Box as="i" className="fa-solid fa-globe" color="brand" aria-hidden="true" />
              <Text>Trade with players, form syndicates, and compete for dominance.</Text>
            </HStack>
            </VStack>
          </SectionCard>
        </Container>

        {/* About / SEO content */}
        <Container pb={{ base: 16, md: 24 }}>
          <SectionCard title="What's This Game?" iconClass="fa-solid fa-circle-question">
            <VStack spacing={6} align="stretch">
              <Text>
                Business & Politics is a persistent, player‑driven MMO about power. Build companies in real
                industries, hire and manage talent, lobby lawmakers, and run for office to shape the rules of the
                economy. Every system connects: markets react to policy, policy responds to influence, and influence is
                earned through results.
              </Text>
              <HStack spacing={6} align="stretch" flexWrap="wrap">
                <Box flex="1 1 280px">
                  <HStack spacing={3} mb={2}>
                    <Box as="i" className="fa-solid fa-sack-dollar" color="brand" aria-hidden="true" />
                    <Text color="white" fontWeight="semibold">A Living Economy</Text>
                  </HStack>
                  <Text>Supply, demand, taxation, and regulation all feed into prices, wages, and growth.</Text>
                </Box>
                <Box flex="1 1 280px">
                  <HStack spacing={3} mb={2}>
                    <Box as="i" className="fa-solid fa-landmark" color="brand" aria-hidden="true" />
                    <Text color="white" fontWeight="semibold">Politics That Matter</Text>
                  </HStack>
                  <Text>Run campaigns, pass laws, and wield real leverage over industries and rivals.</Text>
                </Box>
                <Box flex="1 1 280px">
                  <HStack spacing={3} mb={2}>
                    <Box as="i" className="fa-solid fa-users-gear" color="brand" aria-hidden="true" />
                    <Text color="white" fontWeight="semibold">Play Your Way</Text>
                  </HStack>
                  <Text>Be a mogul, a mayor, a kingmaker—or all three. Specialize or diversify to win.</Text>
                </Box>
              </HStack>
              <HStack spacing={4} pt={2}>
                <Button as={ChakraLink} href="/register" variant="primary" leftIcon={<Box as="i" className="fa-solid fa-user-plus" aria-hidden="true" />}>Create your empire</Button>
                <Button as={ChakraLink} href="/login" variant="outline" leftIcon={<Box as="i" className="fa-solid fa-right-to-bracket" aria-hidden="true" />}>Return to your world</Button>
              </HStack>
            </VStack>
          </SectionCard>
        </Container>

        {/* Why you'll love it */}
        <Container pb={{ base: 20, md: 28 }}>
          <SectionCard title="Why You'll Love It" iconClass="fa-solid fa-stars">
            <VStack spacing={4} align="stretch">
              <HStack spacing={3}><Box as="i" className="fa-solid fa-bolt" color="brand" aria-hidden="true" /><Text>High‑stakes decisions with visible consequences across markets and politics.</Text></HStack>
              <HStack spacing={3}><Box as="i" className="fa-solid fa-scale-balanced" color="brand" aria-hidden="true" /><Text>Fair, transparent systems—win through strategy, not grind.</Text></HStack>
              <HStack spacing={3}><Box as="i" className="fa-solid fa-network-wired" color="brand" aria-hidden="true" /><Text>Social by design: coalitions, rivals, and long‑term reputations matter.</Text></HStack>
              <HStack spacing={3}><Box as="i" className="fa-solid fa-shield-halved" color="brand" aria-hidden="true" /><Text>Play safe: anti‑exploit safeguards and active moderation.</Text></HStack>
            </VStack>
          </SectionCard>
        </Container>
      </Box>
    </Box>
  );
}
