// src/components/HederaTest.js
import React, { useState } from 'react';
import hederaService from '../services/hederaService';

const HederaTest = () => {
    const [testResult, setTestResult] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    const testHederaConnection = async () => {
        setIsTesting(true);
        try {
            const result = await hederaService.registerArtworkHash(
                'test_hash_' + Date.now(),
                'test_file.txt'
            );
            setTestResult(result);
        } catch (error) {
            setTestResult({ success: false, error: error.message });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Hedera Connection Test</h5>
                <button 
                    className="btn btn-primary"
                    onClick={testHederaConnection}
                    disabled={isTesting}
                >
                    {isTesting ? 'Testing...' : 'Test Hedera Connection'}
                </button>
                
                {testResult && (
                    <div className={`mt-3 p-3 rounded ${testResult.success ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                        <pre>{JSON.stringify(testResult, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HederaTest;