"use client";

import { Box, IconButton, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import type { ActionItem } from './QuickActions';
import { useEffect, useRef, useState } from 'react';

interface Props {
  actions: ActionItem[];
}

export default function QuickActionsOverlay({ actions }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [bottomPx, setBottomPx] = useState<number | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const market = document.getElementById('market-trends-card');
      const status = document.getElementById('status-bar');
      const overlay = ref.current;

      if (!market || !status || !overlay) {
        setBottomPx(12 * 4); // Chakra space 12 -> 48px fallback
        return;
      }

      const marketRect = market.getBoundingClientRect();
      const statusRect = status.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();

      // Target center Y between bottom of market card and top of status bar
      const centerY = (marketRect.bottom + statusRect.top) / 2;
      const bottomValue = Math.max(12 * 4, Math.round(window.innerHeight - centerY - overlayRect.height / 2));
      setBottomPx(bottomValue);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, []);

  return (
    // Dynamically position overlay so it centers between market trends and status bar
    <Box ref={ref} position="fixed" right={4} zIndex={9999} style={{ bottom: bottomPx ? `${bottomPx}px` : undefined }}>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="Quick actions"
          icon={<Box as="i" className="fa-solid fa-bolt" />}
          size="md"
          variant="solid"
        />
        <MenuList>
          {actions.map((a) => (
            <MenuItem key={a.label} icon={<Box as="i" className={a.icon} />} onClick={a.onClick}>
              {a.label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
}
