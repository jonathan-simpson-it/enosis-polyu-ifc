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
                const paragraphs = patientDiv ? patientDiv.querySelectorAll('p') : [];

                let name = '', hkid = '', dob = '', gender = '';
                paragraphs.forEach(p => {
                    const text = p.textContent.trim();
                    if (text.includes('Name:')) name = text.replace('Name:', '').trim();
                    if (text.includes('HKID:')) hkid = text.replace('HKID:', '').trim();
                    if (text.includes('DOB:')) dob = text.replace('DOB:', '').trim();
                    if (text.includes('Gender:')) gender = text.replace('Gender:', '').trim();
                });

                // Get clinical notes
                const h2s = document.querySelectorAll('h2');
                let notes = '';
                h2s.forEach(h2 => {
                    if (h2.textContent.includes('Clinical Notes')) {
                        const nextP = h2.nextElementSibling;
                        if (nextP) notes = nextP.textContent.trim();
                    }
                });

                // Map tables by their preceding h2
                const tables = document.querySelectorAll('table');
                const tableMap = {};
                const allH2s = document.querySelectorAll('h2');
                allH2s.forEach((h2, idx) => {
                    const nextTable = h2.nextElementSibling;
                    if (nextTable && nextTable.tagName === 'TABLE') {
                        const rows = nextTable.querySelectorAll('tr');
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
