# IntelliCare frontend

    npm install
    npm run dev

No sample data is included. Create accounts on the sign-in screen (patient, doctor, admin);
everything you enter is saved in the browser (localStorage) by `src/services/db.js`.

## Connecting to Spring Boot
- `src/services/db.js`: replace load/save with REST calls (axios or fetch).
- `src/context/AppContext.jsx`: each action (register, login, book, cancel, ...) maps to one endpoint.
- `src/services/assistant.js`: replace the keyword classifier with your LLM endpoint.
- `src/utils/queue.js` `riskFor`: replace with your no-show model's prediction.
- Real authentication: store the JWT from Spring Security and send it in an Authorization header.
