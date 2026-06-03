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

  return (
    <div className="border-t p-3">
      <div className="rounded-lg border bg-card focus-within:ring-2 focus-within:ring-ring">
        <Textarea
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={`Message #${channelName} — Markdown et \`\`\`code\`\`\` supportés`}
          rows={2}
          maxLength={MAX_LENGTH}
          className="border-0 shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex items-center justify-between px-3 pb-2">
          <span
            className={cn(
              "text-xs text-muted-foreground",
              value.length > MAX_LENGTH - 200 && "text-destructive"
            )}
          >
            {value.length}/{MAX_LENGTH} · Ctrl+Entrée pour envoyer
          </span>
          <Button size="sm" onClick={submit} disabled={disabled || !value.trim()}>
            <Send className="h-4 w-4" /> Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
