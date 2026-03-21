import { useState, useRef, useCallback } from 'react';
import { Download, Plus, Trash2, Copy, GripVertical, X } from 'lucide-react';
import type { FlowDiagram, FlowNode, FlowEdge } from '@/lib/flowchart-types';
import { FLOW_TEMPLATES, FLOW_NODE_COLORS } from '@/lib/flowchart-types';

const STORAGE_KEY = 'engineeros-flowdiagrams';

function loadDiagrams(): FlowDiagram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveDiagrams(d: FlowDiagram[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function genId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getNodeCenter(node: FlowNode) {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

function getEdgePath(from: FlowNode, to: FlowNode): string {
  const fc = getNodeCenter(from);
  const tc = getNodeCenter(to);
  const fromBottom = from.y + from.height;
  const toTop = to.y;

  // Simple routing: go from bottom of 'from' to top of 'to'
  if (Math.abs(fc.x - tc.x) < 20 && fromBottom < toTop) {
    return `M ${fc.x} ${fromBottom} L ${tc.x} ${toTop}`;
  }
  // Side connection or complex routing
  const midY = (fromBottom + toTop) / 2;
  return `M ${fc.x} ${fromBottom} C ${fc.x} ${midY}, ${tc.x} ${midY}, ${tc.x} ${toTop}`;
}

function renderNodeShape(node: FlowNode) {
  const { x, y, width, height, type } = node;
  switch (type) {
    case 'decision':
      const cx = x + width / 2, cy = y + height / 2;
      return (
        <polygon
          points={`${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`}
          fill={node.color}
          fillOpacity={0.15}
          stroke={node.color}
          strokeWidth={2}
          rx={4}
        />
      );
    case 'start':
    case 'end':
      return (
        <rect
          x={x} y={y} width={width} height={height}
          rx={height / 2}
          fill={node.color}
          fillOpacity={0.15}
          stroke={node.color}
          strokeWidth={2}
        />
      );
    case 'io':
      const skew = 12;
      return (
        <polygon
          points={`${x + skew},${y} ${x + width},${y} ${x + width - skew},${y + height} ${x},${y + height}`}
          fill={node.color}
          fillOpacity={0.15}
          stroke={node.color}
          strokeWidth={2}
        />
      );
    default:
      return (
        <rect
          x={x} y={y} width={width} height={height}
          rx={6}
          fill={node.color}
          fillOpacity={0.15}
          stroke={node.color}
          strokeWidth={2}
        />
      );
  }
}

function FlowSVG({ diagram, compact = false }: { diagram: FlowDiagram; compact?: boolean }) {
  const nodeMap = new Map(diagram.nodes.map(n => [n.id, n]));
  const maxX = Math.max(...diagram.nodes.map(n => n.x + n.width)) + 40;
  const maxY = Math.max(...diagram.nodes.map(n => n.y + n.height)) + 40;

  return (
    <svg
      viewBox={`0 0 ${maxX} ${maxY}`}
      className="w-full h-full"
      style={{ minHeight: compact ? 120 : 200 }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" fillOpacity={0.6} />
        </marker>
      </defs>
      {/* Edges */}
      {diagram.edges.map(edge => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        const path = getEdgePath(from, to);
        const fc = getNodeCenter(from);
        const tc = getNodeCenter(to);
        const midX = (fc.x + tc.x) / 2;
        const midY = (from.y + from.height + to.y) / 2;
        return (
          <g key={edge.id}>
            <path
              d={path}
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={0.4}
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
            {edge.label && (
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                fontSize={compact ? 8 : 10}
                fill="hsl(var(--muted-foreground))"
                fontFamily="Inter, sans-serif"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
      {/* Nodes */}
      {diagram.nodes.map(node => {
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        return (
          <g key={node.id}>
            {renderNodeShape(node)}
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={compact ? 9 : 11}
              fontWeight={500}
              fill="hsl(var(--foreground))"
              fontFamily="Inter, sans-serif"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Custom diagram builder
function CustomDiagramBuilder({ onSave, onCancel }: { onSave: (d: FlowDiagram) => void; onCancel: () => void }) {
  const [name, setName] = useState('My Diagram');
  const [nodes, setNodes] = useState<FlowNode[]>([
    { id: genId(), x: 200, y: 30, width: 120, height: 40, label: 'Start', type: 'start', color: FLOW_NODE_COLORS.start },
  ]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  const addNode = (type: FlowNode['type']) => {
    const maxY = nodes.length > 0 ? Math.max(...nodes.map(n => n.y + n.height)) : 0;
    setNodes([...nodes, {
      id: genId(),
      x: 200,
      y: maxY + 40,
      width: type === 'decision' ? 130 : 120,
      height: type === 'decision' ? 60 : 50,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      color: FLOW_NODE_COLORS[type],
    }]);
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.from !== id && e.to !== id));
  };

  const updateNodeLabel = (id: string, label: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, label } : n));
  };

  const handleNodeClick = (id: string) => {
    if (!connectFrom) {
      setConnectFrom(id);
    } else if (connectFrom !== id) {
      setEdges([...edges, { id: genId(), from: connectFrom, to: id }]);
      setConnectFrom(null);
    } else {
      setConnectFrom(null);
    }
  };

  const diagram: FlowDiagram = { id: genId(), name, nodes, edges };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Add node buttons */}
      <div className="flex flex-wrap gap-1">
        {(['start', 'process', 'decision', 'io', 'end'] as const).map(type => (
          <button
            key={type}
            onClick={() => addNode(type)}
            className="px-2 py-1 text-[10px] rounded border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors capitalize"
          >
            + {type}
          </button>
        ))}
      </div>

      {connectFrom && (
        <p className="text-[10px] text-primary animate-pulse">Click another node to connect →</p>
      )}

      {/* Node list */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {nodes.map((node, i) => (
          <div key={node.id} className="flex items-center gap-1.5 text-[11px]">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: node.color }}
            />
            <input
              value={node.label}
              onChange={e => updateNodeLabel(node.id, e.target.value)}
              className="flex-1 bg-transparent border-b border-border/50 outline-none text-foreground px-1 py-0.5 focus:border-primary"
            />
            <button
              onClick={() => handleNodeClick(node.id)}
              className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                connectFrom === node.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
              title="Click to start connecting, then click target node"
            >
              Link
            </button>
            <button onClick={() => removeNode(node.id)} className="text-muted-foreground hover:text-destructive p-0.5">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Preview */}
      {nodes.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-2 h-48 overflow-auto">
          <FlowSVG diagram={diagram} compact />
        </div>
      )}

      {/* Edges list */}
      {edges.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground font-medium">Connections</p>
          {edges.map(edge => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            return (
              <div key={edge.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>{from?.label}</span>
                <span>→</span>
                <span>{to?.label}</span>
                <button
                  onClick={() => setEdges(edges.filter(e => e.id !== edge.id))}
                  className="ml-auto text-muted-foreground hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => onSave(diagram)}
        disabled={nodes.length < 2}
        className="w-full py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
      >
        Save Diagram
      </button>
    </div>
  );
}

export function FlowDiagramPanel() {
  const [diagrams, setDiagrams] = useState<FlowDiagram[]>(loadDiagrams);
  const [showBuilder, setShowBuilder] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const downloadDiagram = useCallback((diagram: FlowDiagram) => {
    const nodeMap = new Map(diagram.nodes.map(n => [n.id, n]));
    const maxX = Math.max(...diagram.nodes.map(n => n.x + n.width)) + 40;
    const maxY = Math.max(...diagram.nodes.map(n => n.y + n.height)) + 40;

    // Build SVG string
    let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxX} ${maxY}" width="${maxX * 2}" height="${maxY * 2}" style="background:#fff">`;
    svgStr += `<defs><marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#666"/></marker></defs>`;

    // Edges
    for (const edge of diagram.edges) {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) continue;
      const path = getEdgePath(from, to);
      svgStr += `<path d="${path}" fill="none" stroke="#888" stroke-width="1.5" marker-end="url(#ah)"/>`;
      if (edge.label) {
        const fc = getNodeCenter(from);
        const tc = getNodeCenter(to);
        svgStr += `<text x="${(fc.x + tc.x) / 2}" y="${(from.y + from.height + to.y) / 2 - 4}" text-anchor="middle" font-size="10" fill="#888" font-family="Inter,sans-serif">${edge.label}</text>`;
      }
    }

    // Nodes
    for (const node of diagram.nodes) {
      const cx = node.x + node.width / 2;
      const cy = node.y + node.height / 2;
      const fillOpacity = '0.15';
      switch (node.type) {
        case 'decision': {
          const pts = `${cx},${node.y} ${node.x + node.width},${cy} ${cx},${node.y + node.height} ${node.x},${cy}`;
          svgStr += `<polygon points="${pts}" fill="${node.color}" fill-opacity="${fillOpacity}" stroke="${node.color}" stroke-width="2"/>`;
          break;
        }
        case 'start': case 'end':
          svgStr += `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${node.height / 2}" fill="${node.color}" fill-opacity="${fillOpacity}" stroke="${node.color}" stroke-width="2"/>`;
          break;
        case 'io': {
          const s = 12;
          const pts = `${node.x + s},${node.y} ${node.x + node.width},${node.y} ${node.x + node.width - s},${node.y + node.height} ${node.x},${node.y + node.height}`;
          svgStr += `<polygon points="${pts}" fill="${node.color}" fill-opacity="${fillOpacity}" stroke="${node.color}" stroke-width="2"/>`;
          break;
        }
        default:
          svgStr += `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="6" fill="${node.color}" fill-opacity="${fillOpacity}" stroke="${node.color}" stroke-width="2"/>`;
      }
      svgStr += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="500" fill="#222" font-family="Inter,sans-serif">${node.label}</text>`;
    }

    svgStr += '</svg>';

    // Convert to PNG via canvas
    const img = new Image();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = maxX * 2;
      canvas.height = maxY * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `${diagram.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }, []);

  const useTemplate = (tpl: FlowDiagram) => {
    const copy: FlowDiagram = {
      ...JSON.parse(JSON.stringify(tpl)),
      id: genId(),
      isTemplate: false,
    };
    const updated = [...diagrams, copy];
    setDiagrams(updated);
    saveDiagrams(updated);
  };

  const deleteDiagram = (id: string) => {
    const updated = diagrams.filter(d => d.id !== id);
    setDiagrams(updated);
    saveDiagrams(updated);
  };

  const saveCustom = (d: FlowDiagram) => {
    const updated = [...diagrams, d];
    setDiagrams(updated);
    saveDiagrams(updated);
    setShowBuilder(false);
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Flow Diagrams</h3>
          <p className="text-[10px] text-muted-foreground">Templates & custom diagrams</p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Custom
        </button>
      </div>

      {showBuilder && (
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <CustomDiagramBuilder onSave={saveCustom} onCancel={() => setShowBuilder(false)} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {/* Templates */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Templates</p>
          <div className="space-y-2">
            {FLOW_TEMPLATES.map(tpl => (
              <div key={tpl.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
                >
                  {tpl.name}
                  <span className="text-[10px] text-muted-foreground">{tpl.nodes.length} nodes</span>
                </button>
                {expanded === tpl.id && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="bg-background rounded-md p-2 h-52 overflow-auto border border-border/50">
                      <FlowSVG diagram={tpl} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { useTemplate(tpl); downloadDiagram(tpl); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                      >
                        <Download className="h-3 w-3" /> Download
                      </button>
                      <button
                        onClick={() => useTemplate(tpl)}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                      >
                        <Copy className="h-3 w-3" /> Use Template
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Saved diagrams */}
        {diagrams.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">My Diagrams</p>
            <div className="space-y-2">
              {diagrams.map(d => (
                <div key={d.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
                  >
                    {d.name}
                    <span className="text-[10px] text-muted-foreground">{d.nodes.length} nodes</span>
                  </button>
                  {expanded === d.id && (
                    <div className="px-3 pb-3 space-y-2">
                      <div className="bg-background rounded-md p-2 h-52 overflow-auto border border-border/50">
                        <FlowSVG diagram={d} />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => downloadDiagram(d)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                        >
                          <Download className="h-3 w-3" /> Download
                        </button>
                        <button
                          onClick={() => deleteDiagram(d.id)}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-[10px] text-destructive bg-destructive/10 rounded hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
