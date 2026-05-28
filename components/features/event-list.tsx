'use client';

import { formatTime } from '@/lib/utils';
import type { Event } from '@/types/database';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface EventListProps {
  events: Event[];
}

export function EventList({ events }: EventListProps) {
  if (!events.length) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">No events scheduled</p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3 py-2.5"
        >
          <div
            className="h-10 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: event.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatTime(event.start_time)} – {formatTime(event.end_time)}
            </p>
            {event.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {event.location}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
