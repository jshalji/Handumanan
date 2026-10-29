import * as React from "react"

import { cn } from "@/lib/utils"

type TableProps = React.HTMLAttributes<HTMLTableElement> & {
  stickyScrollbar?: boolean;
};

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, stickyScrollbar = false, children, ...props }, forwardedRef) => {
    const tableRef = React.useRef<HTMLTableElement>(null);
    const tableScrollerRef = React.useRef<HTMLDivElement>(null);
    const stickyScrollerRef = React.useRef<HTMLDivElement>(null);
    const [tableWidth, setTableWidth] = React.useState(0);

    React.useEffect(() => {
      if (!stickyScrollbar) return;

      const updateTableWidth = () => {
        setTableWidth(tableRef.current?.offsetWidth ?? 0);
      };

      updateTableWidth();
      const observer = new ResizeObserver(updateTableWidth);
      if (tableRef.current) observer.observe(tableRef.current);
      return () => observer.disconnect();
    }, [stickyScrollbar]);

    const setTableRef = React.useCallback((node: HTMLTableElement | null) => {
      tableRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);

    const syncScroll = (source: HTMLDivElement | null, target: HTMLDivElement | null) => {
      if (source && target && source.scrollLeft !== target.scrollLeft) {
        target.scrollLeft = source.scrollLeft;
      }
    };

    const table = (
      <table
        ref={setTableRef}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {children}
      </table>
    );

    if (!stickyScrollbar) {
      return <div className="relative w-full overflow-auto">{table}</div>;
    }

    return (
      <div className="relative w-full">
        <div
          ref={tableScrollerRef}
          className="w-full overflow-x-auto scrollbar-hide"
          onScroll={() => syncScroll(tableScrollerRef.current, stickyScrollerRef.current)}
        >
          {table}
        </div>
        <div
          ref={stickyScrollerRef}
          className="sticky bottom-0 z-10 w-full overflow-x-auto overflow-y-hidden border-t border-slate-200 bg-white/95"
          aria-label="Scroll table horizontally"
          role="region"
          tabIndex={0}
          onScroll={() => syncScroll(stickyScrollerRef.current, tableScrollerRef.current)}
        >
          <div style={{ width: Math.max(tableWidth, 1), height: 12 }} />
        </div>
      </div>
    );
  }
);
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
