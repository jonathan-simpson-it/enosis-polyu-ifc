## **eHR Content Standards Guidebook** 

**[Document Reference No. S57]** 

## **(V 1.10)** 

October 2025 

## ©  Electronic Health Record Office 

Reproduction of any parts of this publication is permitted on condition that it is for non-profit making purposes and an acknowledgement of this work is duly made in the reproduction. 

**eHR Content Standards Guidebook** 

## **Intellectual Property Rights Notice** 

© 2025 by the Government of the Hong Kong Special Administrative Region 

1. Unless otherwise indicated, all content in this publication, including but not limited to all texts, graphics, drawings, diagrams, photographs, compilation of data or other materials (“the Works”) is subject to intellectual property rights protection.  The intellectual property rights in such Works are either owned by the Government of the Hong Kong Special Administrative Region (“the Government”) or licensed to the Government by the intellectual property rights owner(s) of the Works. 

2. Where the Government is the owner of the intellectual property rights in a Work, a registered user may reproduce a Work for personal or internal reference within a registered healthcare provider organization for the purpose of any development, implementation or operation of systems in support of the eHealth System. 

3. The Government reserves the right to withdraw any permission given in clause 2 above at any time without any prior notice to you. 

4. Prior written consent of the Government is required if you intend to reproduce or otherwise use the Work in any way or for any purpose other than that permitted in clause 2 above.  Requests for permission should be addressed to the eHealth Record Office of the Health Bureau at 19/F, East Wing, Central Government Offices, 2 Tim Mei Avenue, Tamar, Hong Kong. 

5. For the avoidance of doubt, the permission in clause 2 above does not extend to intellectual property rights which do not belong to the Government.  Permission should be obtained from the relevant third party intellectual property rights owners in respect of reproduction or otherwise use of their Works. 

## **Disclaimer** 

1. This document is compiled by the Government, and eHealth Product Delivery Group (“eHealth PDG”) of the Hospital Authority which is the technical agency for the eHealth System. 

2. The information provided in this document is for reference or general information only. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 2 / 42 

**eHR Content Standards Guidebook** 

3. While the Government endeavors to ensure the accuracy of the information in this document, no express or implied warranty is given by the Government as to the accuracy of the information.  The Government will **NOT** be liable for any errors in, omissions from, or misstatements or misrepresentations (whether express or implied) concerning any such information, and will not have or accept any liability, obligation or responsibility whatsoever for any loss, destruction or damage (including without limitation consequential loss, destruction or damage) however arising from or in respect of any use or misuse of or reliance on the information in this document or inability to use it. 

4. This document may contain materials contributed by other parties over whom, and in respect of which, the Government may have no influence.  Provision of, or assistance in providing, materials contributed by third parties in this document gives rise to no statement, representation or warranty, express or implied, that the Government agrees or does not disagree with the contents of any such materials and the Government will not have or accept any liability, obligation or responsibility whatsoever for any loss, destruction or damage (including without limitation consequential loss, destruction or damage) however arising from or in respect of any use or misuse of or reliance on the contents of any such materials or inability to use any of them. 

5. The Government is not responsible for any loss or damage whatsoever arising out of or in connection with any information in this document.  The Government reserves the right to omit, suspend or edit all information compiled by the Government at any time in its absolute discretion without giving any reason or prior notice. Users are responsible for making their own assessment of all information contained in this document and are advised to verify such information by making reference, for example, to original publications and obtaining independent advice before acting upon it. 

6. This Disclaimer has been translated into Chinese. If there is any inconsistency or ambiguity between the English version and the Chinese version, the English version shall prevail. 

7. This Disclaimer may be revised and/or amended from time to time by the Government without prior notice to you. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 3 / 42 

**eHR Content Standards Guidebook** 

## **Table of Contents** 

|**Document Summary .............................................................................................................6**|
|---|
|**Amendment History ........................................................................................................................... 7**|
|**1.** **Background ............................................................................................................................... 10**|
|**2.** **Purposes of the Paper ............................................................................................................... 11**|
|**3.** **Abbreviations and Acronyms ................................................................................................... 11**|
|**4.** **Definition of Electronic Health Record ................................................................................... 12**|
|**5.** **Framework in Building eHR.................................................................................................... 12**|
|**6.** **Structured & Free Text Data ................................................................................................... 13**|
|**7.** **Data Type ................................................................................................................................... 14**|
|**8.** **eHR Content .............................................................................................................................. 15**|
|8.1.<br>Healthcare recipient .................................................................................................................. 15|
|8.2.<br>Encounter ................................................................................................................................. 16|
|8.3.<br>Referral ..................................................................................................................................... 16|
|8.4.<br>Clinical note/summary ............................................................................................................. 17|
|8.5.<br>Adverse drug reaction / allergy ................................................................................................ 17|
|8.6.<br>Clinical Alert ............................................................................................................................ 17|
|8.7.<br>Problem .................................................................................................................................... 18|
|8.8.<br>Procedure .................................................................................................................................. 18|
|8.9.<br>Assessment / Physical examination .......................................................................................... 19|
|8.10.<br>Birth Record ............................................................................................................................. 19|
|8.11.<br>Social history ............................................................................................................................ 19|
|8.12.<br>Past medical history .................................................................................................................. 19|
|8.13.<br>Family history........................................................................................................................... 19|
|8.14.<br>Medication ................................................................................................................................ 20|
|8.15.<br>Immunization............................................................................................................................ 20|
|8.16.<br>Clinical request ......................................................................................................................... 20|
|8.17.<br>Diagnostic test result (laboratory / radiology / others) ............................................................. 21|
|8.18.<br>Care & treatment plan .............................................................................................................. 21|
|8.19.<br>Medical certificate .................................................................................................................... 21|
|**9.** **Level of Compliance ................................................................................................................. 22**|
|**10.** **Implementation ......................................................................................................................... 25**|
|10.1.<br>Phased Implementation ............................................................................................................ 25|
|10.2.<br>Sharing Data to Electronic Health System ............................................................................... 26|
|10.3.<br>Ongoing Monitoring ................................................................................................................. 27|
|**11.** **Summary .................................................................................................................................... 28**|
|**12.** **References .................................................................................................................................. 29**|



Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 4 / 42 

**eHR Content Standards Guidebook** 

**Appendix A ....................................................................................................................................... 30 Appendix B ....................................................................................................................................... 32 Appendix C ....................................................................................................................................... 37 Appendix D ....................................................................................................................................... 41** 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 5 / 42 

**eHR Content Standards Guidebook** 

## **Document Summary** 

|Document Item|Current Value|
|---|---|
|Document Title|eHR Content Standards Guidebook|
|Creation Date|23 Jun 2009|
|Date Last Modified|Oct 2025|
|Current Document Issue|Version 1.10|
|Document Description|This paper defines the content and the information<br>standards for Hong Kong Special Administrative<br>Region eHR.  The document should be read in<br>conjunction with the eHR Data Interoperability<br>Standards which both developed by the eHR<br>Information Standards Office.|
|Prepared by|Coordinating Group on eHR Content & Information<br>Standards|
|Contact Information|enquiry@ehealth.gov.hk|



Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 6 / 42 

**eHR Content Standards Guidebook** 

## **Amendment History** 

|Issue No.|Summary of Change|Date|
|---|---|---|
|V1.0|Original version|23 Jun 2009|
|V1.1|1. Revised section on Structured & Free Text Data<br>2. Revised common datatype<br>3. Renamed<br>a. person to healthcare recipient<br>b. healthcare practitioner to healthcare professional /<br>healthcare provider (as appropriate)<br>c. Episode summary to clinical note/summary<br>4. Revised the definition on the following eHR sections :<br>a. healthcare recipient<br>b. Clinical note/summary<br>c. Adverse drug reactions / allergies<br>5. Added the following eHR sections :<br>a. Clinical alert<br>b. Birth Record<br>6. Removed subsection on healthcare practitioner<br>7. Revised the table on implementation phases<br>8. Added section on Summary|Jan 2013|
|V1.2|1. Revised paragraph 2.2 on intended readers<br>2. Added section 3 on abbreviations and acronyms<br>3. Revised numbering of sections 4 – 12<br>4. Revised paragraph 6.4 on sharing scanned discharge<br>summary<br>5. Added paragraph 6.5 on sharing of Chinese character<br>6. Relabeled the appendix starting with alphabet.<br>7. Renamed section title of 8.5<br>8. Renamed 9.6.2<br>9. Added paragraphs 9.7 – 9.10 on adoption of recognised<br>terminologies|Mar 2017|



Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 7 / 42 

||**eHR Content Standards Guidebook**|**eHR Content Standards Guidebook**|
|---|---|---|
||||
||10. Added paragraphs 10.4 – 10.5 on preparation of sharing<br>data to eHRSS<br>11. Added paragraphs 10.6 – 10.8 on monitoring of data<br>shared to eHRSS<br>12. Added Appendix B – Preparation at Healthcare Provider<br>for Data Sharing with the eHR Sharing System<br>13. Added Appendix C – Validation on Compliance to<br>Standards on eHR Sharable Scope||
|V1.3|1. Added reference to Appendix D<br>2. Revised paragraph 8 – further define the sharable scope<br>3. Added paragraph 8.8.5 – specify more details on sharable<br>procedure data<br>4. Revised Table 2 eHR Information Standards: Level of<br>Compliance<br>5. Added Appendix D – Sharing of Scanned Discharge<br>Summary to Electronic Health Record Sharing System|Apr 2018|
|V1.4|1. Revised para 8.4 for adding references of Obstetrics<br>Record dataset<br>2. Added the AppendixA-XVIIIObstetrics Record to<br>Appendix A|Jan 2020|
|V1.5|1. Revised para 8, 8.5.1, 8.7.3, 8.8.6, 8.14.2 for adding<br>references in relation to Chinese Medicine<br>2. Added recognised terminologies to para 9.6<br>3. Added the following Appendices to Appendix A<br>⚫ Appendix A-XIX Chinese Medicine Problem<br>⚫ Appendix A-XX Chinese Medicine Procedure<br>⚫ Appendix A-XXI Chinese Medicines Prescribing Record|Jul 2021|
|V1.6|Amendment on the Name of Bureau from Food and Health<br>Bureau to Health Bureau|Jul 2022|
|V1.7|1.<br>Revised para 8.9 for adding reference ofObservation and<br>Lifestyle Recorddataset<br>2.<br>Added the Appendix A-XXII Observation and Lifestyle<br>Record to Appendix A|Aug 2023|



Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 8 / 42 

**eHR Content Standards Guidebook** 

||||
|---|---|---|
|V1.8|1.<br>Revised para 8.14 for adding reference of Chinese<br>Medicines Dispensing Record<br>2. Added para 8.19 for Medical certificate<br>3. Added the following Appendices to Appendix A<br>⚫<br>Appendix A-XXIII Chinese Medicines Dispensing<br>Record<br>⚫<br>Appendix A-XXIV Medical Certificate|Jan 2024|
|V1.9|1.<br>Revised para 8.5 for adding reference of adverse drug<br>reaction (Chinese Medicine system) and allergy (Chinese<br>Medicine system)<br>2. Added the following Appendices to Appendix A<br>⚫<br>Appendix A-XXV Adverse Drug Reaction (Chinese<br>Medicine System)<br>⚫<br>Appendix A-XXVI Allergy (Chinese Medicine<br>System)<br>3.<br>Changed the eHealth Logo|May 2024|
|V1.10|1.<br>Revised the Intellectual Property Rights Notice and<br>Disclaimer to align terminology with the Electronic<br>Health System Ordinance amendment<br>2.<br>Amendment of the following terms:<br>⚫<br>Changed “Electronic Health Record Sharing<br>System” or “eHR Sharing System” to “Electronic<br>Health System”<br>⚫<br>Changed “eHRSS” to “eHealth”<br>⚫<br>Changed “eHR Programme” to “eHealth<br>Programme”|Oct 2025|



Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 9 / 42 

**eHR Content Standards Guidebook** 

## **1. Background** 

1.1. Healthcare today is confronting an increasing number of tough challenges: highly specialized healthcare fields, aging population, escalating healthcare costs, rising expectations, increasing threats of communicable diseases.  Healthcare is now being delivered by teams of practitioner serving patients over long periods. It is not uncommon for a person to be repeatedly asked for one’s medical and social history by multiple healthcare professionals during an episode of care.  Or, investigations are repeated because the attending doctor does not know what has been done previously and by whom. Sharing timely and accurate patient information amongst various highly specialized healthcare professionals plays a crucial role for the continuous delivery of safe, quality and efficient patient care in today’s healthcare environment. 

## 1.2. 

## 1.3. 

## 1.4. 

Technology enables us to build a longitudinal womb-to-tomb health record.  Electronic data can be exchanged amongst different systems and allow users of different sites and settings to view the record in an integrated fashion.  If the shared clinical data is incorporated into the eMR (electronic medical record) systems of the practitioners, then the receiving systems can reuse the data for purposes such as clinical decision support. However an interoperable health information system cannot be realized without extensive standardization.  IEEE (1990) defines interoperability as the ability of two or more systems or components to exchange information (functional interoperability) and to use the information that has been exchanged (semantic interoperability) (a). 

Standardization forms the foundation for accurate and efficient communication of electronic data.  The current healthcare environment demands a variety of information systems to support its operation, e.g. clinical information systems, laboratory systems, radiology systems, pharmacy systems, financial systems…  Standardization allows systems to interface in a uniform way and relieves the developers of clinical software from building separate interfaces for every system their software needs to talk with, thus reducing the cost of technical integration.  By using standard terminology, information is interpreted by all users with the same understanding.  This supports reuse of data, improves the efficiency of healthcare services by reducing duplicate tests and avoids errors by reducing miscommunication and reducing data transcription and duplication. 

The 2007-08 Policy Address highlighted the requirement of developing a territory-wide, patient-oriented electronic health record (eHR) (b) with the aims to improve efficiency and quality of care, improve continuity and integration of care, enhance disease 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 10 / 42 

**eHR Content Standards Guidebook** 

surveillance and redress public-private imbalance (c).  A Steering Committee on eHealth Record Sharing was established in 2007 with three working groups under which to address issues relating to institutional setup, the legal implications and privacy concerns, as well as the eHR content and information standards. 

## **2. Purposes of the Paper** 

## 2.1. 

## 2.2. 

This paper defines the content and the information standards for Hong Kong eHR.  The initial set of content / information standards only identifies the most essential items that are considered fundamental in record sharing when a healthcare recipient is referred from a healthcare provider to another one.  The scope and content of the eHR will be enriched with time and this paper will be updated with the growth of the eHR. 

This document provides general and practical guidance for Management Executives, Healthcare Professional, Administrative and Technical Staff working in Healthcare Providers (HCPs) who have participated / planning to participate in Electronic Health System. It should be read in conjunction to the eHR Data Interoperability Standards which defines the messaging standard to support standards-compliant interoperability. 

## **3. Abbreviations and Acronyms** 

|Abbreviation|Definition|
|---|---|
|ADR|Adverse drugreaction|
|BCT|Business Case Testing|
|eHR|Electronic Health Record|
|eHR ISO|Electronic Health Record Information Standards Office|
|eHR PMO|Electronic Health Record Project Management Office|
|eHealth|Electronic Health System|
|eMR|Electronic Medical Record|
|ePR|Electronic Patient Record|
|HCP|Healthcare Provider|
|HCR|Healthcare Recipient|
|HKCTT|HongKongClinical TerminologyTable|
|ICD|International Statistical Classification of Diseases and Related Health<br>Problems|



Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 11 / 42 

**eHR Content Standards Guidebook** 

|Abbreviation|Definition|
|---|---|
|ICPC|International Classification of PrimaryCare|
|ISO/IEC|International Standards Organisation / International Electrotechnical<br>Commission|
|LOINC|Logical Observation Identifiers, Names and Codes|
|MDT|Masked Data Testing|
|RPP|List of Registered Pharmaceutical Products|
|RT|Recognised Terminology|
|SNOMED CT|Systematized Nomenclature of Medicine, Clinical Terms|
|TIT|Technical Interface Testing|
|pCm|ProprietaryChinese Medicine|



## **4. Definition of Electronic Health Record** 

- 4.1. eHR is a womb-to-tomb electronic longitudinal health record comprising of all important health data about a healthcare recipient.  It is contributed by various healthcare professionals and the person himself/herself, and the data can be accessed at anytime, anywhere by authorized personnel. 

- 4.2. The eHR should consist of sufficient content to support continuity of health care on transfer / referral.  It also provides information to improve the quality of health care and health service efficiency, e.g. reducing medical error, enhance timeliness, and reduce duplication of services. 

## **5.** 

## **Framework in Building eHR** 

5.1. The pace of development of electronic health information system in Hong Kong varies. On one hand, the Hospital Authority has built a world class electronic patient record for sharing patient data amongst all her institutions and with the private sector.  Yet, the adoption of computer at the private healthcare sector needs to catch up. 

- 5.2. Considering the wide range of computerization at the healthcare sector, the advancement in health science, and the ever changing information technology, the eHR interoperability framework should be : 

   - Concept oriented – ensure the consistency of the meaning of both the data field and field content which are coded to the approved standard terminology 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 12 / 42 

**eHR Content Standards Guidebook** 

   - Data privacy – support the protection of data privacy 

   - Multiple granularity – support both generalist and specialist documentation 

   - Simple – easily understood, and implemented 

   - Generic – able to apply to data captured in any technical environment 

   - Flexible – support different presentations of the same data 

   - Robust – able to support high volume of data retrieval 

- 5.3. Central to this framework, every medical concept is uniquely identified with reference to the context under which the medical fact is being captured.  The medical concept can flexibly be organized to facilitate data retrieval / aggregation at various dimensions for different users.  For example, the same HbA1C result could be retrieved from the Laboratory section, and also at the Diabetes Mellitus Management section. 

## **6. Structured & Free Text Data** 

- 6.1. The granularity of documentation in the traditional record varies depending on the healthcare professional and the setting where healthcare is provided.  In an electronic environment, the practice of free-text entry would be continued as free-text data is more expressive and natural to the healthcare professionals who could describe the person condition / history in detail.  However, encoding free-text data would not be automatic for various reasons, e.g. clinical data are context dependent, the limitation of terminology support to understand different users’ expression.  Thus, reduce its interoperability capability. 

- 6.2. In the computer world, required information can be collected as discrete data element (data field) holding discrete value (field value) as structured data which is more precise and able to be manipulated for data analysis, aggregation and retrieval though it is more rigid and require maintenance. 

- 6.3. Structured data are preferred for eHR contents which would have a bearing on future data retrieval / aggregation and intelligence support.  Structured data should be coded to the approved institution code, and migrate to international (Hong Kong version) terminology to support fully interoperable eHR. 

- 6.4. Free-text data should also be supported in areas where structured data could not fulfill the requirement, e.g. history.  It is anticipated that both types of data could exist together to complement each other and provide comprehensive information on a particular patient. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 13 / 42 

**eHR Content Standards Guidebook** 

To support effective communication, it is recommended the healthcare providers to send computer generated reports to the Electronic Health System.  Healthcare providers who share hand-written discharge summaries (refer to Appendix D for details of how to scan discharge summary and upload to Electronic Health System) at eHR initial phase are advised to develop plan to move scanned records to computer generated reports and send to Electronic Health System (eHealth). 

6.5. There are different coding standards for Chinese characters, e.g. Big-5, Guo Biao.  Out of them, the ISO/IEC 10646 covers characters in all major languages, and is being actively promoted by the Hong Kong Special Administrative Region Government.  The eHealth has adopted the ISO/IEC 10646 standards for traditional and simplified Chinese characters.  Healthcare providers are advised to share their Chinese data to eHealth using ISO/IEC 10646 standards to avoid error display. 

## **7. Data Type** 

## 7.1. 

Data type indicates the type of data for a particular data field.  It is the basic building block used to construct or restrict the contents of a data field, such as, address, person name, and identifier.  Table 1 lists the common ones being used in the eHR.  Further reference to the relevant defined code table is required for coded values, e.g. ID, IS. 

**Table 1  Commonly Used Data Type Used in eHR** 

|**Code**|**Description**|**Definition**|
|---|---|---|
|CE|Coded element|Coding systems/tables specified by eHR project|
|ED|Encapsulated data|Encapsulated data, e.g. PDF document, JPG image,<br>from a source system to a destination system|
|ST|String data|Text data up to 1,000 characters|
|TS|Time stamp|• Date and time<br>• Permits varying degrees of granularity from days, hours, to<br>decimal seconds|
|TX|Text|Text data up to 65536 characters, for display purpose|



Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 14 / 42 

**eHR Content Standards Guidebook** 

## **8. eHR Content** 

This section describes the content that should be included in the eHR.  The proposed sharable scope has considered the international proposal (d, e) and also the local development at the Hospital Authority.  Readers should refer to the appropriate sections of Appendix A on the details of the eHR content and relevant code tables where appropriate.  The proposed sharable scope in Appendix A has defined various domains of the clinical record which could be created by any healthcare professionals, e.g. doctors, Chinese medicine practitioners, nurses, allied health professionals in the process of patient care.  In addition, records of various domains could be grouped together according to the clinical problem/condition that the patient has to facilitate the healthcare professionals to review, record, and monitor the patient’s progress.  Where required, a more detailed requirement would be defined in Appendix A to facilitate record sharing. Unless specified, all clinical data will be considered as present, current when the data was created, and belong to the person.  Care should be taken to define the clinical data under the following conditions: 

- ⚫ Data of the past, e.g. history 

- ⚫ Negation data, e.g. absence of 

- ⚫ Data of other persons, e.g. family history 

## 8.1. **Healthcare recipient** 

- 8.1.1 A healthcare recipient is an individual who joins eHR sharing in order to share his/her health record with other parties via the Electronic Health System.  He/she can be a patient seeking healthcare services for examination or treatment from a healthcare provider.  A healthcare recipient can also be one who attends for routine checkup at a healthcare institute, or simply a person who wants to maintain one’s health data in the eHR. 

- 8.1.2 This includes all information that is required to accurately and uniquely identify a healthcare recipient.  This includes : 

   - A system generated permanent unique identifier for each individual who joins the eHR. 

   - Identification data, including identity document number, name, sex, date of birth. These data should be recorded according to the information on one’s identity document. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 15 / 42 

**eHR Content Standards Guidebook** 

   - Demographic data, e.g. address, phone number.  These data helps to contact the person for future healthcare.  The demographics could also assist in other purposes, e.g. address for disease surveillance, nationality for use of healthcare service. These data should also be coded as far as practicable. 

   - Next of kin information which helps to contact the healthcare recipient / family if required, e.g. in emergency. 

- 8.1.3 Accurate record linkage starts with registration of a healthcare recipient at individual healthcare provider.  Identity of the healthcare recipient must be verified to ensure clinical data are correctly tagged.  Enrolment of a healthcare recipient, or update of a healthcare recipient’s identification data must be supported by his/her identity document. 

- 8.1.4 Clinical data sent to the eHR could be rejected if the essential demographic data do not match with those in the registry. 

(Please refer to Appendix A - I) 

## 8.2. **Encounter** 

- 8.2.1 An encounter is the contact between a healthcare recipient and the healthcare professional who will assess, evaluate and treat a healthcare recipient.  An encounter could be scheduled as an appointment, and it could be urgent.  An episode is composed of one or more encounter(s), see section 8.4.2. 

- 8.2.2 This includes a list of booked appointments and attended healthcare encounters, e.g. clinic appointment, admission, appointment of / attendance for examination / procedure. Information on the healthcare provider who constitutes the encounter, location of the encounter, and other details of the encounter.  Where the event has completed, information on the disposition should also be included. 

(Please refer to Appendix A - II) 

## 8.3. **Referral** 

- 8.3.1 Referral documents the information that is required when a healthcare provider refers all or a portion of a healthcare recipient’s care to another healthcare provider, and also the reply from the receiving healthcare provider to the referrer.  Both the referral and the reply records would include the information as discussed in other areas under Section 8. (Please refer to Appendix A - III) 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 16 / 42 

**eHR Content Standards Guidebook** 

## 8.4. 

## **Clinical note/summary** 

- 8.4.1 The clinical note/summary contains information that record/summarize the following of a particular clinical encounter /episode: 

   - Reason originates the encounter/episode and the healthcare recipient’s condition during initial encounter 

   - Adverse drug reactions, allergies and clinical alert found during the encounter / episode  (these information should also be separately sent to the eHR as the appropriate section) 

   - Major diagnostic findings during the course of the episode 

   - Problems identified 

   - Significant procedures performed and other related therapeutic treatment, e.g. medication 

   - The healthcare recipient’s condition, therapeutic orders or treatment plan for that encounter or while preparing a periodic episode summary or upon termination of an episode 

   - Follow-up arrangement 

   - Education to the healthcare recipient / family, if applicable 

- 8.4.2 An episode is one or more healthcare services a healthcare recipient received from healthcare professional for a particular clinical problem or situation during a relatively continuous period.  An episode is composed of one or more encounter(s), see section 8.2. 

(Please refer to Appendix A - IV for Clinical note/summary and A-XVIII for Obstetrics Record) 

## 8.5. **Adverse drug reaction / allergy** 

- 8.5.1 This includes information on the type of biological, physical or chemical agents that would result in / is proven to give rise to adverse health effects.  Details of the adverse drug reactions, if occurred, should also be included.  Absence of the information does not imply the absence of the condition.  ‘No known drug allergy’ information will NOT be displayed in the Electronic Health System. 

(Please refer to Appendices A – V and A – VI, A – XXV and A– XXVI) 

- 8.6. **Clinical Alert** 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 17 / 42 

**eHR Content Standards Guidebook** 

- 8.6.1 Clinical alert are important information on the condition of the participant and/or the care provided / to be provided to the participant.  The information is a critical reference for subsequent clinical care, for example, the alert information on pregnancy status may affect whether a radiology examination should be ordered / performed. 

- 8.7. **Problem** 

- 8.7.1 Problem list contains all active and inactive significant health and social problems. Problem can be a diagnosis, pathophysiological state, significant abnormal physical sign and examination finding, social problem, risk factor, allergy, reaction to drugs or foods, or health alert. 

- 8.7.2 An initial problem list can be built from the diagnoses / problems recorded in an encounter / episode. 

- 8.7.3 Problem plays a significant role in individual personal care, e.g. developing disease management program or decision support rules.  It assists in data retrieval for public health, and the planning and management of healthcare services.  Thus, the problem should be coded to the controlled terminology as approved by the Steering Committee on eHealth Record Sharing at a level as granular as possible.  The status of the problem should be updated whenever applicable. 

(Please refer to Appendices A - VII and A – XIX) 

- 8.8. **Procedure** 

- 8.8.1 This includes any significant procedures that are done for diagnosis, exploratory or treatment purposes. 

- 8.8.2 Where the procedure was performed at an inpatient episode, there should be indication of the ‘principal procedure’ which is defined as follow : 

   - The most significant procedure performed for treatment of the principal diagnosis; if none - 

   - The most significant procedure performed for treatment of additional diagnoses; if none - 

   - The diagnostic / exploratory procedure related to the principal diagnosis; if none - 

   - The diagnostic / exploratory procedure related to additional diagnoses 

- 8.8.3 Procedures should be coded to the controlled terminology as approved by the Steering Committee on eHealth Record Sharing at a level as granular as possible. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 18 / 42 

**eHR Content Standards Guidebook** 

- 8.8.4 Laboratory diagnostic procedures are excluded. 

- 8.8.5 Separate information model could be defined to facilitate sharing of more details on the procedure that performed, e.g. endoscopy record. 

- 8.8.6 Laboratory diagnostic procedures are excluded. 

   - (Please refer to Appendices A - VIII and A – XX) 

- 8.9. **Assessment / Physical examination** 

- 8.9.1 The healthcare professional records one’s observation made on a particular person after a systematic examination which is usually done according to body part, and also body system as assessment / physical examination. 

- 8.9.2 The assessment / physical examination provides information to the healthcare professional for making a diagnosis and planning the care to be provided.  It supplements the severity of the disease and effects to the treatment. 

   - (Please refer to Appendix A - XXII for Observation and Lifestyle Record) 

- 8.10. **Birth Record** 

- 8.10.1 The basic information about the healthcare recipient’s birth, e.g. place of birth, birth weight, maturity.  Part of the information relating to birth would be fallen under the other sharable scope, e.g. diagnosis, procedure, assessment. 

(Please refer to Appendix A - IX) 

- 8.11. **Social history** 

- 8.11.1 The lifestyle practices that may directly or indirectly affect a healthcare recipient’s health, e.g. occupation, travel, hobbies, habits. 

- 8.12. **Past medical history** 

- 8.12.1 Prior illnesses, injuries, treatment received which may or may not have an effect to the current care.  The medical history should be started during the gestation with the gestational record be transferred to the healthcare recipient’s health record at birth.  For a well maintained electronic health record, the past medical history can be built from the documentation by all healthcare providers who have cared for a healthcare recipient. 

- 8.13. **Family history** 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 19 / 42 

**eHR Content Standards Guidebook** 

- 8.13.1 Family history includes the hereditary or contact diseases that occurred in the family. The biology relationship of the family members with the healthcare recipient is recorded and could be presented in a pedigree chart. 

- 8.14. **Medication** 

- 8.14.1 This includes medication ordered and/or dispensed/administered during the healthcare process.  Where the medication is ordered, information on whether it is dispensed and/or administered should also be included. 

- 8.14.2 Medications acquired over the counter by the patient should also be included in the future when the patient portal is developed. 

(Please refer to Appendices A - X, A - XI, A - XXI and A - XXIII) 

- 8.15. **Immunization** 

- 8.15.1 Immunization should include all immunization administered to the patient and those on the immunization plan.  Information on immunity (whether acquired or induced) or resistant to a particular pathogen should also be included. 

(Please refer to Appendix A - XII) 

## 8.16. **Clinical request** 

- 8.16.1 Clinical request is the health intervention that a healthcare professional instructed for the treatment of a healthcare recipient.  The health intervention includes a wide range of healthcare services which could be provided by other disciplines, e.g. nurses, therapists, other practitioners being done at point-of-care or off-site. 

- 8.16.2 The clinical request usually include the following information : 

   - Details of the healthcare professional who made the request 

   - Details of the healthcare recipient who required the service 

   - Details of the request, e.g. type of service, timing of the service 

   - Whether the request has been fulfilled 

- 8.16.3 Different types of tests would be requested in the same clinical request.  Each clinical request should be uniquely identified, so as the individual requested test that was included in the same request. 

- 8.16.4 The clinical request should also be linked with the results of the requested intervention to promote safety and improve efficiency of healthcare services. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 20 / 42 

**eHR Content Standards Guidebook** 

- 8.16.5 Computerized clinical request (it also termed as computerized physician order entry) communicates the requested intervention directly to the healthcare provider who provides the service.  Thus, it will reduce errors due to handwriting or transcription; avoid delay in providing the treatment to a healthcare recipient; and support error-checking, e.g. allergy checking. 

- 8.17. **Diagnostic test result (laboratory / radiology / others)** 

- 8.17.1 This includes results of various types of diagnostic tests, e.g. laboratory, radiology, electronic medical diagnostic tests, and other diagnostic tests. 

- 8.17.2 Laboratory test results should be subclassified according to the nature of the test, namely anatomical pathology, biochemistry, haematology, microbiology, virology, and other laboratory test. 

- 8.17.3 Radiology results would include radiology report and images.  They are subclassified according to modality, e.g. plain x-ray, fluoroscopy, ultrasound, computer tomography, magnetic resonance imaging, nuclear medicine, angiography and vascular interventional radiography, non-vascular interventional radiography, positron emission tomography and others. 

- 8.17.4 Other diagnostic test results could be of diverse range as discrete data element or a full report of the diagnostic test.  Images, e.g. clinical photos, tracing, could also be included. 

- 8.17.5 As a healthcare recipient could have numerous diagnostic tests being done throughout one’s life.  Where applicable, the result should include a conclusive statement for easy reference, in particular for free-text reports. 

- 8.17.6 Where possible, diagnostic tests should be linked to the diagnoses / problem lists. Special diagnostic results, e.g. radiology examination, should also be fed to the procedure list. 

(Please refer to Appendix A - XIII to A - XVII) 

## 8.18. **Care & treatment plan** 

- 8.18.1 Care & treatment plan includes all planned / scheduled clinical requests, appointments, referrals, procedures, education and / or services that a healthcare professional considers that would aid in the diagnosis of / treatment to a healthcare recipient 

- 8.19. **Medical certificate** 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 21 / 42 

**eHR Content Standards Guidebook** 

- 8.19.1 A medical certificate is a formal statement about the health status or situation related to an individual. 

## **9. Level of Compliance** 

- 9.1. All clinical data sent to the eHR should provide some basic information (the Header) including the following information using HL7 message format (please refer to the eHR Data Interoperability Standards) : 

   - The healthcare recipient’s eHR number 

   - The healthcare recipient’s identification data 

   - The data creation / update information 

   - The healthcare provider who creates the clinical data 

- 9.2. Given the diversity and complexity of various information standards, and the different levels of adoption of information technology by the healthcare sectors, a multi-level compliance to the defined standard is recommended (see table 2). 

- 9.3. The minimum requirement would be providing descriptive information or as scanned document/file, e.g. PDF to the eHR (Level 1).  This allows the sharing of health information at an ‘automated paper environment’.  Appropriate measures must be in place to ensure information is tagged to the right patient, in particular for images. 

- 9.4. Various healthcare professionals can define the data fields using institution-defined codes, and migrate to international codes (Hong Kong version) for both data fields (Level 2.2). This facilitates the integration of same type of information at the eHR and supports easy retrieval of health information at the eHR.  However, at this level, same concept could be differently represented by various institutions, e.g. diabetes mellitus could be recorded as DM, diabetes mellitus, or D.M.  Human interpretation is required to understand the meaning of the shared data.  Yet, such flexibility could be confusing sometimes as the same description could carry different meanings, e.g. PID could be pelvic inflammatory disease, or prolapsed intervertebral disc. 

- 9.5. Healthcare providers can also provide field value using codes tables / recognized terminologies which are defined by the eHR (see para. 8.6), to support a fully interoperable eHR (Level 3).  This supports the Electronic Health System to organize the data in a more clinician friendly format.  Healthcare providers can reuse the data captured by the other healthcare organizations.  In addition, the eHR can also provide information for secondary uses, e.g. public health purpose, health services planning. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 22 / 42 

**eHR Content Standards Guidebook** 

**Table 2  eHR Information Standards: Level of Compliance** 

|**HK**|**HL7**|**Data field**|**Field Content**||
|---|---|---|---|---|
|**eHR**|||**Value**|**PDF**|
|1|1|institutional (free text)<br>description|institutional (free text)<br>description|Y|
|2|2|• institution-defined code<br>• institutional description<br>• international code (HK)|institutional description +/-<br>institution-defined code|Y|
|3.1|3|• institution-defined code<br>• institutional description<br>• international code (HK)|• institution-defined code<br>• institutional description<br>• international code (HK)|Y|
|3.2|3|• institution-defined code<br>• institutional description<br>• international code (HK)<br>• fully specified|• institution-defined code<br>• institutional description<br>• international code (HK)|Y|



   - (a) Interoperable sharable data could be defined in detail such that all structured data are codified.  Level 3.1 refers to the condition that only core data conforms to eHR Level 3 requirement as specified in Appendix A, and the other supporting data may or may not conform to the eHR Level 3 requirement.  Level 3.2 (fully specified) refers to all sharable data of a particular domain conforms to the Level 3 definition as specified in Appendix A. 

- 9.6. In the eHR project, code tables have been defined for individual domains.  Healthcare providers can reference to these code tables and send data to the eHR as level 3 data to facilitate an interoperable eHR.  Some of these code tables are defined by the eHR project, e.g. the sex table for identifying the sex of the healthcare recipient.  Some code tables are referring to various terminologies – the eHR “recognised terminologies”, including : 

      - Hong Kong Clinical Terminology Table (HKCTT) 

      - List of Registered Pharmaceutical Products (RPP) 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 23 / 42 

**eHR Content Standards Guidebook** 

   - International Statistical Classification of Diseases and Related Health Problems, Tenth Revision (ICD-10), includes ICD-10 2001 and 2010 versions, and Mental and Behavioural Disorders (ICD10-MBD) 

   - International Classification of Primary Care, Second edition (ICPC-2) 

   - Logical Observation Identifiers Names and Codes (LOINC) 

   - Systematized Nomenclature of Medicine-Clinical Terms (SNOMED CT) 

   - Classification and codes of diseases and ZHENG of traditional Chinese medicine (GB/T 15657-1995) 

   - Clinic terminology of traditional Chinese medical diagnosis and treatmentTherapeutic methods (GB/T 16751.3-1997) 

   - Proprietary Chinese Medicine (pCm) 

- 9.7. These recognised terminologies were developed for various purposes.  Some were developed to support clinical documentation, e.g. HKCTT, LOINC, SNOMED CT, and some were developed for health statistics purpose, e.g. ICD. 

- 9.8. It is recommended healthcare providers to adopt the recognised terminologies as early as possible, regardless of whether they have joined the eHealth Programme or not.  Such arrangement will facilitate the healthcare providers to be early prepared to send level 3 data to Electronic Health System when they eventually join the eHealth Programme. 

## 9.9. 

## 9.10. 

- Since these recognised terminologies would be updated from time to time, an outdated terminology may affect the interpretation of the shared data and accuracy of data reporting, it is recommended that the healthcare provider to maintain an up-to-date set of terminologies. 

A number of healthcare provider systems were in place before the development of HKCTT.  There could be practical difficulties for some healthcare providers to replace their own local terminologies by HKCTT.  On the other hand, the use or sharing of local terms to Electronic Health System will reduce the capability of the shared data.  For these cases, healthcare providers may consider mapping their local terminologies to HKCTT.   However, they are encouraged to move up the standards compliance ladder so that they can share level 3 data to Electronic Health System over time.  Since mapping could incur error or loss of meaning, eHRISO will provide training and advice on terminology management.  Healthcare providers have to be responsible for the mapping and the accuracy and quality of the mapped data. 

9.11. For details, please refer to the Guide on Implementation and Maintenance of the Hong 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 24 / 42 

**eHR Content Standards Guidebook** 

Kong Clinical Terminology Table. 

## **10. Implementation** 

- 10.1. **Phased Implementation** 

- 10.1.1 Healthcare providers shall share all data (including historical data) falling within the eHR sharable scope if readily sharable electronically belonging to the healthcare recipients who have enrolled in eHR sharing and granted an express and informed consent to the subject healthcare provider. 

- 10.1.2 A phased approach is recommended for passing data to the eHR with reference to the experience of developing electronic medical records at overseas and Hong Kong.  Such phased approach facilitates the healthcare providers to develop their clinical information systems and also identifies the prioritization of the development of related health information standards. 

- 10.1.3 At the initial stage, healthcare providers can send the most essential items at a human readable level to the eHR for ongoing health care.  At later stage with more health information standards being well defined and as providers’ systems are more advanced, health data can be sent at a semantic based machine readable level to the eHR.  Please refer to table 3 for details. 

**Table 3 : eHR Implementation Phases** 

|**eHR Content**|**Level 1**|**Level 2**|**Level 3**|
|---|---|---|---|
|**Healthcare recipient**||||
|**Encounter**||||
|**Referral**||||
|**Clinical note / summary**||||
|**Adverse drug reaction / allergy**||||
|**Clinical alert**||||
|**Problem**||||
|**Procedure**||||
|**Birth record**||||



Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 25 / 42 

**eHR Content Standards Guidebook** 

|**eHR Content**|**Level 1**|**Level 2**|**Level 3**|
|---|---|---|---|
|**Assessment / physical exam**||||
|**Social history**||||
|**Past medical history**||||
|**Family history**||||
|**Medication**||||
|**Immunization**||||
|**Clinical request**||||
|**Diagnostic test result – Laboratory**||||
|**Diagnostic test result – Radiology**||||
|**Diagnostic test result – Other investigation**||||
|**Care & treatment plan**||||



## Key : 

Phase 1 Phase 2 Phase 3 Phase 4 Phase 5 

## 10.2. **Sharing Data to Electronic Health System** 

- 10.2.1 When a healthcare provider indicates her willingness to share patient data to the Electronic Health System, the eHR Project Management Office (eHR PMO) will work with the healthcare provider to prepare for data upload.  In general, this would involve : 

- 10.2.1.1 Gap analysis 

This is to ensure the healthcare providers accurately interpret the eHR standards, and the shared data will conform to the eHR standards, including the eHR content, codex, and recognised terminologies. 

The eHR standards will be updated from time to time, healthcare providers may upload the data using any of the latest three versions of the defined sharable dataset.  The healthcare providers are advised to maintain the updates at the local eMR, such as sharable dataset and the codex tables. 

## 10.2.1.2 Technical preparation 

The healthcare provider will prepare for technical setup and testing for data transmission to/from Electronic Health System. 

## 10.2.1.3 Experience eHR data sharing 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 26 / 42 

**eHR Content Standards Guidebook** 

The healthcare provider to experience data sharing to the Electronic Health System with her deidentified production data, e.g. viewing her patient data at the eHR, and receiving data monitoring reports from the Electronic Health System. 

- 10.2.1.4 See Appendix B for details of preparation for data sharing with the Electronic Health System. 

- 10.2.2 The healthcare providers will report on the findings of the testing.  The eHR PMO will assess the testing result and recommend on sharing of the related healthcare provider’s data to the Electronic Health System. 

## 10.3. **Ongoing Monitoring** 

- 10.3.1 When the healthcare provider started sharing her patient data, the Electronic Health System will check the quality of the data based on individual healthcare provider’s indication on data standard compliance level for individual domain. 

- 10.3.2 The Electronic Health System will reject uploaded records which do not meet the sharing criteria as defined in the eHR Content (see Appendix A) for the standards compliance level as indicated by the respective healthcare provider, for example, missing data for mandatory item, data out of the acceptable range. 

- 10.3.3 Where the healthcare provider indicated sharing level 3 data to the Electronic Health System, the system will also check the codex and the recognised terminologies as indicated by the healthcare provider upon receiving uploaded data from the healthcare provider.  If the code or description provided by the healthcare provider does not match with / exist in the eHR defined codex / recognised terminology tables, the Electronic Health System will treat the data as level 2 data. 

- 10.3.4 A report will be sent to the healthcare provider to follow up for these rejected / regraded data.  The healthcare provider should contact her own information technology / informatics support to review these reports and identify areas for improvement. 

- 10.3.5 See Appendix C for details of validation on compliance to standards on eHR sharable scope. 

- 10.3.6 The healthcare provider should also reflect any abnormalities identified to the eHR PMO for further improvement of data sharing. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 27 / 42 

**eHR Content Standards Guidebook** 

## **11. Summary** 

- 11.1. The Electronic Health System will provide an opportunity to further enhance the quality and efficiency of healthcare delivery.  The proposed eHR sharable scope and phased implementation approach will facilitate healthcare providers with different levels of computer adoption to contribute to the Electronic Health System.  Healthcare providers are encouraged to reference to the proposed sharable scope and enhance their electronic medical records so that data can be shared at the highest standards compliance level to facilitate the reviewing of the eHR data.  The eHR Information Standards Office will review and update the proposed sharable scope, as appropriate. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 28 / 42 

**eHR Content Standards Guidebook** 

## **12. References** 

- a. IEEE, 1990.   IEEE Standard Computer Dictionary: A compilation of IEEE Standard Computer Glossaries. 

- b. Hong Kong Special Administrative Region.  2007.  2007-08 Policy Address. - 

- http://www.policyaddress.gov.hk/07 08/eng/p96.html 

- c. Hong Kong Special Administrative Region.  2008.  Your health, your life – Healthcare Reform Consultation Document. http://www.fhb.gov.hk/beStrong/eng/consultation/consultation_cdhcr_cdhr.html 

- d. ASTM.  2007.  E1384 Standard Practice for Content and Structure of the Electronic Health Record. 

- e. ASTM.  2007.  E2369 Standard Specification for Continuity of Care Record (CCR). 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 29 / 42 

**eHR Content Standards Guidebook** 

## **Appendix A** 

## **Appendices – eHR Content and Codex** 

|Appendix A-I|Healthcare Recipient Index|
|---|---|
|Appendix A-II|Encounter Record|
|Appendix A-III|Referral|
|Appendix A-IV|Clinical Note/Summary|
|Appendix A-V|Adverse Drug Reaction|
|Appendix A-VI|Allergy|
|Appendix A-VII|Problem|
|Appendix A-VIII|Procedure|
|Appendix A-IX|Birth Record|
|Appendix A-X|Dispensing Record|
|Appendix A-XI|Prescribing Record|
|Appendix A-XII|Immunisation Record|
|Appendix A-XIII|Laboratory Record – Anatomical Pathology|
|Appendix A-XIV|Laboratory Record – General Laboratory|
|Appendix A-XV|Laboratory Record – Microbiology (Culture & Sensitivity Test)|
|Appendix A-XVI|Radiology Examination|
|Appendix A-XVII|Investigation Report|
|Appendix A-XVIII|Obstetrics Record|
|Appendix A-XIX|Chinese Medicine Problem|
|Appendix A-XX|Chinese Medicine Procedure|



Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 30 / 42 

**eHR Content Standards Guidebook** 

|Appendix A-XXI|Chinese Medicines Prescribing Record|
|---|---|
|Appendix A-XXII|Observation and Lifestyle Record|
|Appendix A-XXIII|Chinese Medicines Dispensing Record|
|Appendix A-XXIV|Medical Certificate|
|Appendix A-XXV|Adverse Drug Reaction (Chinese Medicine System)|
|Appendix A-XXVI|Allergy (Chinese Medicine System)|



(Note: The details of above appendices are in separate documents.  Please refer to https://www.ehealth.gov.hk/en/healthcare-provider-and-professional/resources/information-standard s/information-standard-document.html) 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 31 / 42 

**eHR Content Standards Guidebook** 

## **Appendix B** 

## **Preparation at Healthcare Provider for Data Sharing with the Electronic Health System** 

## **1. Introduction** 

- 1.1. Sharing of health data to the Electronic Health System includes (i) viewing the healthcare recipient’s (HCR’s) sharable data in Electronic Health System (eHealth), (ii) contributing the HCR’s eHR through uploading the readily sharable health data in healthcare providers’ electronic medical / patient record (eMR / ePR) system to Electronic Health System, and (iii) downloading the HCR’s allergy / adverse drug reaction data from eHealth to eMR / ePR system. 

- 1.2. The healthcare provider (HCP) may share their patients’ record (with the patient’s consent) to the eHealth if the data is within the sharable scope, readily available and conforming to the standard requirements.  The HCP can contact the Commissioner for the Electronic Health Record or the eHR Project Management Office (eHR PMO) who will work with the HCP to prepare for data uploading/downloading.  The following highlights the preparatory works required for data sharing. 

## **2. Gap Analysis** 

- 2.1. The purpose of performing the gap analysis is to ensure the HCP accurately interprets the eHR standards, and the shared data will conform with the eHR standards, including the eHR content, codex, and recognised terminologies. 

- 2.2. The HCP will identify the data domain(s) that is/are ready for sharing data to the eHealth.  It would be easier for the healthcare provider to also demonstrate the local system or provide some screen shoots to the eHR PMO to facilitate their understanding of the HCP system. 

- 2.3. For the domain data to be shared to the eHealth, the HCP should : 

- 2.3.1. Review the eHR content dataset, including the codex, and recognized terminologies and various technical interface specifications. 

- 2.3.2. Check the definition of the proposed eHR content dataset (see Appendix A) and other requirements in the proposed eHR content dataset, e.g. datatype, validation, data requirement for 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 32 / 42 

**eHR Content Standards Guidebook** 

each standard compliance level, code tables, cardinality. 

- 2.3.3. Determine the data compliance level for each domain.  The HCP can indicate more than one data compliance level for individual domain. 

- 2.3.4. Estimate the resources required for support on enhancement to the local system, data mapping, training to staff on data mapping, and support on information technology, and ongoing maintenance of the updates / data mapping. 

- 2.3.5. Match the local data to the eHR content dataset and identify how to keep this by either incorporating the eHR standards in the local patient database, or keep a separate mapping table and refer to it upon uploading data to the eHealth. 

- 2.4. If the HCP indicates that she will share data at eHR data compliance level 3, the eHR Information Standards Office (eHR ISO) will work with the HCP and review the tables/recongised terminology being used.  If the HCP adopts the eHR Codex / recognised terminologies (“eHR adopted”) directly, which is always preferred, the HCP should consider the following steps : 

- 2.4.1. Identify the name and version of the recognised terminology table being used. 

- 2.4.2. Send the recognised terminology table being used at the HCP system to the eHR ISO to identify whether the table is the one being adopted by the eHR ISO.  (Various international standards organizations may update their terminology from time to time, the eHR ISO will adopt one that is most appropriate to the local environment.) 

- 2.4.3. Where the eHR ISO has identified any discrepancies with the “eHR adopted” tables, the eHR ISO will discuss with the HCP on the optimal way to send the data to the eHealth.  The HCP may consider to : 

- 2.4.3.1. Send the existing patient data which are not identical with the “eHR adopted” tables as level 2 data, and 

- 2.4.3.2. Review and revise the local table according to the “eHR adopted” ones so that the patient data captured in the future will meet the eHR data compliance level 3. 

- 2.4.4. If the HCP has been using local tables and wishes to send level 3 data to the eHealth, the HCP can consider mapping the local tables to the codex / recognised terminologies.  Where the HCP wishes to map the data to the recognised terminologies, it is recommended that the HCP to contact the eHR ISO before mapping is performed as mapping error would have huge impact to the 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 33 / 42 

**eHR Content Standards Guidebook** 

quality of patient data. 

- 2.4.4.1. For mapping to the Hong Kong Clinical Terminology Table, please also refer to Chapter Mapping of the Guide on Implementation and Maintenance of the Hong Kong Clinical Terminology Table. 

- 2.4.4.2. The mapping table, after reviewed by domain expert, will be loaded to the local system which should generate a file with the whole mapping data for the HCP to verify whether the generated file is the same as the pre-loading one. 

- 2.4.4.3. Enhancement to the local system would be required, such as storing and updating the mapping table.  The HCP also needs to identify how the mapped data would be sent to the eHealth, whether to store the mapped data in the patient database, or to perform mapping upon sending data to the eHealth. 

- 2.4.5. The defined eHR sharable scope accepts different standard compliance levels.  Through the gap analysis exercise, both the HCP and the eHR PMO are able to identify the business case scenario that is most appropriate to the respective HCP.  This serves as a reference for further preparatory work on data sharing. 

## **3. Technical Preparation** 

- 3.1. Once the data is ready, the HCP should prepare the data according to eHR message standard. Please refer to eHR Data Interoperability Standards (HCP or health IT vendors can contact HL7 Hong Kong for details).  The eHR PMO has developed a message formatter to facilitate the HCPs to share data to the eHealth.  Please contact eHR PMO for details. 

- 3.2. The eHR PMO will work with the HCP to perform Technical Interface Testing (TIT) at the eHealth testing environment. 

- 3.2.1. The major tasks of the interface testing involve checking the message format, data field length, data type, mandatory data item requirement, digital signature verification and virus scanning. Basic data quality checking including codex value and recognised terminology value validation will be based on the HCP claimed data compliance level. 

- 3.2.2. The TIT will also examine the end-to-end workflow handling by HCP starting from HCR enrollment / consent built notification to HCR withdrawal / consent revoked notification to HCP. Please also refer to the Guide on Management of Healthcare Recipient Data by Healthcare 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 34 / 42 

**eHR Content Standards Guidebook** 

Providers. 

- 3.2.3. The eHR PMO will work with HCPs to prepare test plan, test scenarios and test cases based on which data domains that HCPs will be shared 

## **4. Experience eHR Data Sharing** 

- 4.1. When the HCP can successfully share her patient data to the eHealth testing environment, the HCP to experience data sharing to the eHealth with her deidentified production data, e.g. viewing her patient data at the eHR, and receiving data monitoring reports from the eHealth. 

- 4.2. Business case testing (BCT) 

- 4.2.1. The aim of the BCT is to identify various scenarios under which the HCPs may send/download data to/from the eHealth for individual domains. 

- 4.2.2. Based on the gap analysis exercise, the eHR PMO will prepare cases so that the HCPs can prepare some data and send to the eHealth testing environment. 

- 4.3. 

   - Masked data testing (MDT) 

- 4.3.1. In MDT, the HCP will deidentify the production data and send to the eHealth testing environment. The eHR PMO will provide some dummy patient information for the HCP to match the production data to the dummy patient. 

- 4.3.2. Both the HCP and the eHR ISO team will check the masked data via eHR Viewer to identify any abnormalities, e.g. non-clinical data as diagnosis.  Since the eHR record will be accessed by various healthcare professionals, it is recommended the HCPs to rectify/modify those ‘non-clinical’ data so that it is easier for interpretation by other HCPs. 

- 4.3.3. When the masked patient data are uploaded, the eHealth will also check the data and identify whether these data will meet the data standards compliance level for individual domain as indicated by the HCP.  Exceptional reports will be generated for both the HCP and the eHR PMO to review to identify any improvement area. 

## **5. Preparation for Downloading Data from the eHealth** 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 35 / 42 

**eHR Content Standards Guidebook** 

- 5.1. The eHealth will also support download of the healthcare recipient’s major key changes, allergy and adverse drug reaction (ADR) data.  It is recommended that the HCPs to keep these downloadable data in a staging area, and only update the local system after verifying the data with the patient. 

- 5.2. The HCP may consider to : 

- 5.2.1. Review the message standard on data download of relevant domains 

- 5.2.2. Determine how and when to display the downloaded data at the local system 

- 5.2.2.1. For downloaded major key changes of the patient identity data, it is recommended that an alert should be provided at the HCP system to remind the staff to check the patient identity when the patient returns for admission / attendance taking, appointment booking, or update of demographic data. 

- 5.2.2.2. For downloaded allergy / ADR data, it is recommended that the HCP to display the downloaded data with the HCP’s own allergy / ADR data but clearly indicating the data is downloaded from the eHR, and require the healthcare professionals to verify the information before incorporating the data into the HCP’s own system. 

## **6. Conclusion** 

- 6.1. Since the preparation for data sharing to the eHealth will involve various tasks, it is recommended that the HCP to identify a coordinator who will be responsible to liaise with the eHR PMO on issues relating to data sharing to/from the system. 

- 6.2. Upon completion of TIT, BCT and MDT, the eHR PMO will prepare a report for the HCP to sign off. The eHR PMO will assess the testing result and recommend on sharing of the related HCP’s data to the eHealth. 

- 6.3. Data sharing will be affected by the healthcare recipient’s eHR registration status, e.g. registration suspension, registration withdrawal, in the eHealth or the consent status on consent to the HCP. For details, please refer to the guide on Management of Healthcare Recipient Data by Healthcare Providers.  It is recommended that the HCP to review various scenarios that may affect data download and discuss the workflow / system requirement when incorporating these downloadable data to their own system, and enhance the local system accordingly. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 36 / 42 

**eHR Content Standards Guidebook** 

## **Appendix C** 

## **Validation on Compliance to Standards on eHR Sharable Scope** 

## **1. Introduction** 

- 1.1. To support interoperability of the eHR data, and to facilitate healthcare professionals to review the eHR data, healthcare providers (HCPs) are required to comply with the standards (see Appendix A) and to indicate the data standards compliance level when uploading data to the Electronic Health System (eHealth) for individual domain. 

- 1.2. Based on the HCP’s indication on data standard compliance level for individual domain, the eHR Project Management Office (eHR PMO) will validate the data upon receiving the uploaded data from the HCP.  The eHealth will validate whether the uploaded data comply to : 

- 1.2.1. the eHR standards on sharable scope; and 

- 1.2.2. the codex / recognised terminologies if the HCP indicates she is sharing level 3 data to the eHealth. 

## **2. Validation on compliance to standards on eHR sharable scope** 

- 2.1. This validation is to ensure the uploaded data can meet the minimum requirement of the eHR standards (at the standards compliance level as indicated by the HCP for individual domain). 

- 2.2. The eHealth will validate whether the uploaded data comply with the standards of eHR sharable scope under the following areas : 

- 2.2.1. whether mandatory data are all present; and 

- 2.2.2. whether mandatory data under specified conditions as indicated in standards of individual domain; and 

- 2.2.3. other validation requirements as specified in standards of individual domain are met. 

- 2.3. If the HCP’s uploaded data meet all requirements of the eHR standards at the HCP’s declared data standard compliance level for a particular domain, the eHealth will store the data at the HCP’s declared compliance level. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 37 / 42 

**eHR Content Standards Guidebook** 

- 2.4. If the validation is failed at the HCP’s declared compliance level, eHealth will reassess the uploaded data with the requirements of the next lower compliance level. 

- 2.4.1. If all requirements of the next lower compliance level are met, the uploaded data will be stored as such. 

- 2.4.2. If the validation is failed at the next lower compliance level, eHealth will further assess the uploaded data and see whether the data will meet level 1 compliance requirement. 

- 2.4.3. The eHealth will reject the uploaded data if the data cannot meet level 1 data compliance. 

- 2.5. Please refer to table 1 for details. 

- 2.6. eHealth will send an exception report to the HCP via the eHR inbox if the uploaded data do not meet the requirement of eHR standards at the HCP’s declared compliance level.  It is recommended that the HCP to review the patient data / eMR system / data interface file, and identify the reason of non-compliance and follow up accordingly. 

**Table 1 : Validation of Data Compliance** 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 38 / 42 

**eHR Content Standards Guidebook** 

## **3. Validation on Level 3 Data Compliance** 

- 3.1. Under level 3 data standards compliance, the eHealth has defined the Codex and indicated the recognised terminologies (RT) to be used so that the system can recognize and reuse the uploaded data.  Where the HCP has indicated that she will share level 3 data, the eHealth will check the uploaded data with the Codex / RT. 

- 3.2. For some domains, HCP is required to upload data using recognised terminologies if she is sharing level 3 data, e.g. [Organism] under the ‘Microbiology (Culture & Sensitivity Test)’ domain. 

- 3.2.1. The HCP is required to : 

- 3.2.1.1. Upload the local code and local description that are being captured in the HCP’s local system, and 

- 3.2.1.2. Indicate the name of the RT which the HCP is using for sharing such data, and 

- 3.2.1.3. Upload the mapped / captured code and description of the respective term from the indicated RT. 

- 3.2.2. On receiving the uploaded data, the eHealth will check the following areas : 

- 3.2.2.1. Name of the RT is one of those listed in the Codex table for individual domain, and 

- 3.2.2.2. The uploaded RT code exists in the official RT table, and 

- 3.2.2.3. The nature / hierarchy of the valid code is under the declared eHR domain.  Please refer to the standards for individual domains.  For example, an uploaded patient record of “Term ID 8540 Aspiration pneumonia” (with HKCTT nature as “Diagnosis”) would be accepted for the ‘Problem’ domain in eHR, and 

- 3.2.2.4. The uploaded description matches with the official description of the RT code. 

- 3.3. For some domains, the eHR standards has defined code table for individual data item, e.g. [Radiology Modality] under the ‘Radiology’ domain. 

- 3.3.1. The HCP is required to upload the local description, together with the code and description of the data as defined in the eHR Codex if she is sharing level 3 data. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 39 / 42 

**eHR Content Standards Guidebook** 

- 3.3.2. If the HCP indicates that one is sharing level 3 data for such domain, the eHealth will check whether the uploaded data has included the code and description as defined in the eHR Codex. See Table 2 for details. 

**Table 2 : Validation for Level 3 Data** 

|**Type**|**Code exist in**<br>**official RT?**|**Nature /**<br>**Hierarchy**<br>**correct?**|**Code and Desc.**<br>**match with**<br>**official RT?**|**Data stored at**<br>**eHealth**|
|---|---|---|---|---|
|**Recognised**<br>**Terminologies**<br>**(RT)**|**Y**|**Y**|**Y**|**Level 3**|
||**Y**|**Y**|**N**|**Level 2**|
||**Y**|**N**|**--**|**Level 2**|
|**Codex**|**Y**|**--**|**Y**|**Level 3**|
||**Y**|**--**|**N**|**Level 2**|
||**N**|**--**|**--**|**Level 2**|



## **4. Follow up** 

- 4.1. If the uploaded data meet all validation criteria on Codex / RTs, the eHealth will store the data as level 3 data.  Otherwise, the data are considered as level 2 data, and the eHealth will send a report to the HCP via the eHR inbox for her follow up.  It is recommended that the HCP to take appropriate actions to follow up these issues, e.g. review her eMR system, mapping table, recongised terminology table, and the data interface file.  Where required, the HCP may discuss with the eHR PMO. 

## **5. Conclusion** 

- 5.1. The purpose of these validations is to safeguard the quality of the shared data to support efficient and quality of care.   It is recommended that the HCP to identify a person who can be an informatics or information technology colleague to receive such reports and to coordinate various parties to review the data and identify any issues with the local system. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 40 / 42 

**eHR Content Standards Guidebook** 

## **Appendix D** 

## **Sharing of Scanned Discharge Summary to Electronic Health System** 

- 1 To support effective communication, it is recommended the healthcare providers to send computer generated reports to the Electronic Health System (eHealth).  Healthcare providers who share hand-written medical records e.g. discharge summaries at eHR initial phase are advised to develop plan to migrate scanned discharge summaries to computer generated reports and send to eHealth.  The following discuss the principles of sharing a scanned discharge summary to the eHealth. 

- 2 Healthcare providers are responsible for the quality of data that shared to the eHealth.  Where the healthcare provider wishes to share a scanned discharge summary, the healthcare provider should observe: 

   - 2.1 The quality of the discharge summary 

      - 2.1.1 For content of the discharge summary, please refer to ‘eHR Content Standards Guidebook, section 8.4.1’. 

      - 2.1.2 The hand-written discharge summary is legible. 

      - 2.1.3 The discharge summary is dated and authenticated with the author’s signature and name, where appropriate. 

   - 2.2 The discharge summary has sufficient information to identify the patient by the healthcare provider 

      - 2.2.1 Each scanned discharge summary should contain patient identity information, including patient name and identity number.  The identity number is a unique number that can identify individual patient at the healthcare provider, for example, Hong Kong Identity card number, medical record number, hospital number. 

      - 2.2.2 It is recommended to use a patient label generated from the Patient Administration System for identifying the patient in the discharge summary as the information on the label is legible and would be more comprehensive. 

   - 2.3 The scanned discharge summary is in good quality such as, all writings are legible, the scanned record is clear and clarity and completeness of each scanned page. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 41 / 42 

**eHR Content Standards Guidebook** 

- 3 The following are the points to note when sharing a scanned discharge summary to eHealth : 

   - 3.1 HCPs should ensure the quality of the scanned discharge summary including: 

      - 3.1.1 All pages of the discharge summary are scanned, especially for the two-sided record.  Page number should be included if the document has multiple pages. 

      - 3.1.2 All pages are scanned in right order and direction. 

      - 3.1.3 All pages are clear to be read and do not contain any obstacle/folded page(s). 

      - 3.1.4 The scanned discharge summary is associated to the correct patient’s local electronic medical record system. 

   - 3.2 After scanning the discharge summary, HCPs should: 

      - 3.2.1 Check the scanned discharge summary is uploaded to the right patient’s eMR by comparing the identity information between the scanned document and the local eMR where the scanned discharge summary is located. 

      - 3.2.2 Verify the quality of the scanned discharge summary in local eMR.  It includes the scanned discharge summary uploaded to correct patient, correct page(s), clarity, completeness and integrity of each scanned page. 

      - 3.2.3 Rescan the discharge summary, if there is any problem identified. 

   - 3.3 Upon sharing the scanned discharge summary to the eHealth, the healthcare provider should observe the standards for data sharing. 

      - 3.3.1 The scanned discharge summary is uploaded to the appropriate eHR domain, i.e. “Clinical note/summary” domain. 

      - 3.3.2 HCPs should include the following data to indicate the PDF file in eHR viewer for easy reference: 

## 3.3.2.1The report title should be “Discharge summary” 

## 3.3.2.2The report date 

- 3.3.3 If HCPs discover any incorrect data was being uploaded in Electronic Health System, they are advised to contact eHR Office to follow up. 

Copyright ©  Oct 2025 – HKSAR Government 

Version 1.10 

Page 42 / 42 

