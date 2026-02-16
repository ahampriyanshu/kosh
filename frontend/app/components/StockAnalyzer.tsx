"use client";

import { useState } from "react";
import { analyzeStock } from "../lib/api";

export default function StockAnalyzer() {
    const [ticker, setTicker] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAnalyze = async () => {
        if (!ticker) return;
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const data = await analyzeStock(ticker);
            setResult(data);
        } catch (err) {
            setError("Failed to analyze stock. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Stock Analyzer</h2>
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="Enter Ticker (e.g., AAPL)"
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                    {loading ? "Analyzing..." : "Analyze"}
                </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {result && (
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">
                        Recommendation for {result.ticker}
                    </h3>
                    <div className="prose text-gray-700">
                        <p className="whitespace-pre-wrap">{result.recommendation.details}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
