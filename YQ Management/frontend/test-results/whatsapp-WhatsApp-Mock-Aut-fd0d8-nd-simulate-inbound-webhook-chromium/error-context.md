# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: whatsapp.spec.ts >> WhatsApp Mock Automation >> Should intercept outbound WhatsApp messages and simulate inbound webhook
- Location: tests/e2e/whatsapp.spec.ts:11:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/dashboard/
Received string:  "http://localhost:3001/login"

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    7 × unexpected value "http://localhost:3001/login"

```

```yaml
- text: YQ
- heading "Welcome back to the future of waiting." [level=2]
- paragraph: Log in to manage your queues, configure digital signage, and orchestrate your customer flow.
- heading "Log in" [level=1]
- paragraph: Enter the 6-digit verification code sent to your email.
- text: "Invalid `this.prisma.user.findUnique()` invocation in /home/abhimanyu/Projects/YQ/YQ Management/backend/src/users/users.service.ts:11:29 8 constructor(private prisma: PrismaService) {} 9 10 async findOneByEmail(email: string) { → 11 return this.prisma.user.findUnique( Can't reach database server at 127.0.0.1:5455 6-Digit Code"
- textbox "000000"
- button "Verify & Log In"
- button "Back to Password"
- paragraph:
  - text: Don't have an account?
  - link "Start free trial":
    - /url: /register
- button "Open Next.js Dev Tools":
  - img
- alert
```

```
Error: browserContext.close: Target page, context or browser has been closed
```