import type { Comment } from "@/types";
import { useAuth } from "@/store/auth.store";
import { Trash2 } from "lucide-react";
import { AttachmentRenderer } from "./AttachmentRenderer";

interface CommentCardProps {
  comment: Comment;
  onDelete: (id: string) => void;
  deleting: boolean;
}

export const CommentCard = ({ comment, onDelete, deleting }: CommentCardProps) => {
  const { user } = useAuth();
  const canDelete = user?.id === comment.user._id || user?.role === "admin";

  const formattedDate = new Date(comment.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const initials = comment.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];
  const color = colors[comment.user.name.charCodeAt(0) % colors.length];

  return (
    <div className="group flex gap-3">
      {/* Avatar */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}>
        {initials}
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-sm bg-[#1A2235] border border-white/5 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-[#F8FAFC]">{comment.user.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8]">{formattedDate}</span>
              {canDelete && (
                <button
                  onClick={() => onDelete(comment._id)}
                  disabled={deleting}
                  className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <AttachmentRenderer content={comment.content} />
        </div>
      </div>
    </div>
  );
};
