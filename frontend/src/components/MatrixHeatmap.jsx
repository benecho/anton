import React from 'react';
import { motion } from 'framer-motion';

export default function MatrixHeatmap({ data, getColor }) {
    const { N, maxOptionValue, valueTree } = data;

    const cellSize = 6; // Fixed pixel size per cell
    const maxNodes = 2 * N + 1; // Maximum nodes at final step
    const matrixWidth = cellSize * (N + 1);
    const matrixHeight = cellSize * maxNodes;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel"
            style={{ padding: '1.5rem' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Trinomial Heatmap Matrix</h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    N = {N} steps
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Matrix Canvas */}
                <div style={{
                    overflow: 'auto',
                    maxHeight: '700px',
                    maxWidth: '100%',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <svg width={matrixWidth} height={matrixHeight}>
                        {valueTree.map((level, stepIndex) => {
                            const numNodes = level.length;
                            const startJ = -stepIndex;

                            return level.map((value, nodeIndex) => {
                                const j = startJ + nodeIndex;

                                // Position in matrix
                                // x: step index (time)
                                // y: from top, j goes from +stepIndex (top) to -stepIndex (bottom)
                                const x = stepIndex * cellSize;
                                const y = (maxNodes / 2 - j - 0.5) * cellSize;

                                const color = getColor(value, maxOptionValue);

                                return (
                                    <rect
                                        key={`${stepIndex}-${nodeIndex}`}
                                        x={x}
                                        y={y}
                                        width={cellSize}
                                        height={cellSize}
                                        fill={color}
                                        stroke="rgba(0,0,0,0.1)"
                                        strokeWidth="0.5"
                                    >
                                        <title>{`Step ${stepIndex}, j=${j}\nValue: ${value.toFixed(4)}`}</title>
                                    </rect>
                                );
                            });
                        })}
                    </svg>
                </div>

                {/* Legend */}
                <div style={{
                    minWidth: '200px',
                    padding: '1rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Legend</h4>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Steps (N)</div>
                        <div style={{ fontWeight: 'bold' }}>{N}</div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Max Vij</div>
                        <div style={{ fontWeight: 'bold' }}>{maxOptionValue.toFixed(4)}</div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ color: '#94a3b8', marginBottom: '0.25rem' }}>Total Nodes</div>
                        <div style={{ fontWeight: 'bold' }}>{((N + 1) * (N + 2) / 2).toLocaleString()}</div>
                    </div>

                    <div>
                        <div style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Color Scale</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <div style={{ width: 16, height: 16, background: '#ef4444', borderRadius: '2px' }}></div>
                            <span>0 (Low)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 16, height: 16, background: '#22c55e', borderRadius: '2px' }}></div>
                            <span>Max (High)</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <strong>Matrix Layout:</strong><br />
                        • Horizontal: Time steps (0 → N)<br />
                        • Vertical: Price levels (up ↑, down ↓)
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
