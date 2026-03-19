"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from "d3-sankey";

interface SankeyNodeExtra {
  name: string;
  color?: string;
}

interface SankeyLinkExtra {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNodeExtra[];
  links: SankeyLinkExtra[];
}

interface Props {
  data: SankeyData;
  width?: number;
  height?: number;
}

const COLORS_INCOME = ["#22c55e", "#16a34a", "#15803d", "#166534", "#4ade80", "#86efac", "#a3e635", "#65a30d"];
const COLORS_EXPENSE = ["#DC2626", "#ef4444", "#f87171", "#b91c1c", "#991B1B", "#fca5a5", "#dc2626", "#7f1d1d", "#e11d48", "#f43f5e", "#fb7185"];

export default function SankeyDiagram({ data, width: propWidth, height: propHeight }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [dimensions, setDimensions] = useState({ width: propWidth || 900, height: propHeight || 500 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setDimensions({ width: w, height: Math.max(400, Math.min(w * 0.55, 600)) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const margin = { top: 20, right: 160, bottom: 20, left: 160 };
  const innerW = dimensions.width - margin.left - margin.right;
  const innerH = dimensions.height - margin.top - margin.bottom;

  const formatEuro = useCallback(
    (v: number) =>
      new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(v),
    []
  );

  if (!data || !data.nodes.length || !data.links.length) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400 text-sm">
        Nog geen transacties om weer te geven. Voeg transacties toe om de geldstroom te zien.
      </div>
    );
  }

  const sankeyGenerator = sankey<SankeyNodeExtra, SankeyLinkExtra>()
    .nodeId((d: SankeyNode<SankeyNodeExtra, SankeyLinkExtra>) => (d as unknown as { index: number }).index)
    .nodeWidth(18)
    .nodePadding(14)
    .nodeAlign((node: SankeyNode<SankeyNodeExtra, SankeyLinkExtra>) => {
      // d3-sankey provides column via the layout algorithm
      return (node as unknown as { depth: number }).depth;
    })
    .extent([
      [0, 0],
      [innerW, innerH],
    ]);

  let sankeyData;
  try {
    sankeyData = sankeyGenerator({
      nodes: data.nodes.map((d) => ({ ...d })),
      links: data.links.map((d) => ({ ...d })),
    });
  } catch {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400 text-sm">
        Kan Sankey diagram niet genereren met huidige data.
      </div>
    );
  }

  const { nodes, links } = sankeyData;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Links */}
          {links.map((link, i) => {
            const path = sankeyLinkHorizontal()(link as unknown as SankeyLink<SankeyNodeExtra, SankeyLinkExtra>);
            const sourceNode = link.source as unknown as SankeyNode<SankeyNodeExtra, SankeyLinkExtra> & SankeyNodeExtra;
            const isIncome = sourceNode.name && !["Revenue", "Omzet"].includes(sourceNode.name)
              && (sourceNode as unknown as { depth: number }).depth === 0;
            const baseColor = isIncome ? "#22c55e" : "#DC2626";
            return (
              <path
                key={i}
                d={path || ""}
                fill="none"
                stroke={baseColor}
                strokeOpacity={0.25}
                strokeWidth={Math.max(1, (link as unknown as { width: number }).width)}
                className="transition-all duration-200 hover:stroke-opacity-50 cursor-pointer"
                onMouseMove={(e) => {
                  const src = (link.source as unknown as SankeyNodeExtra).name;
                  const tgt = (link.target as unknown as SankeyNodeExtra).name;
                  setTooltip({
                    x: e.nativeEvent.offsetX,
                    y: e.nativeEvent.offsetY - 40,
                    text: `${src} → ${tgt}: ${formatEuro(link.value)}`,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const n = node as unknown as {
              x0: number; x1: number; y0: number; y1: number;
              depth: number; name: string; color?: string;
              sourceLinks: unknown[]; targetLinks: unknown[];
            };
            const isCenter = n.name === "Revenue" || n.name === "Omzet";
            const isIncome = n.depth === 0;
            let fill: string;
            if (isCenter) {
              fill = "#1A1A1A";
            } else if (isIncome) {
              fill = n.color || COLORS_INCOME[i % COLORS_INCOME.length];
            } else {
              fill = n.color || COLORS_EXPENSE[i % COLORS_EXPENSE.length];
            }
            const nodeHeight = n.y1 - n.y0;
            const nodeWidth = n.x1 - n.x0;

            // Calculate total value for label
            const totalValue = isIncome
              ? (n.sourceLinks as { value: number }[]).reduce((s, l) => s + l.value, 0)
              : (n.targetLinks as { value: number }[]).reduce((s, l) => s + l.value, 0);

            return (
              <g key={i}>
                <rect
                  x={n.x0}
                  y={n.y0}
                  width={nodeWidth}
                  height={Math.max(nodeHeight, 2)}
                  fill={fill}
                  rx={3}
                  className="transition-all duration-200"
                  onMouseMove={(e) => {
                    setTooltip({
                      x: e.nativeEvent.offsetX,
                      y: e.nativeEvent.offsetY - 40,
                      text: `${n.name}: ${formatEuro(totalValue || 0)}`,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* Label */}
                <text
                  x={isIncome || isCenter ? n.x0 - 8 : n.x1 + 8}
                  y={(n.y0 + n.y1) / 2}
                  dy="0.35em"
                  textAnchor={isIncome || isCenter ? "end" : "start"}
                  className="text-[11px] fill-dark-600 font-medium pointer-events-none"
                >
                  {n.name}
                </text>
                {/* Value label */}
                {totalValue > 0 && (
                  <text
                    x={isIncome || isCenter ? n.x0 - 8 : n.x1 + 8}
                    y={(n.y0 + n.y1) / 2 + 14}
                    dy="0.35em"
                    textAnchor={isIncome || isCenter ? "end" : "start"}
                    className="text-[9px] fill-dark-400 pointer-events-none"
                  >
                    {formatEuro(totalValue)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="sankey-tooltip"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
