import React from 'react';
import { motion } from 'framer-motion';

export default function TreeVisualizer({ priceTree, valueTree, nSteps, showTree }) {

    if (!showTree) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel"
                style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>
                    ✓ Tree visualization disabled. Enable "Show Tree Visualization" to view.
                </p>
            </motion.div>
        );
    }

    if (Number(nSteps) > 10) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel"
                style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <p style={{ textAlign: 'center', color: '#94a3b8' }}>
                    N is too large to visualize the tree directly. Try N &le; 10.
                </p>
            </motion.div>
        );
    }

    if (!priceTree || !priceTree.length) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel"
                style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>
                    Click "Calculate Price" to generate the tree visualization
                </p>
            </motion.div>
        );
    }

    const steps = priceTree.length;
    const nodeRadius = 18;
    const levelWidth = 100;
    const levelHeight = 50;
    const width = steps * levelWidth + 100;
    // Calculate visualization height based on max nodes (at last step 2N+1 nodes)
    const maxNodes = 2 * (steps - 1) + 1;
    const height = maxNodes * levelHeight + 100;
    const centerY = height / 2;

    const nodes = [];
    const links = [];

    // Identify and position nodes
    for (let i = 0; i < steps; i++) {
        // En trinomial, nivel i tiene 2*i + 1 nodos
        // El backend devuelve lista de listas. priceTree[i] es array de length 2*i+1.

        for (let k = 0; k < priceTree[i].length; k++) {
            const x = i * levelWidth + 50;

            // k va de 0 a 2i. 
            // k=i es el centro (j=0). 
            // Queremos que k=2i (j=i, precio mas alto) este arriba (y menor).
            // Queremos que k=0 (j=-i, precio mas bajo) este abajo (y mayor).

            // offset from center: j = k - i.
            // y = centerY - j * levelHeight
            //   = centerY - (k - i) * levelHeight
            //   = centerY + (i - k) * levelHeight

            const j = k - i;
            const y = centerY - j * levelHeight;

            nodes.push({
                id: `${i}-${k}`,
                x,
                y,
                price: priceTree[i][k],
                value: valueTree[i][k]
            });

            // Links to next step
            if (i < steps - 1) {
                // Node (i, k) conecta con (i+1, k), (i+1, k+1), (i+1, k+2)
                const nextX = (i + 1) * levelWidth + 50;

                // Targets k indices in next level
                const targets = [k, k + 1, k + 2];

                targets.forEach(targetK => {
                    const targetJ = targetK - (i + 1);
                    const targetY = centerY - targetJ * levelHeight;

                    links.push({
                        x1: x, y1: y,
                        x2: nextX, y2: targetY
                    });
                });
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
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Trinomial Tree Visualization</h3>
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
                            opacity="0.4"
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
