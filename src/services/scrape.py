"""Playwright-based CMS screen scraping service."""

from typing import Any

from playwright.async_api import async_playwright

from src.utils.logger import logger


class CMSScraper:
    """Scrapes patient data from clinic CMS systems via browser automation."""

    async def scrape_patient(self, cms_url: str, patient_id: str) -> dict[str, Any]:
        """Scrape a single patient's data from the CMS.

        Args:
            cms_url: Base URL of the CMS patient detail page.
            patient_id: Patient identifier to look up.

        Returns:
            Dict with extracted patient data.
        """
        logger.info(f"Scraping patient {patient_id} from {cms_url}")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            full_url = f"{cms_url}?id={patient_id}" if "?" not in cms_url else cms_url
            await page.goto(full_url, wait_until="networkidle")

            patient_data = await page.evaluate(
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
                    // Skip header row
                    for (let i = 1; i < rows.length; i++) {
                        const cells = rows[i].querySelectorAll('td');
                        if (cells.length > 0) {
                            data.push(Array.from(cells).map(c => c.textContent.trim()));
                        }
                    }
                    return data;
                };

                const patientDiv = document.getElementById('patient-data');
                const infoItems = patientDiv ? patientDiv.querySelectorAll('.info-item') : [];

                let name = '', hkid = '', dob = '', gender = '';
                infoItems.forEach(item => {
                    const label = item.querySelector('label');
                    const span = item.querySelector('span');
                    if (label && span) {
                        const text = label.textContent.trim();
                        const val = span.textContent.trim();
                        if (text === 'Name') name = val;
                        if (text === 'HKID') hkid = val;
                        if (text === 'DOB') dob = val;
                        if (text === 'Gender') gender = val;
                    }
                });

                // Get clinical notes
                const cards = document.querySelectorAll('.card');
                let notes = '';
                cards.forEach(card => {
                    const h2 = card.querySelector('h2');
                    if (h2 && h2.textContent.includes('Clinical Notes')) {
                        const p = card.querySelector('p');
                        if (p) notes = p.textContent.trim();
                    }
                });

                // Map tables by preceding h2 inside cards
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
                    name: name,
                    hkid: hkid,
                    dob: dob,
                    gender: gender,
                    diagnoses: tableMap['Diagnoses'] || [],
                    medications: tableMap['Medications'] || [],
                    lab_results: tableMap['Lab Results'] || [],
                    clinical_notes: notes
                };
            }"""
            )

            await browser.close()

        patient_data["patient_id"] = patient_id
        logger.info(f"Scraped patient {patient_id}: {patient_data.get('name', 'Unknown')}")
        return patient_data

    async def scrape_patients(
        self, cms_url: str, patient_ids: list[str]
    ) -> list[dict[str, Any]]:
        """Scrape multiple patients sequentially.

        Args:
            cms_url: Base URL of the CMS.
            patient_ids: List of patient identifiers.

        Returns:
            List of patient data dicts.
        """
        results: list[dict[str, Any]] = []
        for pid in patient_ids:
            try:
                data = await self.scrape_patient(cms_url, pid)
                results.append(data)
            except Exception as exc:
                logger.error(f"Failed to scrape patient {pid}: {exc}")
        return results
