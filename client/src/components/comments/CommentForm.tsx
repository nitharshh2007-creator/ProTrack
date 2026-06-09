import { useState } from "react";
import { commentService } from "@/services";
import type { Comment } from "@/types";
import { Button } from "@/components/ui/Button";

interface CommentFormProps {
  taskId: string;
  onAdded: (comment: Comment) => void;
}

export const CommentForm = ({ taskId, onAdded }: CommentFormProps) => {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setError("");
    setSubmitting(true);
    try {
      const { comment } = await commentService.create({ content: trimmed, task: taskId });
      onAdded(comment);
      setContent("");
    } catch {
      setError("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={3}
        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" loading={submitting} disabled={!content.trim()}>
          Post Comment
        </Button>
      </div>
    </form>
  );
};
