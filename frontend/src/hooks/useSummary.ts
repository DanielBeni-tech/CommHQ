import { useMutation } from "@tanstack/react-query";

import { summarizeChannel } from "@/api/services";

export function useSummarize() {
  return useMutation({
    mutationFn: (channelId: string) => summarizeChannel(channelId),
  });
}
