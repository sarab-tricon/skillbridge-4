# SkillBridge: Employee Module Documentation 📘

Welcome to the official technical guide for the **Employee Module** of SkillBridge. This document is designed to help you understand and present the system, even if you have no prior coding experience.

---

## SECTION 1: EMPLOYEE ROLE – BUSINESS VIEW
### Who is an Employee?
In SkillBridge, an **Employee** is a professional user whose primary goal is to showcase their expertise and find project opportunities. 

### Why SkillBridge?
In many companies, managers don't know exactly what their staff can do "under the hood." SkillBridge solves this by giving employees a digital platform to:
1. Declare their skills.
2. Track the "trust score" (approval status) of those skills.
3. Request to join specific projects.

### What an Employee CAN do:
*   Log in and see their personal work status.
*   Browse the company’s "Skill Catalog."
*   Add new skills to their profile.
*   Request to be allocated to an active project.

### What an Employee CANNOT do:
*   Approve their own skills (requires a Manager).
*   Create new projects (requires HR).
*   See other employees' utilization data.

---

## SECTION 2: EMPLOYEE UI – WHAT IS VISIBLE
The user interface (UI) is what the employee interacts with.

1.  **Login Page**: A clean portal where you enter your email and password. Internally, this is where "Authentication" happens.
2.  **Employee Dashboard**: Your home base. It shows a greeting like "Welcome back, [Your Name] [reports to: Manager Name]" and a summary of your skills and current project status.
3.  **Sidebar Menu**: A vertical menu on the left (Dashboard, My Skills, Allocation, Utilization).
4.  **Add Skill Section**: A form where you pick a skill from a dropdown and select your proficiency (Beginner, Intermediate, etc.).
5.  **My Skills List**: A table showing every skill you've added and its current status (**PENDING**, **APPROVED**, or **REJECTED**).
6.  **Allocation Panel**: Shows if you are "Allocated" to a project or "On Bench." If on bench, it lists available projects you can join.

---

## SECTION 3: REACT FRONTEND – HOW UI IS BUILT
### What is React? (The Analogy)
Think of React as a **LEGO set**. 
*   **Component**: A single LEGO brick (e.g., a button, a header).
*   **JSX**: The instructions for that brick (looks like HTML).
*   **State**: The "current memory" of a component (e.g., "Is this menu open? Yes").
*   **Props**: Settings passed from a big brick to a small brick.

### Key Files in Focus:
*   `src/App.jsx`: The "Master Instructions" that control which page shows up.
*   `src/pages/EmployeeDashboard.jsx`: The main logic for the Employee side. It handles switching between "My Skills" and "Allocation."
*   `src/context/AuthContext.jsx`: A special "Shared Memory" that remembers if you are logged in.
*   `src/api/axios.js`: The "Messenger" that takes data from the UI and delivers it to the backend server.

---

## SECTION 4: LOGIN FLOW – END TO END
1.  **Entry**: You type your email/password and click "Login."
2.  **Request**: React uses **Axios** (the messenger) to send this data to the URL `/api/auth/login`.
3.  **Validation**: The Backend checks if the password matches the database record.
4.  **The JWT Token**: If valid, the backend generates a **JWT (JSON Web Token)**.
    *   *Analogy*: A JWT is like a **VIP Wristband**. Once you have it, you can enter any "Employee-only" area without showing your ID again.
5.  **Storage**: The browser saves this token in `localStorage` (a small digital drawer in your browser).
6.  **Reuse**: For every click after that, the messenger automatically attaches that "wristband" to the request header.

---

## SECTION 5: BACKEND OVERVIEW (SPRING BOOT)
### Why the Backend exists?
The UI is just a "face." The Backend (Spring Boot) is the **"brain."** It stores the data, enforces rules, and talks to the **Database**.

*   **REST API**: A standard way for the Face (React) to talk to the Brain (Spring Boot).
*   **JSON**: The language they speak. It’s just simple text structured like a list of names and values.

---

## SECTION 6: BACKEND FILE STRUCTURE
We organize the code into "layers" for cleanliness:

1.  **Controller**: The "Receptionist." It takes the request and passes it to the right department.
2.  **Service**: The "Department Head." It makes decisions (e.g., "Is this skill name valid?").
3.  **Repository**: The "File Clerk." It knows how to find or save things in the Database.
4.  **Entity**: The "Blueprint." Describes how a record (like a "Skill") looks in the database.
5.  **DTO (Data Transfer Object)**: The "Envelope." Used to send only specific info to the UI (hiding sensitive data).

---

## SECTION 7: EMPLOYEE APIs – CONTROLLER LAYER
Controllers use "Annotations" (labels starting with @) to tell Spring Boot what to do:
*   `@RestController`: Tells Spring "this class handles web requests."
*   `@RequestMapping("/api")`: Every URL starts with `/api`.

### The Employee Endpoints:
*   `POST /api/auth/login`: Let me in!
*   `GET /api/users/me`: Who am I? (Gets profile and manager name).
*   `GET /api/skills/my`: Show me all my skills.
*   `POST /api/skills`: I just learned a new skill! Add it.
*   `POST /api/allocation-requests`: I want to join this project!

---

## SECTION 8: SERVICE LAYER – BUSINESS LOGIC
The **Service** layer is where the rules are enforced.
*   When you add a skill, the **SkillService** automatically sets the status to `PENDING`.
*   It checks if you already added that skill (validation).
*   It ensures you are an `EMPLOYEE` before letting you save it.

---

## SECTION 9: ENTITY & DATABASE
The data is stored in **PostgreSQL** (a powerful table-based database).
*   `User` Table: Stores email, name, role (EMPLOYEE), and who their `manager_id` is.
*   `Skill` Table: Stores the skill names like "Java" or "React."
*   `AllocationRequest` Table: Stores the requests you send to your manager.

**Annotations used:**
*   `@Entity`: "This class is a database table."
*   `@Id`: "This is the unique ID number for the record."

---

## SECTION 10: DTOs – PROTECTIVE ENVELOPES
We never send the "raw database record" to the UI because it might contain passwords or internal IDs. We use a **DTO**.
*   *Example*: The database has a `User` entity with a `passwordHash`. We send a `UserProfileResponse` DTO which contains only `firstName`, `email`, and `managerName`.

---

## SECTION 11: SECURITY – ACCESS CONTROL
We use **Spring Security** to keep the app safe.
1.  **Authentication**: "Are you who you say you are?" (Check the VIP Wristband/JWT).
2.  **Authorization**: "Are you allowed to be here?" 
    *   If you're an EMPLOYEE, you can access `/api/skills/my`.
    *   If you try to access `/api/users/team` (Manager Only), you get a **403 Forbidden** error.

**Annotations:**
*   `@PreAuthorize("hasAuthority('ROLE_EMPLOYEE')")`: A guard at the door that only let's Employees through.

---

## SECTION 12: FULL DATA FLOW (ADD SKILL STORY)
1.  **UI**: You pick "Python" and click "Add."
2.  **React**: The `handleAddSkill` function triggers. It bundles "Python" into a JSON object.
3.  **Messenger**: Axios attaches your VIP JWT token and sends the JSON to `POST /api/skills`.
4.  **Receptionist**: The `SkillController` receives the JSON.
5.  **Department Head**: `SkillService` verifies you don't already have Python. It sets status to `PENDING`.
6.  **File Clerk**: `SkillRepository` saves the request to the database.
7.  **Response**: Backend sends a "Success" message.
8.  **UI Update**: React sees the success, clears the form, and refreshes the skill table to show "Python (Pending)."

---

## SECTION 13: LOGOUT FLOW
In modern apps, "Logging Out" is simple:
1.  The UI removes the VIP Wristband (JWT) from `localStorage`.
2.  React redirects you to the `/login` page.
3.  Because the token is gone, the backend will reject any further requests because you no longer have your "Wristband."

---

## SECTION 14: CHEAT SHEET OF ANNOTATIONS
*   `@RestController`: The API entry point.
*   `@Service`: Where the brain power/logic is.
*   `@Repository`: The database connection manager.
*   `@Entity`: A database table definition.
*   `@Transactional`: Ensures that if an error happens midway, everything cancels (so no partial data is saved).

---

## SECTION 15: PRESENTATION TIPS
### The 2-Minute Pitch:
"SkillBridge is a talent management platform. The Employee Module allows our staff to take ownership of their professional growth. They can log in, declare skills, and request project allocations. Internally, we use a React frontend that communicates securely via JWT tokens to a Spring Boot backend, ensuring all data remains valid and protected by role-based security."

### Key Keywords:
*   **Full-Stack**: Frontend (React) + Backend (Java).
*   **JWT**: Standard for secure login tokens.
*   **REST API**: The bridge between UI and Server.
*   **Role-Based Access (RBAC)**: Ensuring Employees only see what they should.

---
**SkillBridge 2025** | *Empowering Talent through Technology.*
