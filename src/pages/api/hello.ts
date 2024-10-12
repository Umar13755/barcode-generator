import bwipjs from "bwip-js";
import PDFDocument from "pdfkit";
import { promisify } from "util";
import { Readable } from "stream";

const generateBarcode = (text) => {
  return promisify(bwipjs.toBuffer)({
    bcid: "code128",
    text: text,
    scale: 2,
    height: 40,
    includetext: false,
  });
};

const generateBarcodes = async (start, end) => {
  const barcodes = [];
  for (let i = start; i <= end; i++) {
    const number = i.toString();
    const barcode = await generateBarcode(number);
    barcodes.push({ number, barcode });
  }
  return barcodes;
};

const generatePDF = async (barcodes) => {
  const doc = new PDFDocument({ margin: 20 });
  const stream = new Readable();

  doc.on("data", (chunk) => stream.push(chunk));
  doc.on("end", () => stream.push(null));

  const itemsPerRow = 6;
  const itemWidth = 76;
  const itemHeight = 30;
  const marginY = 40;
  const marginX = 22;
  const maxRowsPerPage = 11;

  let x = doc.page.margins.left;
  let y = doc.page.margins.top;
  let rowCount = 0;

  barcodes.forEach((item, index) => {
    doc.image(item.barcode, x, y, { width: itemWidth, height: itemHeight });
    doc.text(item.number, x, y + itemHeight + 5, {
      width: itemWidth,
      align: "center",
    });

    x += itemWidth + marginX;

    if ((index + 1) % itemsPerRow === 0) {
      x = doc.page.margins.left;
      y += itemHeight + marginY;
      rowCount++;

      if (rowCount >= maxRowsPerPage) {
        doc.addPage();
        x = doc.page.margins.left;
        y = doc.page.margins.top;
        rowCount = 0;
      }
    }
  });

  doc.end();
  return stream;
};

export default async function handler(req, res) {
  const { start, end } = req.body;

  try {
    const barcodes = await generateBarcodes(parseInt(start), parseInt(end));
    const pdfStream = await generatePDF(barcodes);

    res.setHeader("Content-Type", "application/pdf");
    pdfStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate barcodes" });
  }
}
