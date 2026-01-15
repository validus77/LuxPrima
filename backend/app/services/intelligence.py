from sqlalchemy.orm import Session
from app.models import Source, Report, Setting
from app.services.crawler import crawler_service
from app.services.llm import get_llm_service
from app.core.config import settings
import json
import logging
import asyncio
from datetime import datetime
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

class IntelligenceService:
    def __init__(self):
        self.current_status = "Idle"
        self.tz = ZoneInfo(settings.APP_TIMEZONE)

    async def generate_daily_report(self, db: Session, llm_provider_name: str = "openai"):
        # Initialize execution logs
        execution_logs = []
        def log(msg: str):
            logger.info(msg)
            # Include full date in the first log entry for frontend parsing
            if not execution_logs:
                timestamp = datetime.now(self.tz).strftime("%Y-%m-%d %H:%M:%S")
            else:
                timestamp = datetime.now(self.tz).strftime("%H:%M:%S")
            execution_logs.append(f"[{timestamp}] {msg}")
        
        def set_status(status: str):
            self.current_status = status
            log(status)

        set_status("Initializing Analysis...")

        # 1. Fetch Active Sources
        sources = db.query(Source).filter(Source.is_active == True).all()
        if not sources:
            log("Error: No active sources found")
            set_status("Idle")
            return {"error": "No active sources found"}

        # 2. Get LLM Service
        # Try to get config from DB settings first, else defaults
        settings_keys = ["llm_provider", "llm_api_key", "llm_model", "llm_base_url", "research_breadth", "research_depth"]
        llm_config = db.query(Setting).filter(Setting.key.in_(settings_keys)).all()
        config_dict = {s.key: s.value for s in llm_config}
        
        provider_name = config_dict.get("llm_provider", llm_provider_name)
        api_key = config_dict.get("llm_api_key")
        model = config_dict.get("llm_model")
        base_url = config_dict.get("llm_base_url")
        
        # User defined Breadth and Depth
        research_breadth = int(config_dict.get("research_breadth", 3))
        research_depth = int(config_dict.get("research_depth", 1))

        log(f"Initializing LLM Provider: {provider_name} ({model})")
        log(f"Strategy: Depth {research_depth}, Breadth {research_breadth}")
        llm = get_llm_service(provider=provider_name, api_key=api_key, model=model, base_url=base_url)

        # 3. Crawl Primary Sources
        crawled_data = []
        for source in sources:
            set_status(f"Processing Source: {source.url}")
            try:
                data = await crawler_service.crawl(source.url)
                crawled_data.append(data)
                log(f"Successfully crawled: {data['title']}")
            except Exception as e:
                log(f"Failed to crawl {source.url}: {e}")

        # 4. Expansion Cycles
        for depth_level in range(1, research_depth + 1):
            log(f"Expansion Cycle {depth_level} of {research_depth} starting...")
            set_status(f"Exploring lead layer {depth_level} (Breadth: {research_breadth})...")
            
            # Prepare context for LLM to find interesting links from ALL current data
            current_context = ""
            all_links = []
            for item in crawled_data:
                current_context += f"Source: {item['url']} - Title: {item['title']}\n"
                all_links.extend(item.get('links', []))

            # Filter links to unique valid ones that we haven't crawled yet
            already_crawled = set(d['url'] for d in crawled_data)
            unique_links = list(set([l for l in all_links if l.startswith('http') and l not in already_crawled]))
            log(f"Cycle {depth_level}: Found {len(unique_links)} new potential links.")
            
            # Ask LLM to pick interesting links or suggest search terms
            expansion_prompt = f"""
            You are a research assistant. 
            Based on the following information gathered so far, identifies the next best leads to follow.
            
            Your goal is to find information that adds new dimensions, verifying details, or adds depth to the current data.
            
            Identify:
            1. Up to {research_breadth} most relevant external links for further research from the "Available Links" list.
            2. Up to {research_breadth} specific search queries to find information on key entities or events mentioned but not linked.

            Gathered Intelligence so far:
            {current_context}
            
            Available Links:
            {json.dumps(unique_links[:50])} 
            
            Return ONLY a JSON object with two keys: "links" (array of strings) and "search_terms" (array of strings).
            Do not include markdown formatting.
            """
            
            log(f"Sending Expansion Prompt (Cycle {depth_level})...")
            
            try:
                expansion_response = await llm.generate(expansion_prompt)
                # Cleanup potential markdown code blocks
                clean_json = expansion_response.replace('```json', '').replace('```', '').strip()
                
                try:
                    expansion_data = json.loads(clean_json)
                except json.JSONDecodeError:
                    log(f"Failed to parse Expansion JSON in cycle {depth_level}.")
                    expansion_data = {}
                
                target_links = expansion_data.get("links", [])
                search_terms = expansion_data.get("search_terms", [])
                
                log(f"Cycle {depth_level} leads: {len(target_links)} links, {len(search_terms)} search terms")
                
                # Perform Web Search for terms
                if search_terms:
                    from duckduckgo_search import DDGS
                    ddgs = DDGS()
                    for term in search_terms:
                        set_status(f"Cycle {depth_level} Research: '{term}'")
                        try:
                            results = list(ddgs.text(term, max_results=1))
                            if results:
                                url = results[0]['href']
                                log(f"Found lead: {url}")
                                target_links.append(url)
                        except Exception as e:
                            log(f"Search failed for '{term}': {e}")
                
                target_links = list(set([l for l in target_links if l not in already_crawled])) # Final dedupe
                
                # Crawl Leads
                for link in target_links:
                    set_status(f"Processing Depth Level {depth_level} Source: {link}")
                    try:
                        data = await crawler_service.crawl(link)
                        crawled_data.append(data)
                        log(f"Captured: {data['title']}")
                    except Exception as e:
                        log(f"Failed to crawl {link}: {e}")
                        
            except asyncio.TimeoutError:
                 log(f"Expansion cycle {depth_level} timed out.")
            except Exception as e:
                log(f"Expansion cycle {depth_level} failed: {type(e).__name__}: {e}")

        # 5. Synthesize Report
        combined_text = ""
        for item in crawled_data:
            combined_text += f"\n\nSource: {item['url']} ({item['title']})\n"
            combined_text += item['content'][:5000] # Truncate to avoid context limits if naive

        prompt = f"""
        Current Date and Time: {datetime.now(self.tz).strftime("%A, %B %d, %Y %H:%M")}
        
        You are a research assistant generating a Daily Briefing for a trading desk.
        Review the following gathered information and synthesize a comprehensive report.
        
        The report MUST be in Markdown format and follow these structural and formatting rules for maximum readability:
        
        1. **Executive Summary**: 
           - Start with a clear "Market Overview" table.
           - The table MUST have exactly these three columns: **INDEX / THEME**, **Sentiment**, and **Strength**.
           - Use short, impactful bullet points below the table.
           - Limit paragraphs to 3 sentences maximum.
        ---
        2. **Key Developments**: 
           - Break down primary stories into distinct subsections with `###` headers.
           - Use bolding for key entities and metrics.
           - Ensure vertical spacing between items.
        ---
        3. **Ongoing Situations**: 
           - Provide concise updates on continuing events.
           - Highlight any changes since the last report.
        ---
        4. **Market Sentiment & Emerging Trends**: 
           - Analysis of sentiment.
           - Use the phrase "Early Indicators" to mark emerging trends.

        GENERAL FORMATTING RULES:
        - Use horizontal rules (`---`) between the four major sections.
        - Use tables where data can be compared. **IMPORTANT**: Every table row must be on a new line.
        - Use bolding for emphasis, but do not over-bold.
        - Prioritize white space.
        
        Format heavily with bolding, bullet points, and clear headers.

        Input Data:
        {combined_text}
        """

        set_status("Finalizing Briefing...")
        try:
            report_content = await llm.generate(prompt)
             # Clean formatting
            report_content = report_content.replace('```markdown', '').replace('```', '').strip()
            log("Report generation successful.")

            # 6. Save Report
            now = datetime.now(self.tz)
            new_report = Report(
                title=f"Daily Briefing - {now.strftime('%Y-%m-%d %H:%M')}", 
                generated_at=now,
                content_markdown=report_content,
                content_json={},
                logs=execution_logs
            )
            db.add(new_report)
            db.commit()
            db.refresh(new_report)
            
            log(f"Report saved to database (ID: {new_report.id})")
            set_status("Idle")
            return new_report

        except Exception as e:
            log(f"Report generation failed: {e}")
            set_status("Error")
            raise e

intelligence_service = IntelligenceService()
