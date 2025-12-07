## 📘 `CODING_GUIDELINES.md`

These guidelines are the **mandatory rules** enforced by the Gemini AI Review Bot and represent the minimum standard for all pull requests. The AI model is specifically instructed to use these rules to generate structured, actionable feedback.

### 1. General Principles

* **Readability Over Cleverness:** Code must be **clear and easily understood** by a new team member. Avoid overly complex single-line operations.
* **Immutability:** Wherever possible, variables and data structures must be **immutable** (e.g., use `const` over `let` in JavaScript/TypeScript). Avoid direct modification of function arguments or global state.
* **DRY (Don't Repeat Yourself):** Duplicate code blocks (more than 3 lines) **must be extracted** into utility functions or shared components.

---

### 2. Naming Conventions (Mandatory Checks)

The AI Bot will check for strict adherence to these naming patterns:

| Element | Rule | Example |
| :--- | :--- | :--- |
| **Variables/Functions** | `camelCase`. Must be descriptive and pronounceable. | `getProductName`, `isUserLoggedIn` |
| **Classes/Types/Interfaces** | `PascalCase`. Must begin with a capital letter. | `ProductService`, `UserInterface` |
| **Constants** | `SCREAMING_SNAKE_CASE`. Use only for globally fixed values. | `MAX_RETRIES = 5`, `API_TIMEOUT` |
| **Boolean Prefixes** | Booleans must be prefixed with `is`, `has`, or `can`. | `isEnabled`, `hasPermissions` |

---

### 3. TypeScript/JavaScript Specific Rules

* **Type Safety:** All public functions, class methods, and component props must have **explicit return types and argument types**. Avoid implicit `any` usage.
* **Destructuring:** Prefer **object destructuring** for reading properties from objects (`const { id, name } = user;`) instead of chained property access (`const name = user.name;`).
* **Async/Await:** All asynchronous operations **must use the `async/await`** syntax. Direct use of raw `.then().catch()` chains on Promises is forbidden.
* **Error Handling:** Every `async` function that can throw an error **must be wrapped in a `try...catch` block**, or the error must be explicitly handled by propagating the rejection.

---

### 4. Security & Performance (Critical Checks)

The AI Bot will flag any code that violates these critical rules and will suggest remediation:

* **Credential Handling:** Never hardcode **sensitive credentials** (API keys, secrets, access tokens) directly in the code. They must be loaded from **environment variables** or a secure vault.
* **SQL Injection:** Do not concatenate user-supplied input directly into database queries. All queries **must use parameterized statements** (prepared statements).
* **Logging Secrets:** Do not log environment variables, entire request bodies, or error stack traces to standard output (stdout) in production code.
* **Large Loops:** Avoid nested loops (`for` inside `for`) that result in a time complexity of $O(n^2)$ or greater when processing large arrays (over 1,000 items). Suggest optimizations like **hash maps or array methods**. 

---

### 5. Formatting & Style

* **Line Length:** Lines **must not exceed 100 characters** (excluding comments).
* **Indentation:** Use **2 spaces** for indentation. Tabs are forbidden.
* **Semicolons:** Semicolons are **mandatory** at the end of every executable statement.
* **Quotes:** Use **single quotes** (`'`) for all string literals, unless the string itself contains a single quote (to avoid escaping).
* **Trailing Commas:** Trailing commas are **mandatory** in multi-line arrays, objects, and function argument lists.