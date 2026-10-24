## 2026-10-24 — Restore complete search result rendering

- Confirmed the matcher already returned substring matches. The panel was slicing ranked results to the first 80 before building the search tree; valid lower-ranked hits were only exposed after clicking “Show more”.
- Removed that search-only global cap and pagination control. Every match for the current query and active tab now reaches the existing tree and is rendered together. Matching/ranking logic, tabs, category hierarchy, parent-folder highlighting, browse-mode paging, discovery, and application are unchanged.
- Added tests for beginning/middle/end substring matches, `shake` names and tags, full result-tree/render counts, all tabs, and the lack of a global search cap. **All 11 automated test files passed** on Node 24.22.1.
- In the 3,790-item simulated panel profile, `glow` rendered 307/307 matches, `sh` 539/539, and `shake` 537/537. Median simulated input handlers were 20.4 ms, 21.4 ms, and 19.6 ms respectively. This is not live After Effects verification.
- Workspace changed: `index.html`, four search/panel test files, `HANDOVER.md`, and `CHANGELOG.md`. Pre-edit workspace snapshots are at `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-complete-search-results-2026-10-24`. Backed up the previous canonical installed `index.html` to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-complete-search-results-install-2026-10-24\installed-com.aeuniversalsearch.minimal\index.html`, then installed only the new `index.html`. Workspace and installed SHA-256 match: `2FF43DC54DD68EDE87E27FA1B385B4C9A9D7C66CDDDDC25A4332ACB36357D1DB`. The only changed canonical file was `index.html`; the unchanged `resultTree.js` matches at `6085D514D7093F94291F37A5735C8127554556020D436D24CD228CD71219ADF2`. The stale duplicate remained unchanged. Live After Effects verification remains pending.

## 2026-10-24 — Search-result parent-folder highlighting

- Search results now identify parent folders from each matched item's actual category/path ancestry, not by comparing folder text with the query. Preset and plug-in paths highlight the first actual folder below their scan-root group; host-listed effects highlight their host category when one is provided.
- Added a subtle violet background and left accent to only the qualifying folder row. Multiple matching parent folders highlight independently; repeated matches under one parent produce one marked node. Browse mode remains unhighlighted, and existing rendering refreshes clear stale search state.
- Added coverage for the five requested nested preset examples, multiple and duplicate-labeled parents, query text in an unrelated folder name, browse-mode clearing, effect category highlighting, and panel state cleanup.
- **All 11 automated test files passed** on Node 24.22.1, including simulated panel/tree tests and the 3,790-item search profile. No After Effects in-app visual verification was performed.
- Workspace files changed: `index.html`, `client/search/resultTree.js`, `tests/resultTree.test.js`, `tests/panelBehavior.test.js`, `HANDOVER.md`, and `CHANGELOG.md`. Backups are in `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-parent-folder-highlighting-2026-10-24`. The canonical installed extension was not modified.

## 2026-10-24 — Main section order and startup state

- Fixed the main section order to Presets, Plug-in Files, Host Effects in browse and search views. Per-item ranking and ordering within each section remain unchanged.
- Top-level `<details>` sections now start closed in browse mode. Search continues to open the sections and nested groups containing matches. Inspection found no persisted expansion-state setting; no user data or settings were removed.
- Added automated assertions for visible section order, collapsed initial state, expand/collapse property behavior, and fixed section order in search even when another group has a stronger match. **All 11 test files passed** on Node 24.22.1; no live After Effects verification was performed.
- Backed up canonical installed `index.html` and `client\search\resultTree.js` to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-section-order-install-2026-10-24\installed-com.aeuniversalsearch.minimal`, then installed only those two files. Workspace and installed SHA-256 match: `index.html` `B02A6207F719B61A69545F69E757724C63B640C142DDE8D785C2F458A976CDDC`; `resultTree.js` `2BB73B3845F3B3474305B42ED37C9FE3FAD05B432D6EB81716825E3728AB901F`. The stale duplicate and all unrelated installed files were left untouched.
- Live After Effects verification is still pending.

## 2026-10-23 — Removed editable preset aliases

- Removed the preset-row Alias button, alias-edit prompt, alias-specific footer messages, and the controller's custom alias lookup/injection during catalogue rebuilds. Presets display and search by their scanned filename-derived name; application continues to use the original path.
- Removed `readAliases`/`setAlias` and the alias storage key from the local discovery module. Existing `aeus.presetDisplayAliases.v1` localStorage values were not read, modified, or deleted; folder settings continue using their separate key.
- Left `client/search/searchEngine.js` and its general alternate-term/tag ranking unchanged. Its `aliases` field represents search terms supplied to catalogue items (synonyms); it is not the removed user editing feature. Existing exact/name/multiword, synonym/alternate-term, tag, metadata, and ordering tests remain.
- Updated panel, local discovery, host scan, and UI syntax tests for absence of the editable feature, search by the real preset name, unchanged preset path, and preservation of legacy storage. All 11 automated tests passed. No in-app After Effects test was performed.
- Before installation, backed up canonical installed `index.html` and `client\search\localDiscovery.js` to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-alias-removal-install-2026-10-23\installed-com.aeuniversalsearch.minimal`. Installed only those two runtime files to canonical `%APPDATA%\Adobe\CEP\extensions\com.aeuniversalsearch.minimal`. Both workspace/installed hashes match: `index.html` `01C161F16A2C894A8111586F633CA0D00E878E9C8CD75FEECE8D6B1CA7B7F675`; `localDiscovery.js` `CF0722A223B8F923CE3115A58B6FA3F0989F918F361A73453B77B4D138EEB253`. The stale duplicate, manifest, preferences, and unrelated files were not changed.
- Reloading Searchy and visual/in-app confirmation remain for the user; no After Effects UI test was performed.

## 2026-10-23 — Simplified normal status display

- Hid the technical effect-discovery and raw local/host status lines from the normal panel. The discovered effect count and After Effects version remain available in the result-count tooltip.
- Added a concise footer status for refresh/scan activity, effect and preset Apply success/failure, and drop/application preflight feedback. Raw host responses remain attached as status detail; drag diagnostics remain in the existing hidden diagnostic elements and persistent `%TEMP%\Searchy-drag-diagnostics.jsonl` log.
- Left drag source/target handlers, payload format, validation, application route, and duplicate guard unchanged. The user has reported that in-panel drag-and-drop works; this change did not retest it live.
- Extended panel/UI tests for hidden technical text, tooltip metadata, concise Apply/drop status, actual failure details, and retained drag logs. All 11 existing automated test files passed. Tests run in a simulated CEP/host harness do not verify the visible UI inside After Effects.
- Backed up the pre-change canonical build (SHA-256 `F0DDE4868FD0BBB70D2FF23A7ADD4EA6696E1527823F4E75B45CEB1AAE15C744`) to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-status-cleanup-install-2026-10-23\installed-com.aeuniversalsearch.minimal\index.html`, then installed only `index.html` to canonical `%APPDATA%\Adobe\CEP\extensions\com.aeuniversalsearch.minimal`. Installed and workspace SHA-256 match: `6E00211836F457D2BC1F636B5AD3D250EBAD7A8251DA01966B1082AF303E6EF7`. Stale duplicate and unrelated files were not changed.
- Live visual verification inside After Effects is still pending; ask the user to reload Searchy and check the footer/status display.

## 2026-10-23 — Approved-reference panel UI

- Restyled the existing Searchy panel with a compact charcoal/violet theme, gear menu, search icon and clear action, All/Effects/Plugins/Presets filters, compact result metadata/type badges, and a scrollable result area with status/count footer.
- Tabs filter the existing catalogue and ranked search output by real catalogue item type. Per-type browse trees are cached on catalogue rebuild. Existing result ranking, aliases, category/folder hierarchy, paths, Apply/double-click, host bridge, and folder controls are preserved.
- Moved the existing Add Folder, Rescan Files, Refresh Effects, and custom-folder controls into the gear popover without replacing their handlers. Added outside-click and Escape dismissal and keyboard tab navigation.
- Updated panel behavior and UI syntax checks. The panel harness exercised the existing Add Folder, Rescan Files, and Refresh Effects actions through the gear menu and confirmed they did not apply items. All 11 automated test files passed in the rerun after installation; this does not constitute visual verification in After Effects.
- Backed up every edited workspace file at `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-ui-redesign-2026-10-22`. The continuation confirmed `com.aeuniversalsearch.minimal` as canonical and the `AE-CEP-Minimal` folder as stale. Backed up the canonical installed `index.html` to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-ui-install-2026-10-23\installed-com.aeuniversalsearch.minimal\index.html`, then installed only the workspace `index.html`. Workspace and installed SHA-256 match: `F0DDE4868FD0BBB70D2FF23A7ADD4EA6696E1527823F4E75B45CEB1AAE15C744`. The stale duplicate, manifest, registry, preferences, and unrelated extension files were left unchanged.
- Visual verification inside After Effects remains pending. The user should reload Searchy and inspect normal and narrow docked widths, tabs, long names, selected state, folder hierarchy, and gear menu actions.
- Drag-and-drop remains unfinished and unverified. No drag behavior or payload code was changed.

## 2026-10-22 — Panel-wide in-panel drag handling

- Replaced the compact hint row as the sole drop receiver with a document capture handler so eligible Searchy effect/preset payloads can be dropped anywhere inside the extension panel. Only the existing `application/x-aeus-result` type is accepted; unrelated MIME types pass through, and malformed or stale payloads are rejected before host application.
- Reused the existing item lookup, composition/selection checks, `applicationPending` duplicate guard, and effect/preset bridge. The accepted drop event is marked before processing to prevent duplicate application. Kept the compact status strip as panel-wide guidance. `host.jsx`, search behavior, Apply, and double-click logic were not changed.
- Added coverage for panel-wide effect and preset drops, accepted dragover, unrelated and malformed payloads, duplicate event delivery, and pending Apply. All 11 automated test files passed on Node 24. Simulated tests do not prove CEP or After Effects drag success.
- Backed up all edited workspace files and the old canonical installed `index.html` to `%SEARCHY_ROOT%/AE-CEP-Minimal-backup-before-panel-wide-drop-2026-10-22`. Installed only the new `index.html` to the canonical per-user extension. Workspace and installed SHA-256 both equal `AF075F18A42DEC7D08947905196D50E5ED316820152A22A2B9BC1B2A0631CDEB`.
- Live test still required: drop a built-in effect and a local preset on panel areas outside the hint strip, then verify visible changes on selected layers in After Effects. Do not claim completion before those live results are confirmed.

## 2026-10-22 — Coordinate-aware drag event diagnostics

- Added temporary passive document-capture logging for `dragenter`, `dragover`, `dragleave`, and `drop` while a Searchy drag trace is active. Each capture stores client coordinates, event target/current target, a short composed path, `elementFromPoint`, the live drop-target bounds and inside/outside result, transfer MIME types, and the pre-handler `defaultPrevented` value. Deferred records capture `defaultPrevented` after handlers run.
- Repeated `dragover` details are grouped into 120 ms JSONL batches. Every observed event record is retained inside the batch; this avoids rewriting the persistent log for each over event. Logging does not cancel or stop events, change the payload, or call the host application bridge.
- Backed up the workspace files and previous installed `index.html` to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-coordinate-drag-diagnostics-2026-10-22`.
- Updated only the canonical installed `index.html` at `%APPDATA%\Adobe\CEP\extensions\com.aeuniversalsearch.minimal`. Workspace and installed SHA-256 both equal `22DF4069EAAF20ADC1E64B5AC78C9942336D20E051546DCABD5048A76D905401`.
- All 11 automated test files passed, including the updated simulated panel test for event logging, hit testing, coordinates, final cancellation state, and passive behavior. No live After Effects drag test was performed; drag-and-drop remains unverified and no fix is claimed.
- **Manual test:** Refresh/reopen Searchy. In a disposable comp with a selected layer, drag one built-in effect onto Searchy's drop target, inspect the effect/result, and Undo. Repeat with one preset. Retrieve `%TEMP%\Searchy-drag-diagnostics.jsonl` and share it. Test the Searchy-owned target only; direct drops onto AE layers are a separate unsupported/unverified route.

## 2026-10-22 — Drag payload contract audit

- Compared `dragstart`, `dragTransferTypes()`, `hasSearchyDragPayload()`, target handlers, and `applyDroppedItem()` in the workspace and hash-matching installed `index.html`. Source and target use the same `application/x-aeus-result` MIME type; the target reads and parses that same value. No payload mismatch or host-bridge defect was found.
- The existing persistent log contains 23 actual drag-start records with the expected MIME type, 16 ending outside Searchy, and 7 entering Searchy without a drop. Panel-level events landed on other elements; no target event, decode, selection check, or host request is present. This localizes those failures before the drop target but does not establish why it was missed. The 342 × 23 px target measurements are user-reported; no overlap/stacking or `defaultPrevented` live measurement was available here.
- `node tests/panelBehavior.test.js` passed. This is a simulated CEP DOM/host check and not proof of real drag delivery. No source changes, installs, or settings changes were made; no drag success is claimed. Additional inspection was blocked because Opera GX is not available to this session's UI controls.
- Backed up both docs to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-drag-payload-audit-2026-10-22`. See the handover for the next coordinate-to-target diagnostic step.
## 2026-10-22 — Opera GX inspector access check

- The CEP remote-debug endpoint at `localhost:8088` lists the running Searchy page target in `/json`. This verifies target availability, not that Opera's DevTools inspector is connected.
- This session's computer-use inventory has no Opera GX browser/tab, so the Elements and Console inspector could not be accessed. No DOM/event inspection or real drag test was performed. No code, registry, preferences, or unrelated files changed; no tests were run.
- Stop until Opera GX is available to the session. The handover records the endpoint evidence and the exact boundary of what remains unverified.
- Documentation backup: `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-opera-inspector-note-2026-10-22`.

## 2026-10-21 — CEP remote debugging investigation

- Read the current handover, changelog, and `%TEMP%\Searchy-drag-diagnostics.jsonl` before documenting. Traces 12–14 record panel-level `dragenter`/`dragover` over `DETAILS`, `SUMMARY`, or `BUTTON`, followed by no drop; no target event, payload decode, selection check, or host request is recorded. This localizes the failure before the bridge but does not prove why the target was missed.
- Verified installed CEP engine file version 12.0.1 and CEP runtime 12.0 in the manifest. Adobe's CEP 12 documentation identifies Chromium 99. No `.debug` file or listening remote-debug port was present in either installed Searchy folder. Chrome is absent from checked standard paths; Edge 155 is installed but Adobe documents Chrome, so Edge's use as the DevTools frontend remains unverified.
- Chrome DevTools via CEP's extension-scoped `.debug` file is the recommended next diagnostic tool; it can inspect live target geometry, listeners, event targets, cancellation, and payload types. No software, registry key, After Effects preference, installed file, or runtime code was changed. Creating `.debug` is pending user approval because it changes the installed extension directory.
- Backed up both docs to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-cep-devtools-diagnostics-2026-10-21`. See `HANDOVER.md` for exact setup, the `.debug` example, limitations, and separate built-in-effect/preset test plan.
- No automated tests were run: this was a documentation-only, read-only investigation. No drag success is claimed. Double-click and Apply remain working fallbacks; direct drops to AE layers are still separate and unverified.

# Changelog

## 2026-10-24 — Public-source preparation

- Generalized personal and machine-specific paths, local preset names/folders, and disposable-project references in the handover and changelog. Technical history and manual-versus-automated verification distinctions are retained; link targets were preserved.
- Added the approved root .gitignore for installed backups, local diagnostics/temp files, generated outputs, CEP debug files, OS metadata, local environment files, and private signing material.
- No source, test, backup, or installed extension files were changed. Git remains uninitialized. No license file is present; a license decision is needed before public release.

## 2026-10-22 — Panel-wide in-panel drag handling

- Replaced the compact hint row as the sole drop receiver with a document-level handler so eligible Searchy effect/preset payloads can be dropped anywhere inside the extension panel. Only the existing `application/x-aeus-result` payload is accepted; unsupported MIME types pass through, and malformed or stale payloads are rejected before host application.
- Reused the existing decoded-item lookup, composition/selection checks, pending-Apply duplicate guard, and effect/preset bridge. The accepted drop event is marked before processing to prevent duplicate application. Kept the small status strip as panel-wide guidance. `host.jsx`, search behavior, Apply, and double-click logic were not changed.
- Added coverage for panel-wide effect and preset drops, accepted dragover, unrelated and malformed payloads, duplicate event delivery, and pending Apply. All 11 automated test files passed. Simulated tests do not prove CEP or After Effects drag success.
- Backed up all edited workspace files and the old canonical installed `index.html` to `%SEARCHY_ROOT%/AE-CEP-Minimal-backup-before-panel-wide-drop-2026-10-22`. Installed only the new `index.html` to the canonical per-user extension; workspace and installed SHA-256 both equal `AF075F18A42DEC7D08947905196D50E5ED316820152A22A2B9BC1B2A0631CDEB`.
- Live test still required: built-in effect and local preset dropped onto panel areas outside the hint strip, with visible change verified on selected layers in After Effects. Do not claim completion before that test.

## 2026-10-22 — Research reusable CEP drag-and-drop code

- Reviewed Searchy's current source and persistent diagnostics, Adobe's CEP cookbook and After Effects sample, and the public Glide CEP panel. No candidate demonstrates dragging an effect/preset onto a panel-owned target and applying it to selected AE layers. Glide's inspected interaction edits canvas Bezier handles with mouse events; Adobe's AE sample demonstrates a button-to-`evalScript` bridge, not drag/drop. No third-party code was downloaded, copied, or integrated.
- Re-read the persistent log: 384 document-capture drag events all fell outside the live target rectangle; there was no captured `drop`. A sample had the target rectangle above the viewport (`top=-252`, `bottom=-229`) while the pointer hit a result row. This makes target visibility/scroll position the next measured check, not a proven root cause. The 36 drag starts and existing 24/12 end classifications remain as logged.
- Recommended a no-code live retest with Searchy scrolled so its dedicated target is visibly in view, using one built-in effect and one preset, then review the JSONL. No application source, installed build, settings, or dependencies changed. No automated tests or in-app drag tests were run during this research; drag-and-drop remains unverified. Double-click and Apply remain unchanged.
- Documentation backup: `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-dnd-code-research-note-2026-10-22`.

## 2026-10-21 — Diagnose and correct Searchy drop-target event acceptance

- Inspected the six user-provided attempts in `%TEMP%\Searchy-drag-diagnostics.jsonl`: all recorded `drag-started` with the expected custom type and then `drag-ended-outside-searchy`; none reached a logged drop/decode/host stage. Because that build did not log `dragenter` or `dragover`, this does not establish whether the cursor entered the target or dropped elsewhere within Searchy.
- The existing target is visible and hit-testable in the document, 23 px high, and has no pointer-events/overlay rule. Its old handler listened only to `dragover`, conditionally canceled it for an exact MIME string, and had no `dragenter` acceptance listener. The HTML Standard describes canceling both `dragenter` and `dragover` for a target to accept a drop. Added that targeted acceptance behavior; it is a code-level standards correction, **not yet proof of the root cause or a live fix**.
- Added low-volume persistent events for the first panel `dragenter` and `dragover`, plus separate target `dragenter`, `dragover`, and `drop` receipt. Target MIME matching is case-insensitive. Revised drag-end classification to distinguish a drop inside Searchy but outside its target, entering Searchy without a drop, and ending outside Searchy. No event is logged per pointer-move frame.
- Preserved the existing duplicate-request guard, host application bridge, double-click, Apply, search, preset scan, and effect discovery. No direct AE layer drop changes or visual redesign were made.
- Backups: workspace `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-target-dragenter-fix-2026-10-21`; installed runtime backup `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-target-dragenter-fix-2026-10-21`.
- All 11 automated test files passed, including simulated target acceptance and event-scope tests. These do not verify real drag delivery in After Effects.
- Installed only `index.html` to `%APPDATA%\Adobe\CEP\extensions\com.aeuniversalsearch.minimal`; hash matches workspace (`490C6D6089B7B9ED61A248F3521416115EBA2A4D8B4E805C97C87A795179717A`).
- **Live verification pending.** Reload Searchy, drag one built-in effect and one preset separately onto its labeled target, inspect the visible layer result and Undo after each, then share `%TEMP%\Searchy-drag-diagnostics.jsonl`. Do not mark the target fixed until that real in-app test succeeds. Direct drops onto AE layers remain out of scope.

## 2026-10-21 — Persistent in-panel drag diagnostics

- Added a persistent JSONL trace at `%TEMP%\Searchy-drag-diagnostics.jsonl` using CEP filesystem read/write APIs. Each event records its timestamp, drag trace ID, and relevant item/host data. The log is capped at the latest 500 events. The stages include drag start, Searchy drop receipt, payload decode, effect/preset identification, composition/layer validation, host request, host result, and duplicate request blocking. Direct drops ending outside Searchy are recorded separately; this does not mean AE accepted them.
- Added a small host function to return the temp log path. The drop handler now uses the panel-wide in-flight Apply guard and releases it on selection errors, host responses, and exceptions. Existing effect/preset Apply bridges and double-click/Apply methods were left intact.
- Backed up changed workspace sources/tests/docs before editing to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-persistent-dnd-diagnostics-2026-10-21`.
- All 11 automated test files passed, including simulated persistent-log stage assertions and a duplicate-drop-while-Apply-pending case. The harness does not establish actual CEP event delivery or a visible AE result.
- **In-app test remains pending.** Do not report drag-and-drop as working. Test the built-in effect, Deep Glow, and one preset on Searchy's dedicated target separately, inspect the visible effect/preset result, and test direct AE drops separately. Retrieve `%TEMP%\Searchy-drag-diagnostics.jsonl` afterward to identify the exact stage reached.
- Backed up the complete canonical installed extension to `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-persistent-dnd-diagnostics-2026-10-21`, then installed only `index.html` and `host.jsx` to `%APPDATA%\Adobe\CEP\extensions\com.aeuniversalsearch.minimal`. Installed/workspace SHA-256 values match: `index.html` `EBA23E81F9A22089B85C36712C2139E25F681000A5F05A92AEFD9A75D3CCA577`; `host.jsx` `84285F17CCB81A7A58B10FFD6ABCA03B3B9E99727838443D70480EB1C4F56018`. The manifest, duplicate legacy folder, and system settings were untouched.
- Reran all 11 test files after installation; all passed. Tests remain simulated. **Actual drag and visible result are unverified in After Effects.** Follow `HANDOVER.md` to test each in-panel item separately, test direct AE drops separately, and retrieve `%TEMP%\Searchy-drag-diagnostics.jsonl`.

## 2026-10-21 — Drag-and-drop feasibility documented (no implementation)

- Read `HANDOVER.md` and this changelog, inspected current row drag payloads, the Searchy-owned drop target, stage diagnostics, host preflight/apply calls, simulated panel tests, and prior user failure reports. Backed up both documentation files to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-dnd-feasibility-investigation-2026-10-21` before editing. No code or installed file changed; no automated test was run for this docs-only investigation.
- **Direct native AE drops:** CEP 12 documentation supports HTML5 drag/drop in general between an extension and host, but does not specify an AE native Timeline/Composition receiver for Searchy's custom effect `matchName` MIME payload. Issue #389 reports outbound CEP drag failure in AE; #557 reports an AE 26.3/CEP 12 limitation for project items on macOS, not Searchy's effects/presets on Windows. Both are corroborating reports, not definitive Windows evidence. The user reports dragging starts but no effect applies; their report does not clearly distinguish the target. Direct native drop is not demonstrated supported/reliable.
- **Searchy-owned target:** CEP documentation explicitly supports drag/drop inside an HTML extension. Existing code decodes Searchy's type/key, checks the cached item and current AE selection, then invokes the existing host bridge. The panel behavior test simulates the events and data transfer, but no saved live diagnostic trace proves actual CEF event receipt or visible effect. Therefore the earlier target failure point remains unknown.
- Found a future safety consideration: `applyDroppedItem()` bypasses `applyItemOnce()` and its panel-wide in-flight duplicate guard. This did not establish the reported failure cause and was not changed; account for it only if the target is proven live and implementation is approved.
- Recommendation: test one built-in effect, Deep Glow, and one preset on the dedicated panel target, capturing each diagnostic stage and inspecting/undoing the visible result. Test direct native AE drops separately. The full minimal plan and unresolved questions are in `HANDOVER.md`. Keep double-click and Apply as fallbacks; no drag-and-drop implementation was made.
- Evidence: Adobe's [CEP 12 HTML Extension Cookbook](https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_12.x/Documentation/CEP%2012%20HTML%20Extension%20Cookbook.md#drag-and-drop), [CEP issue #389](https://github.com/Adobe-CEP/CEP-Resources/issues/389), and [CEP issue #557](https://github.com/Adobe-CEP/CEP-Resources/issues/557). The issue reports have the scope limitations described above.

## 2026-10-21 — Searchy branding and confirmation-free Apply

- Removed the routine `window.confirm()` from the shared preset application function. Preset Apply, preset double-click, and the existing in-panel drop handler now call the same host bridge immediately. Effect Apply and double-click were already confirmation-free. The alias editing prompt remains because it is a separate user-requested edit action.
- Kept host validation, success/failure messages, callback cleanup, the panel-wide in-flight guard, per-row duplicate throttle, and undo groups. Changed only the undo group labels to Searchy; no application semantics changed.
- Updated the HTML title and panel heading, CEP manifest menu label, and bundle display name to Searchy. Preserved the extension IDs, CEP runtime, install paths, and architecture.
- Added tests proving that effect/preset Apply buttons and double-click routes do not invoke the confirmation stub; the alias path still works; failure text is surfaced; the in-flight guard releases after failure; duplicate protection still works; Searchy labels and stable extension ID are present; and the existing selected-layer `Layer.applyPreset()` API call is preserved. Its all-selected-layer semantics are documented by the [After Effects Scripting Guide](https://ae-scripting.docsforadobe.dev/layer/layer/#layerapplypreset); the user had also previously verified multi-layer preset application in After Effects.
- All 11 automated test files passed before installation and passed again after installation. These include simulated CEP and After Effects objects; they do not verify the panel inside the live host.
- Backed up the edited workspace files to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-confirm-removal-branding-2026-10-21`. Backed up installed `index.html`, `host.jsx`, and `CSXS/manifest.xml` to `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-apply-confirm-branding-2026-10-21` before copying.
- Installed only the three changed runtime files in `%APPDATA%\Adobe\CEP\extensions\com.aeuniversalsearch.minimal`. Workspace/install hashes match: `index.html` `7B9220F47AB5FA3AF3D71C4C62FF95FED5C39A2A4866C42EA3E021A81C96E7C4`, `host.jsx` `E2CF2E36807FB89D641CF12DB64D952EE2F27B73A4095A7C056892D658C207F3`, and manifest `3FAED3BB80A95CB4D5531EC27E1CF156264AA1048D0F0A7B8F0AF10F532ED12F`. The duplicate legacy-named extension folder and system settings were not changed.
- **Live test not performed.** The user must reload Searchy and check both effect/preset Apply and double-click, multi-selected layers, failure feedback, and Undo inside After Effects. The handover includes a manual checklist and the next task.

## 2026-10-21 — Installed visual polish build

- Confirmed the manifest's extension ID is `com.aeuniversalsearch.minimal`; installed the presentation-only `index.html` to `%APPDATA%\Adobe\CEP\extensions\com.aeuniversalsearch.minimal`.
- Backed up the canonical installed folder before replacement at `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-visual-polish-2026-10-21`. Only the panel HTML was changed. The legacy-named duplicate folder was inspected and left untouched; system settings were not changed.
- Workspace and installed `index.html` SHA-256 both equal `589C6C8EC3EEEC27051C3BB9E20E2B9C1329913FA53C00CB80229480C0ED9EAF`.
- Reran all 11 automated test files after installation; all passed. Simulated tests and the 3,790-entry Node performance profile do not verify appearance or performance inside After Effects.
- Visual validation is pending the user's inspection in After Effects at normal and narrow docked widths. Reload steps are in `HANDOVER.md`; no in-app visual success is claimed.

## 2026-10-21 — Core audit closed; first visual polish pass

- Recorded the user's live confirmation that CC, shake, and glow presets apply to all selected layers, and that effects apply to multiple selected Adjustment, Null, and Text layers. The multi-layer preset audit item is closed; the working application code was left unchanged.
- Completed the core audit with no P0/P1 issue found. Reviewed direct-to-layer and dedicated in-panel drag-and-drop separately. Direct drops lack a documented AE effect-drop receiver and have failed in user testing; the existing in-panel target remains an unverified proof of concept. No drag implementation was changed.
- Backed up the full project at `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-visual-polish-2026-10-21` before visual changes.
- Made a presentation-only pass in `index.html`: unified compact control styling, clearer hover/focus/selection states, stronger tree separators, and a wider narrow-panel breakpoint. Preset/effect hierarchy and all controls remain in place. Updated the UI syntax test for the new CSS breakpoint/focus behavior.
- All 11 automated test files pass, including simulated panel behavior and a 3,790-entry search profile. The latest Node medians were approximately 9–13 ms for search computation, below 0.3 ms for result-tree construction, and below 0.13 ms for mock DOM mutations. They do not measure CEP/After Effects rendering.
- Host/search logic hashes match the pre-polish backup. The new styling has **not** been installed or visually checked in After Effects; normal and narrow docked sizes remain for live review. See `HANDOVER.md` for the capture limitation and exact verification scope.

## 2026-10-21 — Multi-layer application verification and drag feasibility

- User confirmed in After Effects that CC, shake, and glow presets apply successfully to all selected layers. The user also confirmed effects apply to multiple selected Adjustment, Null, and Text layers. This verifies those tested workflows only; no code changes were made to the working application logic. The multi-layer preset audit item is closed.
- Inspected the existing drag source, dedicated panel drop target, host preflight/apply bridge, and automated panel simulation. CEP's HTML5 drag-and-drop support makes an in-panel target technically viable, and this project already contains that proof of concept. Automated tests cover payload creation, target routing, and bridge invocation; they do not prove a real AE drop event or visible host result.
- Direct drops onto native AE layers remain unsupported/unverified for this extension: the available CEP documentation gives general extension/host HTML drag-and-drop but no AE-specific effect `matchName` payload or way to target the layer under the pointer. The user's prior drag tests did not apply effects. No new drag code was added; the in-panel target remains a proof of concept, and direct native-layer drag is deferred.
- Sources and caveats: CEP 12 Cookbook, [issue #389](https://github.com/Adobe-CEP/CEP-Resources/issues/389) (CEP-to-AE drag report), and [issue #557](https://github.com/Adobe-CEP/CEP-Resources/issues/557) (AE 26.3/CEP 12 on macOS, different project-item workflow). Issue reports are corroborating community evidence, not a Windows guarantee.
- After Effects window capture failed twice (`FrameArrived timed out: timed out waiting on channel`; refreshed retry `window capture timed out: timed out waiting on channel`), so no live test of the dedicated target was performed. Double-click and Apply remain working methods. See `HANDOVER.md` for separate verification status and the next targeted check.
- Documentation backup: `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-multilayer-dnd-feasibility-2026-10-21`.

## 2026-10-21 — Core-functionality audit and stabilization

- Audited the current search, discovery, alias/folder persistence, hierarchy cache, effect/preset application bridges, existing automated tests, and both installed CEP copies. No framework rebuild, visual redesign, registry change, or After Effects preference change was made.
- Found that the 450 ms per-row Apply guard did not cover a host request still waiting for its CEP callback; after re-render, a fresh row could submit the same action again. Added a panel-wide in-flight guard that releases on callback completion, failure, cancellation, or synchronous launch error. The existing double-click and Apply controls remain the entry points.
- Added a delayed-response regression test that rerenders the result list while an effect application is pending and checks that a duplicate host call is blocked. All 11 `tests/*.test.js` pass. The tests simulate the panel and host; they are not in-app verification.
- Current automated profile on the 3,790-item fixture: median search computation is about 10–18 ms across the audited queries, full-catalogue matching remains enabled, and the initial search result view stays capped at 80 rows. Node mock timings do not measure CEP layout/paint.
- Found a P2 behavior/documentation mismatch: preset Apply currently calls `applyPreset()` only on the first selected layer, while the UI says “layer(s).” Existing tests and user confirmation verify one selected layer. Multi-layer preset behavior was not changed pending confirmation of intended semantics.
- Installation audit found two per-user CEP copies. Backed up each installed `index.html` to `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-core-audit-2026-10-21` and installed the updated panel in both. SHA-256 matches: `181DAAD1F065D044DD6757D8A02C9E923561A1B55911657FDB89D73DD1F6AC1A`.
- In-app verification could not be completed: the first After Effects window capture returned `FrameArrived timed out: timed out waiting on channel`; after refreshing window selection, the retry returned `window capture timed out: timed out waiting on channel`. No claim is made that the in-flight guard was tested inside After Effects.
- See `HANDOVER.md` for detailed findings, verified history, and limitations. Drag-and-drop and visual polish remain deferred.

## 2026-10-19

- Corrected the CEP manifest dispatch structure and aligned it with CEP 12.0, the runtime found in After Effects 26.3.
- Replaced the basic CEP test screen with the AE Universal Search prototype interface and an explicitly sample-only effects/presets catalogue.
- Added an independent, dependency-free search engine with exact, prefix, partial, alias, and tag ranking.
- Added Node.js search checks covering normalization, ranking, duplicate names, empty/no-match queries, and a 10,000-item catalogue.
- Verified the search checks pass and synced the current interface into the two per-user CEP folders.
- At the time, in-app verification was pending because window capture timed out. The user later confirmed Stage 5 passed inside After Effects; see `HANDOVER.md`.

## 2026-10-19 — Stage 6 effect discovery

- Marked Stage 5 complete based on the user's in-app confirmation that search input and suggestions work and the panel opens and closes normally.
- Added read-only host discovery using After Effects `app.effects`; results include name, match name, category, and version where provided.
- Removed illustrative effect entries from the sample catalogue so they cannot be mistaken for installed effects. Sample presets remain marked as examples.
- Added a refresh control and discovery status to the existing interface, plus metadata search for effect match names, categories, and versions.
- Each discovered effect is identified as host-listed; layer applicability is explicitly not tested. No effect application was implemented.
- Refined the state labels after confirming that a host effects inventory alone does not prove a plug-in is installed or usable. No effect is called verified available or applicable.
- Added effect-discovery response tests. Node search and parsing tests pass; host API enumeration inside After Effects remains to be verified.
- Added a simulated host response check for serialization and duplicate filtering; it does not replace an After Effects runtime check.
- Backed up the prior installed extension folders and synced the Stage 6 files to both existing per-user CEP locations with user approval; verified matching key-file hashes. No software or system settings were changed.
- The user confirmed the panel returned 754 effects host-listed by After Effects 2026 (26.3). Individual installation, availability, and applicability remain unverified.
- Updated `HANDOVER.md` with current status, test results, and next verification steps.

## 2026-10-19 — Stage 7 investigation

- Read `HANDOVER.md` and inspected the existing extension before editing the project.
- The user confirmed Stage 6 returned 754 host-listed effects in After Effects 2026 (26.3); this is an inventory result, not per-effect availability or applicability verification.
- Read-only filesystem inspection found 621 install `.ffx` files, 2,056 `.ffx` files in the user's After Effects 2026 Documents tree, and 359 install-tree `.aex` files. A follow-up corrected an earlier count: the Adobe shared `Plug-ins\7.0\MediaCore` folder has 0 `.aex` files (one `dummy.txt`). File presence alone cannot establish plug-in loading or vendor.
- Research supports `.ffx` discovery by recursive local file scan, folder selection with CEP's directory picker, and application through After Effects `Layer.applyPreset(File)`. No preset-format parsing or online service is needed.

## 2026-10-19 — Stage 7 local discovery implementation

- Reused the existing CEP interface and Stage 6 `app.effects` discovery. The user-confirmed Stage 6 result remains 754 host-listed effects; no individual effect is marked installed or applicable.
- Added local recursive `.ffx` discovery for the After Effects install presets and the user's `Documents\Adobe\After Effects*` trees, plus `.aex` discovery in the AE install and Adobe shared plug-in folders.
- Added custom preset folder selection with CEP's native directory picker; folder paths persist locally in CEP `localStorage`. No account, server, or network is used.
- Replaced sample preset search results with discovered local `.ffx` files. Results show name, source path, and file-present status. `.aex` binaries appear as plug-in files; vendor, host loading, and effect mapping are not claimed.
- Added an explicit apply action using ExtendScript `Layer.applyPreset(File)`, with active-composition/selected-layer/file validation and an undo group. UI text separates a completed host call from a visually verified result.
- The existing sample catalogue file is retained as unused legacy data and is no longer loaded in the panel.
- Added and ran separate Node checks for local folder storage/parsing, recursive file scan and apply bridge behavior with mocks, search, host response parsing, local inventory traversal, and panel script syntax. All seven checks pass; local in-app discovery, folder picker, and preset application are not yet verified.
- After user approval, backed up the previous Stage 6 files to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-stage7-2026-10-19` and synced Stage 7 to both existing per-user CEP folders. SHA-256 checks confirm the key installed files match the workspace. No system settings were changed.
- In-app local discovery, folder picker/storage, and preset application verification remain pending; no preset has been applied to a user project.

## 2026-10-20 — User verification update and search redesign

- User confirmed inside After Effects that the search bar works, effects can be added, custom preset folders can be added, and local preset scanning works. This confirms those specific flows only; preset application and individual effect applicability remain separate checks.
- Backed up the full project before edits to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-search-redesign-2026-10-20`.
- Reused the current panel, host effect discovery, local folder settings, file scan, and supported preset application bridge.
- Reworked search ranking to exact name, name prefix, name word-start, name substring, alias, tag, then metadata. Cached local `.ffx` file names remain searchable; searches do not rescan folders.
- Added three expandable result groups ordered by the strongest result in each group, an eight-result initial cap per group with “Show more”, and Up/Down/Escape keyboard navigation. Effect-origin group assignment is a match-name hint only; local `.aex` entries remain file-level discoveries.
- Automated ranking and UI structure/syntax checks passed, including fixture queries for `sh`, `shake`, `glow`, `sapphire`, `zoom`, and a custom preset filename; search also passed a 10,000-item check. Fixture checks do not prove results for the user's actual custom preset or in After Effects.
- With approval, backed up both existing installed per-user CEP extension folders to `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-search-redesign-2026-10-20` and copied the redesigned workspace files into them. No software or registry settings were changed.
- After Effects was launched for in-app verification, but window capture timed out twice, including after refreshing window selection. In-app checks for the six requested queries remain pending; no in-app pass is claimed.

## 2026-10-20 — Stage 9 compact category-tree redesign (in progress)

- User confirms core extension behavior inside After Effects: effects can be applied, custom preset folders can be added, local preset scans work, and a custom preset was successfully applied to a text layer.
- Read the current handover/changelog and inspected the panel, search engine, catalogue data, host effect inventory, preset scan, and preset application path before editing. Backed up the project to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-ui-tree-redesign-2026-10-20`.
- Initial UI findings: large outer/card padding, repeated multi-line metadata/status per result, raw long paths in cards, and no browse tree in empty-search mode. Existing ADBE-prefix origin grouping is a guess, not reliable vendor metadata.
- No reference video was present in the project or its parent folder. Continue using the user's written description; do not claim a visual comparison against the video.
- Added `client/search/resultTree.js` to build browse/search trees from exact host-provided effect categories and actual preset/plugin parent folders. Items without category/path metadata stay directly under their source section; no vendor is inferred.
- Replaced padded multi-line result cards with compact single-line rows, ellipsis plus full-name/path tooltips, visible short status labels, compact expandable custom-folder settings, and dark disclosure/hover/focus/selected states.
- Browse mode shows Host Effects, Plug-in Files, and Presets hierarchies; search mode renders only matching branches in existing relevance order. Folder scans remain tied to explicit refresh actions, not keystrokes. A 12-result-per-category initial limit keeps long lists compact, with Show more.
- Added Up/Down selection movement, Left/Right disclosure control, Enter selection, and Escape-to-search behavior.
- All nine dependency-free Node tests pass, including source-grounded tree checks, unknown-category handling, 10,000-item cases, and simulated browse/search expansion, selection, keyboard, show-more, custom-folder, and preset-apply flows. This is not a visual or in-app test.
- Backed up the existing installed panel before sync and again before the final sync at `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-ui-tree-redesign-2026-10-20` and `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-ui-tree-final-sync-2026-10-20`. Synced the final tested workspace files to both per-user CEP folders; SHA-256 checks match for the UI, search engine, tree builder, local discovery helper, and host bridge.
- After Effects window capture failed twice after refreshing window selection (`FrameArrived timed out: timed out waiting on channel`; `window capture timed out: timed out waiting on channel`). Docked/narrow visual testing and live searches/selection remain unverified. The reference video was not found alongside the project files.

## 2026-10-20 — Stage 10 effect naming and application (in progress)

- Inspected `HANDOVER.md`, this changelog, the current project, and the running After Effects panel before editing. Made a fresh full project backup and backups of both installed per-user CEP folders before changes.
- Live After Effects 2026 (26.3) panel inspection showed 462 host-listed effects. `Deep Glow` appears by that host-provided display name. This does not yet confirm its match name or application.
- Fixed the effect-name fallback so internal `matchName` values remain separate from the host's user-facing `displayName`; missing display names no longer expose identifiers as labels.
- Added an exact-host-identifier effect apply bridge with active composition, selected-layer, host availability, effect-parade, and return-identifier checks. The success response remains explicitly unverified visually.
- Added row double-click and an explicit Apply button for effects and presets. Row single-click remains selection-only; application is guarded against a second event from the Apply control.
- Automated tests cover display labels, identifiers, selection validation, unavailable effects, add-property errors, double-click behavior, and application count. All 10 Node test files pass using simulated host/UI objects.
- CEP-to-native-timeline drag-and-drop remains unimplemented and unverified: the available Adobe CEP discussion concerns the reverse direction (host panel to CEP), so it does not settle whether this specific outbound drag works in After Effects. Double-click and Apply are the current fallback.
- Added disposable test-composition setup/cleanup scripts. Actual After Effects application and visible-change checks for a built-in effect, Deep Glow, and a custom `.ffx` preset remain pending.
- Copied runtime files, including the final click-duplication guard, to both installed CEP folders and verified their SHA-256 hashes. After the attempted reload, screenshot capture failed twice (`FrameArrived timed out: timed out waiting on channel`; `window capture timed out: timed out waiting on channel`). I could not confirm the revised UI loaded or test effect/preset application in-app. Accessibility still showed the existing 462-entry inventory and Deep Glow host-listed result; no application verification is claimed.

### Verification attempt and host-count investigation

- Re-read `HANDOVER.md` and inspected the disposable test scripts, current apply bridge, discovery code, and earlier saved copies before proceeding. The effect discovery and application logic were left unchanged.
- Compared saved discovery implementations: the `app.effects` source and `matchName` de-duplication are the same in pre-Stage-10 copies and current code. The label fix only stopped using `matchName` as a display fallback. This does not explain 754 → 462. There is no archived raw inventory from the 754 session, so the cause cannot be determined from current evidence.
- Attempted the read-only live inventory diagnostic and a runner marker through `AfterFX.exe -r`. Neither produced the expected output file. The scripting file-access preference stayed at `0`; the user-approved temporary change did not take effect and was not left enabled.
- The After Effects window was not available through the current UI observation channel, after previous screenshot timeouts. No disposable composition or visible effect/preset result was confirmed. Built-in effect, Deep Glow, and custom `.ffx` application tests remain pending; there was no test-specific application error to investigate because the host returned no result.
- Keep all three application outcomes unverified. Next step is to run the disposable scripts from within the visible AE session through an observable scripting path, inspect each result separately, and restore the preference to `0` after any temporary enablement.

## 2026-10-20 — Effect application verification and drag-and-drop POC

- User manually verified inside After Effects: effect double-click applies; the effect Apply button applies; Deep Glow, Saber, and the built-in effects they tested apply. This is not verification of every listed effect/plugin. Custom preset folder selection and scanning were reconfirmed, and custom `.ffx` application remains confirmed from the earlier user test.
- Backed up the workspace to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-drag-drop-poc-2026-10-20` and both installed extension folders to `%SEARCHY_ROOT%\AE-CEP-Minimal\AE-CEP-Minimal-installed-backup-before-drag-drop-poc-2026-10-20`.
- Research indicates the CEP HTML5 cookbook supports drag-and-drop generally, but does not document an AE-specific effect identity payload. `com.adobe.cep.dnd.file.0` carries a file path, not an effect match name. The native AE panel supports dragging effects/presets onto layers, while CEP reports #389 and #557 describe outbound CEP-to-native drag limitations (the latter is macOS, not this Windows machine). References are recorded in `HANDOVER.md`.
- Added a contained POC: effect/preset rows are draggable; a same-panel drop target routes the cached item to the existing application bridge; effects expose a custom match-name MIME payload for a direct native-drop experiment; preset rows expose their `.ffx` path using `com.adobe.cep.dnd.file.0`. Existing double-click and Apply paths are preserved.
- All 10 `tests/*.test.js` checks pass. The panel behavior test simulates both payload creation and effect/preset drops onto the in-panel target. This does not establish real cross-panel drag behavior.
- After backing up both installed CEP folders, copied the POC `index.html` to each installed folder. SHA-256 matches for both installed copies: `6DEB6846469EE7CEAA29316AA5E2E1F9A673396528346CA7876B070B6D7C9C22`. No registry or After Effects scripting-security preference was changed.
- Attempted live After Effects inspection after the process appeared with `<disposable-test-project>.aep` open. Screenshot capture and one fresh-window retry timed out; no UI drag action or live drop result was observed. Drag-and-drop is **not complete or in-app verified**. Next step is actual testing inside the visible AE session on a disposable selected layer, both to the timeline/composition and to the in-panel target.

### Drag failure report and diagnostic instrumentation

- User reports on Windows/After Effects 2026 that effect rows can be dragged but dropping them does not apply effects; several effects behaved the same. Double-click and Apply remain working. Do not mark drag-and-drop complete.
- The report does not distinguish native layer drop from the extension's dedicated drop target. Inspecting the POC showed that it had no stage-by-stage status, so failure could be event delivery, payload decoding/cache lookup, selected composition/layers, or the application bridge.
- Backed up the workspace and both installed extension folders before diagnostics. Added trace status for drag start, in-panel dragover/drop receipt, item type/key lookup, and the exact effect match name. Added read-only host preflight (`getApplyTargetStatus`) to show the active composition and selected-layer count/names before the bridge call, and visible reporting of whether the bridge was called and its response. A drag ending outside the panel reports that native AE acceptance cannot be observed from the CEP side.
- Installed the final diagnostic `index.html` and read-only `host.jsx` in both backed-up CEP folders. The visible diagnostic reports payload type/key/match name or preset path, composition/selection status, and bridge outcome. SHA-256 matches for both copies: index `643F754C14E710C184045A61B60DE0F1D61AAEE017CC7102C40E830EA1BD2AE2`, host `042CCE21230A1E626973A6B8AC381EA5F8070BD0CC60BF7CD3197753A8B06112`.
- Double-click, Apply, and single-click selection behavior were preserved. All 10 Node tests pass with simulated CEP/After Effects objects; this does not substitute for the requested live test.
- The current UI observation retried capture twice and timed out, so no live built-in/Deep Glow drag test was carried out by the assistant. In-panel target and native AE layer drop remain separate and unverified. The diagnostic build needs to be loaded and tested on a disposable selected layer before making further changes.

## 2026-10-20 — Preset hierarchy and display-name work

- Latest user test: dragging effects still did not apply, including with an adjustment layer and across multiple effects. Double-click and Apply still work. No evidence-based fix was found; drag-and-drop is deferred, not complete, and no drag code was changed in this work.
- Inspected the project and handover before editing. The recursive scan returned flat records with absolute paths, while the tree grouped only by immediate parent folder. The scan record did not include its root or relative path, causing nested preset folders to lose their hierarchy in browse mode.
- Backed up the full project to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-hierarchy-names-2026-10-20` before changes.
- Added scan-root and relative-path metadata to cached local discovery records. Search and application still use the existing file catalogue and full `.ffx` path; opening folders or typing does not rescan the disk.
- Replaced flattened preset grouping with a source-root and nested folder/file tree, with alphabetical sorting within each parent and descendant file counts. Duplicate scan-root folder names are distinguished with their full paths. The scan is still capped at 20,000 records per root, as before.
- Preset labels now derive from the actual filename with only the final `.ffx` extension removed. The original filename and path remain in each result. Added an optional Alias control stored in CEP local storage; aliases affect the displayed/searchable name but never the applied file path.
- Effect labels continue to use After Effects `displayName`; `matchName` remains a separate internal identifier. Host-provided effect categories are retained. No vendor or third-party classification is guessed when AE does not supply it.
- Added a parser guard for older effect responses: a `name` field identical to `matchName` is not shown as a display label when `displayName` is missing. Host-provided display punctuation remains untouched.
- All 10 `tests/*.test.js` checks pass, including simulated application by original file path, aliases, duplicate roots, nested folder paths, file counts, and a 10,000-item hierarchy. The local filesystem adapter test saw 2,677 `.ffx` and 359 `.aex` files; it does not prove After Effects availability or panel rendering.
- Backed up both installed per-user extension folders at `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-hierarchy-names-2026-10-20`, then synced this revision into both. SHA-256 hashes match: `index.html` `3A7235BA2464168BD434AB8B71EA5C760216030F0643A8F9B87DC083AADAB795`, `resultTree.js` `F0763E85A0950E53D5BB0AA2A13BFBE407A6B1742B9646DAF8F5BB9F752A30A0`, `localDiscovery.js` `C391C041D53077E09036523A9BF8D6F583E8A61AF3D4CA45F403DEAF20E08A1E`.
- User reviewed the latest in-app video and confirmed that the effect and preset hierarchy is organized correctly with items in their folders. The user is satisfied with the current organization. This confirms tree organization only; alias editing, large-folder behavior, long names, and application identity were not separately established by that video. Do not pursue visual changes until core functionality is complete.
- No new drag test or code changes were made. The user reports drag still does not apply effects, including with an adjustment layer; double-click and Apply continue to work. Drag-and-drop remains deferred.

## 2026-10-20 — Stage 13 search accuracy and reliability (in progress)

- Read the handover and changelog, then inspected the current search engine, ranking tests, local discovery model, panel event handlers, and remaining stage notes. Updated the handover to reflect the user's hierarchy verification and to defer drag and visual polish.
- Backed up the project before source changes: `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-search-hardening-2026-10-20`.
- Fixed a search gap: multiword searches previously required one contiguous phrase. Queries now also match when every term starts a word in the result name, regardless of order. This fallback ranks below contiguous name matches and above aliases; it rejects items missing any term.
- Added focused automated coverage for reordered terms, all-term requirement, and ranking against exact aliases. All 10 `tests/*.test.js` checks pass, including the existing 10,000-item search/tree and simulated application tests. No After Effects UI or host behavior was exercised by these tests.
- Backed up both installed CEP folders to `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-search-hardening-2026-10-20`, then copied only `searchEngine.js`. Its SHA-256 matches in both installed folders and the workspace: `257A121389E25FD5E933F3FC2852598892867C1BA0F8848F4675BD05B76F00E6`.
- In-app verification of reordered multiword queries remains pending. The core stage remains in progress; once core functionality is complete and verified, prepare UI polish as a separate stage.

## 2026-10-20 — Stage 14 search responsiveness diagnosis (in progress)

- User confirmed in After Effects 2026 that `Glow Dee` returns Deep Glow. This is in-app verification of order-independent multiword search.
- Diagnosed per-keystroke behavior before production edits: no disk scan or host call runs while typing, but each keystroke concatenates all catalogues, parses aliases and maps every result, scores all entries, rebuilds the result tree, clears the result container, and recreates visible rows/headings.
- Identified a quadratic tree-build path: for every matching preset, root label uniqueness filtered the full catalogue again. Broad queries also got up to 12 rows per folder rather than a global initial cap.
- Baseline Node 24 profile used a synthetic 3,498-item dataset (2,677 presets, 462 effects, 359 plug-in files) and five input runs per query. Median input-handler/search/tree/mock-DOM mutation ms: `Deep Glow` 18.9/15.7/0.37/0.04; `Glow Dee` 16.8/13.6/0.24/0.01; `glow` 436.8/10.8/420.5/0.40; `sh` 766.9/10.5/749.7/0.14; `shake` 766.1/10.3/752.4/0.13; real local preset `Jarle's Deadpool Handheld Camera Long Lens` 19.4/14.7/1.60/0.01; no match 12.6/9.5/0.19/0.01. The broad `sh` and `shake` searches each produced 539/537 matches and 1,156/1,133 mock DOM mutation operations.
- Timings are automated Node/VM results, not measurements inside After Effects. Mock DOM mutation time excludes real Chromium layout and paint. Order-independent matching adds some work but is not the principal cause of the hundreds of milliseconds.
- Backed up the project before performance work at `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-search-performance-2026-10-20`.
- Search optimization is recorded below; no UI styling or layout redesign is planned.

## 2026-10-20 — Stage 14 search responsiveness optimization (automated verification complete)

- Cached the combined search catalogue and preset aliases. They rebuild only when host effects, local files, folders, or aliases change; typing does not read the filesystem or local storage.
- Added cached tree indexes and reused the browse tree. Fixed the quadratic duplicate-root lookup that previously filtered the full catalogue for each matching preset.
- Search still scores every cached catalogue item and preserves exact, prefix, word-start, substring, alias/tag, and order-independent multiword behavior. The first page now contains up to 80 globally best results, regardless of folder count; the existing Show more flow exposes later results.
- Added `tests/searchPerformance.test.js` with a 3,790-item fixture and seven requested query cases. All 11 test files pass.
- Latest Node v24 median input-handler/search/tree/mock-DOM-mutation times (ms): Deep Glow 14.34/14.09/0.018/0.013; Glow Dee 14.00/13.91/0.018/0.012; glow 12.41/11.04/0.266/0.168; sh 12.37/10.61/0.259/0.109; shake 12.02/11.08/0.215/0.118; real preset filename 15.52/15.42/0.034/0.007; no match 10.48/10.45/0/0.003. Broad queries still report 307/539/537 total matches, but initially render only 80 rows.
- Earlier baseline on a 3,498-item fixture measured broad-query input handlers at 436.8 ms (`glow`), 766.9 ms (`sh`), and 766.1 ms (`shake`); the quadratic tree work alone took 420–752 ms. Current tree build for these queries is 0.2–0.3 ms. Fixture sizes differ, so this is indicative rather than a strict same-data comparison.
- Mock DOM timings exclude CEP/Chromium layout and paint. The user has since verified the optimized build inside After Effects: search feels responsive/fast, result quality improved, and double-click plus Apply still work. This user test is separate from the automated timing data. No UI redesign or effect-name strategy change was made; drag-and-drop remains deferred.
- Workspace backup: `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-search-performance-2026-10-20`.
- Backed up the two installed per-user CEP folders at `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-search-performance-2026-10-20`, then synced only `index.html` and `client/search/resultTree.js` to both folders. SHA-256 matches workspace and installed files: index `4A7E836FF451BC989E31A6625461324E98F435C6774A09AE524724FD8400095E`; tree builder `BDC07F8AACE6488C0E42B24A4B6395E7C553E4A8603504D9454BF4E5E45E8AE9`. The optimized build is installed, but still awaits live After Effects verification.

## 2026-10-20 — Stage 15 effect-name diagnosis

- Backed up the project before source changes: `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-effect-name-accuracy-2026-10-20`.
- Traced names end-to-end. `host.jsx` reads `app.effects` fields `displayName`, `matchName`, `category`, and `version` and serializes them separately. `effectDiscovery.js` preserves those fields, catalogue rebuild retains the item object, and the tree passes it through to `renderRow()`.
- Adobe documents `displayName` as the localized user-facing effect label, `matchName` as a stable internal identifier, `category` as the localized Effect menu category, and `version` as an internal effect version. No documented vendor/plugin display-name field is available on `app.effects`. Local `.aex` filenames are a separate file-discovery source and do not become effect labels.
- Found one label transformation: the renderer's generic `cleanDisplayText()` collapsed whitespace and removed control characters before showing effect names. The UI uses `textContent`, so markup escaping is not needed. Effect labels now preserve the host string verbatim while preset and search behavior remain unchanged.
- Live-panel capture failed twice (`FrameArrived timed out: timed out waiting on channel`; `window capture timed out: timed out waiting on channel`). Native comparison for Deep Glow, Saber, at least three Adobe effects, and any other installed third-party effects remains pending. No specific metadata-to-native mismatch is yet verified; do not claim name accuracy is fixed or create a mapping.
- Adobe source: [After Effects Application API: effects collection](https://developer.adobe.com/after-effects/uxp/after-effects-api/application) (current UXP docs list `displayName`, `matchName`, `category`, and `version`; the page documents AE 27.0 API), and [After Effects Scripting Guide: Application/Effect fields](https://ae-scripting.docsforadobe.dev/general/application/) (ExtendScript-era interface, including localized display/category semantics).

## 2026-10-20 — Stage 15 effect display-name accuracy (minimal correction; native comparison pending)

- Preserved the whole project in `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-effect-name-accuracy-2026-10-20` before editing.
- Traced `app.effects.displayName` through host JSON serialization, effect response parsing, catalogue caching, result-tree pass-through, and row rendering. `matchName` stays separate and is only used for identity/application. `category` and `version` are host fields; no documented vendor/plugin-label field is available from `app.effects`. `.aex` filenames belong to separate plugin-file results and are not effect display names.
- Found the only label rewrite in the visible effect path: the renderer applied generic text cleanup that collapsed whitespace and stripped control characters. Effect rows now use the host `displayName` verbatim via safe `textContent`, while safe parser fallback remains for a missing display name. Preset labels, folder hierarchy, ranking, application methods, and search cache are unchanged.
- Added a panel behavior regression test for preservation of double spaces, a non-breaking space, and punctuation, and for keeping the internal identifier out of the visible name. All 11 Node test files pass.
- Backed up both installed panel files at `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-effect-name-accuracy-2026-10-20` and synced only `index.html`. Both installed hashes match the workspace: `56DE1E597BF3C53190FC2CCD2C2A3160FC715AF51D831767A228ADEE89B14DD9`. Refresh/restart the panel before checking this build.
- Native panel comparison and the requested per-effect metadata capture are still **not verified**. After Effects was present, but both screenshot captures timed out. No names for Deep Glow, Saber, three built-in Adobe effects, or third-party effects are claimed as in-app comparisons; no `.aex` mapping was added.
- Source references: [Adobe After Effects Application API](https://developer.adobe.com/after-effects/uxp/after-effects-api/application) and [After Effects Scripting Guide: Application](https://ae-scripting.docsforadobe.dev/general/application/). The official UXP API page currently documents version 27.0; it is corroborating reference, not a substitute for the requested AE 26.3 native comparison.

## 2026-10-20 — Stage 16 encoded preset filename correction (in-app verification pending)

- User-provided side-by-side screenshots showed the native panel displaying `Audio Effect 1`, `Reverb`, `CC 1`, etc., while AE Universal Search exposed <URL-encoded-filename> sequences.
- Read the project/handover before changing files and backed up the full project to `%SEARCHY_ROOT%\AE-CEP-Minimal-backup-before-encoded-preset-label-fix-2026-10-20`.
- Local filesystem inspection confirmed actual filenames such as `Audio Effect 1.ffx`, `CC 1.ffx`, and `Reverb.ffx` under the user's `Ante Effects` preset tree. Cause is in the ExtendScript scan: it used `File.name` (filename component of an absolute URI) as the displayed filename. That property encoded spaces as <URL-encoded-filename>; serialization, parsing, caching, and rendering preserved the value.
- Fixed scanning to use `File.displayName` as the human-readable filename and use `File.decode(File.name)` only if `displayName` is empty. It removes `.ffx` only for the visible name. The `fsName` application path is unchanged; no files were renamed or paths decoded. Literal <URL-encoded-filename> names remain literal because the displayName branch is not decoded again.
- Added simulated ExtendScript tests for <URL-encoded-filename> → `CC 1`, <URL-encoded-filename> → `Audio Effect 1`, ordinary names, literal <URL-encoded-filename>, decode fallback, searching by name and alias, and applying through the unchanged original filesystem path. All 11 automated tests pass.
- Backed up both installed host scripts at `%SEARCHY_ROOT%\AE-CEP-Minimal-installed-backup-before-encoded-preset-label-fix-2026-10-20`; installed only `host.jsx` into both existing per-user CEP folders. Both installed hashes match the workspace: `E953C531BABF9A3D560BC4057AE62EB8E6BD91EB7EBAE1B8BD13644C28EA8C62`.
- Search ranking/performance, preset aliases, hierarchy, double-click and Apply controls were not changed. No design changes.
- The before images prove the original mismatch. The corrected scan is installed but has not yet been visually tested inside After Effects. Restart/refresh the panel, rescan, and compare the same folders before claiming success.
- Reference: [ExtendScript File object](https://extendscript.docsforadobe.dev/file-system-access/file-object/) (File.name URI filename, displayName localized filename, File.decode URI decoding).


