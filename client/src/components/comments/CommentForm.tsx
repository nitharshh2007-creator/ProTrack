import { useState, useRef, useCallback, useEffect } from "react";
import { commentService } from "@/services";
import type { Comment } from "@/types";
import { Paperclip, Smile, Send, X, Image, FileText, Video, File } from "lucide-react";

interface CommentFormProps {
  taskId: string;
  onAdded: (comment: Comment) => void;
}

interface AttachmentChip {
  file: File;
  id: string;
  url: string;
}

export const CommentForm = ({ taskId, onAdded }: CommentFormProps) => {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<AttachmentChip[]>([]);
  const [dragging, setDragging] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const EMOJIS = ["😊", "👍", "❤️", "😂", "🎉", "🔥", "💡", "✅", "❌", "⚠️", "📝", "🚀"];

  useEffect(() => {
    const handleClickOutside = () => setShowEmojiPicker(false);
    if (showEmojiPicker) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const chips: AttachmentChip[] = Array.from(files).map((f) => ({ 
      file: f, 
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f)
    }));
    setAttachments((prev) => [...prev, ...chips]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      // For now, we'll just post the text content since backend doesn't support file uploads
      // In a real implementation, you'd upload files first and get URLs
      let finalContent = trimmed;
      // Store attachment URLs for download
      const attachmentLinks = attachments.map(a => `[📎 ${a.file.name}](${a.url})`).join('\n');
      
      if (attachments.length > 0) {
        finalContent = trimmed ? `${trimmed}\n\n${attachmentLinks}` : attachmentLinks;
      }
      const { comment } = await commentService.create({ content: finalContent, task: taskId });
      onAdded(comment);
      setContent("");
      setAttachments([]);
    } catch {
      setError("Failed to post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return <Image className="h-3 w-3 text-blue-500" />;
    if (ext === "pdf") return <FileText className="h-3 w-3 text-red-500" />;
    if (["mp4","mov","webm","avi"].includes(ext)) return <Video className="h-3 w-3 text-purple-500" />;
    return <File className="h-3 w-3 text-gray-500" />;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 transition-all ${
          dragging ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        } shadow-sm overflow-hidden`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); autoResize(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent); }}
          placeholder="Write an update… (Ctrl+Enter to send)"
          rows={2}
          className="w-full resize-none px-4 pt-3 pb-2 text-sm text-gray-700 dark:text-slate-200 outline-none bg-transparent dark:bg-transparent placeholder:text-gray-400 dark:placeholder:text-slate-500"
          style={{ minHeight: 64 }}
        />

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {attachments.map((chip) => (
              <div key={chip.id} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2.5 py-1 text-xs text-blue-700 dark:text-blue-300">
                {fileIcon(chip.file.name)}
                <a 
                  href={chip.url} 
                  download={chip.file.name}
                  className="max-w-[120px] truncate hover:underline cursor-pointer"
                  title="Click to download"
                >
                  {chip.file.name}
                </a>
                <button type="button" onClick={() => {
                  URL.revokeObjectURL(chip.url);
                  setAttachments((p) => p.filter((c) => c.id !== chip.id));
                }} title="Remove">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 px-3 py-2">
          <div className="flex items-center gap-1">
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            <button type="button" onClick={() => fileRef.current?.click()} title="Attach file"
              className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition">
              <Paperclip className="h-4 w-4" />
            </button>

            <div className="relative">
              <button type="button" title="Emoji" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-yellow-500 dark:hover:text-yellow-400 transition">
                <Smile className="h-4 w-4" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-1 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-2 shadow-lg z-10" style={{ width: '200px' }}>
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContent(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:bg-gray-100 dark:hover:bg-slate-700 rounded p-1 text-lg leading-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="ml-2 text-xs text-gray-300 dark:text-slate-600 select-none">😊 @mention #tag</span>
          </div>
          <button
            type="submit"
            disabled={submitting || (!content.trim() && attachments.length === 0)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 dark:bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white dark:text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-700 disabled:opacity-40 transition"
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? "Posting…" : "Send"}
          </button>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </form>
  );
};
