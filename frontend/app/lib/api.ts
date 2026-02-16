const API_URL = "http://localhost:8000/api/v1";

export async function analyzeStock(ticker: string) {
    const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker }),
    });
    if (!response.ok) {
        throw new Error("Analysis failed");
    }
    return response.json();
}

export async function getPortfolio() {
    const response = await fetch(`${API_URL}/portfolio`);
    if (!response.ok) {
        throw new Error("Failed to fetch portfolio");
    }
    return response.json();
}
