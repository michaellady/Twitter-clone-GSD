import { formatDistanceToNow } from "date-fns";

interface EmbeddedPostProps {
  authorUsername: string;
  authorDisplayName: string | null;
  content: string | null;
  createdAt: string;
}

export function EmbeddedPost({
  authorUsername,
  authorDisplayName,
  content,
  createdAt,
}: EmbeddedPostProps) {
  return (
    <div className="mt-2 rounded-xl border border-gray-200 p-3">
      {/* Header: display name + @username + timestamp */}
      <div className="flex items-center gap-1 text-xs">
        <span className="truncate font-semibold text-slate-900">
          {authorDisplayName || authorUsername}
        </span>
        <span className="text-slate-500">@{authorUsername}</span>
        <span className="text-slate-400">&middot;</span>
        <span className="text-slate-400">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Content */}
      {content && (
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">
          {content}
        </p>
      )}
    </div>
  );
}
