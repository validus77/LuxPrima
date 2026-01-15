from playwright.async_api import async_playwright
from readability import Document
from bs4 import BeautifulSoup
import asyncio

class CrawlerService:
    async def crawl(self, url: str):
        async with async_playwright() as p:
            # Launch browser (headless by default)
            browser = await p.chromium.launch()
            try:
                # Create a new page
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
                page = await context.new_page()
                
                # Navigate to the URL
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                
                # Get page content
                content = await page.content()
                
                # Use Readability to extract main content
                doc = Document(content)
                summary_html = doc.summary()
                title = doc.title()
                
                # Clean up text
                soup = BeautifulSoup(summary_html, "lxml")
                text_content = soup.get_text(separator="\n", strip=True)
                
                # Extract all unique absolute links from the page
                links = await page.evaluate("""
                    () => {
                        return Array.from(document.querySelectorAll('a'))
                            .map(a => a.href)
                            .filter(href => href.startsWith('http'))
                    }
                """)
                links = list(set(links)) # Unique
                
                return {
                    "url": url,
                    "title": title,
                    "content": text_content,
                    "html": summary_html,
                    "links": links
                }
            except Exception as e:
                print(f"Error crawling {url}: {e}")
                return {
                    "url": url,
                    "error": str(e),
                    "title": "Error",
                    "content": ""
                }
            finally:
                await browser.close()

crawler_service = CrawlerService()
