import CommentItem from '@/components/comments/CommentItem';

type Props = {
  comment: any;
  allComments?: any[];
  depth?: number;
  onEdit?: (id: string, message: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onReply?: (message: string, parentId?: string) => Promise<void>;
  highlightedId?: string | null;
  canComment?: boolean;
};

export default function ClientContentCommentItem(props: Props) {
  // Wrapper kept to preserve original import path for client code.
  return <CommentItem {...props} />;
}
