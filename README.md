# UNSENT website prototype

A responsive single-page website prototype for UNSENT, an anonymous-letter brand.

## Run locally
Open `index.html` in a modern browser. No build tools are required.

## Included
- Responsive burgundy/ivory editorial landing page
- How-it-works, delivery pricing, FAQ and policy placeholder sections
- Letter builder with write/upload modes
- PDF, DOC, DOCX and TXT file selection and 10 MB validation
- Online (25 lei) and physical (50 lei) delivery selection
- Conditional recipient fields, review panel and order total calculation
- Mobile navigation and accessible form labels

## Important before launch
This is a front-end prototype, not a live ordering service. It does not upload or persist files, send letters, create orders, or process payments. The displayed shipping value is a configurable placeholder and must not be treated as a free-shipping promise.

Production work still required:
1. Add a server-side order API and database.
2. Implement private file storage, access controls, malware scanning, retention and deletion.
3. Configure a real payment provider and verify payments server-side.
4. Integrate email delivery and a physical fulfilment workflow.
5. Configure actual shipping rates and service areas.
6. Replace legal policy placeholders and contact/social placeholders with verified business details.
7. Add automated tests, production build checks, and deployment configuration.

Images are referenced from Unsplash URLs and require an internet connection. Review image licenses and replace images if needed before commercial launch.
