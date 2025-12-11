import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import MatrixHeatmap from './MatrixHeatmap';
import TreeNodes from './TreeNodes';

export default function TreeVisualizer({ priceTree, valueTree, nSteps, showTree }) {

    // Helper: Interpolate color from Red (low) to Green (high)
    // Using sqrt to bias gradient towards green earlier
    // Helper: Interpolate color from Red (low) to Green (high)
    // Using cubic root (1/3) to bias gradient towards green VERY early
    const getColor = (val, maxVal) => {
        if (maxVal === 0) return '#ef4444';
        let ratio = Math.max(0, Math.min(1, val / maxVal));

        // Strong non-linear scaling: cubic root makes 10% value -> 46% color, 50% -> 80% color
        ratio = Math.pow(ratio, 0.4);

        const r = Math.round(239 + (34 - 239) * ratio);
        const g = Math.round(68 + (197 - 68) * ratio);
        const b = Math.round(68 + (94 - 68) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
    };

    const visualizationData = useMemo(() => {
        if (!priceTree || !priceTree.length || !valueTree || !valueTree.length) return null;

        const N = Number(nSteps);

        // Find max value for heatmap normalization
        let maxOptionValue = 0;
        valueTree.forEach(level => {
            level.forEach(val => {
                if (val > maxOptionValue) maxOptionValue = val;
            });
        });

        // Determine visualization mode
        if (N > 100) {
            // MODE 3: Matrix Heatmap for large N
            return {
                mode: 'matrix',
                N,
                maxOptionValue,
                priceTree,
                valueTree
            };
        } else if (N > 10) {
            // MODE 2: Filtered tree (steps 0, 10, 20, ...)
            return {
                mode: 'filtered-tree',
                N,
                maxOptionValue,
                priceTree,
                valueTree
            };
        } else {
            // MODE 1: Full tree
            return {
                mode: 'full-tree',
                N,
                maxOptionValue,
                priceTree,
                valueTree
            };
        }
    }, [priceTree, valueTree, nSteps]);

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

    if (!visualizationData) {
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

    // Render Matrix Heatmap for N > 100
    if (visualizationData.mode === 'matrix') {
        return <MatrixHeatmap data={visualizationData} getColor={getColor} />;
    }

    // Render Tree (full or filtered)
    return <TreeNodes data={visualizationData} getColor={getColor} />;
}
