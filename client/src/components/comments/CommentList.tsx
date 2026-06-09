import type { Comment } from "@/types";
import { CommentCard } from "./CommentCard";
import { Spinner } from "@/components/ui/Spinner";

interface CommentListProps {
  comments: Comment[];
  loading: boolean;
  error: string;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

export const CommentList = ({ comments, loading, error, deletingId, onDelete }: CommentListProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
        No comments yet. Be the first to comment.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => (
        <CommentCard
          key={comment._id}
          comment={comment}
          onDelete={onDelete}
          deleting={deletingId === comment._id}
        />
      ))}
    </div>
  );
};
