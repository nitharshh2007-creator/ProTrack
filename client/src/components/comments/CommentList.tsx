import type { Comment } from "@/types";
import { CommentCard } from "./CommentCard";
import { Spinner } from "@/components/ui/Spinner";
import { MessageSquare } from "lucide-react";

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
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
        <MessageSquare className="h-8 w-8 opacity-30" />
        <p className="text-sm">No comments yet. Start the discussion.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
