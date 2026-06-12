# Test Case: Verify document type detection for MSA documents for all documents processing mode

**Module:** Discovery Agent - Document detection  
**Status:** New  
**Type:** Manual  
**Priority:** High  
**Category:** Regression Test  
**Attachments:** [None]  
**Id:** [None]  

## Description
This test describes the process to verify that discovery agent auto detects the Document type for uploaded MSA document when the processing mode is selected as "All Documents"

## Precondition
- **AppURL:** `https://rls-dev.congacloud.io/clm/`
- User: `adetroja@conga.com`
- Data extraction setup is configured for MSA database record type in Admin console > Discovery Agent > Admin Dashboard > Data Extraction Setup

## Test Steps

| Test Step # | Test Step Description | Test Step Expected Result |
| :--- | :--- | :--- |
| 1 | Log in to RLS CLM UI ( `https://rls-dev.congacloud.io/clm/` ) | Contract List View Screen Should Open |
| 2 | Click on Discovery Agent option from left menu | Discovery Agent welcome screen opens |
| 3 | Click on the project dashboard folder or access below link, `https://rls-dev.congacloud.io/cci/user/projects` | Project Dashboard screen appears |
| 4 | Select any folder, and click on Upload Files button on top-right corner of the screen | Import popup appears with options as My Computer CLM SharePoint |
| 5 | Select My computer > Next | Import Documents screen opens |
| 6 | Under Select Documents tab, make sure the option Auto Detect Document Type is checked as selected | Auto Detect Document Type is selected and dropdown value for Auto Initiate Processing Mode is selected as All Documents by default |
| 7 | In File section, make sure, Skip Duplicate Files switch is OFF. Browse file or drag and drop MSA type document | Document is selected and is seen in the Files section list, Import button to the bottom right corner get enabled. |
| 8 | Click on Import button | User returns back to the project dashboard folder and wait for the document to be uploaded |
| 9 | Once document upload is successful, observe the uploaded document in the list | Type column is Not Set at first |
| 10 | Wait for sometime and reload the page | Type column is set to MSA and is processed for extraction |
