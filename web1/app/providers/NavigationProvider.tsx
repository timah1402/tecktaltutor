"use client";
import {
  createContext, useCallback, useContext, useEffect,
  useRef, useState, ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PageActionEvent {
  page:   string;        // "solver" | "research" | "question" | ...
  action: string;        // "submit" | "start" | "generate" | "write" | ...
  data:   Record<string, unknown>;
}

interface NavigationCtx {
  activePanel:      string | null;
  setActivePanel:   (panel: string | null) => void;
  chatPanelOpen:    boolean;
  setChatPanelOpen: (open: boolean) => void;
  /** Latest page_action event received from the agent. null = none yet. */
  pageAction:       PageActionEvent | null;
  /** Called by VoiceProvider's SSE listener to forward page_action events. */
  dispatchPageAction: (evt: PageActionEvent) => void;
}

const NavigationContext = createContext<NavigationCtx | null>(null);

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be inside NavigationProvider");
  return ctx;
}

// ── usePageAction hook ─────────────────────────────────────────────────────────
/**
 * Subscribe to page_action events for a specific page.
 *
 * Usage inside a page component:
 *   usePageAction("solver", (evt) => {
 *     if (evt.action === "submit") setInputValue(evt.data.problem as string);
 *   });
 */
export function usePageAction(
  page: string,
  handler: (evt: PageActionEvent) => void,
) {
  const { pageAction } = useNavigation();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  // Track the last _ts we processed so StrictMode double-invoke is a no-op
  const lastTsRef = useRef<number>(0);

  useEffect(() => {
    if (!pageAction || pageAction.page !== page) return;
    const ts = (pageAction as PageActionEvent & { _ts?: number })._ts ?? 0;
    // Skip if we already handled this exact event stamp
    if (ts && ts <= lastTsRef.current) return;
    lastTsRef.current = ts;
    handlerRef.current(pageAction);
  // Only run when pageAction changes (not on handler identity changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageAction, page]);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activePanel,   setActivePanelState] = useState<string | null>(null);
  const [chatPanelOpen, setChatPanelOpen]    = useState(true);
  const [pageAction,    setPageAction]        = useState<PageActionEvent | null>(null);

  const setActivePanel = useCallback((panel: string | null) => {
    setActivePanelState(panel);
    if (panel !== null) setChatPanelOpen(true);
  }, []);

  const dispatchPageAction = useCallback((evt: PageActionEvent) => {
    // Stamp with a unique key so the same action can be re-dispatched
    setPageAction({ ...evt, _ts: Date.now() } as PageActionEvent & { _ts: number });
  }, []);

  return (
    <NavigationContext.Provider value={{
      activePanel, setActivePanel,
      chatPanelOpen, setChatPanelOpen,
      pageAction, dispatchPageAction,
    }}>
      {children}
    </NavigationContext.Provider>
  );
}
