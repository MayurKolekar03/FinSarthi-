import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

# Image paths
CM_IMG = r"c:\Users\mayur\Desktop\finance app\New folder (3)\results\confusion_matrix_setfit.png"
DASH_IMG = r"C:\Users\mayur\.gemini\antigravity-ide\brain\2a218ad9-a831-405d-aaa1-e5a716e70498\app_homepage_1791897796868.png"
CHAT_IMG = r"C:\Users\mayur\.gemini\antigravity-ide\brain\2a218ad9-a831-405d-aaa1-e5a716e70498\chat_screen_1791897813952.png"
PDF_OUTPUT = r"c:\Users\mayur\Desktop\finance app\FinSarathi_AI_Research_Report.pdf"

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for total page count and professional headers/footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.drawString(36, 812, "FinSarathi.AI: Empirical Validation & Implementation Status Audit")
            self.drawRightString(559, 812, "IEEE Technical Report")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 806, 559, 806)

        # Footer (All pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 36, 559, 36)
        self.drawString(36, 24, "CONFIDENTIAL & VERIFIED — Prepared for IEEE Conference/Transactions Submission")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(559, 24, page_text)
        self.restoreState()

def build_pdf():
    doc = SimpleDocTemplate(
        PDF_OUTPUT,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    NAVY = colors.HexColor("#0F172A")
    ACCENT_BLUE = colors.HexColor("#2563EB")
    TEXT_DARK = colors.HexColor("#1E293B")
    TEXT_MUTED = colors.HexColor("#475569")
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#CBD5E1")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=NAVY,
        spaceAfter=3
    )

    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0369A1"),
        spaceAfter=2
    )

    meta_style = ParagraphStyle(
        'Meta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_MUTED
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=NAVY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12.5,
        textColor=ACCENT_BLUE,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.2,
        textColor=TEXT_DARK,
        spaceAfter=4
    )

    caption_style = ParagraphStyle(
        'Caption',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=9.5,
        textColor=TEXT_MUTED,
        alignment=1,
        spaceBefore=3,
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor("#F8FAFC")
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.8,
        textColor=TEXT_DARK
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold'
    )

    table_hdr = ParagraphStyle(
        'TableHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=NAVY
    )

    elements = []

    # Title & Metadata
    elements.append(Paragraph("<b>IEEE RESEARCH MANUSCRIPT TECHNICAL AUDIT & EMPIRICAL VALIDATION</b>", badge_style))
    elements.append(Paragraph("FinSarathi.AI: Empirical Evaluation, System Architecture, and Implementation Status", title_style))
    
    meta_text = (
        "<b>Target Paper:</b> <i>FinSarathi.AI: A Privacy-First, Local-First Multilingual Personal Finance Assistant with Hybrid ML–LLM Architecture and Retrieval-Augmented Generation</i><br/>"
        "<b>Auditor:</b> Antigravity AI Engineering Audit Team &nbsp;|&nbsp; <b>Date:</b> October 2026 &nbsp;|&nbsp; <b>Status:</b> Two-Phase Implementation Verified"
    )
    elements.append(Paragraph(meta_text, meta_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=NAVY, spaceAfter=6, spaceBefore=4))

    # Executive Summary / Implementation Disclosure Box
    exec_summary_text = (
        "<b>CRITICAL RESEARCH DISCLOSURE (The 'Two-Phase Implementation Reality'):</b><br/>"
        "To guarantee academic defensibility during IEEE review, the manuscript must accurately present the <b>current implementation boundary</b>:<br/>"
        "• <b>Phase 1 (Completed & Empirically Verified):</b> On-device Few-Shot SetFit transaction classifier (97.58% CV accuracy), zero-cloud SQLite local ledger, TRAI DLT regulatory SMS gatekeeper, hybrid Bhashini translation bridge, and Groq LLM financial cognitive reasoning.<br/>"
        "• <b>Phase 2 (Proposed / Architectural Roadmap):</b> Multi-step PyTorch LSTM budget forecasting, rolling Z-score anomaly detection, dense ChromaDB regulatory RAG, and client-side AES-256 Google Drive backup. These modules must be framed as designed future extensions, not completed benchmarks."
    )
    
    box_table = Table([[Paragraph(exec_summary_text, body_style)]], colWidths=[523])
    box_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#3B82F6")),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(box_table)
    elements.append(Spacer(1, 6))

    # Section 1: Implementation Matrix
    elements.append(Paragraph("1. System Architecture & Component Verification Matrix", h1_style))
    elements.append(Paragraph(
        "Every system component proposed in the research paper was audited against source code, unit tests, and live application instances:",
        body_style
    ))

    matrix_data = [
        [Paragraph("Component", table_hdr), Paragraph("Status", table_hdr), Paragraph("Audited Implementation Facts", table_hdr), Paragraph("Framing for IEEE Manuscript", table_hdr)],
        
        [Paragraph("<b>React Native Client</b>", table_cell_bold),
         Paragraph("<font color='#15803D'><b>Completed</b></font>", table_cell),
         Paragraph("Expo SDK 57, React Native 0.86.3, TypeScript, tab navigation, active on localhost:8081.", table_cell),
         Paragraph("Present as functional mobile edge client.", table_cell)],

        [Paragraph("<b>Local SQLite Ledger</b>", table_cell_bold),
         Paragraph("<font color='#15803D'><b>Completed</b></font>", table_cell),
         Paragraph("<code>expo-sqlite</code> with WAL journal mode. Zero raw user records leave the device.", table_cell),
         Paragraph("Present as sovereign zero-cloud persistence layer.", table_cell)],

        [Paragraph("<b>SetFit Classifier</b>", table_cell_bold),
         Paragraph("<font color='#15803D'><b>Completed</b></font>", table_cell),
         Paragraph("Trained on 7,650 samples (97.58% CV accuracy). Exported to 22.9 MB INT8 ONNX.", table_cell),
         Paragraph("Present as core empirical ML contribution.", table_cell)],

        [Paragraph("<b>TRAI DLT SMS Gate</b>", table_cell_bold),
         Paragraph("<font color='#15803D'><b>Completed</b></font>", table_cell),
         Paragraph("Offline 3-gate regex enforcing TCCCPR 2018/2025 formats. 15 Jest tests pass.", table_cell),
         Paragraph("Present as regulatory anti-spam SMS ingestion.", table_cell)],

        [Paragraph("<b>Multilingual Layer</b>", table_cell_bold),
         Paragraph("<font color='#B45309'><b>Partial</b></font>", table_cell),
         Paragraph("Bhashini REST API + MyMemory web bridge (no IndicTrans2). Devanagari normalizer.", table_cell),
         Paragraph("Disclose REST translation API; IndicTrans2 as future on-device model.", table_cell)],

        [Paragraph("<b>LLM Cognitive Core</b>", table_cell_bold),
         Paragraph("<font color='#15803D'><b>Completed</b></font>", table_cell),
         Paragraph("Groq API (Qwen-3.8 / Llama 3) with prompt-injected SQLite ledger ground truth.", table_cell),
         Paragraph("Present as cloud-inference financial cognitive layer.", table_cell)],

        [Paragraph("<b>Text-to-SQL Pipeline</b>", table_cell_bold),
         Paragraph("<font color='#B91C1C'><b>Proposed</b></font>", table_cell),
         Paragraph("In-context ledger injection is used. No SQLGlot or dynamic SQL AST generator.", table_cell),
         Paragraph("Reclassify as designed optimization in Phase 2.", table_cell)],

        [Paragraph("<b>LSTM Forecasting</b>", table_cell_bold),
         Paragraph("<font color='#B91C1C'><b>Proposed</b></font>", table_cell),
         Paragraph("12,030 dataset and PyTorch LSTM model do not exist in codebase.", table_cell),
         Paragraph("Frame as theoretical formulation & future roadmap.", table_cell)],

        [Paragraph("<b>Rolling Z-Score</b>", table_cell_bold),
         Paragraph("<font color='#B91C1C'><b>Proposed</b></font>", table_cell),
         Paragraph("No rolling statistical anomaly detector implemented or evaluated.", table_cell),
         Paragraph("Frame as planned anomaly detection module.", table_cell)],

        [Paragraph("<b>ChromaDB RAG</b>", table_cell_bold),
         Paragraph("<font color='#B91C1C'><b>Proposed</b></font>", table_cell),
         Paragraph("No ChromaDB, vector database, or dense regulatory retriever implemented.", table_cell),
         Paragraph("Frame as planned extension for RBI compliance circulars.", table_cell)],

        [Paragraph("<b>Google Drive Sync</b>", table_cell_bold),
         Paragraph("<font color='#B91C1C'><b>Proposed</b></font>", table_cell),
         Paragraph("UI button triggers simulated 1200ms timer; no Drive API or AES module present.", table_cell),
         Paragraph("Describe as planned client-side sovereign cloud backup.", table_cell)],
    ]

    t_matrix = Table(matrix_data, colWidths=[105, 55, 185, 178])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    elements.append(t_matrix)

    # Page Break for Empirical Section
    elements.append(PageBreak())

    # Section 2: SetFit Empirical Results
    elements.append(Paragraph("2. SetFit Transaction Classifier: Empirical Verification", h1_style))
    elements.append(Paragraph(
        "<b>Dataset Profile:</b> The classification benchmark evaluated in <code>research_evaluation.py</code> was derived from <code>financial_transaction_train (2).csv</code>. "
        "The script stratified the transactions into <b>7,650 records</b> across six classes (1,500 each for EMI, Food, Investment, Shopping, Travel, and 150 for Personal_Transfer), applying 70% probabilistic banking noise.",
        body_style
    ))

    elements.append(Paragraph("2.1 5-Fold Stratified Cross-Validation Breakdown ($K=5$)", h2_style))
    cv_data = [
        [Paragraph("Evaluation Fold", table_hdr), Paragraph("Validation N", table_hdr), Paragraph("Accuracy", table_hdr), Paragraph("Macro F1", table_hdr), Paragraph("Weighted F1", table_hdr), Paragraph("Verification Evidence", table_hdr)],
        [Paragraph("Fold 1", table_cell), Paragraph("1,530", table_cell), Paragraph("100.00%", table_cell), Paragraph("1.0000", table_cell), Paragraph("1.0000", table_cell), Paragraph("results/cv_summary.txt", table_cell)],
        [Paragraph("Fold 2", table_cell), Paragraph("1,530", table_cell), Paragraph("98.56%", table_cell), Paragraph("0.9856", table_cell), Paragraph("0.9856", table_cell), Paragraph("results/cv_summary.txt", table_cell)],
        [Paragraph("Fold 3", table_cell), Paragraph("1,530", table_cell), Paragraph("95.75%", table_cell), Paragraph("0.9573", table_cell), Paragraph("0.9573", table_cell), Paragraph("results/cv_summary.txt", table_cell)],
        [Paragraph("Fold 4", table_cell), Paragraph("1,530", table_cell), Paragraph("97.06%", table_cell), Paragraph("0.9705", table_cell), Paragraph("0.9705", table_cell), Paragraph("results/cv_summary.txt", table_cell)],
        [Paragraph("Fold 5", table_cell), Paragraph("1,530", table_cell), Paragraph("96.54%", table_cell), Paragraph("0.9651", table_cell), Paragraph("0.9651", table_cell), Paragraph("results/cv_summary.txt", table_cell)],
        [Paragraph("<b>Mean &plusmn; Std</b>", table_cell_bold), Paragraph("<b>7,650</b>", table_cell_bold), Paragraph("<b>97.58% &plusmn; 1.52%</b>", table_cell_bold), Paragraph("<b>0.9757</b>", table_cell_bold), Paragraph("<b>0.9757 &plusmn; 0.0153</b>", table_cell_bold), Paragraph("<b>Authentic Measured Scores</b>", table_cell_bold)],
    ]
    t_cv = Table(cv_data, colWidths=[95, 65, 85, 65, 85, 128])
    t_cv.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#EFF6FF")),
    ]))
    elements.append(t_cv)
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("2.2 Category-Wise Performance Report (5-Fold Aggregated)", h2_style))
    cat_data = [
        [Paragraph("Target Category", table_hdr), Paragraph("Precision", table_hdr), Paragraph("Recall", table_hdr), Paragraph("F1-Score", table_hdr), Paragraph("Support", table_hdr), Paragraph("Correct", table_hdr), Paragraph("Errors", table_hdr)],
        [Paragraph("<b>EMI</b>", table_cell), Paragraph("1.0000", table_cell), Paragraph("0.9987", table_cell), Paragraph("<b>0.9993</b>", table_cell), Paragraph("1,500", table_cell), Paragraph("1,498", table_cell), Paragraph("2", table_cell)],
        [Paragraph("<b>Food</b>", table_cell), Paragraph("0.9495", table_cell), Paragraph("0.9273", table_cell), Paragraph("<b>0.9383</b>", table_cell), Paragraph("1,500", table_cell), Paragraph("1,391", table_cell), Paragraph("109", table_cell)],
        [Paragraph("<b>Investment</b>", table_cell), Paragraph("1.0000", table_cell), Paragraph("1.0000", table_cell), Paragraph("<b>1.0000</b>", table_cell), Paragraph("1,500", table_cell), Paragraph("1,500", table_cell), Paragraph("0", table_cell)],
        [Paragraph("<b>Personal_Transfer</b>", table_cell), Paragraph("0.9868", table_cell), Paragraph("1.0000", table_cell), Paragraph("<b>0.9934</b>", table_cell), Paragraph("150", table_cell), Paragraph("150", table_cell), Paragraph("0", table_cell)],
        [Paragraph("<b>Shopping</b>", table_cell), Paragraph("0.9300", table_cell), Paragraph("0.9653", table_cell), Paragraph("<b>0.9473</b>", table_cell), Paragraph("1,500", table_cell), Paragraph("1,448", table_cell), Paragraph("52", table_cell)],
        [Paragraph("<b>Travel</b>", table_cell), Paragraph("1.0000", table_cell), Paragraph("0.9853", table_cell), Paragraph("<b>0.9926</b>", table_cell), Paragraph("1,500", table_cell), Paragraph("1,478", table_cell), Paragraph("22", table_cell)],
        [Paragraph("<b>Overall Accuracy</b>", table_cell_bold), Paragraph("—", table_cell), Paragraph("—", table_cell), Paragraph("<b>0.9758</b>", table_cell_bold), Paragraph("7,650", table_cell), Paragraph("<b>7,465</b>", table_cell_bold), Paragraph("<b>185</b>", table_cell_bold)],
        [Paragraph("<b>Macro Average</b>", table_cell_bold), Paragraph("0.9777", table_cell), Paragraph("0.9794", table_cell), Paragraph("0.9785", table_cell), Paragraph("7,650", table_cell), Paragraph("—", table_cell), Paragraph("—", table_cell)],
        [Paragraph("<b>Weighted Average</b>", table_cell_bold), Paragraph("0.9761", table_cell), Paragraph("0.9758", table_cell), Paragraph("0.9759", table_cell), Paragraph("7,650", table_cell), Paragraph("—", table_cell), Paragraph("—", table_cell)],
    ]
    t_cat = Table(cat_data, colWidths=[105, 65, 65, 75, 65, 65, 83])
    t_cat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,7), (-1,7), colors.HexColor("#EFF6FF")),
    ]))
    elements.append(t_cat)
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("2.3 Identification of All 185 Misclassifications", h2_style))
    elements.append(Paragraph(
        "Analysis of the confusion matrix reveals the exact pairs responsible for all 185 misclassifications across the 7,650 test samples:<br/>"
        "• <b>109 Food Errors:</b> 109 true Food transactions misclassified as <b>Shopping</b> due to quick-commerce stores (Blinkit, BigBasket) selling groceries and general merchandise.<br/>"
        "• <b>52 Shopping Errors:</b> 52 true Shopping transactions misclassified as <b>Food</b> due to bakeries, confectionery, and departmental store overlap.<br/>"
        "• <b>22 Travel Errors:</b> 22 true Travel transactions misclassified as <b>Food</b> (dining at transit stations, airport lounges, highway fuel rest-stops).<br/>"
        "• <b>2 EMI Errors:</b> 2 true EMI installment debits misclassified as <b>Personal_Transfer</b> due to direct bank-to-bank P2P transfer syntax.<br/>"
        "• <b>0 Investment & Personal_Transfer Errors:</b> 100.0% recall achieved on critical wealth and P2P tracking.<br/>"
        "<b>Total Errors:</b> 109 + 52 + 22 + 2 = <b>185</b> (Accuracy: 7,465 / 7,650 = 97.5817%).",
        body_style
    ))

    # Confusion matrix image
    if os.path.exists(CM_IMG):
        elements.append(Spacer(1, 4))
        elements.append(Image(CM_IMG, width=500, height=185))
        elements.append(Paragraph("Figure 1: Verified 5-Fold Aggregated Confusion Matrix (Raw Counts & Normalized) from research_evaluation.py", caption_style))

    # Page Break for Live App & Security
    elements.append(PageBreak())

    # Section 3: Live App & Security
    elements.append(Paragraph("3. Operational Client Evidence & Security Architecture", h1_style))
    elements.append(Paragraph(
        "FinSarathi.AI is operational as a cross-platform React Native client. The figures below document the live application running on Expo SDK 57 (localhost:8081):",
        body_style
    ))

    # Side-by-side app screenshots
    if os.path.exists(DASH_IMG) and os.path.exists(CHAT_IMG):
        app_img_table = Table([
            [Image(DASH_IMG, width=250, height=128), Image(CHAT_IMG, width=250, height=128)],
            [Paragraph("<b>Figure 2:</b> Live Dashboard (Net Worth, Spending Chart, Local SQLite Ledger)", caption_style),
             Paragraph("<b>Figure 3:</b> Live AI Assistant (Verified Ledger Badge & Multilingual Chat)", caption_style)]
        ], colWidths=[260, 263])
        app_img_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 2),
        ]))
        elements.append(app_img_table)
        elements.append(Spacer(1, 4))

    elements.append(Paragraph("3.1 Regulatory TRAI DLT SMS Ingestion Gatekeeper", h2_style))
    elements.append(Paragraph(
        "To ensure compliance with Indian telecom regulations and eliminate security vulnerabilities before financial parsing, <code>src/utils/smsValidator.ts</code> enforces a strict 3-gate offline validation pipeline (15 Jest unit tests pass):<br/>"
        "• <b>Gate 1 (Personal Mobile Filter):</b> Rejects incoming SMS from 10-digit mobile numbers using regex <code>^(\\+91|0091|91)?[6-9]\\d{9}$</code>.<br/>"
        "• <b>Gate 2 (TRAI DLT Header Compliance):</b> Enforces 2-letter circle prefix and 6-char brand header with optional 2025 category suffix using regex <code>^[A-Z]{2}-[A-Z0-9]{6}(-[TSPG])?$</code> (TCCCPR 2018/2025).<br/>"
        "• <b>Gate 3 (Financial Intent & Currency Check):</b> Enforces presence of Indian currency markers (Rs., INR) and transaction verbs (debited, credited, spent).",
        body_style
    ))

    elements.append(Paragraph("3.2 Multilingual Pipeline & Edge ONNX Model Footprint", h2_style))
    elements.append(Paragraph(
        "• <b>Multilingual Bridge:</b> Real-time translation between regional Indic languages (Marathi 'mr', Hindi 'hi') and English is handled via dedicated REST bridges (Bhashini API / MyMemory). Devanagari numerals are normalized client-side before matching ledger records.<br/>"
        "• <b>Edge Model Footprint:</b> The SetFit classifier was converted to dynamic INT8 ONNX (<code>assets/models/model_int8.onnx</code>), reducing disk storage to <b>22.9 MB</b> (from 90.8 MB uncompressed PyTorch weights), allowing deployment on commodity mobile CPUs without GPU accelerators.",
        body_style
    ))

    # Page Break for Section 4 & Disclosures
    elements.append(PageBreak())

    elements.append(Paragraph("4. LaTeX Code Blocks Ready for IEEE Manuscript Insertion", h1_style))
    elements.append(Paragraph("Co-authors can directly insert the following verified LaTeX blocks into the manuscript:", body_style))

    latex_code_cv = (
        "% --- Table 1: 5-Fold Stratified Cross-Validation Results ---\n"
        "\\begin{table}[htbp]\n"
        "\\centering\n"
        "\\caption{5-Fold Stratified Cross-Validation Performance of SetFit Model}\n"
        "\\label{tab:cv_results}\n"
        "\\begin{tabular}{lcccc}\n"
        "\\hline\n"
        "\\textbf{Fold} & \\textbf{Validation N} & \\textbf{Accuracy} & \\textbf{Macro F1} & \\textbf{Weighted F1} \\\\ \\hline\n"
        "Fold 1 & 1,530 & 1.0000 & 1.0000 & 1.0000 \\\\\n"
        "Fold 2 & 1,530 & 0.9856 & 0.9856 & 0.9856 \\\\\n"
        "Fold 3 & 1,530 & 0.9575 & 0.9573 & 0.9573 \\\\\n"
        "Fold 4 & 1,530 & 0.9706 & 0.9705 & 0.9705 \\\\\n"
        "Fold 5 & 1,530 & 0.9654 & 0.9651 & 0.9651 \\\\ \\hline\n"
        "\\textbf{Mean $\\pm$ Std} & \\textbf{7,650} & \\textbf{0.9758 $\\pm$ 0.0152} & \\textbf{0.9757} & \\textbf{0.9757 $\\pm$ 0.0153} \\\\ \\hline\n"
        "\\end{tabular}\n"
        "\\end{table}"
    )

    latex_code_cat = (
        "% --- Table 2: Category-Wise Classification Metrics ---\n"
        "\\begin{table}[htbp]\n"
        "\\centering\n"
        "\\caption{Aggregated Category-Wise Classification Metrics on 7,650 Financial Records}\n"
        "\\label{tab:category_metrics}\n"
        "\\begin{tabular}{lcccc}\n"
        "\\hline\n"
        "\\textbf{Target Class} & \\textbf{Precision} & \\textbf{Recall} & \\textbf{F1-Score} & \\textbf{Support} \\\\ \\hline\n"
        "EMI & 1.0000 & 0.9987 & \\textbf{0.9993} & 1,500 \\\\\n"
        "Food & 0.9495 & 0.9273 & \\textbf{0.9383} & 1,500 \\\\\n"
        "Investment & 1.0000 & 1.0000 & \\textbf{1.0000} & 1,500 \\\\\n"
        "Personal\\_Transfer & 0.9868 & 1.0000 & \\textbf{0.9934} & 150 \\\\\n"
        "Shopping & 0.9300 & 0.9653 & \\textbf{0.9473} & 1,500 \\\\\n"
        "Travel & 1.0000 & 0.9853 & \\textbf{0.9926} & 1,500 \\\\ \\hline\n"
        "\\textbf{Overall Accuracy} & \\multicolumn{3}{c}{\\textbf{0.9758}} & 7,650 \\\\\n"
        "\\textbf{Macro Average} & 0.9777 & 0.9794 & 0.9785 & 7,650 \\\\\n"
        "\\textbf{Weighted Average} & 0.9761 & 0.9758 & 0.9759 & 7,650 \\\\ \\hline\n"
        "\\end{tabular}\n"
        "\\end{table}"
    )

    latex_box1 = Table([[Paragraph(latex_code_cv.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style)]], colWidths=[523])
    latex_box1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0F172A")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(latex_box1)
    elements.append(Spacer(1, 6))

    latex_box2 = Table([[Paragraph(latex_code_cat.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style)]], colWidths=[523])
    latex_box2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0F172A")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(latex_box2)
    elements.append(Spacer(1, 8))

    elements.append(Paragraph("5. Recommended IEEE Abstract Text", h1_style))
    abstract_text = (
        "<i>\"Automated financial transaction classification in personal finance management requires resilient semantic understanding under noisy, truncated narrations and out-of-vocabulary merchant names. In this paper, we present FinSarathi.AI, a privacy-first, local-first financial assistant integrating a lightweight few-shot sentence transformer architecture (SetFit atop all-MiniLM-L6-v2) with an on-device SQLite ledger and a hybrid multilingual LLM reasoning pipeline. Evaluated across 7,650 transaction narrations under a 5-fold stratified cross-validation protocol, our SetFit model achieves 97.58% (+- 1.52%) mean accuracy and a weighted F1-score of 0.9757, outperforming lexical n-gram baselines under low-resource constraints while compressing to a 22.9 MB INT8 ONNX edge footprint. We detail the operational edge client, regulatory TRAI DLT SMS ingestion filter, and multilingual translation bridge, while establishing an architectural roadmap for upcoming LSTM budget forecasting and local retrieval-augmented generation modules.\"</i>"
    )
    elements.append(Paragraph(abstract_text, body_style))
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("6. IEEE Generative AI & Authorship Compliance Statement", h1_style))
    disclosure_text = (
        "<i>In accordance with IEEE Author Center Guidelines on AI-Generated Text:</i><br/>"
        "\"Antigravity AI (Google DeepMind) and LLM-assisted coding environments were utilized during the development of FinSarathi.AI for assisting in client UI component scaffolding, formulating synthetic banking perturbation scripts, and conducting automated empirical audits of model checkpoints. All underlying model training scripts, cross-validation metrics, classification reports, and architectural specifications were independently evaluated, verified, and approved by the authors.\""
    )
    elements.append(Paragraph(disclosure_text, meta_style))

    # Build document
    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"Refined PDF built successfully: {PDF_OUTPUT}")

if __name__ == "__main__":
    build_pdf()
