/**
 * GraphVisualization — Interactive force-directed graph of the Neo4j knowledge graph.
 * Pure canvas renderer, zero extra dependencies.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GitGraph, ZoomIn, ZoomOut, Maximize2, RefreshCw, Info } from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

// ── Colour palette per node label ──
const NODE_COLORS: Record<string, string> = {
  Team: '#3b82f6',       // blue-500
  Project: '#8b5cf6',    // purple-500
  Ticket: '#f59e0b',     // amber-500
  Member: '#10b981',     // emerald-500
  SystemUser: '#ec4899', // pink-500
};

const NODE_RADII: Record<string, number> = {
  Team: 28,
  Project: 24,
  Ticket: 16,
  Member: 20,
  SystemUser: 18,
};

const EDGE_COLORS: Record<string, string> = {
  HAS_PROJECT: '#6366f1',
  HAS_TICKET: '#a855f7',
  ASSIGNED_TO: '#22d3ee',
  MEMBER_OF: '#34d399',
  BLOCKED_BY: '#ef4444',
};

// ── Types ──
interface GNode {
  id: string;
  label: string;
  name: string;
  props: Record<string, any>;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
}

interface GEdge {
  source: string;
  target: string;
  type: string;
}

// ── Force simulation helpers ──
function initPositions(nodes: GNode[], w: number, h: number) {
  const cx = w / 2, cy = h / 2;
  // Place by type in clusters
  const groups: Record<string, GNode[]> = {};
  nodes.forEach((n) => {
    (groups[n.label] ||= []).push(n);
  });
  const labels = Object.keys(groups);
  labels.forEach((label, gi) => {
    const angle = (gi / labels.length) * Math.PI * 2;
    const clusterR = Math.min(w, h) * 0.25;
    const gcx = cx + Math.cos(angle) * clusterR;
    const gcy = cy + Math.sin(angle) * clusterR;
    groups[label].forEach((n, ni) => {
      const a2 = (ni / groups[label].length) * Math.PI * 2;
      const r2 = 40 + Math.random() * 60;
      n.x = gcx + Math.cos(a2) * r2;
      n.y = gcy + Math.sin(a2) * r2;
      n.vx = 0;
      n.vy = 0;
    });
  });
}

function tick(nodes: GNode[], edges: GEdge[], nodeMap: Map<string, GNode>, alpha: number) {
  const k = alpha;

  // Repulsion (all pairs)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (800 / (dist * dist)) * k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (a.fx === null) { a.vx -= fx; }
      if (a.fy === null) { a.vy -= fy; }
      if (b.fx === null) { b.vx += fx; }
      if (b.fy === null) { b.vy += fy; }
    }
  }

  // Attraction (edges)
  const idealLen = 120;
  edges.forEach((e) => {
    const a = nodeMap.get(e.source);
    const b = nodeMap.get(e.target);
    if (!a || !b) return;
    let dx = b.x - a.x, dy = b.y - a.y;
    let dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = ((dist - idealLen) / dist) * k * 0.3;
    const fx = dx * force;
    const fy = dy * force;
    if (a.fx === null) { a.vx += fx; }
    if (a.fy === null) { a.vy += fy; }
    if (b.fx === null) { b.vx -= fx; }
    if (b.fy === null) { b.vy -= fy; }
  });

  // Center gravity
  const cx = 0, cy = 0;
  nodes.forEach((n) => {
    if (n.fx === null) n.vx += (cx - n.x) * 0.001 * k;
    if (n.fy === null) n.vy += (cy - n.y) * 0.001 * k;
  });

  // Apply velocity with damping
  nodes.forEach((n) => {
    if (n.fx !== null) { n.x = n.fx; n.vx = 0; }
    else { n.vx *= 0.6; n.x += n.vx; }
    if (n.fy !== null) { n.y = n.fy; n.vy = 0; }
    else { n.vy *= 0.6; n.y += n.vy; }
  });
}

// ── Component ──
const GraphVisualization = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GNode[]>([]);
  const [edges, setEdges] = useState<GEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredNode, setHoveredNode] = useState<GNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GNode | null>(null);

  // Camera
  const camRef = useRef({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef<{
    type: 'pan' | 'node';
    node?: GNode;
    startX: number;
    startY: number;
    startCamX: number;
    startCamY: number;
  } | null>(null);

  const nodeMapRef = useRef(new Map<string, GNode>());
  const animRef = useRef(0);
  const alphaRef = useRef(1);

  // ── Fetch data ──
  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getGraphData();
      const gNodes: GNode[] = data.nodes.map((n) => ({
        ...n,
        x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null,
      }));
      const w = containerRef.current?.clientWidth || 900;
      const h = containerRef.current?.clientHeight || 600;
      initPositions(gNodes, w, h);
      // Center camera
      camRef.current = { x: w / 2, y: h / 2, zoom: 1 };

      const map = new Map<string, GNode>();
      gNodes.forEach((n) => map.set(n.id, n));
      nodeMapRef.current = map;

      setNodes(gNodes);
      setEdges(data.edges);
      alphaRef.current = 1;
    } catch (e: any) {
      setError(e.message || 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  // ── Draw loop ──
  useEffect(() => {
    if (!nodes.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cam = camRef.current;

      // Physics tick
      if (alphaRef.current > 0.005) {
        tick(nodes, edges, nodeMapRef.current, alphaRef.current);
        alphaRef.current *= 0.995;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.save();

      // Camera transform
      ctx.translate(cam.x, cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      // ── Draw edges ──
      edges.forEach((e) => {
        const a = nodeMapRef.current.get(e.source);
        const b = nodeMapRef.current.get(e.target);
        if (!a || !b) return;

        const color = EDGE_COLORS[e.type] || '#555';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = e.type === 'BLOCKED_BY' ? 2.5 : 1.2;
        if (e.type === 'BLOCKED_BY') ctx.setLineDash([6, 3]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const rB = NODE_RADII[b.label] || 16;
        const tipX = b.x - Math.cos(angle) * (rB + 4);
        const tipY = b.y - Math.sin(angle) * (rB + 4);
        const arrowLen = 8;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - Math.cos(angle - 0.4) * arrowLen, tipY - Math.sin(angle - 0.4) * arrowLen);
        ctx.lineTo(tipX - Math.cos(angle + 0.4) * arrowLen, tipY - Math.sin(angle + 0.4) * arrowLen);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Edge label
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.font = '9px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(200,200,200,0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(e.type.replace(/_/g, ' '), mx, my - 5);
      });

      // ── Draw nodes ──
      nodes.forEach((n) => {
        const r = NODE_RADII[n.label] || 16;
        const color = NODE_COLORS[n.label] || '#666';
        const isHovered = hoveredNode?.id === n.id;
        const isSelected = selectedNode?.id === n.id;

        // Glow ring
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = `${color}33`;
          ctx.fill();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#fff' : isHovered ? '#ddd' : `${color}88`;
        ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
        ctx.stroke();

        // Icon letter
        ctx.font = `bold ${r * 0.7}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = n.label === 'Ticket' ? '🎫' : n.label[0];
        ctx.fillText(icon, n.x, n.y + 1);

        // Node name
        ctx.font = `${Math.max(10, 11)}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = '#e5e7eb';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const displayName = n.name.length > 18 ? n.name.slice(0, 16) + '…' : n.name;
        ctx.fillText(displayName, n.x, n.y + r + 4);
      });

      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, edges, hoveredNode, selectedNode]);

  // ── Resize canvas ──
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Hit test ──
  const hitTest = useCallback(
    (cx: number, cy: number): GNode | null => {
      const cam = camRef.current;
      const wx = (cx - cam.x) / cam.zoom;
      const wy = (cy - cam.y) / cam.zoom;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const r = NODE_RADII[n.label] || 16;
        const dx = wx - n.x, dy = wy - n.y;
        if (dx * dx + dy * dy <= (r + 4) * (r + 4)) return n;
      }
      return null;
    },
    [nodes],
  );

  // ── Mouse handlers ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = hitTest(mx, my);

      if (hit) {
        hit.fx = hit.x;
        hit.fy = hit.y;
        dragRef.current = { type: 'node', node: hit, startX: mx, startY: my, startCamX: 0, startCamY: 0 };
        setSelectedNode(hit);
        alphaRef.current = Math.max(alphaRef.current, 0.3);
      } else {
        dragRef.current = {
          type: 'pan',
          startX: mx,
          startY: my,
          startCamX: camRef.current.x,
          startCamY: camRef.current.y,
        };
        setSelectedNode(null);
      }
    },
    [hitTest],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (dragRef.current) {
        if (dragRef.current.type === 'pan') {
          camRef.current.x = dragRef.current.startCamX + (mx - dragRef.current.startX);
          camRef.current.y = dragRef.current.startCamY + (my - dragRef.current.startY);
        } else if (dragRef.current.type === 'node' && dragRef.current.node) {
          const cam = camRef.current;
          dragRef.current.node.fx = (mx - cam.x) / cam.zoom;
          dragRef.current.node.fy = (my - cam.y) / cam.zoom;
          alphaRef.current = Math.max(alphaRef.current, 0.3);
        }
      } else {
        const hit = hitTest(mx, my);
        setHoveredNode(hit);
        canvasRef.current!.style.cursor = hit ? 'grab' : 'default';
      }
    },
    [hitTest],
  );

  const handleMouseUp = useCallback(() => {
    if (dragRef.current?.type === 'node' && dragRef.current.node) {
      dragRef.current.node.fx = null;
      dragRef.current.node.fy = null;
    }
    dragRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cam = camRef.current;
    const newZoom = Math.min(Math.max(cam.zoom * factor, 0.15), 5);
    cam.x = mx - ((mx - cam.x) / cam.zoom) * newZoom;
    cam.y = my - ((my - cam.y) / cam.zoom) * newZoom;
    cam.zoom = newZoom;
  }, []);

  // ── Toolbar ──
  const zoomIn = () => {
    camRef.current.zoom = Math.min(camRef.current.zoom * 1.3, 5);
  };
  const zoomOut = () => {
    camRef.current.zoom = Math.max(camRef.current.zoom * 0.7, 0.15);
  };
  const fitAll = () => {
    if (!nodes.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    });
    const pad = 80;
    const gw = maxX - minX + pad * 2;
    const gh = maxY - minY + pad * 2;
    const zoom = Math.min(canvas.width / gw, canvas.height / gh, 2);
    camRef.current = {
      x: canvas.width / 2 - ((minX + maxX) / 2) * zoom,
      y: canvas.height / 2 - ((minY + maxY) / 2) * zoom,
      zoom,
    };
  };

  // ── Legend entries ──
  const legend = Object.entries(NODE_COLORS);
  const edgeLegend = Object.entries(EDGE_COLORS);

  // ── Stats ──
  const stats = {
    nodes: nodes.length,
    edges: edges.length,
    types: [...new Set(nodes.map((n) => n.label))],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-4rem)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 text-white shadow">
            <GitGraph className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Knowledge Graph</h1>
            <p className="text-xs text-muted-foreground">
              {stats.nodes} nodes • {stats.edges} edges •&nbsp;
              {stats.types.join(', ')}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5">
          <button onClick={zoomIn} className="rounded-lg p-2 hover:bg-muted transition-colors" title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={zoomOut} className="rounded-lg p-2 hover:bg-muted transition-colors" title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={fitAll} className="rounded-lg p-2 hover:bg-muted transition-colors" title="Fit all">
            <Maximize2 className="h-4 w-4" />
          </button>
          <button onClick={loadGraph} className="rounded-lg p-2 hover:bg-muted transition-colors" title="Reload">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas + overlays */}
      <div ref={containerRef} className="relative flex-1 bg-slate-950 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-950/80 text-muted-foreground">
            Loading graph…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-950/80 text-red-400">
            {error}
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Legend */}
        <div className="absolute left-3 bottom-3 rounded-xl border bg-card/90 backdrop-blur p-3 text-xs space-y-2 max-w-[200px]">
          <p className="font-semibold text-muted-foreground mb-1">Nodes</p>
          {legend.map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </div>
          ))}
          <p className="font-semibold text-muted-foreground mt-2 mb-1">Edges</p>
          {edgeLegend.map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-4 rounded shrink-0" style={{ backgroundColor: color }} />
              <span>{label.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>

        {/* Hovered / Selected node info */}
        {(hoveredNode || selectedNode) && (
          <div className="absolute right-3 top-3 rounded-xl border bg-card/90 backdrop-blur p-4 text-xs max-w-[260px] space-y-2">
            {(() => {
              const n = selectedNode || hoveredNode!;
              return (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: NODE_COLORS[n.label] || '#666' }}
                    />
                    <span className="font-bold text-sm">{n.name}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium mr-1">
                      {n.label}
                    </span>
                    <span className="text-[10px]">id: {n.id}</span>
                  </div>
                  <div className="space-y-0.5 text-muted-foreground max-h-[200px] overflow-y-auto">
                    {Object.entries(n.props)
                      .filter(([k]) => !['id'].includes(k))
                      .slice(0, 12)
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-1">
                          <span className="text-muted-foreground shrink-0">{k}:</span>
                          <span className="truncate font-medium text-foreground">
                            {typeof v === 'string' && v.length > 40 ? v.slice(0, 38) + '…' : String(v)}
                          </span>
                        </div>
                      ))}
                  </div>
                  {/* connected edges */}
                  {(() => {
                    const connected = edges.filter((e) => e.source === n.id || e.target === n.id);
                    if (!connected.length) return null;
                    return (
                      <div>
                        <p className="font-semibold text-muted-foreground mt-1">
                          {connected.length} connection{connected.length > 1 ? 's' : ''}
                        </p>
                        {connected.slice(0, 6).map((e, i) => {
                          const other = e.source === n.id ? e.target : e.source;
                          const otherNode = nodeMapRef.current.get(other);
                          const dir = e.source === n.id ? '→' : '←';
                          return (
                            <div key={i} className="text-[10px] text-muted-foreground">
                              {dir} <span className="font-medium text-foreground">{otherNode?.name || other}</span>{' '}
                              <span style={{ color: EDGE_COLORS[e.type] || '#888' }}>
                                ({e.type.replace(/_/g, ' ')})
                              </span>
                            </div>
                          );
                        })}
                        {connected.length > 6 && (
                          <p className="text-[10px] text-muted-foreground">+{connected.length - 6} more</p>
                        )}
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </div>
        )}

        {/* Help hint */}
        <div className="absolute right-3 bottom-3 flex items-center gap-1 text-[10px] text-muted-foreground/50">
          <Info className="h-3 w-3" />
          Drag nodes • Pan canvas • Scroll to zoom
        </div>
      </div>
    </motion.div>
  );
};

export default GraphVisualization;
