import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to realtime roster changes for a given team.
 * Calls `onUpdate` whenever a roster row is inserted/updated/deleted.
 */
export function useRealtimeRosters(
  team: 'A' | 'B' | null,
  onUpdate: (payload: any) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!team) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`realtime-rosters-${team}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rosters',
          filter: `team=eq.${team}`,
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime: rosters (${team}) ✓`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [team]);
}
