# Handoff: Backend Architecture Design

**Submitted by:** Backend Engineer  
**Date:** 2026-05-10  
**Spec:** `docs/specs/multitrack-backend-api.md`  
**ADR:** `docs/adr/001-dsp-locality.md`

---

## What was designed

Full backend contract for the collaborative multitrack engine. No server code written yet — this is the design phase. The frontend can stub against the shared types file immediately.

### Deliverables

**`src/shared/types.ts`** (280 lines, new file)  
Single source of truth for all TypeScript interfaces shared between frontend and backend:
- Primitive ID types (`UserId`, `SessionId`, `TrackId`, `ClipId`, `AssetId`, `PluginId`, `PluginChainId`)
- Entity models: `User`, `Collaborator`, `Session`, `TransportState`, `Track`, `Clip`, `AudioAsset`, `Plugin`, `PluginChain`, `CollaboratorPresence`, `TrackInputAssignment`
- REST envelope types: `ApiResponse<T>`, `ApiError`
- Auth types: `JwtPayload`, `AuthTokenResponse`
- All WebSocket message types: `WsMessage<T>`, `WsEventType` union (28 event types), and payload interfaces for every event
- All REST request body types: `CreateSessionBody`, `CreateTrackBody`, `UpdateTrackBody`, `CreateClipBody`, `UpdateClipBody`, `SplitClipBody`, `BounceClipBody`, `UpdatePluginParamsBody`, `UpdatePluginChainBody`, `AudioUploadInitBody`, `AudioUploadInitResponse`

**`docs/specs/multitrack-backend-api.md`** (this session)  
Full API contract covering:
- Stack decision and rationale
- 24-bit audio pipeline (capture → chunked upload → blob storage → playback)
- Plugin chain DSP mapping (Web Audio node per plugin type)
- All REST endpoints with request/response types
- WebSocket event catalog with payloads and directions
- Frontend stub specifications for `useTransport`, `WsContext`, `useAuth`
- Risk register with mitigations

**`docs/adr/001-dsp-locality.md`** (this session)  
Architecture Decision Record for browser-side DSP. Key call: Web Audio API for the prototype, with a documented future path to a native CLAP/VST3 sidecar via Electron/Tauri shared memory if needed.

### Design system updates (Frontend, same session)

The frontend engineer applied these changes to `src/App.tsx` based on the new data models:
- `Track` interface extended with `pan`, `lockedBy`, `audioInput` fields
- `PanKnob` component added to track strip
- `lockedBy` lock state variant in `TrackHeader` (disabled R button, collaborator-colored lock icon)
- `PluginSlot` / `PluginChainPanel` component (280px right panel, per-track and master bus)
- `CollabPresence` type + presence cursor overlays in the arranger (vertical line + avatar chip)
- Audio input badge on track header

---

## Files changed / created

| File | Status | Notes |
|------|--------|-------|
| `src/shared/types.ts` | Created | 472 lines — import from `../shared/types` |
| `docs/specs/multitrack-backend-api.md` | Created | Full API contract |
| `docs/adr/001-dsp-locality.md` | Created | DSP locality decision |
| `src/App.tsx` | Modified | Design system updates (pan, lock, plugin chain, presence) |

---

## Review checklist for Tech Lead

- [ ] `src/shared/types.ts` covers all entities the frontend currently seeds (`Track`, `Clip`, `Collaborator`, `Session`, `TransportState`)
- [ ] WebSocket event catalog is complete — no interaction in the arranger/mixer is unaddressed
- [ ] `lockedBy` mutex design is correct (server sets on arm, releases on WS disconnect)
- [ ] 24-bit audio pipeline is realistic for a WebSocket-based prototype
- [ ] DSP locality decision (ADR 001) is approved — or flag if sidecar path should start sooner
- [ ] Plugin param throttle strategy (16 ms at sender + server dedup) is sufficient
- [ ] Frontend stub specs (`useTransport`, `WsContext`, `useAuth`) are clear enough for FE to implement without a sync
- [ ] No REST endpoint is missing that blocks any current or Sprint 2 frontend feature

---

## What's next (pending Tech Lead approval)

1. **Frontend:** Implement `useTransport`, `WsContext`, `useAuth` stubs wired to seed data — unblocks any future real integration
2. **Backend:** Scaffold the Fastify server (`server/` directory), in-memory session store, and WS handler skeleton
3. **Backend:** Implement chunked audio upload endpoint (`/api/v1/assets/upload/...`) — needed before any real recording session
4. **PM decision needed:** "Add Plugin +" interaction spec (modal picker vs. inline dropdown) — flagged as blocked in `STATUS.md` defect #13
