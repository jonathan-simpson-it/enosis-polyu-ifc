"""Playwright-based Trade Declaration System scraping service."""

from typing import Any

from playwright.async_api import async_playwright

from src.utils.logger import logger


class TradeSystemScraper:
    """Extracts declaration data from Trade Declaration System via browser automation.

    Part of Enosis's multi-modal ingestion pipeline:
    - Trade system scraping (Playwright) — digital trade portals
    - OCR (Tesseract) — scanned manifest documents, commercial invoices
    - File upload API — JSON/CSV data file uploads
    - Direct submission API — structured JSON input
    """

    async def scrape_declaration(self, system_url: str, declaration_id: str) -> dict[str, Any]:
        logger.info(f"Scraping declaration {declaration_id} from {system_url}")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            full_url = f"{system_url}?id={declaration_id}" if "?" not in system_url else system_url
            await page.goto(full_url, wait_until="networkidle")

            declaration_data = await page.evaluate(
                """() => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.textContent.trim() : '';
                };

                const getTableData = (tableIndex) => {
                    const tables = document.querySelectorAll('table');
                    if (tableIndex >= tables.length) return [];
                    const rows = tables[tableIndex].querySelectorAll('tr');
                    const data = [];
                    for (let i = 1; i < rows.length; i++) {
                        const cells = rows[i].querySelectorAll('td');
                        if (cells.length > 0) {
                            data.push(Array.from(cells).map(c => c.textContent.trim()));
                        }
                    }
                    return data;
                };

                const declDiv = document.getElementById('declaration-data');
                const infoItems = declDiv ? declDiv.querySelectorAll('.info-item') : [];

                let declarationNumber = '', consignorName = '', consigneeName = '', portOfLoading = '', portOfDischarge = '';
                infoItems.forEach(item => {
                    const label = item.querySelector('label');
                    const span = item.querySelector('span');
                    if (label && span) {
                        const text = label.textContent.trim();
                        const val = span.textContent.trim();
                        if (text === 'Declaration No') declarationNumber = val;
                        if (text === 'Consignor') consignorName = val;
                        if (text === 'Consignee') consigneeName = val;
                        if (text === 'Port of Loading') portOfLoading = val;
                        if (text === 'Port of Discharge') portOfDischarge = val;
                    }
                });

                const cards = document.querySelectorAll('.card');
                let notes = '';
                cards.forEach(card => {
                    const h2 = card.querySelector('h2');
                    if (h2 && h2.textContent.includes('Commercial Notes')) {
                        const p = card.querySelector('p');
                        if (p) notes = p.textContent.trim();
                    }
                });

                const tableMap = {};
                cards.forEach(card => {
                    const h2 = card.querySelector('h2');
                    const table = card.querySelector('table');
                    if (h2 && table) {
                        const rows = table.querySelectorAll('tr');
                        const data = [];
                        for (let i = 1; i < rows.length; i++) {
                            const cells = rows[i].querySelectorAll('td');
                            if (cells.length > 0) {
                                data.push(Array.from(cells).map(c => c.textContent.trim()));
                            }
                        }
                        tableMap[h2.textContent.trim()] = data;
                    }
                });

                return {
                    declaration_number: declarationNumber,
                    consignor_name: consignorName,
                    consignee_name: consigneeName,
                    port_of_loading: portOfLoading,
                    port_of_discharge: portOfDischarge,
                    commodities: tableMap['Commodities'] || [],
                    goods_items: tableMap['Goods Items'] || [],
                    measures: tableMap['Measures'] || [],
                    commercial_notes: notes
                };
            }"""
            )

            await browser.close()

        declaration_data["declaration_id"] = declaration_id
        logger.info(f"Scraped declaration {declaration_id}: {declaration_data.get('declaration_number', 'Unknown')}")
        return declaration_data

    async def scrape_declarations(
        self, system_url: str, declaration_ids: list[str]
    ) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        for did in declaration_ids:
            try:
                data = await self.scrape_declaration(system_url, did)
                results.append(data)
            except Exception as exc:
                logger.error(f"Failed to scrape declaration {did}: {exc}")
        return results
