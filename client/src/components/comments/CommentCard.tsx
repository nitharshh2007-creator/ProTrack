import type { Comment } from "@/types";
import { useAuth } from "@/store/auth.store";

interface CommentCardProps {
  comment: Comment;
  onDelete: (id: string) => void;
  deleting: boolean;
}

export const CommentCard = ({ comment, onDelete, deleting }: CommentCardProps) => {
  const { user } = useAuth();

  // user.id comes from AuthUser (login response: id)
  // comment.user._id comes from populated User document (_id)
  // Both are ObjectId strings — compare directly
  const canDelete = user?.id === comment.user._id || user?.role === "admin";

  const formattedDate = new Date(comment.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + Meta */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
            {comment.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{comment.user.name}</span>
              <span className="text-xs text-gray-400">{formattedDate}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{comment.content}</p>
          </div>
        </div>

        {/* Delete */}
        {canDelete && (
          <button
            onClick={() => onDelete(comment._id)}
            disabled={deleting}
            className="shrink-0 rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition"
          >
            {deleting ? "..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
};
