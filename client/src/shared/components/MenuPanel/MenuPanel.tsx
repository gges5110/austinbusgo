import { useMediaQuery, useTheme } from "@mui/material";
import * as React from "react";
import { PropsWithChildren } from "react";
import { DesktopMenuPanel } from "./DesktopMenuPanel";
import { MobileMenuPanel } from "./MobileMenuPanel";

export const MENU_PANEL_WIDTH = "408px";

interface MenuPanelProps {
  innerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

export const MenuPanel = ({
  children,
  innerRef,
}: PropsWithChildren<MenuPanelProps>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isMobile) {
    return <MobileMenuPanel innerRef={innerRef}>{children}</MobileMenuPanel>;
  }

  return <DesktopMenuPanel innerRef={innerRef}>{children}</DesktopMenuPanel>;
};
