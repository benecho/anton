import React, { useState } from 'react';
import axios from 'axios';
import ControlPanel from './components/ControlPanel';
import ResultPanel from './components/ResultPanel';
import TreeVisualizer from './components/TreeVisualizer';
import CalibrationPanel from './components/CalibrationPanel';

function App() {
    const [params, setParams] = useState({
        S0: 100, K: 100, T: 1, N: 5, r: 0.05,
        u: 1.02, d: 1 / 1.02,
        isAmerican: true,
        type: 'CALL',
        ThetaStr: "0.2, 0.25, 0.22",
        tauStr: "0.0, 0.4, 0.7, 1.0",
        showTree: true
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
            const Theta = params.ThetaStr.split(',').map(Number);
            const tau = params.tauStr.split(',').map(Number);

            const payload = {
                S0: Number(params.S0),
                K: Number(params.K),
                T: Number(params.T),
                r: Number(params.r),
                N: Number(params.N),
                u: Number(params.u),
                d: Number(params.d),
                type: params.type,
                isAmerican: params.isAmerican,
                Theta: Theta,
                tau: tau
            };

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            let response;
            if (params.showTree && params.N <= 10) {
                response = await axios.post(`${apiUrl}/tree`, payload);
            } else {
                response = await axios.post(`${apiUrl}/price`, payload);
            }

            setResult(response.data);
        } catch (err) {
            console.error(err);
            alert("Error calculating price. Check inputs and backend connection.");
        }
        setLoading(false);
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '1800px',
            margin: '0 auto'
        }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                    Trinomial <span style={{ color: '#3b82f6' }}>Pricer</span>
                </h1>
                <p style={{ color: '#94a3b8', margin: 0 }}>Advanced options pricing model</p>
            </header>

            <div style={{
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'flex-start',
                flexWrap: 'wrap'
            }}>

                <div style={{
                    flex: '1 1 100%',
                    minWidth: '280px',
                    maxWidth: '100%'
                }}
                    className="control-panel-container"
                >
                    <ControlPanel
                        params={params}
                        handleChange={handleChange}
                        setParams={setParams}
                        calculate={calculate}
                        loading={loading}
                    />

                    <CalibrationPanel
                        params={params}
                        setParams={setParams}
                    />
                </div>

                <div style={{
                    flex: '1 1 100%',
                    minWidth: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}
                    className="results-container"
                >

                    <ResultPanel result={result} />

                    <TreeVisualizer
                        priceTree={result?.priceTree}
                        valueTree={result?.valueTree}
                        nSteps={params.N}
                        showTree={params.showTree}
                    />

                </div>
            </div>

            <style>{`
                @media (min-width: 1024px) {
                    .control-panel-container {
                        flex: 0 0 420px !important;
                        max-width: 450px !important;
                    }
                    .results-container {
                        flex: 1 1 600px !important;
                    }
                }
                @media (min-width: 768px) and (max-width: 1023px) {
                    .control-panel-container {
                        flex: 0 0 380px !important;
                        max-width: 400px !important;
                    }
                    .results-container {
                        flex: 1 1 400px !important;
                    }
                }
            `}</style>
        </div>
    )
}


export default App
