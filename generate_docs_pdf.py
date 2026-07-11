import os
import sys
import subprocess
import html

# --- Dependency Autoinstall ---
try:
    import reportlab
except ImportError:
    print("ReportLab is not installed. Installing it now...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    import reportlab

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# --- Numbered Canvas for Page X of Y & Headers/Footers ---
class NumberedCanvas(canvas.Canvas):
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
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        
        # Suppress header and footer on the cover page
        if self._pageNumber == 1:
            # Draw beautiful cover background accent
            self.setFillColor(colors.HexColor("#4F46E5"))
            self.rect(0, 0, 18, 792, fill=True, stroke=False)
            self.setFillColor(colors.HexColor("#0D9488"))
            self.rect(18, 0, 6, 792, fill=True, stroke=False)
            self.restoreState()
            return

        # Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#4F46E5"))
        self.drawString(54, 750, "AETHERQUIZ AI")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#718096"))
        self.drawString(130, 750, "|   Technical Documentation & Project Guide")
        
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)
        
        # Footer
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 52, 558, 52)
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#718096"))
        self.drawString(54, 40, "Confidential — LMS Integration & Deployment Blueprint")
        self.drawRightString(558, 40, page_text)
        self.restoreState()

def build_pdf(filename="AetherQuiz_AI_Project_Documentation.pdf"):
    # Letter is 612 x 792 points. Margins: 54pt (0.75 in). Printable width: 504pt.
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()

    # --- Typography & Custom Styles ---
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=30,
        leading=36,
        textColor=colors.HexColor('#4F46E5'),
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#0D9488'),
        spaceAfter=25
    )

    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#4B5563')
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#4F46E5'),
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0D9488'),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=7
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1F2937'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#111827'),
        backColor=colors.HexColor('#F3F4F6'),
        borderColor=colors.HexColor('#E5E7EB'),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6
    )

    story = []

    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 100))
    story.append(Paragraph("AetherQuiz AI", title_style))
    story.append(Paragraph("PDF-to-Interactive Quiz Generator", subtitle_style))
    
    # Horizontal line
    line_table = Table([[""]], colWidths=[504])
    line_table.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 2, colors.HexColor('#4F46E5')),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 20))

    meta_text = """
    <b>Document Class:</b> Technical & Deployment Blueprint<br/>
    <b>Target Environment:</b> University LMS (Canvas, Moodle, Blackboard)<br/>
    <b>Hosting Stack:</b> 100% Free Production Deployment (Cloudflare + Render)<br/>
    <b>AI Engine:</b> Groq Llama-3.3-70B API Tier<br/>
    <b>Prepared For:</b> Course Tutors and LMS Administrators<br/>
    <b>Date:</b> July 2026<br/>
    <b>Status:</b> Production Ready
    """
    story.append(Paragraph(meta_text, meta_style))
    story.append(PageBreak())

    # ==================== SECTION 1 ====================
    story.append(Paragraph("1. Executive Summary & Core Concept", h1_style))
    story.append(Paragraph(
        "AetherQuiz AI is a lightweight, high-performance web application designed for university instructors to rapidly translate course materials (syllabi, reading packets, slides) into structured assessment questions. By pairing a high-fidelity PDF parser with LLM completion, the system automates quiz formulation and distractor generation.",
        body_style
    ))
    story.append(Paragraph("The system operates in two core modes:", h2_style))
    story.append(Paragraph("• <b>Auto-Gen Mode:</b> Instructors specify a desired number of questions. The system scans the document, identifies key conceptual topics, and instructs the LLM to write corresponding multiple-choice questions.", bullet_style))
    story.append(Paragraph("• <b>Custom Prompts Mode:</b> Instructors input specific question stems or topics. The system reads the PDF, locates the factual answers, creates three plausible distractor options, and formats the output into standard A-D configurations.", bullet_style))

    story.append(Spacer(1, 10))

    # ==================== SECTION 2 ====================
    story.append(Paragraph("2. System Architecture & Tech Stack", h1_style))
    story.append(Paragraph(
        "To ensure zero cost barrier and maximum reliability, AetherQuiz AI uses a bifurcated serverless-static cloud architecture:",
        body_style
    ))

    # Architecture Table
    data_arch = [
        ["Component", "Technology", "Role", "Hosting / Deployment"],
        ["Frontend UI", "React 18 + Vite + CSS", "User dashboard, editor, interactive practice", "Cloudflare Pages (Static)"],
        ["Backend API", "FastAPI (Python 3.10+)", "Saves uploaded PDF, extracts text, handles prompt compiling", "Render.com (Web Service)"],
        ["PDF Parser", "PyMuPDF (fitz)", "Fast, clean local extraction of text from PDF binaries", "Embedded in Backend"],
        ["AI Inference", "Groq Llama-3.3-70B", "Receives system prompts, outputs structured JSON quizzes", "External API call"]
    ]
    t_arch = Table(data_arch, colWidths=[80, 110, 174, 140])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F3F4F6')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#4F46E5')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 10))

    # ==================== SECTION 3 ====================
    story.append(Paragraph("3. The 100% Free Production Stack Strategy", h1_style))
    story.append(Paragraph(
        "AetherQuiz AI is built to run entirely on zero-cost tiers, eliminating hosting fees. The breakdown below describes how each layer achieves this, along with specific limitations.",
        body_style
    ))
    
    story.append(Paragraph("Frontend: Cloudflare Pages (Free Tier)", h2_style))
    story.append(Paragraph(
        "Cloudflare Pages hosts the pre-compiled static assets (HTML, CSS, JS). The free tier provides unlimited bandwidth, unlimited requests, and 500 builds per month. Pages are served directly from Cloudflare's global edge network, meaning pages load instantly with 0ms cold starts.",
        body_style
    ))

    story.append(Paragraph("Backend: Render.com Free Web Service", h2_style))
    story.append(Paragraph(
        "The Python backend runs on Render's <i>Free Web Service</i> tier. This tier gives you 512MB RAM, shared CPU, and 500 free build hours per month (which is plenty for low-to-medium volume tutoring tools). The primary drawback is <b>cold starts</b>: if the API has not received any traffic for 15 minutes, Render spins down the server container. The next request will experience a 50-second spin-up delay. Once spun up, it remains active as long as requests are ongoing.",
        body_style
    ))

    story.append(Paragraph("AI Layer: Groq Developer API (Free Tier)", h2_style))
    story.append(Paragraph(
        "Groq runs LLM inference at extremely high speeds. The Developer Tier is free, requires no credit card, and has limits based on rate and token quotas instead of pricing. This makes it perfect for deployment in classrooms.",
        body_style
    ))

    story.append(PageBreak())

    # ==================== SECTION 4 ====================
    story.append(Paragraph("4. Groq API Quotas, Token Limits & Refresh Windows", h1_style))
    story.append(Paragraph(
        "Groq manages API usage using a combination of rate limits (number of hits) and token limits (amount of text processed). The system defaults to the <b>llama-3.3-70b-versatile</b> model, which falls under the following developer limits:",
        body_style
    ))

    # Limits Table
    data_lim = [
        ["Limit Metric", "Value / Quota", "Window Duration", "How it Refreshes"],
        ["RPM (Requests Per Min)", "30 requests", "1 Minute (Sliding)", "Refreshes continuously per-second (1 req / 2s avg)"],
        ["RPD (Requests Per Day)", "14,400 requests", "24 Hours (Fixed)", "Resets at midnight UTC (00:00 UTC) every day"],
        ["TPM (Tokens Per Min)", "40,000 tokens", "1 Minute (Sliding)", "Tokens from completed requests age out after 60s"],
        ["TPD (Tokens Per Day)", "500,000 tokens", "24 Hours (Fixed)", "Resets at midnight UTC (00:00 UTC) every day"]
    ]
    t_lim = Table(data_lim, colWidths=[120, 100, 100, 184])
    t_lim.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F3F4F6')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#4F46E5')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_lim)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Understanding Token Refresh Mechanics", h2_style))
    story.append(Paragraph(
        "<b>1. Sliding-Window Limits (TPM / RPM):</b> Rather than resetting completely on the hour, sliding window tokens refresh progressively. For instance, if you submit a request with 8,000 tokens at 12:01:05, those 8,000 tokens are deducted from your 40,000 TPM limit. At 12:02:05, those 8,000 tokens are returned to your pool.",
        body_style
    ))
    story.append(Paragraph(
        "<b>2. Daily Fixed Limits (TPD / RPD):</b> Unlike sliding limits, the daily caps are absolute counters that count up to 500,000 tokens and reset all at once at 00:00 UTC. If you hit 500,000 tokens at 15:00 UTC, the API will return HTTP 429 error codes until 00:00 UTC.",
        body_style
    ))

    story.append(Spacer(1, 5))

    # ==================== SECTION 5 ====================
    story.append(Paragraph("5. Token Consumption & Cost Calculations", h1_style))
    story.append(Paragraph(
        "AetherQuiz AI contains built-in optimization to keep usage within the free-tier limits. In <b>main.py</b>, the extracted PDF text is capped using python slice notation before sending it to the model:",
        body_style
    ))
    story.append(Paragraph("trimmed = text[:12000]  # Cap input text context to preserve tokens", code_style))
    story.append(Paragraph(
        "12,000 characters correspond roughly to <b>2,000 to 2,500 words</b> or approximately <b>3,000 tokens</b>. This is the maximum input size possible.",
        body_style
    ))
    
    story.append(Paragraph("Worst-Case Request Math (10-Question Quiz):", h2_style))
    story.append(Paragraph("• <b>Input Context:</b> Capped PDF Text + Instruction Prompt = ~3,200 input tokens.", bullet_style))
    story.append(Paragraph("• <b>Output Response:</b> Generated 10-Question JSON Quiz = ~1,200 output tokens.", bullet_style))
    story.append(Paragraph("• <b>Total Tokens Per Request:</b> ~4,400 tokens.", bullet_style))
    
    story.append(Paragraph("Given these average values, your limits yield the following capacities:", body_style))
    story.append(Paragraph("• <b>Max Quizzes Per Minute:</b> 40,000 TPM / 4,400 tokens = ~9 quizzes per minute (exceeds standard classroom usage).", bullet_style))
    story.append(Paragraph("• <b>Max Quizzes Per Day:</b> 500,000 TPD / 4,400 tokens = ~113 quizzes generated per day.", bullet_style))

    story.append(PageBreak())

    # ==================== SECTION 6 ====================
    story.append(Paragraph("6. Project Guide & Deployment Blueprint", h1_style))
    story.append(Paragraph(
        "Follow these structured instructions to deploy the backend and frontend services to production.",
        body_style
    ))

    story.append(Paragraph("Step A: Render Backend Web Service Setup", h2_style))
    story.append(Paragraph("1. Register a free account at <b>render.com</b> and connect your GitHub repository.", bullet_style))
    story.append(Paragraph("2. Select <b>New +</b> > <b>Web Service</b>.", bullet_style))
    story.append(Paragraph("3. Configure the settings exactly as follows:", bullet_style))
    story.append(Paragraph("   - <b>Runtime:</b> Python<br/>"
                           "   - <b>Build Command:</b> pip install -r requirements.txt<br/>"
                           "   - <b>Start Command:</b> uvicorn main:app --host 0.0.0.0 --port $PORT<br/>"
                           "   - <b>Root Directory:</b> Leave blank", bullet_style))
    story.append(Paragraph("4. Navigate to the <b>Environment</b> tab and add your Groq key:<br/>"
                           "   - <b>Key:</b> GROQ_API_KEY<br/>"
                           "   - <b>Value:</b> [Your API key beginning with gsk_]", bullet_style))
    story.append(Paragraph("5. Click <b>Deploy</b>. Render will build and deploy. Take note of the live URL (e.g. https://your-app.onrender.com).", bullet_style))

    story.append(Paragraph("Step B: Cloudflare Pages Frontend Setup", h2_style))
    story.append(Paragraph("1. The frontend is located in the <b>frontend/</b> directory. Navigate to this folder on your machine.", bullet_style))
    story.append(Paragraph("2. Install local node dependencies and run the build compiler:", bullet_style))
    story.append(Paragraph("cd frontend\nnpm install\nnpm run build", code_style))
    story.append(Paragraph("This generates a highly optimized distribution bundle in the <b>frontend/dist</b> directory.", body_style))
    story.append(Paragraph("3. Deploy the compiled build straight to Cloudflare's edge network using Wrangler:", bullet_style))
    story.append(Paragraph("npx wrangler pages deploy dist", code_style))
    story.append(Paragraph("4. Wrangler will ask you to log in to Cloudflare. Once completed, select your project name and it will upload the files.", bullet_style))
    story.append(Paragraph("5. Note down the Pages live URL (e.g., https://aether-quiz.pages.dev).", bullet_style))

    story.append(Spacer(1, 10))

    # Keep troubleshooting section together
    ts_elements = []
    ts_elements.append(Paragraph("7. Troubleshooting & API Connection", h1_style))
    ts_elements.append(Paragraph(
        "Once both systems are deployed, you must bridge the two URLs in your user dashboard:",
        body_style
    ))
    ts_elements.append(Paragraph("1. Open your live Cloudflare Pages URL in a browser.", bullet_style))
    ts_elements.append(Paragraph("2. Look for the <b>API Configuration / Endpoint</b> field in the dashboard UI settings (usually in the header or sidebar).", bullet_style))
    ts_elements.append(Paragraph("3. Paste your full Render live URL (e.g., <i>https://tutor-qa-deployment-test.onrender.com</i>).", bullet_style))
    ts_elements.append(Paragraph("4. <b>Cold Start Warning:</b> If the backend has been idle and you request a quiz, it will say 'Connecting...' for 45-60 seconds. This is normal behavior for Render's free tier. You can keep the server awake by using a free cron monitoring service (like UptimeRobot) to ping the health endpoint (<i>/</i>) every 14 minutes.", bullet_style))
    story.append(KeepTogether(ts_elements))

    # --- Build Document ---
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    build_pdf()
