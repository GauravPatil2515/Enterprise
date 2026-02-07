import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  ChevronDown,
  Trash2,
  FolderKanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTeams } from '@/context/TeamsContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Streaming fetch helper ─────────────────────────────────────────────────

async function streamChat(
  projectId: string | null,
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
) {
  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, messages }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      onError(err.detail || `API Error ${res.status}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) { onError('No readable stream'); return; }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';          // keep incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);  // strip "data: "
        if (payload === '[DONE]') {
          onDone();
          return;
        }
        onToken(payload);
      }
    }
    onDone();
  } catch (e: any) {
    onError(e.message || 'Network error');
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

const ChatPage = () => {
  const { state } = useTeams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Build flat project list from teams
  const allProjects = state.teams.flatMap((t) =>
    t.projects.map((p) => ({ id: p.id, name: p.name, teamName: t.name })),
  );

  const selectedProjectName =
    allProjects.find((p) => p.id === selectedProject)?.name || 'All Projects';

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setStreaming(true);

    // Add a placeholder assistant message that we'll stream into
    const assistantIdx = updatedMessages.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    streamChat(
      selectedProject,
      updatedMessages,
      // onToken — append to assistant message
      (token) => {
        setMessages((prev) => {
          const next = [...prev];
          next[assistantIdx] = {
            ...next[assistantIdx],
            content: next[assistantIdx].content + token,
          };
          return next;
        });
      },
      // onDone
      () => setStreaming(false),
      // onError
      (err) => {
        setMessages((prev) => {
          const next = [...prev];
          next[assistantIdx] = { role: 'assistant', content: `⚠️ Error: ${err}` };
          return next;
        });
        setStreaming(false);
      },
    );
  }, [input, streaming, messages, selectedProject]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Co-Pilot</h1>
            <p className="text-xs text-muted-foreground">
              Ask about project risks, team health & decisions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Project selector */}
          <div className="relative">
            <button
              onClick={() => setProjectMenuOpen(!projectMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-[160px] truncate">{selectedProjectName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            <AnimatePresence>
              {projectMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-card shadow-lg"
                >
                  <button
                    onClick={() => { setSelectedProject(null); setProjectMenuOpen(false); }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent',
                      !selectedProject && 'bg-accent font-medium',
                    )}
                  >
                    All Projects (general chat)
                  </button>
                  {allProjects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProject(p.id); setProjectMenuOpen(false); }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent',
                        selectedProject === p.id && 'bg-accent font-medium',
                      )}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.teamName}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clear chat */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
        {messages.length === 0 ? (
          <EmptyState onSuggestion={(q) => { setInput(q); inputRef.current?.focus(); }} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} isStreaming={streaming && i === messages.length - 1} />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedProject
                  ? `Ask about ${selectedProjectName}…`
                  : 'Ask about project risks, team health, decisions…'
              }
              rows={1}
              className="w-full resize-none rounded-lg border border-border bg-card px-4 py-3 pr-12 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-lg"
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          AI responses may contain inaccuracies. Verify critical decisions.
        </p>
      </div>
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const MessageBubble = ({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming: boolean;
}) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border shadow-sm',
        )}
      >
        {message.content || (isStreaming && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
          </span>
        ))}
        {isStreaming && message.content && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary" />
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
};

const EmptyState = ({ onSuggestion }: { onSuggestion: (q: string) => void }) => (
  <div className="flex h-full flex-col items-center justify-center text-center">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">AI Co-Pilot</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask questions about your projects, risks, team health, and delivery decisions.
        Select a specific project for contextual analysis.
      </p>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {[
          'What are the top risks across all projects?',
          'Which tickets are blocking delivery?',
          'Summarize the health of Team Alpha',
          'What should we prioritize this sprint?',
        ].map((q) => (
          <button
            key={q}
            onClick={() => onSuggestion(q)}
            className="rounded-lg border border-border px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {q}
          </button>
        ))}
      </div>
    </motion.div>
  </div>
);

export default ChatPage;
