import express from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to check project ownership
async function checkOwnership(req, projectId) {
    const project = await db.getProjectById(projectId);
    if (!project) return { error: 'Project not found', status: 404 };

    // Get user to check role
    const user = await db.getUserById(req.user.id);

    // Contractors can export all projects, regular users only their own
    if (user.role !== 'contractor' && project.user_id !== req.user.id) {
        return { error: 'Access denied', status: 403 };
    }

    return { project };
}

// Export to Excel
router.get('/:projectId/excel', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const check = await checkOwnership(req, projectId);
        if (check.error) return res.status(check.status).json({ error: check.error });

        const { project } = check;
        const images = await db.getImagesByProject(projectId);

        // Fetch analysis for all images
        const imagesWithAnalysis = await Promise.all(
            images.map(async (img) => {
                const analysis = await db.getAnalysisByImage(img.id);
                return { ...img, analysis };
            })
        );

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ConstructAI';
        workbook.created = new Date();

        // Sheet 1: Project Overview
        const overviewSheet = workbook.addWorksheet('Overview');
        overviewSheet.columns = [
            { header: 'Property', key: 'prop', width: 20 },
            { header: 'Value', key: 'val', width: 50 }
        ];
        overviewSheet.addRows([
            { prop: 'Project Name', val: project.name },
            { prop: 'Stage', val: project.stage },
            { prop: 'Location', val: project.location },
            { prop: 'Description', val: project.description },
            { prop: 'Created At', val: project.created_at },
            { prop: 'Total Images', val: images.length }
        ]);

        // Sheet 2: Analysis Details
        const analysisSheet = workbook.addWorksheet('Analysis Data');
        analysisSheet.columns = [
            { header: 'Image Name', key: 'name', width: 30 },
            { header: 'Upload Date', key: 'date', width: 20 },
            { header: 'Progress (%)', key: 'progress', width: 15 },
            { header: 'Confidence', key: 'confidence', width: 15 },
            { header: 'Est. Days Remaining', key: 'days', width: 20 },
            { header: 'Structural Elements', key: 'structural', width: 40 },
            { header: 'Safety Issues', key: 'safety', width: 40 },
            { header: 'Weather', key: 'weather', width: 20 }
        ];

        imagesWithAnalysis.forEach(img => {
            const analysis = img.analysis || {};
            analysisSheet.addRow({
                name: img.file_name,
                date: img.upload_date,
                progress: analysis.progress_percentage || 0,
                confidence: (analysis.confidence_score || 0).toFixed(2),
                days: analysis.time_estimate_days || 'N/A',
                structural: JSON.stringify(analysis.structural_elements || {}),
                safety: JSON.stringify(analysis.safety_issues || []),
                weather: analysis.weather_conditions || 'N/A'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${project.name.replace(/\s+/g, '_')}_report.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ error: 'Failed to generate Excel report' });
    }
});

// Export to PDF
router.get('/:projectId/pdf', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const check = await checkOwnership(req, projectId);
        if (check.error) return res.status(check.status).json({ error: check.error });

        const { project } = check;
        const images = await db.getImagesByProject(projectId);

        // Fetch analysis for all images
        const imagesWithAnalysis = await Promise.all(
            images.map(async (img) => {
                const analysis = await db.getAnalysisByImage(img.id);
                return { ...img, analysis };
            })
        );

        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${project.name.replace(/\s+/g, '_')}_report.pdf`);

        doc.pipe(res);

        // --- Header ---
        doc.fontSize(24).text('ConstructAI Project Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1);

        // --- Horizontal Project Overview ---
        const overviewTop = doc.y;
        doc.fontSize(10);

        // Draw a box for overview
        doc.rect(30, overviewTop, 782, 40).fillAndStroke('#f5f5f5', '#aaaaaa');
        doc.fillColor('#000000');

        // Column 1: Project Name
        doc.font('Helvetica-Bold').text('Project:', 40, overviewTop + 13);
        doc.font('Helvetica').text(project.name, 85, overviewTop + 13);

        // Column 2: Stage
        doc.font('Helvetica-Bold').text('Stage:', 250, overviewTop + 13);
        doc.font('Helvetica').text(project.stage, 290, overviewTop + 13);

        // Column 3: Location
        doc.font('Helvetica-Bold').text('Location:', 450, overviewTop + 13);
        doc.font('Helvetica').text(project.location, 505, overviewTop + 13);

        // Column 4: Total Images
        doc.font('Helvetica-Bold').text('Images:', 650, overviewTop + 13);
        doc.font('Helvetica').text(images.length.toString(), 700, overviewTop + 13);

        doc.moveDown(4);

        // --- Table Configuration ---
        const tableTop = doc.y + 10;
        const itemHeight = 30;
        const startX = 30;
        const colWidths = [150, 80, 60, 60, 80, 176, 176]; // Total: 782 (Matches overview box width)
        const headers = ['Image Name', 'Date', 'Prog %', 'Conf %', 'Est. Days', 'Structural Elements', 'Safety Issues'];

        let currentY = tableTop;

        // Function to draw table header
        const drawHeader = (y) => {
            doc.rect(startX, y, 782, 25).fillAndStroke('#e0e0e0', '#000000');
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);

            let currentX = startX;
            headers.forEach((header, i) => {
                doc.text(header, currentX + 5, y + 8, { width: colWidths[i] - 10, align: 'left' });
                // Draw vertical line separator
                if (i > 0) {
                    doc.moveTo(currentX, y).lineTo(currentX, y + 25).stroke();
                }
                currentX += colWidths[i];
            });
        };

        drawHeader(currentY);
        currentY += 25;

        // --- Table Rows ---
        doc.font('Helvetica').fontSize(9);

        imagesWithAnalysis.forEach((img, index) => {
            // Check for page break
            if (currentY > doc.page.height - 50) {
                doc.addPage({ layout: 'landscape' });
                currentY = 50;
                drawHeader(currentY);
                currentY += 25;
            }

            const analysis = img.analysis || {};
            const structural = analysis.structural_elements ? Object.keys(analysis.structural_elements).join(', ') : 'None';
            const safety = analysis.safety_issues ? analysis.safety_issues.map(i => i.description).join(', ') : 'None';

            const rowData = [
                img.file_name,
                new Date(img.upload_date).toLocaleDateString(),
                `${analysis.progress_percentage || 0}%`,
                `${((analysis.confidence_score || 0) * 100).toFixed(1)}%`,
                `${analysis.time_estimate_days || 'N/A'}`,
                structural,
                safety
            ];

            // Draw Row Background (Alternating)
            if (index % 2 === 1) {
                doc.rect(startX, currentY, 782, itemHeight).fill('#f9f9f9');
                doc.fillColor('#000000');
            }

            let currentX = startX;

            // Draw Cell Text
            rowData.forEach((text, i) => {
                doc.text(text, currentX + 5, currentY + 8, { width: colWidths[i] - 10, align: 'left', height: itemHeight - 10 });
                currentX += colWidths[i];
            });

            // Draw Grid Lines (Box around row)
            doc.rect(startX, currentY, 782, itemHeight).stroke();

            // Draw Vertical Lines
            currentX = startX;
            colWidths.forEach((width, i) => {
                if (i > 0) {
                    doc.moveTo(currentX, currentY).lineTo(currentX, currentY + itemHeight).stroke();
                }
                currentX += width;
            });

            currentY += itemHeight;
        });

        doc.end();

    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ error: 'Failed to generate PDF report' });
    }
});

export default router;
