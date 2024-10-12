import { useState } from "react";

export default function Home() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLink, setPdfLink] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setPdfLink(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ start, end }), // send start and end values to API
      });

      if (!response.ok) {
        throw new Error("Error generating PDF");
      }

      const blob = await response.blob();
      const link = URL.createObjectURL(blob);
      setPdfLink(link); // Set the link to download the PDF
    } catch (error) {
      console.error("Error generating barcodes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">
          Barcode Generator
        </h1>
        <h2 className="text-green-400 my-3">
          Give max of 7 numbers length e.g{" "}
          <span className="font-bold">2100100 to 2100200</span>
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Start Barcode Number:
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Enter start number"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              End Barcode Number:
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="Enter end number"
            />
          </div>
          <button
            onClick={handleGenerate}
            className={`w-full py-2 px-4 rounded-lg text-white font-bold ${
              loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Barcodes"}
          </button>
          {pdfLink && (
            <div className="mt-4 text-center">
              <a
                href={pdfLink}
                download="barcodes.pdf"
                className="bg-indigo-500 p-3 rounded-md hover:bg-indigo-400 text-slate-50"
              >
                Download PDF
              </a>
            </div>
          )}
        </div>
      </div>

    </>
  );
}
