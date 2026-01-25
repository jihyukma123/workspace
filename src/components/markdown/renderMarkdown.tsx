export function renderMarkdown(content: string) {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={index} className="text-2xl font-semibold text-foreground mb-4">
          {line.slice(2)}
        </h1>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} className="text-xl font-semibold text-foreground mt-6 mb-3">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} className="text-lg font-medium text-foreground mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith('- [ ] ')) {
      return (
        <li key={index} className="text-foreground ml-4 mb-1 flex items-center gap-2">
          <span className="w-4 h-4 border border-border rounded" />
          {line.slice(6)}
        </li>
      );
    }
    if (line.startsWith('- [x] ')) {
      return (
        <li
          key={index}
          className="text-muted-foreground ml-4 mb-1 flex items-center gap-2 line-through"
        >
          <span className="w-4 h-4 border border-primary bg-primary/20 rounded flex items-center justify-center text-primary text-xs">
            {'\u2713'}
          </span>
          {line.slice(6)}
        </li>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <li key={index} className="text-foreground ml-4 mb-1 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (line.includes('**')) {
      const parts = line.split('**');
      return (
        <p key={index} className="text-foreground mb-2">
          {parts.map((part, i) =>
            i % 2 === 1 ? (
              <strong key={i} className="font-bold text-primary">
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </p>
      );
    }
    if (line.trim() === '') {
      return <br key={index} />;
    }
    return (
      <p key={index} className="text-foreground mb-2">
        {line}
      </p>
    );
  });
}
