/**
 * Arrowhead markers shared by every SVG diagram on the page (rendered once in the root layout).
 * Reference them with marker-end="url(#ah)", "url(#ah-accent)" or "url(#ah-bad)".
 */
export function SvgMarkers() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute h-0 w-0 overflow-hidden">
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="dg-ah" />
        </marker>
        <marker id="ah-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="dg-ah dg-ah--accent" />
        </marker>
        <marker id="ah-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="dg-ah dg-ah--bad" />
        </marker>
      </defs>
    </svg>
  );
}
