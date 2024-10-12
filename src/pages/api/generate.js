import bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';

export default async function handler(req, res) {
  try {
    // Validate the request method
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method Not Allowed' });
      return;
    }

    const { start, end } = req.body;

    // Generate barcodes
    const generateBarcode = (text) => {
      return new Promise((resolve, reject) => {
        bwipjs.toBuffer(
          {
            bcid: 'code128', // Barcode type
            text: text, // Text to encode
            scale: 2,
            height: 40,
            includetext: false,
          },
          (err, png) => {
            if (err) {
              reject(err);
            } else {
              resolve(png);
            }
          }
        );
      });
    };

    const barcodes = [];
    for (let i = parseInt(start); i <= parseInt(end); i++) {
      const barcode = await generateBarcode(i.toString());
      barcodes.push({ number: i.toString(), barcode });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="barcodes.pdf"');

    // Pipe PDF document to the response stream
    doc.pipe(res);

    // Generate PDF content
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
        align: 'center',
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

    doc.end(); // Finalize the PDF and send it in response
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
}
