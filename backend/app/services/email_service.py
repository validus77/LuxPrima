import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from app.models import Setting
import markdown
import asyncio

class EmailService:
    def get_smtp_config(self, db: Session):
        settings = db.query(Setting).filter(Setting.key.in_([
            "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_sender", "smtp_stream"
        ])).all()
        return {s.key: s.value for s in settings}

    def _sync_send(self, config, to_email, report_title, markdown_content):
        host = config.get("smtp_host")
        port = int(config.get("smtp_port", 587))
        user = config.get("smtp_user")
        password = config.get("smtp_pass")
        sender = config.get("smtp_sender", user)
        stream_id = config.get("smtp_stream")

        if not all([host, user, password]):
            raise Exception("SMTP configuration is incomplete. Please check Settings.")

        # Convert Markdown to HTML
        html_body = markdown.markdown(markdown_content, extensions=['tables', 'fenced_code'])
        
        full_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: sans-serif; line-height: 1.6; color: #333; }}
                h1 {{ color: #6366f1; }}
            </style>
        </head>
        <body>
            <h1>{report_title}</h1>
            <p><i>Autonomous Intelligence Briefing by LuxPrima</i></p>
            <hr>
            {html_body}
        </body>
        </html>
        """

        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = to_email
        msg['Subject'] = f"LuxPrima Briefing: {report_title}"
        
        if stream_id:
            msg['X-Message-Stream'] = stream_id

        msg.attach(MIMEText(full_html, 'html'))

        try:
            # Use SMTP_SSL for port 465, otherwise use SMTP + starttls
            if port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=10)
            else:
                server = smtplib.SMTP(host, port, timeout=10)
                server.starttls()
            
            with server:
                server.login(user, password)
                server.send_message(msg)
            return True
        except smtplib.SMTPAuthenticationError:
            raise Exception("SMTP Authentication failed. Check username/password.")
        except Exception as e:
            raise Exception(f"SMTP Error: {str(e)}")

    async def send_report_email(self, db: Session, to_email: str, report_title: str, markdown_content: str):
        config = self.get_smtp_config(db)
        # Run synchronous blocking code in a thread pool to avoid hanging the event loop
        return await asyncio.to_thread(self._sync_send, config, to_email, report_title, markdown_content)

email_service = EmailService()
