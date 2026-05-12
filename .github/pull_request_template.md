# Pull Request

**Closes:** #<!-- issue number -->  
**Agent:** <!-- Frontend / Backend / Designer / Tech Lead -->  
**Milestone:** <!-- Sprint 1 / Sprint 2 -->

---

## What changed

<!-- 1–3 bullets describing what was built or fixed -->

## Why

<!-- Link to the spec or work order that drove this -->

## Files changed

<!-- Key files touched and why -->

## Definition of done checklist

- [ ] `tsc --noEmit` passes locally
- [ ] CI typecheck passes
- [ ] UAT agent has validated acceptance criteria (or N/A for non-UI changes)
- [ ] No hardcoded hex values — all colors use `C.*` tokens or collaborator color via inline `style`
- [ ] Collaborator color tinting honored on any new surface
- [ ] Handoff dropped to `docs/handoffs/` if this closes a design or FE work order
- [ ] `STATUS.md` updated
- [ ] Commit includes `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

## Notes for Tech Lead reviewer

<!-- Anything that needs special attention: perf risk, architectural change, open trade-off -->
