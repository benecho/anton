import React from 'react';
import { motion } from 'framer-motion';

export default function ControlPanel({ params, handleChange, calculate, loading }) {
    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass-panel"
            style={{ padding: '1.5rem', height: 'fit-content' }}
        >
            <form onSubmit={calculate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label>Spot Price (S0)</label>
                    <input type="number" name="S0" value={params.S0} onChange={handleChange} step="0.1" required />
                </div>
                <div>
                    <label>Strike Price (K)</label>
                    <input type="number" name="K" value={params.K} onChange={handleChange} step="0.1" required />
                </div>
                <div>
                    <label>Time (Years)</label>
                    <input type="number" name="T" value={params.T} onChange={handleChange} step="0.01" required />
                </div>
                <div>
                    <label>Steps (N)</label>
                    <input type="number" name="N" value={params.N} onChange={handleChange} max="100" required />
                    <small style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', marginTop: 4 }}>Max recommended for tree view: 20</small>
                </div>
                <div>
                    <label>Risk-free Rate (r)</label>
                    <input type="number" name="r" value={params.r} onChange={handleChange} step="0.001" required />
                </div>
                <div>
                    <label>Volatility (σ)</label>
                    <input type="number" name="sigma" value={params.sigma} onChange={handleChange} step="0.01" required />
                </div>
                <div>
                    <label>Type</label>
                    <select name="type" value={params.type} onChange={handleChange} style={{ width: '100%' }}>
                        <option value="CALL">Call</option>
                        <option value="PUT">Put</option>
                    </select>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Calculating...' : 'Calculate Price'}
                </button>
            </form>
        </motion.div>
    );
}
