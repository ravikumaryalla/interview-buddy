import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AutoTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'rows'
> {
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  containerClassName?: string;
}

const AutoTextarea = React.forwardRef<HTMLTextAreaElement, AutoTextareaProps>(
  (
    {
      className,
      containerClassName,
      startAdornment,
      endAdornment,
      onChange,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement>(null);
    const resolvedRef =
      (ref as React.RefObject<HTMLTextAreaElement>) ?? innerRef;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      onChange?.(e);
    };

    // Reset height when value is cleared externally
    React.useEffect(() => {
      const el = resolvedRef.current;
      if (!el) return;
      if (!props.value && !props.defaultValue) {
        el.style.height = 'auto';
      }
    }, [props.value]);

    return (
      <div
        className={cn(
          'flex items-end gap-2 bg-panel rounded-xl px-3 py-2',
          'outline-none focus-within:outline-none focus-within:ring-0',
          containerClassName,
        )}
      >
        {startAdornment && (
          <div className='shrink-0 self-end h-5 flex items-center'>
            {startAdornment}
          </div>
        )}

        <textarea
          ref={resolvedRef}
          rows={1}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          className={cn(
            'flex-1 bg-transparent border-0 border-none outline-none ring-0 shadow-none resize-none',
            'text-sm text-foreground placeholder:text-foreground/40',
            'min-w-0 leading-5 overflow-hidden disabled:opacity-50',
            'focus:outline-none focus:ring-0 focus:border-none focus:shadow-none',
            '[&]:border-none [&]:shadow-none',
            className,
          )}
          style={{ minHeight: '20px', maxHeight: '120px' }}
          {...props}
        />

        {endAdornment && (
          <div className='shrink-0 self-end h-5 flex items-center'>
            {endAdornment}
          </div>
        )}
      </div>
    );
  },
);

AutoTextarea.displayName = 'AutoTextarea';

export { AutoTextarea };
