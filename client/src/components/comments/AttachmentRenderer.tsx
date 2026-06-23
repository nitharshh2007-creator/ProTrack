import { Download, Image, FileText, Video, File } from "lucide-react";

interface AttachmentRendererProps {
  content: string;
}

const fileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return <Image className="h-4 w-4 text-blue-500" />;
  if (ext === "pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (["mp4","mov","webm","avi"].includes(ext)) return <Video className="h-4 w-4 text-purple-500" />;
  return <File className="h-4 w-4 text-gray-500" />;
};

export const AttachmentRenderer = ({ content }: AttachmentRendererProps) => {
  // Parse markdown-style attachment links: [📎 filename.pdf](blob:...)
  const attachmentRegex = /\[📎\s+([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | { type: 'attachment'; name: string; url: string })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = attachmentRegex.exec(content)) !== null) {
    // Add text before the attachment
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    // Add the attachment
    parts.push({
      type: 'attachment',
      name: match[1],
      url: match[2]
    });
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // If no attachments found, return original content
  if (parts.length === 0) {
    return <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return part.trim() ? (
            <p key={index} className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {part}
            </p>
          ) : null;
        }

        return (
          <div key={index} className="inline-flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm">
            {fileIcon(part.name)}
            <span className="text-gray-700">{part.name}</span>
            <a
              href={part.url}
              download={part.name}
              className="ml-auto rounded-md p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
              title="Download attachment"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        );
      })}
    </div>
  );
};