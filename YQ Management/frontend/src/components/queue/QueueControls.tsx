import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Play, SkipForward, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';

interface QueueControlsProps {
  queueId: string;
  servingToken: { id: string; status: string } | undefined;
}

export function QueueControls({ queueId, servingToken }: QueueControlsProps) {
  const queryClient = useQueryClient();

  const nextCustomerMutation = useMutation({
    mutationFn: () => fetchApi(`/token/advance/${queueId}`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queueTokens', queueId] }),
    onError: () => toast.error('Error advancing queue'),
  });

  const skipTokenMutation = useMutation({
    mutationFn: (tokenId: string) => fetchApi(`/token/${tokenId}/complete`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queueTokens', queueId] }),
    onError: () => toast.error('Error skipping token'),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Queue controls</h2>
        <div className="grid grid-cols-2 gap-6">
          <Button
            onClick={() => nextCustomerMutation.mutate()}
            disabled={nextCustomerMutation.isPending}
            className="flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-transform active:scale-95 disabled:opacity-50"
          >
            {nextCustomerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            Next customer
          </Button>

          <Button
            onClick={() => servingToken && skipTokenMutation.mutate(servingToken.id)}
            disabled={!servingToken || skipTokenMutation.isPending}
            className="flex items-center justify-center gap-2 py-4 bg-yellow-500/10 hover:bg-yellow-500/20 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/30 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-sm dark:shadow-none disabled:opacity-50"
          >
            {skipTokenMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <SkipForward className="w-5 h-5" />}
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}