import React from 'react';
import { motion } from 'framer-motion';

export default function TreeVisualizer({ priceTree, valueTree, nSteps }) {
    if (Number(nSteps) > 15) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel"
                style={{ padding: '1.5rem' }}
            >
                <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    N is too large to visualize the tree directly. Try N &le; 15.
                </p>
            </motion.div>
        );
    }

    const steps = priceTree.length;
    const nodeRadius = 18;
    const levelWidth = 80;
    const levelHeight = 60;
    const width = steps * levelWidth + 100;
    const height = steps * levelHeight + 50;

    const nodes = [];
    const links = [];

    for (let i = 0; i < steps; i++) {
        for (let j = 0; j <= i; j++) {
            const x = i * levelWidth + 50;
            const y = (height / 2) + (j - i / 2) * levelHeight;

            nodes.push({ id: `${i}-${j}`, x, y, price: priceTree[i][j], value: valueTree[i][j] });

            if (i < steps - 1) {
                const nextX = (i + 1) * levelWidth + 50;
                const nextYUp = (height / 2) + (j - (i + 1) / 2) * levelHeight;
                const nextYDown = (height / 2) + ((j + 1) - (i + 1) / 2) * levelHeight;

                links.push({ x1: x, y1: y, x2: nextX, y2: nextYUp });
                links.push({ x1: x, y1: y, x2: nextX, y2: nextYDown });
            }
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel"
            style={{ padding: '1.5rem', minHeight: '400px', overflowX: 'auto' }}
        >
            <h3>Tree Visualization</h3>
            <div style={{ overflow: 'auto', textAlign: 'center' }}>
                <svg width={width} height={height}>
                    <defs>
                        <marker id="arrow" markerWidth="6" markerHeight="6" refX="16" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill="#475569" />
                        </marker>
                    </defs>

                    {links.map((link, idx) => (
                        <line
                            key={idx}
                            x1={link.x1} y1={link.y1}
                            x2={link.x2} y2={link.y2}
                            stroke="#475569"
                            strokeWidth="1"
                        />
                    ))}

                    {nodes.map((node) => (
                        <g key={node.id}>
                            <circle cx={node.x} cy={node.y} r={nodeRadius} fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                            <text x={node.x} y={node.y - 4} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
                                {node.value.toFixed(2)}
                            </text>
                            <text x={node.x} y={node.y + 8} textAnchor="middle" fontSize="8" fill="#94a3b8">
                                {node.price.toFixed(1)}
                            </text>
                        </g>
                    ))}
                </svg>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>Bold: Option Value</span>
                    <span style={{ color: '#94a3b8' }}>Gray: Stock Price</span>
                </div>
            </div>
        </motion.div>
    );
}
