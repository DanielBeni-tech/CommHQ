import { useRef, useState } from "react";
import { Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_LENGTH = 4000;

interface MessageComposerProps {
  channelName: string;
  disabled?: boolean;
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export function MessageComposer({
  channelName,
  disabled,
  onSend,
  onTyping,
}: MessageComposerProps) {
  const [value, setValue] = useState("");
  const typingRef = useRef(false);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const isTyping = e.target.value.length > 0;
    if (isTyping !== typingRef.current) {
      typingRef.current = isTyping;
      onTyping(isTyping);
    }
  }

  function submit() {
    const content = value.trim();
    if (!content || disabled) return;
    onSend(content);
    setValue("");
    typingRef.current = false;
    onTyping(false);
  }

  const remaining = MAX_LENGTH - value.length;
  const nearLimit = remaining < 200;

  return (
    <div className="border-t bg-card/30 p-3">
      <div className="overflow-hidden rounded-xl border border-input bg-card transition-shadow focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/25">
        <Textarea
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={`Message #${channelName} — Markdown et \`\`\`code\`\`\` supportés`}
          rows={2}
          maxLength={MAX_LENGTH}
          className="min-h-[60px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/40 px-3 py-2">
          <span
            className={cn(
              "flex items-center gap-2 font-mono text-[11px] text-muted-foreground",
              nearLimit && "text-destructive"
            )}
          >
            <span>{value.length}/{MAX_LENGTH}</span>
            <span className="hidden sm:inline">·</span>
            <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
              Ctrl ↵
            </kbd>
            <span className="hidden sm:inline">pour envoyer</span>
          </span>
          <Button size="sm" onClick={submit} disabled={disabled || !value.trim()}>
            <Send className="h-4 w-4" /> Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
