import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ChannelHeader } from "@/components/chat/ChannelHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { SummarizePanel } from "@/components/chat/SummarizePanel";
import { PinnedMessagesSheet } from "@/components/chat/PinnedMessagesSheet";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useChannels } from "@/hooks/useChannels";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useDeleteMessage,
  useEditMessage,
  useMessages,
  useSendMessage,
  useTogglePin,
} from "@/hooks/useMessages";
import { useSummarize } from "@/hooks/useSummary";
import { useChannelRealtime } from "@/hooks/useChannelRealtime";
import type { ChannelSummary } from "@/types";

export function ChatPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspaces();
  const { data: channels } = useChannels(activeWorkspaceId);
  const { canPinMessages, canManageChannels } = usePermissions();

  const channel = channels?.find((c) => c.id === channelId);

  const { data: messages = [], isLoading } = useMessages(channelId);
  const send = useSendMessage(channelId ?? "");
  const edit = useEditMessage(channelId ?? "");
  const remove = useDeleteMessage(channelId ?? "");
  const pin = useTogglePin(channelId ?? "");
  const summarize = useSummarize();
  const { typingUsers, notifyTyping } = useChannelRealtime(channelId);

  const [summary, setSummary] = useState<ChannelSummary | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);

  const pinnedMessages = useMemo(
    () => messages.filter((m) => m.pinned),
    [messages]
  );

  async function handleSummarize() {
    if (!channelId) return;
    setSummary(null);
    setSummaryError(false);
    try {
      const result = await summarize.mutateAsync(channelId);
      setSummary(result);
    } catch {
      setSummaryError(true);
    }
  }

  if (!channelId || (!channel && channels)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>Ce canal est introuvable.</p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChannelHeader
        channel={channel}
        pinnedCount={pinnedMessages.length}
        canManage={canManageChannels}
        summarizing={summarize.isPending}
        onSummarize={handleSummarize}
        onShowPinned={() => setPinnedOpen(true)}
      />

      <SummarizePanel
        loading={summarize.isPending}
        summary={summary}
        error={summaryError}
        onRefresh={handleSummarize}
      />

      <MessageList
        channel={channel}
        messages={messages}
        isLoading={isLoading}
        currentUserId={user?.id ?? ""}
        canPin={canPinMessages}
        typingUsers={typingUsers}
        onEdit={(messageId, content) => edit.mutate({ messageId, content })}
        onDelete={(messageId) => {
          remove.mutate(messageId);
          toast.success("Message supprimé.");
        }}
        onTogglePin={(messageId, pinned) => pin.mutate({ messageId, pinned })}
      />

      <MessageComposer
        channelName={channel.name}
        onSend={(content) => send.mutate(content)}
        onTyping={notifyTyping}
      />

      <PinnedMessagesSheet
        open={pinnedOpen}
        onOpenChange={setPinnedOpen}
        messages={pinnedMessages}
      />
    </div>
  );
}
