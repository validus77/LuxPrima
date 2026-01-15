import markdown
from playwright.async_api import async_playwright
import os

class PDFService:
    def __init__(self):
        self.template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
            <style>
                :root {{
                    --primary: #6366f1;
                    --accent: #f43f5e;
                    --bg: #030712;
                    --surface: #111827;
                    --text: #f9fafb;
                    --text-dim: #9ca3af;
                }}
                
                body {{
                    font-family: 'Inter', sans-serif;
                    background: white;
                    color: #111827;
                    margin: 0;
                    padding: 40px;
                    line-height: 1.6;
                }}
                
                .header {{
                    border-bottom: 2px solid #e5e7eb;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                }}
                
                .logo {{
                    font-weight: 800;
                    font-size: 24px;
                    letter-spacing: -0.02em;
                    color: var(--primary);
                    margin-bottom: 8px;
                }}
                
                .report-type {{
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: #6b7280;
                }}
                
                h1 {{
                    font-size: 32px;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                    margin: 20px 0;
                    line-height: 1.1;
                }}
                
                .metadata {{
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-bottom: 40px;
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                }}
                
                .meta-item b {{
                    display: block;
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #6b7280;
                    letter-spacing: 0.1em;
                }}
                
                .meta-item span {{
                    font-size: 14px;
                    font-weight: 600;
                }}
                
                .content {{
                    font-size: 16px;
                }}
                
                /* Markdown Styling */
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }}
                
                th {{
                    text-align: left;
                    background: #f3f4f6;
                    padding: 12px;
                    font-size: 12px;
                    text-transform: uppercase;
                    border-bottom: 2px solid #e5e7eb;
                }}
                
                td {{
                    padding: 12px;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 14px;
                }}
                
                h2 {{
                    font-size: 22px;
                    font-weight: 700;
                    margin-top: 40px;
                    border-left: 4px solid var(--primary);
                    padding-left: 15px;
                }}
                
                blockquote {{
                    margin: 20px 0;
                    padding: 15px 25px;
                    background: #f9fafb;
                    border-left: 4px solid #d1d5db;
                    font-style: italic;
                    color: #4b5563;
                }}
                
                code {{
                    font-family: 'JetBrains Mono', monospace;
                    background: #f3f4f6;
                    padding: 2px 4px;
                    border-radius: 4px;
                    font-size: 0.9em;
                }}
                
                .footer {{
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    font-size: 10px;
                    color: #9ca3af;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">LUXPRIMA</div>
                <div class="report-type">Autonomous Intelligence Briefing</div>
            </div>
            
            <h1>{title}</h1>
            
            <div class="metadata">
                <div class="meta-item">
                    <b>Generated On</b>
                    <span>{date}</span>
                </div>
                <div class="meta-item">
                    <b>Research Scope</b>
                    <span>{sources} Sources</span>
                </div>
                <div class="meta-item">
                    <b>Intelligence Engine</b>
                    <span>{model}</span>
                </div>
            </div>
            
            <div class="content">
                {content_html}
            </div>
            
            <div class="footer">
                LuxPrima Intelligence Platform &copy; 2026. Confidential Property.
            </div>
        </body>
        </html>
        """

    async def generate_pdf(self, title: str, markdown_content: str, metadata: dict) -> bytes:
        html_content = markdown.markdown(markdown_content, extensions=['tables', 'fenced_code'])
        
        full_html = self.template.format(
            title=title,
            content_html=html_content,
            date=metadata.get('date', 'N/A'),
            sources=metadata.get('sources', '0'),
            model=metadata.get('model', 'LuxPrima Hybrid')
        )
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.set_content(full_html, wait_until="networkidle")
            pdf_bytes = await page.pdf(
                format="A4",
                margin={"top": "20px", "bottom": "20px", "left": "20px", "right": "20px"},
                print_background=True
            )
            await browser.close()
            return pdf_bytes

pdf_service = PDFService()
