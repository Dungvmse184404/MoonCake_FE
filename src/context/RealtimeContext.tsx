import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr";
import { useAuth } from "@/context/AuthContext";
import { API_ORIGIN, loadTokens } from "@/lib/api";

// Event names published by the backend (MoonCake.Application/Realtime/RealtimeEvents.cs)
export const REALTIME_EVENTS = {
  notificationReceived: "notification.received",
  unreadCountChanged: "notification.unread-count-changed",
} as const;

type Handler = (payload: unknown) => void;

interface RealtimeContextValue {
  // Subscribes to a hub event and returns the unsubscribe function
  on: (event: string, handler: Handler) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

// One SignalR connection to /hubs/app while a user is signed in; handlers survive reconnects.
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const connectionRef = useRef<HubConnection | null>(null);
  const handlersRef = useRef(new Map<string, Set<Handler>>());

  useEffect(() => {
    if (!userId) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_ORIGIN}/hubs/app`, { accessTokenFactory: () => loadTokens()?.accessToken ?? "" })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    for (const [event, handlers] of handlersRef.current) {
      for (const handler of handlers) connection.on(event, handler);
    }
    connectionRef.current = connection;
    // Realtime is a bonus: the pages still load everything through the REST API
    connection.start().catch(() => undefined);

    return () => {
      connectionRef.current = null;
      void connection.stop();
    };
  }, [userId]);

  const on = useCallback((event: string, handler: Handler) => {
    const handlers = handlersRef.current.get(event) ?? new Set<Handler>();
    handlers.add(handler);
    handlersRef.current.set(event, handlers);
    connectionRef.current?.on(event, handler);
    return () => {
      handlers.delete(handler);
      connectionRef.current?.off(event, handler);
    };
  }, []);

  return <RealtimeContext.Provider value={{ on }}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(event: string, handler: Handler) {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used inside RealtimeProvider");
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => ctx.on(event, (payload) => latest.current(payload)), [ctx, event]);
}
