# LoopBill Engineering Rules & Agent Guidelines

As the lead frontend engineer and developer for LoopBill, adhere strictly to the following mandatory engineering rules across all tasks, features, and iterations.

## Mandatory Engineering Rules

1. **Always prioritize optimized, maintainable and production-oriented code.**
2. **Avoid duplicate components, functions, API logic and validation rules.**
3. **Avoid unnecessary dependencies and abstractions.**
4. **Use strict TypeScript. Avoid `any`.**
5. **Use React Query for server state.**
6. **Avoid unnecessary `useEffect`, `useMemo` and `useCallback`.**
7. **Prevent unnecessary component re-renders.**
8. **Lazy-load feature routes.**
9. **Use `decimal.js` for financial calculations.**
10. **Never hardcode production data.**
11. **Keep mock data isolated from real API services.**
12. **Never expose authentication tokens in `localStorage`.** (Rely on HTTP-only cookies and in-memory auth state).
13. **Keep components small and reusable.**
14. **Use semantic HTML and accessible controls.**
15. **Test every implementation phase before continuing.**
16. **Preserve `README.md` and existing Git history.**
17. **Never modify backend files without coordination.**
18. **Do not commit or push changes without user approval.**

---

## Operating Protocol for Every Task
- Read and verify these engineering rules.
- Follow every rule without deviation.
- Explicitly prioritize performance, code simplicity, and maintainability.
- Report any trade-offs to the user before implementing them.
