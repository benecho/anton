import React, { useState } from 'react';
import axios from 'axios';
import ControlPanel from './components/ControlPanel';
import ResultPanel from './components/ResultPanel';
import TreeVisualizer from './components/TreeVisualizer';

function App() {
    const [params, setParams] = useState({
        S0: 100, K: 100, T: 1, N: 5, r: 0.05, sigma: 0.2, type: 'CALL'
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setParams({ ...params, [e.target.name]: e.target.value });
    };

    const calculate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await axios.get(`${apiUrl}/tree`, { params });
            setResult(response.data);
        } catch (err) {
            console.error(err);
            alert("Error calculating price. Backend is running?");
        }
        setLoading(false);
    };

    return (
        <div style={{ width: '100%', maxWidth: '1200px' }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Binomial <span style={{ color: '#3b82f6' }}>Pricer</span></h1>
                <p style={{ color: '#94a3b8' }}>High-performance options pricing via C & FastAPI</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>

                {/* Panel de Control */}
                <ControlPanel
                    params={params}
                    handleChange={handleChange}
                    calculate={calculate}
                    loading={loading}
                />

                {/* Panel de Resultados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <ResultPanel result={result} />

                    {result && (
                        <TreeVisualizer
                            priceTree={result.priceTree}
                            valueTree={result.valueTree}
                            nSteps={params.N}
                        />
                    )}

                </div>
            </div>
        </div>
    )
}

export default App
